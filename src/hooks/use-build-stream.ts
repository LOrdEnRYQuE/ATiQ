import { useState, useEffect, useCallback, useRef } from 'react'
import { githubObserver, GitHubRun, ParsedLogLine } from '@/lib/github-observer'
import { triggerPhoenixHealing } from '@/lib/phoenix/phoenix-trigger'

export type BuildStatus = 'queued' | 'in_progress' | 'success' | 'failure' | 'cancelled'

export interface BuildStep {
  name: string
  status: 'queued' | 'in_progress' | 'success' | 'failure'
  started_at?: string
  completed_at?: string
  conclusion?: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required'
}

export interface BuildRun {
  id: number
  status: BuildStatus
  name: string
  head_branch: string
  created_at: string
  updated_at: string
  run_number: number
  workflow_id: number
  jobs: BuildStep[]
  html_url: string
  logs: ParsedLogLine[]
}

export interface UseBuildStreamProps {
  repo: string // 'owner/repo' format
  token: string
  runId?: number
  pollInterval?: number
  enablePhoenix?: boolean // Enable self-healing
  githubConfig?: {
    owner: string
    repo: string
    token: string
    branch: string
  }
}

export function useBuildStream({ repo, token, runId, pollInterval = 2000, enablePhoenix = false, githubConfig }: UseBuildStreamProps) {
  const [buildRun, setBuildRun] = useState<BuildRun | null>(null)
  const [logs, setLogs] = useState<ParsedLogLine[]>([])
  const [status, setStatus] = useState<BuildStatus>('queued')
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phoenixSession] = useState<{
    active: boolean
    diagnosis: any
    surgery: any
    startTime: number
  }>({
    active: false,
    diagnosis: null,
    surgery: null,
    startTime: 0
  })
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const logBufferRef = useRef<Set<string>>(new Set())
  const phoenixTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBuildRun = useCallback(async (runId: number): Promise<BuildRun | null> => {
    try {
      const run = await githubObserver.getLatestRun(repo, token)
      
      if (!run || run.id !== runId) {
        return null
      }

      // Convert GitHubRun to our BuildRun format
      const buildRun: BuildRun = {
        id: run.id,
        status: run.status as BuildStatus,
        name: run.name,
        head_branch: run.head_branch,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_number: run.run_number,
        workflow_id: run.workflow_id,
        jobs: run.jobs.map(job => ({
          name: job.name,
          status: job.status as BuildStep['status'],
          started_at: job.started_at,
          completed_at: job.completed_at,
          conclusion: job.conclusion as BuildStep['conclusion']
        })),
        html_url: run.html_url,
        logs: logs
      }

      return buildRun
    } catch (err) {
      console.error('Failed to fetch build run:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch build status')
      return null
    }
  }, [repo, token, logs])

  const fetchJobLogs = useCallback(async (jobId: number): Promise<ParsedLogLine[]> => {
    try {
      const logText = await githubObserver.getJobLogs(repo, jobId)
      const lines = logText.split('\n').filter(line => line.trim())
      
      // Parse each line and filter out duplicates
      const parsedLines: ParsedLogLine[] = []
      
      for (const line of lines) {
        const parsed = githubObserver.parseLogLine(line)
        const lineKey = `${parsed.timestamp}-${parsed.message}`
        
        // Only add new lines that haven't been seen before
        if (!logBufferRef.current.has(lineKey)) {
          logBufferRef.current.add(lineKey)
          parsedLines.push(parsed)
        }
      }

      return parsedLines
    } catch (err) {
      console.error('Failed to fetch job logs:', err)
      return [{
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `Failed to fetch logs: ${err instanceof Error ? err.message : 'Unknown error'}`
      }]
    }
  }, [repo])

  const startPolling = useCallback((runId: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    setIsPolling(true)
    setError(null)
    logBufferRef.current.clear()

    const poll = async () => {
      const run = await fetchBuildRun(runId)
      if (!run) return

      setBuildRun(run)
      setStatus(run.status)

      // Calculate overall progress based on job completion
      const totalJobs = run.jobs.length
      const completedJobs = run.jobs.filter(job => job.status === 'success' || job.status === 'failure').length
      const jobProgress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
      setProgress(jobProgress)

      // Fetch logs for in-progress jobs
      const inProgressJobs = run.jobs.filter(job => job.status === 'in_progress')
      
      for (const job of inProgressJobs) {
        const jobLogs = await fetchJobLogs(job.id)
        
        if (jobLogs.length > 0) {
          setLogs(prev => {
            const newLogs = [...prev]
            
            // Add only new logs
            for (const log of jobLogs) {
              const logKey = `${log.timestamp}-${log.message}`
              if (!logBufferRef.current.has(logKey)) {
                newLogs.push(log)
                logBufferRef.current.add(logKey)
              }
            }
            
            return newLogs.slice(-100) // Keep only last 100 lines
          })
        }
      }

      // Stop polling if build is complete
      if (run.status === 'success' || run.status === 'failure' || run.status === 'cancelled') {
        setIsPolling(false)
        setProgress(100)
        
        // Trigger Phoenix if build failed and enabled
        if (run.status === 'failure' && enablePhoenix && githubConfig) {
          void triggerPhoenixHealing(run, githubConfig)
        }
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }

    // Initial fetch
    poll()

    // Start polling
    pollingRef.current = setInterval(poll, pollInterval)
  }, [fetchBuildRun, fetchJobLogs, pollInterval, enablePhoenix, githubConfig])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // Auto-start polling if runId is provided
  useEffect(() => {
    if (runId && !isPolling) {
      setTimeout(() => startPolling(runId), 0)
    }
  }, [runId, isPolling, startPolling])

  return {
    buildRun,
    logs,
    status,
    error,
    isPolling,
    progress,
    startPolling,
    stopPolling,
    fetchBuildRun
  }
}

// Helper function to trigger workflow and get run ID
export async function triggerWorkflowAndGetRunId(
  repo: string,
  token: string,
  workflowFile: string,
  branch: string = 'main'
): Promise<number | null> {
  return await githubObserver.triggerWorkflow(repo, token, workflowFile, branch)
}
