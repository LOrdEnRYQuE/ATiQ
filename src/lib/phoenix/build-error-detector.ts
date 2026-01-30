/**
 * Project Phoenix: Build Error Detection and Classification System
 * Extracts, classifies, and analyzes build errors for automatic repair
 */

export interface BuildError {
  id: string
  type: 'dependency' | 'syntax' | 'config' | 'runtime' | 'network' | 'permission' | 'unknown'
  severity: 'critical' | 'error' | 'warning' | 'info'
  message: string
  file?: string
  line?: number
  column?: number
  stack?: string
  timestamp: number
  context: {
    command?: string
    exitCode?: number
    logs: string[]
    lastOperation: string
  }
  suggestedFix?: string
  confidence: number // 0-100
}

export interface ParsedBuildLog {
  errors: BuildError[]
  warnings: BuildError[]
  summary: {
    totalErrors: number
    totalWarnings: number
    errorTypes: Record<string, number>
    buildStatus: 'success' | 'failed' | 'warning'
    duration?: number
  }
}

/**
 * Build Error Detector - Extracts and classifies errors from build logs
 */
export class BuildErrorDetector {
  private errorPatterns = {
    // Dependency errors
    dependency: [
      /npm ERR!\s+code\s+ERESOLVE/i,
      /npm ERR!\s+peer dep missing/i,
      /Could not resolve dependency/i,
      /UNMET PEER DEPENDENCY/i,
      /Module not found/i,
      /Cannot find module/i,
      /Error: Cannot find package/i,
      /Failed to resolve loader/i
    ],

    // Syntax errors  
    syntax: [
      /SyntaxError:/i,
      /Unexpected token/i,
      /Unexpected identifier/i,
      /Missing semicolon/i,
      /Invalid regular expression/i,
      /Unterminated string literal/i,
      /Unexpected end of input/i,
      /Parsing error/i,
      /TypeScript error/i,
      /TS\d+:/i
    ],

    // Configuration errors
    config: [
      /Configuration file not found/i,
      /Invalid configuration/i,
      /Missing required configuration/i,
      /config file is missing/i,
      /No configuration file found/i,
      /Invalid option/i,
      /Unknown option/i,
      /CLI error/i
    ],

    // Runtime errors
    runtime: [
      /ReferenceError:/i,
      /TypeError:/i,
      /Cannot read propert(y|ies)/i,
      /is not a function/i,
      /is not defined/i,
      /null.*undefined/i,
      /Cannot access.*before initialization/i
    ],

    // Network errors
    network: [
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /Network error/i,
      /fetch failed/i,
      /Failed to load resource/i,
      /CORS policy/i,
      /404 Not Found/i,
      /500 Internal Server Error/i
    ],

    // Permission errors
    permission: [
      /EACCES/i,
      /EPERM/i,
      /Permission denied/i,
      /Access denied/i,
      /Unauthorized/i,
      /Forbidden/i
    ]
  }

  /**
   * Parse build logs and extract errors
   */
  parseBuildLogs(logs: string[], context: { command?: string; exitCode?: number; lastOperation: string }): ParsedBuildLog {
    const errors: BuildError[] = []
    const warnings: BuildError[] = []
    const errorTypes: Record<string, number> = {}

    // Process each log line
    for (let i = 0; i < logs.length; i++) {
      const line = logs[i]
      const error = this.extractErrorFromLine(line, i, logs, context)
      
      if (error) {
        if (error.severity === 'warning') {
          warnings.push(error)
        } else {
          errors.push(error)
          errorTypes[error.type] = (errorTypes[error.type] || 0) + 1
        }
      }
    }

    // Determine build status
    let buildStatus: 'success' | 'failed' | 'warning' = 'success'
    if (errors.length > 0) buildStatus = 'failed'
    else if (warnings.length > 0) buildStatus = 'warning'

    return {
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        errorTypes,
        buildStatus,
        duration: undefined // Can be calculated from timestamps if needed
      }
    }
  }

  /**
   * Extract error information from a single log line
   */
  private extractErrorFromLine(
    line: string, 
    lineIndex: number, 
    allLogs: string[], 
    context: { command?: string; exitCode?: number; lastOperation: string }
  ): BuildError | null {
    // Skip empty lines and non-error lines
    if (!line.trim() || this.isInfoLine(line)) return null

    const errorType = this.classifyError(line)
    if (errorType === 'unknown') return null

    const error = this.parseErrorDetails(line, errorType, lineIndex, allLogs, context)
    return error
  }

  /**
   * Classify error type based on patterns
   */
  private classifyError(line: string): BuildError['type'] {
    for (const [type, patterns] of Object.entries(this.errorPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return type as BuildError['type']
        }
      }
    }
    return 'unknown'
  }

  /**
   * Parse detailed error information
   */
  private parseErrorDetails(
    line: string,
    type: BuildError['type'],
    lineIndex: number,
    allLogs: string[],
    context: { command?: string; exitCode?: number; lastOperation: string }
  ): BuildError {
    const errorId = `error_${Date.now()}_${lineIndex}`
    const timestamp = Date.now()

    // Extract file and line information
    const fileMatch = line.match(/at\s+.*\(([^:]+):(\d+):(\d+)\)/) ||
                     line.match(/Error:\s+([^:]+):(\d+):(\d+)/) ||
                     line.match(/TS\d+:\s+([^:]+):(\d+):(\d+)/)

    const severity = this.determineSeverity(line, type)
    const confidence = this.calculateConfidence(line, type)

    // Get surrounding context lines
    const contextLines = allLogs.slice(
      Math.max(0, lineIndex - 3),
      Math.min(allLogs.length, lineIndex + 4)
    )

    // Extract stack trace
    const stack = this.extractStackTrace(lineIndex, allLogs)

    const suggestedFix = this.generateSuggestedFix(line, type)

    return {
      id: errorId,
      type,
      severity,
      message: this.cleanErrorMessage(line),
      file: fileMatch?.[1],
      line: fileMatch?.[2] ? parseInt(fileMatch[2]) : undefined,
      column: fileMatch?.[3] ? parseInt(fileMatch[3]) : undefined,
      stack,
      timestamp,
      context: {
        command: context.command,
        exitCode: context.exitCode,
        logs: contextLines,
        lastOperation: context.lastOperation
      },
      suggestedFix,
      confidence
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(line: string, type: BuildError['type']): BuildError['severity'] {
    // Critical errors that completely stop the build
    if (line.includes('FATAL') || line.includes('CRITICAL') || type === 'permission') {
      return 'critical'
    }

    // Regular errors
    if (line.includes('ERROR') || type === 'dependency' || type === 'syntax') {
      return 'error'
    }

    // Warnings
    if (line.includes('WARN') || line.includes('WARNING')) {
      return 'warning'
    }

    // Default to error for unknown types
    return 'error'
  }

  /**
   * Calculate confidence in error classification
   */
  private calculateConfidence(line: string, type: BuildError['type']): number {
    let confidence = 50 // Base confidence

    // Boost confidence for specific patterns
    if (type === 'dependency' && line.includes('npm ERR!')) confidence += 30
    if (type === 'syntax' && line.includes('SyntaxError')) confidence += 30
    if (type === 'config' && line.includes('Configuration')) confidence += 25
    if (type === 'runtime' && line.includes('Error:')) confidence += 20

    // Boost for file/line information
    if (line.match(/\d+:\d+/)) confidence += 15

    return Math.min(100, confidence)
  }

  /**
   * Extract stack trace from surrounding lines
   */
  private extractStackTrace(lineIndex: number, allLogs: string[]): string | undefined {
    const stackLines: string[] = []
    
    // Look forward for stack trace
    for (let i = lineIndex + 1; i < Math.min(lineIndex + 10, allLogs.length); i++) {
      const line = allLogs[i]
      if (line.trim().startsWith('at ') || line.includes('node_modules')) {
        stackLines.push(line)
      } else if (stackLines.length > 0 && !line.trim()) {
        // Stop at first empty line after stack started
        break
      }
    }

    return stackLines.length > 0 ? stackLines.join('\n') : undefined
  }

  /**
   * Generate suggested fix based on error type
   */
  private generateSuggestedFix(line: string, type: BuildError['type']): string | undefined {
    switch (type) {
      case 'dependency':
        if (line.includes('ERESOLVE')) {
          return 'Try adding --legacy-peer-deps to npm install or update package.json dependencies'
        }
        if (line.includes('Module not found')) {
          return 'Install missing dependency: npm install [module-name]'
        }
        return 'Check package.json dependencies and run npm install'

      case 'syntax':
        if (line.includes('Unexpected token')) {
          return 'Check syntax around the reported line and column'
        }
        return 'Fix syntax error in the reported file'

      case 'config':
        return 'Check configuration files (package.json, tsconfig.json, etc.)'

      case 'runtime':
        if (line.includes('Cannot read property')) {
          return 'Add null check or optional chaining'
        }
        return 'Check variable initialization and data types'

      case 'network':
        return 'Check network connection and API endpoints'

      case 'permission':
        return 'Check file permissions and run with appropriate access rights'

      default:
        return 'Review error details and check documentation'
    }
  }

  /**
   * Clean error message for display
   */
  private cleanErrorMessage(line: string): string {
    return line
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
      .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*/, '') // Remove timestamps
      .trim()
  }

  /**
   * Check if line is informational (not an error)
   */
  private isInfoLine(line: string): boolean {
    return !!(line.includes('info') || 
           line.includes('debug') || 
           line.includes('verbose') ||
           line.match(/^\s*>\s+/) || // npm command echo
           line.match(/^\s*\$\s+/)) // shell command echo
  }

  /**
   * Get most critical error (for Phoenix prioritization)
   */
  getMostCriticalError(errors: BuildError[]): BuildError | null {
    if (errors.length === 0) return null

    // Sort by severity and confidence
    return errors.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      
      if (severityDiff !== 0) return severityDiff
      return b.confidence - a.confidence
    })[0]
  }

  /**
   * Check if build failure is repairable by Phoenix
   */
  isRepairableError(error: BuildError): boolean {
    // Unrepairable errors
    if (error.type === 'permission' || error.type === 'network') {
      return false
    }

    // Low confidence errors are risky to auto-repair
    if (error.confidence < 60) {
      return false
    }

    // Critical and error severity are repairable
    return ['critical', 'error'].includes(error.severity)
  }

  /**
   * Generate repair prompt for AI
   */
  generateRepairPrompt(error: BuildError, files: Record<string, string>): string {
    const context = error.context.logs.slice(-5).join('\n')
    const fileList = Object.keys(files).slice(0, 10).join(', ')

    return `PROJECT PHOENIX: Build error detected requiring automatic repair.

ERROR DETAILS:
- Type: ${error.type}
- Severity: ${error.severity}
- Message: ${error.message}
- File: ${error.file || 'Unknown'}
- Line: ${error.line || 'Unknown'}
- Confidence: ${error.confidence}%

SUGGESTED FIX: ${error.suggestedFix || 'No suggestion available'}

RECENT LOGS:
${context}

AVAILABLE FILES:
${fileList}

REPAIR INSTRUCTIONS:
1. Analyze the error type and determine the root cause
2. Read the problematic file(s) to understand the context
3. Generate minimal, targeted fixes to resolve the build error
4. Focus on the specific error, don't rewrite entire files
5. Test the fix mentally before applying

COMMON REPAIR STRATEGIES:
- Dependency errors: Update package.json versions, add missing deps
- Syntax errors: Fix typos, add missing semicolons, correct imports
- Config errors: Fix configuration files, add missing settings
- Runtime errors: Add null checks, fix variable initialization

Execute the repair immediately. The build is waiting to recover.

IMPORTANT: Apply the smallest possible fix that resolves the error.`
  }
}

// Singleton instance
export const buildErrorDetector = new BuildErrorDetector()
