/**
 * Runtime error detection and auto-repair system
 * Captures preview crashes and triggers AI repair before user notices
 */

export interface PreviewError {
  type: 'javascript' | 'promise' | 'console' | 'network' | 'react' | 'vue' | 'performance' | 'system'
  payload: {
    message: string
    stack?: string
    file?: string
    line?: number
    column?: number
    timestamp?: number
    userAgent?: string
    url?: string
    source?: string
    isPromiseRejection?: boolean
    severity: 'error' | 'warning' | 'info'
    args?: string[]
    method?: string
    status?: number
    statusText?: string
    componentStack?: string
    reason?: string
  }
}

export interface RuntimeRepairRequest {
  error: PreviewError
  timestamp: number
  context: {
    files: Record<string, string>
    activeFile?: string
    lastOperation: string
  }
}

export interface StreamingCallbacks {
  onThinking?: (content: string) => void
  onShellCommand?: (command: string) => void
  onFileWrite?: (block: ParsedBlock) => void
  onBlockComplete?: (block: ParsedBlock) => void
  onError?: (error: string) => void
}

export interface AIOrchestrator {
  modifyCodeStreaming(context: AIContext, prompt: string, callbacks: StreamingCallbacks): Promise<FilePatch[]>
  analyzeProjectStructure(files: Record<string, string>): ProjectStructure
  extractDependencies(files: Record<string, string>): Record<string, string>
  detectLanguage(files: Record<string, string>): 'typescript' | 'javascript' | 'python' | undefined
  sendSystemMessage?: (message: string) => Promise<void>
}

export interface AIContext {
  files: Record<string, string>
  activeFile?: string
  projectStructure: ProjectStructure
  dependencies: Record<string, string>
  framework?: 'react' | 'vue' | 'angular' | 'vanilla' | 'node'
  language?: 'typescript' | 'javascript' | 'python'
}

export interface ProjectStructure {
  type: 'frontend' | 'backend' | 'fullstack' | 'static' | 'mobile'
  framework?: string
  entryPoints: string[]
  assets: string[]
  components: string[]
  pages: string[]
}

export interface FilePatch {
  type: 'patch' | 'full'
  file: string
  operations: PatchOperation[]
  checksum?: string
  content?: string
}

export interface PatchOperation {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
}

import { logTelemetry } from './telemetry'

export interface ParsedBlock {
  type: string
  attributes?: { path: string; type: string }
  content: string
  isComplete: boolean
}

/**
 * Circuit Breaker System - Prevents infinite repair loops
 */

interface CrashRecord {
  timestamp: number
  errorHash: string
  errorMessage: string
  errorType: string
}

interface CircuitBreakerConfig {
  maxCrashesPerMinute: number
  maxDuplicateAttempts: number
  cooldownPeriodMs: number
  enableEmergencyBrake: boolean
}

interface CircuitBreakerState {
  crashHistory: CrashRecord[]
  isTripped: boolean
  tripReason?: string
  tripTime?: number
  totalRepairsAttempted: number
  totalRepairsBlocked: number
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    crashHistory: [],
    isTripped: false,
    totalRepairsAttempted: 0,
    totalRepairsBlocked: 0
  }

  constructor(private config: CircuitBreakerConfig = {
    maxCrashesPerMinute: 3,
    maxDuplicateAttempts: 2,
    cooldownPeriodMs: 60000,
    enableEmergencyBrake: true
  }) {}

  /**
   * Creates a deterministic hash of an error for duplicate detection
   */
  private hashError(error: { message: string; stack?: string; type?: string }): string {
    // Normalize the error message for consistent hashing
    const normalizedMessage = error.message
      .toLowerCase()
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/["'][^"']*["']/g, 'S') // Replace strings with S
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    const normalizedStack = error.stack
      ? error.stack
          .toLowerCase()
          .split('\n')
          .slice(0, 3) // Only first 3 stack lines matter
          .join('\n')
          .replace(/\d+/g, 'N')
          .replace(/["'][^"']*["']/g, 'S')
          .replace(/\s+/g, ' ')
      : ''
    
    const combined = `${error.type || 'unknown'}-${normalizedMessage}-${normalizedStack}`
    
    // Simple hash function (you could use crypto.subtle.digest for better security)
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  /**
   * Checks if a repair attempt should be allowed
   */
  shouldAttemptRepair(error: PreviewError): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const errorHash = this.hashError({
      message: error.payload?.message || 'Unknown error',
      stack: error.payload?.stack,
      type: error.type
    })

    // Clean up old history (older than cooldown period)
    this.state.crashHistory = this.state.crashHistory.filter(
      crash => now - crash.timestamp < this.config.cooldownPeriodMs
    )

    // Check if circuit breaker is currently tripped
    if (this.state.isTripped && this.state.tripTime) {
      const timeSinceTrip = now - this.state.tripTime
      if (timeSinceTrip < this.config.cooldownPeriodMs) {
        this.state.totalRepairsBlocked++
        return {
          allowed: false,
          reason: `Circuit breaker is tripped. Cooldown: ${Math.ceil((this.config.cooldownPeriodMs - timeSinceTrip) / 1000)}s remaining`
        }
      } else {
        // Reset circuit breaker after cooldown
        this.reset()
      }
    }

    // Check for exact duplicate errors (AI failed to fix it)
    const duplicateCount = this.state.crashHistory.filter(
      crash => crash.errorHash === errorHash
    ).length

    if (duplicateCount >= this.config.maxDuplicateAttempts) {
      this.trip(`Duplicate error detected ${duplicateCount} times: ${error.payload?.message?.slice(0, 100) || 'Unknown error'}...`)
      return {
        allowed: false,
        reason: `Same error occurred ${duplicateCount} times. Previous repair attempts failed.`
      }
    }

    // Check for crash loop (too many distinct crashes)
    if (this.state.crashHistory.length >= this.config.maxCrashesPerMinute) {
      const uniqueErrors = new Set(this.state.crashHistory.map(c => c.errorHash))
      
      if (uniqueErrors.size >= 2) { // At least 2 different errors
        this.trip(`Crash loop detected: ${this.state.crashHistory.length} crashes in ${this.config.cooldownPeriodMs / 1000}s`)
        return {
          allowed: false,
          reason: `Too many crashes (${this.state.crashHistory.length}) in short succession. Code appears unstable.`
        }
      }
    }

    // Record this crash and allow repair
    this.state.crashHistory.push({
      timestamp: now,
      errorHash,
      errorMessage: error.payload?.message || 'Unknown error',
      errorType: error.type
    })
    
    this.state.totalRepairsAttempted++
    return { allowed: true }
  }

  /**
   * Trips the circuit breaker
   */
  private trip(reason: string): void {
    if (!this.config.enableEmergencyBrake) return
    
    this.state.isTripped = true
    this.state.tripReason = reason
    this.state.tripTime = Date.now()
    
    console.warn('🚨 CIRCUIT BREAKER TRIPPED:', reason)
    console.warn('📊 Stats:', {
      totalAttempts: this.state.totalRepairsAttempted,
      totalBlocked: this.state.totalRepairsBlocked,
      recentCrashes: this.state.crashHistory.length
    })
  }

  /**
   * Resets the circuit breaker
   */
  reset(): void {
    this.state.isTripped = false
    this.state.tripReason = undefined
    this.state.tripTime = undefined
    this.state.crashHistory = []
    
    console.log('🔧 Circuit breaker reset')
  }

  /**
   * Gets current circuit breaker state
   */
  getState(): CircuitBreakerState & { config: CircuitBreakerConfig } {
    return {
      ...this.state,
      config: this.config
    }
  }

  /**
   * Gets statistics for monitoring
   */
  getStats(): {
    totalRepairsAttempted: number
    totalRepairsBlocked: number
    successRate: number
    isTripped: boolean
    recentCrashes: number
  } {
    const successRate = this.state.totalRepairsAttempted > 0 
      ? ((this.state.totalRepairsAttempted - this.state.totalRepairsBlocked) / this.state.totalRepairsAttempted) * 100
      : 100

    return {
      totalRepairsAttempted: this.state.totalRepairsAttempted,
      totalRepairsBlocked: this.state.totalRepairsBlocked,
      successRate: Math.round(successRate * 100) / 100,
      isTripped: this.state.isTripped,
      recentCrashes: this.state.crashHistory.length
    }
  }
}


/**
 * Runtime repair orchestrator
 */
export class RuntimeRepairOrchestrator {
  private repairHistory: RuntimeRepairRequest[] = []
  private isRepairing = false
  private repairCallbacks: {
    onStart?: (request: RuntimeRepairRequest) => void
    onSuccess?: (request: RuntimeRepairRequest, patches: FilePatch[]) => void
    onError?: (request: RuntimeRepairRequest, error: string) => void
    onCircuitBreakerTripped?: (reason: string, stats: ReturnType<CircuitBreaker['getStats']>) => void
  } = {}
  private circuitBreaker: CircuitBreaker

  constructor(
    callbacks?: typeof RuntimeRepairOrchestrator.prototype.repairCallbacks,
    circuitBreakerConfig?: CircuitBreakerConfig
  ) {
    this.repairCallbacks = callbacks || {}
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig)
  }

  /**
   * Trigger automatic runtime repair with circuit breaker protection
   */
  async triggerRuntimeRepair(
    error: PreviewError,
    context: {
      files: Record<string, string>
      activeFile?: string
      lastOperation: string
    },
    aiOrchestrator: AIOrchestrator
  ): Promise<void> {
    if (this.isRepairing) {
      console.log('Runtime repair already in progress, queuing...')
      return
    }

    // Check circuit breaker before attempting repair
    const circuitCheck = this.circuitBreaker.shouldAttemptRepair(error)
    if (!circuitCheck.allowed) {
      console.warn('🚨 Circuit breaker blocked repair attempt:', circuitCheck.reason)
      
      // Notify about circuit breaker trip
      this.repairCallbacks.onCircuitBreakerTripped?.(
        circuitCheck.reason || 'Unknown reason',
        this.circuitBreaker.getStats()
      )
      
      return
    }

    const repairRequest: RuntimeRepairRequest = {
      error,
      timestamp: Date.now(),
      context
    }

    this.repairHistory.push(repairRequest)
    this.isRepairing = true

    // Notify start of repair
    this.repairCallbacks.onStart?.(repairRequest)

    try {
      // Analyze error and generate repair prompt
      const repairPrompt = this.generateRepairPrompt(error, context)
      
      // Send to AI orchestrator for automatic repair
      const patches = await aiOrchestrator.modifyCodeStreaming(
        {
          files: context.files,
          activeFile: context.activeFile,
          projectStructure: aiOrchestrator.analyzeProjectStructure(context.files),
          dependencies: aiOrchestrator.extractDependencies(context.files),
          framework: aiOrchestrator.detectLanguage(context.files) as 'react' | 'vue' | 'angular' | 'vanilla' | 'node',
          language: aiOrchestrator.detectLanguage(context.files)
        },
        repairPrompt,
        {
          onThinking: (content: string) => {
            console.log('🔧 AI thinking about runtime repair:', content)
          },
          onFileWrite: (block: ParsedBlock) => {
            console.log('🔧 AI writing repair for:', block.attributes?.path)
          },
          onBlockComplete: (block: ParsedBlock) => {
            console.log('🔧 AI completed repair block for:', block.attributes?.path)
          },
          onError: (error: string) => {
            console.error('🔧 AI repair failed:', error)
          }
        }
      )

      // Notify success
      this.repairCallbacks.onSuccess?.(repairRequest, patches)
      void logTelemetry({
        type: "CRASH_REPAIRED",
        model: "gemini-2.5-pro", // TODO: pull from orchestrator
        success: true,
        error_signature: error.payload?.message?.slice(0, 200),
        metadata: { file: error.payload?.file, line: error.payload?.line }
      })
      
    } catch (repairError) {
      console.error('Runtime repair failed:', repairError)
      this.repairCallbacks.onError?.(repairRequest, repairError instanceof Error ? repairError.message : 'Unknown error')
    } finally {
      this.isRepairing = false
    }
  }

  /**
   * Generate intelligent repair prompt based on error analysis
   */
  private generateRepairPrompt(error: PreviewError, context: { files: Record<string, string>; activeFile?: string; lastOperation: string }): string {
    const errorAnalysis = this.analyzeError(error, context)
    
    return `SYSTEM ALERT: Runtime error detected in preview window.

ERROR DETAILS:
- Type: ${error.type}
- Message: ${error.payload?.message || 'Unknown error'}
- File: ${error.payload?.file || 'Unknown'}
- Line: ${error.payload?.line || 'Unknown'}
- Severity: ${error.payload?.severity || 'Unknown'}
- Stack: ${error.payload?.stack || 'No stack trace'}
- Timestamp: ${new Date(error.payload?.timestamp || Date.now()).toISOString()}

ERROR ANALYSIS:
${errorAnalysis}

CONTEXT:
- Last Operation: ${context.lastOperation}
- Active File: ${context.activeFile || 'None'}
- Available Files: ${Object.keys(context.files).join(', ')}

REPAIR TASK:
1. Analyze the error type and stack trace to identify the exact cause
2. Read the problematic file(s) to understand the context
3. Generate precise patches to fix the runtime error
4. Focus on the root cause, not just symptoms
5. Test the fix mentally before applying

COMMON FIXES:
- Undefined variables: Check imports, exports, and variable declarations
- Type errors: Fix data types, add null checks, or use optional chaining
- Missing properties: Add default values or proper object structure
- Async errors: Add proper error handling with try/catch
- React errors: Fix component props, state, or lifecycle issues
- Network errors: Add proper error handling and CORS configuration

Execute the repair immediately. The user is waiting for the app to recover.

IMPORTANT: Apply minimal, targeted fixes. Don't rewrite entire files unless absolutely necessary.`;
  }

  /**
   * Analyze error to provide context for AI repair
   */
  private analyzeError(error: PreviewError, context: { files: Record<string, string>; activeFile?: string; lastOperation: string }): string {
    const message = error.payload?.message?.toLowerCase() || '';
    const stack = error.payload?.stack?.toLowerCase() || '';
    const errorType = error.type;
    
    let analysis = ''

    // Start with error type analysis
    analysis += `Error Type: ${errorType}\n`
    analysis += `Severity: ${error.payload?.severity || 'Unknown'}\n\n`

    // Detailed analysis based on error type
    switch (errorType) {
      case 'javascript':
        if (message.includes('undefined') || message.includes('is not defined')) {
          analysis += 'Likely cause: Missing import, variable declaration, or property access\n'
          
          // Try to identify the undefined variable
          const match = message.match(/(?:undefined|not defined)\s+(?:of\s+)?(\w+)/i);
          if (match) {
            analysis += `Undefined variable: ${match[1]}\n`
          }
        } else if (message.includes('null') || message.includes('cannot read')) {
          analysis += 'Likely cause: Null/undefined value being accessed\n'
          analysis += 'Suggested fix: Add null check or optional chaining\n'
        } else if (message.includes('typeerror')) {
          analysis += 'Likely cause: Wrong data type or method call\n'
          analysis += 'Suggested fix: Check variable types before operations\n'
        }
        break
        
      case 'promise':
        analysis += 'Likely cause: Unhandled promise rejection\n'
        analysis += 'Suggested fix: Add .catch() handler or try/catch with await\n'
        if (error.payload.reason) {
          analysis += `Rejection reason: ${error.payload.reason}\n`
        }
        break
        
      case 'console':
        analysis += 'Source: Console error output\n'
        analysis += 'Likely cause: Library or framework error\n'
        if (error.payload.args && error.payload.args.length > 0) {
          analysis += `Console arguments: ${error.payload.args.join(', ')}\n`
        }
        break
        
      case 'network':
        analysis += 'Likely cause: API call failure or network issue\n'
        if (error.payload.method) {
          analysis += `Request method: ${error.payload.method}\n`
        }
        if (error.payload.status) {
          analysis += `HTTP Status: ${error.payload.status} ${error.payload.statusText || ''}\n`
        }
        analysis += 'Suggested fix: Add proper error handling for network requests\n'
        break
        
      case 'react':
        analysis += 'Likely cause: React component error\n'
        if (error.payload.componentStack) {
          analysis += 'Component stack available for debugging\n'
        }
        analysis += 'Suggested fix: Check component props, state, or lifecycle\n'
        break
        
      case 'vue':
        analysis += 'Likely cause: Vue component error\n'
        analysis += 'Suggested fix: Check component data, props, or template\n'
        break
        
      case 'performance':
        analysis += 'Likely cause: Performance issue (slow load)\n'
        analysis += 'Suggested fix: Optimize loading or reduce bundle size\n'
        break
        
      case 'system':
        analysis += 'System message (likely informational)\n'
        break
        
      default:
        analysis += 'Unknown error type - requires investigation\n'
    }

    // Analyze stack trace for file hints
    if (stack) {
      const stackLines = stack.split('\n')
      const relevantLines = stackLines.slice(0, 3) // First few lines are most relevant
      
      analysis += '\nStack trace hints:\n'
      relevantLines.forEach((line, index) => {
        if (line.trim()) {
          analysis += `${index + 1}. ${line.trim()}\n`
        }
      })
    }

    // Add file location context
    if (error.payload.file && error.payload.line) {
      analysis += `\nError location: ${error.payload.file}:${error.payload.line}`
      if (error.payload.column) {
        analysis += `:${error.payload.column}`
      }
    }

    // Add context about available files
    if (context.files) {
      const relevantFiles = Object.keys(context.files).filter(file => 
        file.endsWith('.js') || file.endsWith('.jsx') || 
        file.endsWith('.ts') || file.endsWith('.tsx') ||
        file.endsWith('.vue') || file.endsWith('.html')
      )
      
      if (relevantFiles.length > 0) {
        analysis += `\n\nRelevant files in project:\n${relevantFiles.slice(0, 5).join('\n')}`
        if (relevantFiles.length > 5) {
          analysis += `\n... and ${relevantFiles.length - 5} more`
        }
      }
    }

    return analysis
  }

  /**
   * Get repair history
   */
  getRepairHistory(): RuntimeRepairRequest[] {
    return this.repairHistory
  }

  /**
   * Check if currently repairing
   */
  isCurrentlyRepairing(): boolean {
    return this.isRepairing
  }

  /**
   * Clear repair history
   */
  clearHistory(): void {
    this.repairHistory = []
  }

  /**
   * Get circuit breaker instance
   */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): {
    repairs: {
      total: number
      successful: number
      failed: number
      successRate: number
    }
    circuitBreaker: ReturnType<CircuitBreaker['getStats']>
  } {
    const circuitStats = this.circuitBreaker.getStats()
    const successfulRepairs = this.repairHistory.length - (circuitStats.totalRepairsBlocked)
    
    return {
      repairs: {
        total: this.repairHistory.length,
        successful: Math.max(0, successfulRepairs),
        failed: circuitStats.totalRepairsBlocked,
        successRate: circuitStats.successRate
      },
      circuitBreaker: circuitStats
    }
  }
}
