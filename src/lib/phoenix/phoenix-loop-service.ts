/**
 * Project Phoenix: Main Loop Service
 * Connects Sentinel (build monitoring) to Genesis (AI repair) for self-healing
 */

import { BuildError, buildErrorDetector } from './build-error-detector'
import { autoCommitService, PhoenixBranch, CommitResult } from './auto-commit-service'
import { RuntimeRepairOrchestrator, RuntimeRepairRequest, CircuitBreaker } from '../runtime-repair'
import { AIOrchestrator } from '../runtime-repair'
import { FilePatch } from '../runtime-repair'
import { logTelemetry } from '../telemetry'

export interface PhoenixLoopConfig {
  enabled: boolean
  autoRetry: boolean
  maxRetries: number
  retryDelay: number // ms
  requireApproval: boolean
  enableCircuitBreaker: boolean
}

export interface PhoenixSession {
  id: string
  buildId: string
  error: BuildError
  branch?: PhoenixBranch
  commit?: CommitResult
  status: 'detecting' | 'repairing' | 'committing' | 'rebuilding' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  retryCount: number
  logs: string[]
}

export interface PhoenixStats {
  totalSessions: number
  successfulRepairs: number
  failedRepairs: number
  avgRepairTime: number
  successRate: number
  activeSessions: number
}

/**
 * Phoenix Loop Service - Main orchestrator for self-healing builds
 */
export class PhoenixLoopService {
  private config: PhoenixLoopConfig
  private activeSessions: Map<string, PhoenixSession> = new Map()
  private repairOrchestrator: RuntimeRepairOrchestrator
  private isRunning = false
  private stats: PhoenixStats = {
    totalSessions: 0,
    successfulRepairs: 0,
    failedRepairs: 0,
    avgRepairTime: 0,
    successRate: 0,
    activeSessions: 0
  }

  constructor(
    private aiOrchestrator: AIOrchestrator,
    config: Partial<PhoenixLoopConfig> = {}
  ) {
    this.config = {
      enabled: true,
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 5000,
      requireApproval: false,
      enableCircuitBreaker: true,
      ...config
    }

    this.repairOrchestrator = new RuntimeRepairOrchestrator(
      {
        onStart: (request) => this.onRepairStart(request),
        onSuccess: (request, patches) => this.onRepairSuccess(request, patches),
        onError: (request, error) => this.onRepairError(request, error),
        onCircuitBreakerTripped: (reason, stats) => this.onCircuitBreakerTripped(reason, stats)
      },
      {
        maxCrashesPerMinute: 5,
        maxDuplicateAttempts: 2,
        cooldownPeriodMs: 60000,
        enableEmergencyBrake: this.config.enableCircuitBreaker
      }
    )
  }

  /**
   * Main entry point - Detect build failure and trigger Phoenix loop
   */
  async handleBuildFailure(
    buildId: string,
    buildLogs: string[],
    context: {
      command?: string
      exitCode?: number
      files: Record<string, string>
      lastOperation: string
    }
  ): Promise<PhoenixSession> {
    if (!this.config.enabled) {
      throw new Error('Phoenix loop is disabled')
    }

    const sessionId = this.generateSessionId()
    console.log(`🔥 Phoenix: Starting self-healing session ${sessionId} for build ${buildId}`)

    // Parse build logs to extract errors
    const parsedLog = buildErrorDetector.parseBuildLogs(buildLogs, context)
    
    if (parsedLog.summary.totalErrors === 0) {
      throw new Error('No build errors detected - Phoenix not needed')
    }

    // Get most critical error for repair
    const criticalError = buildErrorDetector.getMostCriticalError(parsedLog.errors)
    if (!criticalError) {
      throw new Error('No repairable errors found')
    }

    // Check if error is repairable
    if (!buildErrorDetector.isRepairableError(criticalError)) {
      throw new Error(`Error type ${criticalError.type} is not auto-repairable`)
    }

    // Create Phoenix session
    const session: PhoenixSession = {
      id: sessionId,
      buildId,
      error: criticalError,
      status: 'detecting',
      startTime: Date.now(),
      retryCount: 0,
      logs: [`🔥 Phoenix: Detected ${criticalError.type} error - ${criticalError.message}`]
    }

    this.activeSessions.set(sessionId, session)
    this.stats.totalSessions++
    this.stats.activeSessions++

    try {
      // Execute Phoenix loop
      await this.executePhoenixLoop(session, context.files)
    } catch (error) {
      session.status = 'failed'
      session.endTime = Date.now()
      session.logs.push(`🔥 Phoenix: Session failed - ${error}`)
      this.stats.failedRepairs++
      this.stats.activeSessions--
      
      void logTelemetry({
        type: "REPAIR_FAILED",
        model: "phoenix-loop",
        success: false,
        error_signature: criticalError.message,
        metadata: { 
          sessionId,
          buildId,
          errorType: criticalError.type,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }

    return session
  }

  /**
   * Execute the complete Phoenix loop
   */
  private async executePhoenixLoop(session: PhoenixSession, files: Record<string, string>): Promise<void> {
    try {
      // Step 1: Create fix branch
      session.status = 'repairing'
      session.logs.push('🔥 Phoenix: Creating fix branch...')
      
      const branch = await autoCommitService.createFixBranch(
        session.error.type,
        session.error.id,
        'main'
      )
      
      session.branch = branch
      session.logs.push(`🔥 Phoenix: Created branch ${branch.name}`)

      // Step 2: Trigger AI repair
      session.logs.push('🔥 Phoenix: Triggering AI repair...')
      
      await this.repairOrchestrator.triggerRuntimeRepair(
        {
          type: session.error.type as any,
          payload: {
            message: session.error.message,
            file: session.error.file,
            line: session.error.line,
            severity: session.error.severity === 'critical' ? 'error' : session.error.severity,
            stack: session.error.stack
          }
        },
        {
          files,
          activeFile: session.error.file,
          lastOperation: 'build_failure'
        },
        this.aiOrchestrator
      )

      // Step 3: Commit and rebuild (handled in callbacks)
      // The flow continues in onRepairSuccess callback

    } catch (error) {
      // Handle retry logic
      if (this.config.autoRetry && session.retryCount < this.config.maxRetries) {
        session.retryCount++
        session.logs.push(`🔥 Phoenix: Retry ${session.retryCount}/${this.config.maxRetries} after error: ${error}`)
        
        await this.delay(this.config.retryDelay)
        return this.executePhoenixLoop(session, files)
      }
      
      throw error
    }
  }

  /**
   * Handle repair start
   */
  private onRepairStart(request: RuntimeRepairRequest): void {
    const session = this.findSessionByError(request.error)
    if (session) {
      session.logs.push('🔥 Phoenix: AI repair started...')
    }
  }

  /**
   * Handle successful repair
   */
  private async onRepairSuccess(request: RuntimeRepairRequest, patches: FilePatch[]): Promise<void> {
    const session = this.findSessionByError(request.error)
    if (!session || !session.branch) return

    try {
      session.status = 'committing'
      session.logs.push(`🔥 Phoenix: Repair successful with ${patches.length} patches`)

      // Step 3: Commit fixes
      const commitResult = await autoCommitService.commitFix(
        session.branch,
        patches,
        request.context.files
      )

      session.commit = commitResult
      session.logs.push(`🔥 Phoenix: Committed fixes - ${commitResult.commitHash}`)

      // Step 4: Trigger rebuild
      session.status = 'rebuilding'
      session.logs.push('🔥 Phoenix: Triggering rebuild...')
      
      const rebuildResult = await autoCommitService.triggerRebuild(commitResult)
      
      if (rebuildResult.success) {
        session.status = 'completed'
        session.endTime = Date.now()
        session.logs.push(`🔥 Phoenix: Rebuild triggered - ${rebuildResult.buildUrl}`)
        
        this.stats.successfulRepairs++
        this.stats.activeSessions--
        
        // Calculate average repair time
        const repairTime = session.endTime - session.startTime
        this.updateAvgRepairTime(repairTime)

        void logTelemetry({
          type: "CRASH_REPAIRED",
          model: "phoenix-loop",
          success: true,
          error_signature: session.error.message,
          metadata: { 
            sessionId: session.id,
            buildId: session.buildId,
            patchesCount: patches.length,
            repairTime,
            buildUrl: rebuildResult.buildUrl
          }
        })

        console.log(`🔥 Phoenix: Session ${session.id} completed successfully!`)
      } else {
        throw new Error('Rebuild trigger failed')
      }

    } catch (error) {
      session.status = 'failed'
      session.endTime = Date.now()
      session.logs.push(`🔥 Phoenix: Commit/rebuild failed - ${error}`)
      this.stats.failedRepairs++
      this.stats.activeSessions--
      
      void logTelemetry({
        type: "REPAIR_FAILED",
        model: "phoenix-loop",
        success: false,
        error_signature: session.error.message,
        metadata: { 
          sessionId: session.id,
          buildId: session.buildId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  /**
   * Handle repair error
   */
  private onRepairError(request: RuntimeRepairRequest, error: string): void {
    const session = this.findSessionByError(request.error)
    if (session) {
      session.logs.push(`🔥 Phoenix: AI repair failed - ${error}`)
    }
  }

  /**
   * Handle circuit breaker trip
   */
  private onCircuitBreakerTripped(reason: string, stats: ReturnType<CircuitBreaker['getStats']>): void {
    console.warn(`🔥 Phoenix: Circuit breaker tripped - ${reason}`)
    console.warn(`🔥 Phoenix: Stats - ${JSON.stringify(stats)}`)
    
    // Mark all active sessions as failed due to circuit breaker
    for (const session of this.activeSessions.values()) {
      if (session.status !== 'completed' && session.status !== 'failed') {
        session.status = 'failed'
        session.endTime = Date.now()
        session.logs.push(`🔥 Phoenix: Failed - Circuit breaker tripped: ${reason}`)
        this.stats.failedRepairs++
        this.stats.activeSessions--
      }
    }
  }

  /**
   * Find session by error
   */
  private findSessionByError(error: RuntimeRepairRequest['error']): PhoenixSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.error.id === error.payload?.message || 
          session.error.message === error.payload?.message) {
        return session
      }
    }
    return undefined
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `phoenix_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Update average repair time
   */
  private updateAvgRepairTime(repairTime: number): void {
    const totalRepairs = this.stats.successfulRepairs
    const currentAvg = this.stats.avgRepairTime
    
    this.stats.avgRepairTime = ((currentAvg * (totalRepairs - 1)) + repairTime) / totalRepairs
    this.stats.successRate = (this.stats.successfulRepairs / this.stats.totalSessions) * 100
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): PhoenixSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): PhoenixSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.status !== 'completed' && s.status !== 'failed')
  }

  /**
   * Get all sessions (including completed)
   */
  getAllSessions(): PhoenixSession[] {
    return Array.from(this.activeSessions.values())
  }

  /**
   * Get Phoenix statistics
   */
  getStats(): PhoenixStats {
    return { ...this.stats }
  }

  /**
   * Clear old sessions
   */
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge
    const toDelete: string[] = []
    
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.endTime && session.endTime < cutoff) {
        toDelete.push(id)
      }
    }
    
    toDelete.forEach(id => this.activeSessions.delete(id))
    console.log(`🔥 Phoenix: Cleaned up ${toDelete.length} old sessions`)
  }

  /**
   * Enable/disable Phoenix loop
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    console.log(`🔥 Phoenix: ${enabled ? 'Enabled' : 'Disabled'} self-healing loop`)
  }

  /**
   * Check if Phoenix is running
   */
  isEnabled(): boolean {
    return this.config.enabled
  }
}

// Singleton instance
let phoenixLoopService: PhoenixLoopService | null = null

export function getPhoenixLoopService(aiOrchestrator: AIOrchestrator, config?: Partial<PhoenixLoopConfig>): PhoenixLoopService {
  if (!phoenixLoopService) {
    phoenixLoopService = new PhoenixLoopService(aiOrchestrator, config)
  }
  return phoenixLoopService
}
