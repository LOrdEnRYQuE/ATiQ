export interface GitHubRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required' | 'neutral'
  head_branch: string
  created_at: string
  updated_at: string
  run_number: number
  workflow_id: number
  html_url: string
  jobs: GitHubJob[]
}

export interface GitHubJob {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required' | 'neutral'
  started_at?: string
  completed_at?: string
  steps: GitHubStep[]
}

export interface GitHubStep {
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped'
  number: number
  started_at?: string
  completed_at?: string
}

export interface ParsedLogLine {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  progress?: number
}

class GitHubObserver {
  private baseUrl = 'https://api.github.com'

  async getLatestRun(repo: string, token: string, workflowName?: string): Promise<GitHubRun | null> {
    try {
      let url = `${this.baseUrl}/repos/${repo}/actions/runs?per_page=10`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      const runs = data.workflow_runs || []

      // Filter for recent runs (last 5 minutes) and optionally by workflow name
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentRuns = runs.filter((run: any) => {
        const createdAt = new Date(run.created_at)
        const isRecent = createdAt > fiveMinutesAgo
        const matchesWorkflow = !workflowName || run.name.includes(workflowName)
        return isRecent && matchesWorkflow
      })

      // Return the most recent run
      if (recentRuns.length > 0) {
        const run = recentRuns[0]
        
        // Fetch jobs for this run
        const jobs = await this.getRunJobs(repo, run.id, token)
        
        return {
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          head_branch: run.head_branch,
          created_at: run.created_at,
          updated_at: run.updated_at,
          run_number: run.run_number,
          workflow_id: run.workflow_id,
          html_url: run.html_url,
          jobs
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get latest run:', error)
      throw error
    }
  }

  async getRunJobs(repo: string, runId: number, token: string): Promise<GitHubJob[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${repo}/actions/runs/${runId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`)
      }

      const data = await response.json()
      const jobs = data.jobs || []

      return jobs.map((job: any) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        started_at: job.started_at,
        completed_at: job.completed_at,
        steps: job.steps || []
      }))
    } catch (error) {
      console.error('Failed to get run jobs:', error)
      return []
    }
  }

  async getJobLogs(repo: string, jobId: number, token: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${repo}/actions/jobs/${jobId}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`)
      }

      // GitHub returns logs as plain text
      const logText = await response.text()
      return logText
    } catch (error) {
      console.error('Failed to get job logs:', error)
      return `[Error fetching logs: ${error instanceof Error ? error.message : 'Unknown error'}]\n`
    }
  }

  async triggerWorkflow(repo: string, token: string, workflowFile: string, branch: string = 'main'): Promise<number | null> {
    try {
      // Trigger the workflow
      const triggerResponse = await fetch(`${this.baseUrl}/repos/${repo}/actions/workflows/${workflowFile}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          ref: branch
        })
      })

      if (!triggerResponse.ok) {
        throw new Error(`Failed to trigger workflow: ${triggerResponse.status}`)
      }

      // Wait a moment for the workflow to start
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Get the latest run for this workflow
      const run = await this.getLatestRun(repo, token, workflowFile.replace('.yml', ''))
      return run?.id || null
    } catch (error) {
      console.error('Failed to trigger workflow:', error)
      return null
    }
  }

  parseLogLine(line: string): ParsedLogLine {
    const timestamp = new Date().toLocaleTimeString()
    let level: ParsedLogLine['level'] = 'info'
    let message = line.trim()
    let progress: number | undefined

    // Detect log level and extract progress
    if (message.includes('Error:') || message.includes('error:') || message.includes('✗')) {
      level = 'error'
    } else if (message.includes('Warning:') || message.includes('warning:') || message.includes('⚠')) {
      level = 'warn'
    } else if (message.includes('✓') || message.includes('Success') || message.includes('completed')) {
      level = 'success'
    }

    // Extract progress percentages
    const progressMatch = message.match(/(\d+)%/)
    if (progressMatch) {
      progress = parseInt(progressMatch[1])
    }

    // Clean up common prefixes
    message = message
      .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*/, '') // Remove ISO timestamps
      .replace(/^Run\s+/, '') // Remove "Run " prefix
      .replace(/^\s*\|\s*/, '') // Remove log separators

    return {
      timestamp,
      level,
      message,
      progress
    }
  }

  formatLogLine(parsed: ParsedLogLine): string {
    const icons = {
      info: 'ℹ',
      warn: '⚠',
      error: '✗',
      success: '✓'
    }

    const colors = {
      info: 'text-blue-400',
      warn: 'text-yellow-400',
      error: 'text-red-400',
      success: 'text-green-400'
    }

    const icon = icons[parsed.level]
    const progress = parsed.progress ? ` [${parsed.progress}%]` : ''
    
    return `${icon} ${parsed.message}${progress}`
  }
}

// Singleton instance
export const githubObserver = new GitHubObserver()

// Helper functions for common operations
export async function waitForRunCompletion(
  repo: string,
  token: string,
  runId: number,
  onUpdate?: (run: GitHubRun) => void,
  pollInterval = 3000
): Promise<GitHubRun> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const run = await githubObserver.getLatestRun(repo, token)
        
        if (!run || run.id !== runId) {
          reject(new Error('Run not found'))
          return
        }

        onUpdate?.(run)

        if (run.status === 'completed') {
          resolve(run)
        } else if (run.status === 'failure' || run.status === 'cancelled') {
          reject(new Error(`Run ${run.status}: ${run.conclusion}`))
        } else {
          setTimeout(poll, pollInterval)
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}
