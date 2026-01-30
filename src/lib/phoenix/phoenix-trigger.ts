/**
 * Project Phoenix: Trigger Phoenix Healing Function
 * Handles the complete self-healing workflow
 */

import { errorDiagnostician } from './diagnostician'
import { createAutoSurgeon } from './surgeon'
import { BuildRun } from '@/hooks/use-build-stream'
type TelemetryEvent =
  | { type: "CRASH_REPAIRED"; model?: string; success: boolean; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "REPAIR_FAILED"; model?: string; success: false; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "PROMPT_USED"; model?: string; prompt_version?: string; metadata?: Record<string, unknown> }
  | { type: "CRASH"; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "FEATURE_USED"; feature: string; metadata?: Record<string, unknown> }
  | { type: "SESSION_START"; metadata?: Record<string, unknown> }
  | { type: "SESSION_END"; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_BRANCH_CREATED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_FIX_COMMITTED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_REBUILD_TRIGGERED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_PR_CREATED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_SURGERY_COMPLETED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_SURGERY_FAILED"; model?: string; success: false; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_HEALING_COMPLETED"; model?: string; success: boolean; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_HEALING_FAILED"; model?: string; success: false; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_HEALING_SKIPPED"; model?: string; success: false; metadata?: Record<string, unknown> }
  | { type: "PHOENIX_HEALING_ERROR"; model?: string; success: false; metadata?: Record<string, unknown> };

async function logTelemetry(event: TelemetryEvent) {
  // Mock implementation - would use real telemetry in production
  console.log('🔥 Phoenix Telemetry:', event.type, event.metadata)
}

interface BuildContext {
  framework: 'react' | 'vue' | 'angular' | 'next' | 'expo' | 'unknown'
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown'
  platform: 'web' | 'mobile' | 'desktop' | 'unknown'
  lastOperation: string
  files: Record<string, string>
}

interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

/**
 * Trigger Phoenix healing when build fails
 */
export async function triggerPhoenixHealing(
  buildRun: BuildRun,
  githubConfig: GitHubConfig
): Promise<void> {
  console.log('🔥 Phoenix: Build failure detected - initiating self-healing...')
  
  const startTime = Date.now()
  
  try {
    // Extract error logs from build run
    const errorLog = extractErrorLog(buildRun)
    
    if (!errorLog) {
      console.log('🔥 Phoenix: No clear error log found - skipping auto-healing')
      return
    }

    // Analyze build context
    const buildContext = analyzeBuildContext(buildRun)
    
    // Step 1: Diagnose the error
    console.log('🔥 Phoenix: Step 1 - Diagnosing error...')
    const diagnosis = await errorDiagnostician.diagnoseError(errorLog, buildContext)
    
    console.log(`🔥 Phoenix: Diagnosis - ${diagnosis.diagnosis}`)
    console.log(`🔥 Phoenix: Action - ${diagnosis.action} on ${diagnosis.target}`)
    console.log(`🔥 Phoenix: Confidence - ${Math.round(diagnosis.confidence * 100)}%`)
    
    // Step 2: Apply the fix if confidence is high enough
    if (diagnosis.confidence >= 0.7) {
      console.log('🔥 Phoenix: Step 2 - Applying surgical fix...')
      
      const surgeon = createAutoSurgeon(githubConfig)
      const surgeryResult = await surgeon.applyFix(diagnosis)
      
      if (surgeryResult.success) {
        console.log(`🔥 Phoenix: ✅ Fix applied successfully!`)
        console.log(`🔥 Phoenix: 📊 Changes - ${surgeryResult.changes.filesModified} files modified, ${surgeryResult.changes.filesCreated} files created`)
        
        if (surgeryResult.commitUrl) {
          console.log(`🔥 Phoenix: 🔗 Commit: ${surgeryResult.commitUrl}`)
        }
        
        // Step 3: Trigger rebuild (would be handled by CI/CD)
        console.log('🔥 Phoenix: Step 3 - Rebuild triggered by CI/CD...')
        console.log('🔥 Phoenix: 🔄 Monitoring rebuild progress...')
        
        void logTelemetry({
          type: "PHOENIX_HEALING_COMPLETED",
          model: "phoenix-immune-system",
          success: true,
          metadata: {
            buildId: buildRun.id,
            diagnosis: diagnosis.diagnosis,
            action: diagnosis.action,
            target: diagnosis.target,
            confidence: diagnosis.confidence,
            duration: Date.now() - startTime,
            surgeryResult
          }
        })
        
      } else {
        console.log(`🔥 Phoenix: ❌ Surgery failed - ${surgeryResult.error}`)
        
        void logTelemetry({
          type: "PHOENIX_HEALING_FAILED",
          model: "phoenix-immune-system",
          success: false,
          metadata: {
            buildId: buildRun.id,
            diagnosis: diagnosis.diagnosis,
            action: diagnosis.action,
            target: diagnosis.target,
            confidence: diagnosis.confidence,
            duration: Date.now() - startTime,
            error: surgeryResult.error
          }
        })
      }
      
    } else {
      console.log(`🔥 Phoenix: ⚠️ Low confidence (${Math.round(diagnosis.confidence * 100)}%) - skipping auto-fix`)
      console.log('🔥 Phoenix: Manual intervention recommended')
      
      
      void logTelemetry({
        type: "PHOENIX_HEALING_SKIPPED",
        model: "phoenix-immune-system",
        success: false,
        metadata: {
          buildId: buildRun.id,
          diagnosis: diagnosis.diagnosis,
          action: diagnosis.action,
          target: diagnosis.target,
          confidence: diagnosis.confidence,
          reason: 'Low confidence'
        }
      })
    }
    
  } catch (error) {
    console.error('🔥 Phoenix: 💥 Healing process failed:', error)
    
    void logTelemetry({
      type: "PHOENIX_HEALING_ERROR",
      model: "phoenix-immune-system",
      success: false,
      metadata: {
        buildId: buildRun.id,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

/**
 * Extract error log from build run
 */
function extractErrorLog(buildRun: BuildRun): string | null {
  // Get the most recent error logs
  const errorLogs = buildRun.logs
    .filter(log => log.level === 'error' || log.message.toLowerCase().includes('error'))
    .slice(-10) // Last 10 error messages
    .map(log => log.message)
    .join('\\n')
  
  return errorLogs || null
}

/**
 * Analyze build context for better diagnosis
 */
function analyzeBuildContext(buildRun: BuildRun): BuildContext {
  // Determine framework from job names or workflow
  const framework = detectFramework(buildRun)
  
  // Determine package manager from common patterns
  const packageManager = detectPackageManager(buildRun)
  
  // Determine platform
  const platform = detectPlatform(buildRun)
  
  return {
    framework,
    packageManager,
    platform,
    lastOperation: 'build',
    files: {} // Would be populated from repo in real implementation
  }
}

/**
 * Detect framework from build information
 */
function detectFramework(buildRun: BuildRun): BuildContext['framework'] {
  const workflowName = buildRun.name.toLowerCase()
  const jobNames = buildRun.jobs.map(job => job.name.toLowerCase()).join(' ')
  
  if (workflowName.includes('next') || jobNames.includes('next')) {
    return 'next'
  } else if (workflowName.includes('react') || jobNames.includes('react')) {
    return 'react'
  } else if (workflowName.includes('vue') || jobNames.includes('vue')) {
    return 'vue'
  } else if (workflowName.includes('angular') || jobNames.includes('angular')) {
    return 'angular'
  } else if (workflowName.includes('expo') || jobNames.includes('expo')) {
    return 'expo'
  }
  
  return 'unknown'
}

/**
 * Detect package manager from build information
 */
function detectPackageManager(buildRun: BuildRun): BuildContext['packageManager'] {
  const logs = buildRun.logs.map(log => log.message).join(' ').toLowerCase()
  
  if (logs.includes('npm ')) {
    return 'npm'
  } else if (logs.includes('yarn ')) {
    return 'yarn'
  } else if (logs.includes('pnpm ')) {
    return 'pnpm'
  }
  
  return 'unknown'
}

/**
 * Detect platform from build information
 */
function detectPlatform(buildRun: BuildRun): BuildContext['platform'] {
  const workflowName = buildRun.name.toLowerCase()
  const jobNames = buildRun.jobs.map(job => job.name.toLowerCase()).join(' ')
  
  if (workflowName.includes('mobile') || jobNames.includes('mobile') || 
      workflowName.includes('ios') || workflowName.includes('android')) {
    return 'mobile'
  } else if (workflowName.includes('desktop') || jobNames.includes('desktop')) {
    return 'desktop'
  }
  
  return 'web'
}
