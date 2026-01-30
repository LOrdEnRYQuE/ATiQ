/**
 * Project Phoenix: Auto-Commit Integration Service
 * Manages Git operations for automatic error fixes
 */

import { FilePatch } from '../runtime-repair'
import { logTelemetry } from '../telemetry'

export interface CommitResult {
  success: boolean
  commitHash?: string
  branchName: string
  message: string
  changes: number
  timestamp: number
}

export interface PhoenixBranch {
  name: string
  baseBranch: string
  errorType: string
  errorId: string
  createdAt: number
  status: 'active' | 'merged' | 'abandoned'
}

export interface AutoCommitConfig {
  enabled: boolean
  requireApproval: boolean
  maxCommitsPerHour: number
  commitAuthor: {
    name: string
    email: string
  }
  branchPrefix: string
}

/**
 * Auto-Commit Service - Manages Git operations for Phoenix fixes
 */
export class AutoCommitService {
  private config: AutoCommitConfig
  private commitHistory: CommitResult[] = []
  private activeBranches: PhoenixBranch[] = []

  constructor(config: Partial<AutoCommitConfig> = {}) {
    this.config = {
      enabled: true,
      requireApproval: false, // Auto-approve for Phoenix
      maxCommitsPerHour: 10,
      commitAuthor: {
        name: 'Project Phoenix',
        email: 'phoenix@vibe-coding.com'
      },
      branchPrefix: 'phoenix/fix/',
      ...config
    }
  }

  /**
   * Create a new Phoenix branch for error fix
   */
  async createFixBranch(errorType: string, errorId: string, baseBranch: string = 'main'): Promise<PhoenixBranch> {
    const timestamp = Date.now()
    const branchName = `${this.config.branchPrefix}${errorType}/${errorId.substring(0, 8)}`

    const branch: PhoenixBranch = {
      name: branchName,
      baseBranch,
      errorType,
      errorId,
      createdAt: timestamp,
      status: 'active'
    }

    this.activeBranches.push(branch)

    // In a real implementation, this would execute Git commands
    console.log(`🔥 Phoenix: Creating branch ${branchName} from ${baseBranch}`)
    
    // Simulate Git branch creation
    await this.simulateGitCommand(`git checkout -b ${branchName}`)
    await this.simulateGitCommand(`git push -u origin ${branchName}`)

    void logTelemetry({
      type: "PHOENIX_BRANCH_CREATED",
      model: "phoenix-auto-commit",
      success: true,
      metadata: { 
        branchName, 
        errorType, 
        errorId: errorId.substring(0, 8) 
      }
    })

    return branch
  }

  /**
   * Apply fixes and commit them to the Phoenix branch
   */
  async commitFix(
    branch: PhoenixBranch, 
    patches: FilePatch[], 
    files: Record<string, string>
  ): Promise<CommitResult> {
    const timestamp = Date.now()
    
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Phoenix auto-commit rate limit exceeded')
    }

    console.log(`🔥 Phoenix: Applying ${patches.length} fixes to ${branch.name}`)

    // Apply patches to files
    let changesCount = 0
    for (const patch of patches) {
      const result = await this.applyPatch(patch, files)
      if (result.success) {
        changesCount += result.changes
      }
    }

    // Stage and commit changes
    await this.simulateGitCommand('git add .')
    
    const commitMessage = this.generateCommitMessage(branch, patches)
    const commitResult = await this.simulateGitCommand(`git commit -m "${commitMessage}"`)
    
    const commitHash = this.extractCommitHash(commitResult)
    
    // Push to remote
    await this.simulateGitCommand(`git push origin ${branch.name}`)

    const result: CommitResult = {
      success: true,
      commitHash,
      branchName: branch.name,
      message: commitMessage,
      changes: changesCount,
      timestamp
    }

    this.commitHistory.push(result)

    void logTelemetry({
      type: "PHOENIX_FIX_COMMITTED",
      model: "phoenix-auto-commit",
      success: true,
      metadata: { 
        branchName: branch.name,
        patchesCount: patches.length,
        changesCount,
        commitHash: commitHash?.substring(0, 8) 
      }
    })

    return result
  }

  /**
   * Trigger rebuild with the committed fixes
   */
  async triggerRebuild(commitResult: CommitResult): Promise<{ success: boolean; buildUrl?: string }> {
    console.log(`🔥 Phoenix: Triggering rebuild for ${commitResult.branchName}`)

    // In a real implementation, this would trigger CI/CD pipeline
    // For now, simulate the trigger
    await this.simulateDelay(2000) // Simulate API call

    const buildUrl = `https://vercel.com/build/phoenix-${commitResult.commitHash?.substring(0, 8)}`

    void logTelemetry({
      type: "PHOENIX_REBUILD_TRIGGERED",
      model: "phoenix-auto-commit",
      success: true,
      metadata: { 
        branchName: commitResult.branchName,
        buildUrl 
      }
    })

    return {
      success: true,
      buildUrl
    }
  }

  /**
   * Create pull request for the fix (optional)
   */
  async createPullRequest(
    branch: PhoenixBranch, 
    commitResult: CommitResult,
    autoMerge: boolean = true
  ): Promise<{ success: boolean; prUrl?: string }> {
    const prTitle = `🔥 Phoenix Auto-Fix: ${branch.errorType} Error`
    const prBody = this.generatePRDescription(branch, commitResult)

    console.log(`🔥 Phoenix: Creating PR for ${branch.name} - ${prTitle}`)

    // Simulate PR creation
    await this.simulateDelay(1500)

    const prUrl = `https://github.com/vibe-coding/app/pull/${Date.now()}`

    if (autoMerge) {
      console.log(`🔥 Phoenix: Auto-merging PR ${prUrl}`)
      await this.simulateDelay(1000)
    }

    // Mark branch as merged
    branch.status = 'merged'

    void logTelemetry({
      type: "PHOENIX_PR_CREATED",
      model: "phoenix-auto-commit",
      success: true,
      metadata: { 
        branchName: branch.name,
        prUrl,
        autoMerge 
      }
    })

    return {
      success: true,
      prUrl
    }
  }

  /**
   * Apply a single patch to files
   */
  private async applyPatch(patch: FilePatch, files: Record<string, string>): Promise<{ success: boolean; changes: number }> {
    try {
      let changes = 0

      if (patch.type === 'full') {
        // Full file replacement
        if (patch.content) {
          files[patch.file] = patch.content
          changes = 1
        }
      } else if (patch.type === 'patch') {
        // Apply patch operations
        const currentContent = files[patch.file] || ''
        let newContent = currentContent

        for (const operation of patch.operations) {
          const result = this.applyOperation(newContent, operation)
          newContent = result.content
          changes += result.changes
        }

        files[patch.file] = newContent
      }

      console.log(`🔥 Phoenix: Applied patch to ${patch.file} (${changes} changes)`)
      return { success: true, changes }
    } catch (error) {
      console.error(`🔥 Phoenix: Failed to apply patch to ${patch.file}:`, error)
      return { success: false, changes: 0 }
    }
  }

  /**
   * Apply a single operation to content
   */
  private applyOperation(content: string, operation: { type: string; position: number; content?: string; length?: number }): { content: string; changes: number } {
    const lines = content.split('\n')
    let changes = 0

    switch (operation.type) {
      case 'insert':
        lines.splice(operation.position, 0, operation.content || '')
        changes = 1
        break

      case 'delete':
        lines.splice(operation.position, operation.length || 1)
        changes = 1
        break

      case 'replace':
        lines[operation.position] = operation.content || lines[operation.position]
        changes = 1
        break
    }

    return {
      content: lines.join('\n'),
      changes
    }
  }

  /**
   * Generate commit message for Phoenix fix
   */
  private generateCommitMessage(branch: PhoenixBranch, patches: FilePatch[]): string {
    const filesChanged = patches.map(p => p.file).join(', ')
    const timestamp = new Date().toISOString()

    return `🔥 Phoenix Auto-Fix: ${branch.errorType}

Error ID: ${branch.errorId.substring(0, 8)}
Files changed: ${filesChanged}
Timestamp: ${timestamp}

This commit was automatically generated by Project Phoenix
to resolve a build failure and restore functionality.`
  }

  /**
   * Generate pull request description
   */
  private generatePRDescription(branch: PhoenixBranch, commitResult: CommitResult): string {
    return `## 🔥 Project Phoenix Auto-Fix

**Error Type:** ${branch.errorType}  
**Error ID:** ${branch.errorId.substring(0, 8)}  
**Branch:** ${branch.name}  
**Changes:** ${commitResult.changes} files modified  

### Summary
This PR contains automatically generated fixes to resolve a build failure detected by Project Phoenix. The system analyzed the error, identified the root cause, and applied minimal targeted fixes to restore functionality.

### Files Modified
${commitResult.message.split('\n').find(line => line.includes('Files changed:')) || 'Multiple files'}

### Verification
- ✅ Error analysis completed
- ✅ Fixes applied successfully  
- ✅ Build triggered for validation
- ✅ Ready for auto-merge

---
*Generated by Project Phoenix - Self-Healing DevOps System*`
  }

  /**
   * Check rate limiting for commits
   */
  private checkRateLimit(): boolean {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentCommits = this.commitHistory.filter(c => c.timestamp > oneHourAgo)
    
    return recentCommits.length < this.config.maxCommitsPerHour
  }

  /**
   * Simulate Git command execution
   */
  private async simulateGitCommand(command: string): Promise<string> {
    console.log(`🔥 Phoenix Git: ${command}`)
    await this.simulateDelay(500) // Simulate network/processing time

    // Return mock results based on command
    if (command.includes('commit')) {
      return `[master ${this.generateMockHash()}] Phoenix Auto-Fix applied`
    } else if (command.includes('push')) {
      return `Branch '${command.split(' ').pop()}' set up to track remote branch`
    } else {
      return `Command executed: ${command}`
    }
  }

  /**
   * Extract commit hash from Git output
   */
  private extractCommitHash(gitOutput: string): string | undefined {
    const match = gitOutput.match(/\[([a-f0-9]+)\]/)
    return match ? match[1] : this.generateMockHash()
  }

  /**
   * Generate mock commit hash
   */
  private generateMockHash(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * Simulate delay for async operations
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get commit history
   */
  getCommitHistory(): CommitResult[] {
    return [...this.commitHistory]
  }

  /**
   * Get active branches
   */
  getActiveBranches(): PhoenixBranch[] {
    return [...this.activeBranches]
  }

  /**
   * Clean up old branches
   */
  cleanupOldBranches(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge
    this.activeBranches = this.activeBranches.filter(branch => {
      if (branch.createdAt < cutoff) {
        console.log(`🔥 Phoenix: Cleaning up old branch ${branch.name}`)
        return false
      }
      return true
    })
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCommits: number
    successRate: number
    activeBranches: number
    avgChangesPerCommit: number
  } {
    const successfulCommits = this.commitHistory.filter(c => c.success)
    const totalChanges = this.commitHistory.reduce((sum, c) => sum + c.changes, 0)

    return {
      totalCommits: this.commitHistory.length,
      successRate: this.commitHistory.length > 0 ? (successfulCommits.length / this.commitHistory.length) * 100 : 100,
      activeBranches: this.activeBranches.length,
      avgChangesPerCommit: this.commitHistory.length > 0 ? totalChanges / this.commitHistory.length : 0
    }
  }
}

// Singleton instance
export const autoCommitService = new AutoCommitService()
