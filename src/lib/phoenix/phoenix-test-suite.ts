/**
 * Project Phoenix: End-to-End Test Suite
 * Tests the complete self-healing workflow from build failure to recovery
 */

import { getPhoenixLoopService, PhoenixSession, PhoenixLoopService } from './phoenix-loop-service'
import { BuildError } from './build-error-detector'
import { AIOrchestrator, ProjectStructure } from '../runtime-repair'

// Mock AI Orchestrator for testing
class MockAIOrchestrator {
  async modifyCodeStreaming(context: { files: Record<string, string> }, prompt: string, callbacks: { onThinking?: (content: string) => void; onFileWrite?: (block: { type: string; attributes?: { path: string; type: string }; content: string; isComplete: boolean }) => void; onBlockComplete?: (block: { type: string; attributes?: { path: string; type: string }; content: string; isComplete: boolean }) => void }): Promise<{ type: string; file: string; operations: { type: string; position: number; content?: string }[] }[]> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock patches based on error type
    const patches = this.generateMockPatches(prompt, context.files)
    
    // Simulate streaming callbacks
    callbacks.onThinking?.('Analyzing build error...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    callbacks.onFileWrite?.({
      type: 'file',
      attributes: { path: 'package.json', type: 'modified' },
      content: 'Updated package.json',
      isComplete: true
    })
    
    callbacks.onBlockComplete?.({
      type: 'file',
      attributes: { path: 'package.json', type: 'modified' },
      content: 'Updated package.json',
      isComplete: true
    })
    
    return patches
  }
  
  analyzeProjectStructure(_files: Record<string, string>): ProjectStructure {
    return {
      type: 'frontend' as const,
      framework: 'react',
      entryPoints: ['index.js'],
      assets: [],
      components: [],
      pages: []
    }
  }
  
  extractDependencies(_files: Record<string, string>): Record<string, string> {
    return {
      'react': '^18.0.0',
      'next': '^14.0.0'
    }
  }
  
  detectLanguage(_files: Record<string, string>): 'typescript' {
    return 'typescript'
  }
  
  private generateMockPatches(prompt: string, _files: Record<string, string>): { type: string; file: string; operations: { type: string; position: number; content?: string }[] }[] {
    if (prompt.includes('dependency') || prompt.includes('ERESOLVE')) {
      return [{
        type: 'patch',
        file: 'package.json',
        operations: [{
          type: 'replace',
          position: 1,
          content: '  "dependencies": {\n    "react": "^18.2.0",\n    "next": "^14.0.0",\n    "legacy-peer-deps": true\n  },'
        }]
      }]
    }
    
    if (prompt.includes('syntax') || prompt.includes('SyntaxError')) {
      const errorFile = Object.keys(files).find(f => f.endsWith('.js') || f.endsWith('.ts')) || 'index.js'
      return [{
        type: 'patch',
        file: errorFile,
        operations: [{
          type: 'replace',
          position: 10,
          content: 'const variable = "fixed"; // Fixed syntax error'
        }]
      }]
    }
    
    return [{
      type: 'patch',
      file: 'package.json',
      operations: [{
        type: 'insert',
        position: 0,
        content: '// Phoenix auto-fix applied'
      }]
    }]
  }
}

// Test scenarios
interface TestScenario {
  name: string
  buildLogs: string[]
  expectedErrorType: BuildError['type']
  expectedFixFiles: string[]
  description: string
}

const testScenarios: TestScenario[] = [
  {
    name: 'Dependency Conflict',
    buildLogs: [
      'npm ERR! code ERESOLVE',
      'npm ERR! ERESOLVE unable to resolve dependency tree',
      'npm ERR! peer dep missing: react@^18.0.0',
      'npm ERR! Found: react@17.0.0',
      'npm install failed with exit code 1'
    ],
    expectedErrorType: 'dependency',
    expectedFixFiles: ['package.json'],
    description: 'Tests Phoenix handling of npm dependency conflicts'
  },
  
  {
    name: 'Syntax Error',
    buildLogs: [
      'SyntaxError: Unexpected token \'<\'',
      'at Module._compile (internal/modules/cjs/loader.js:xxx)',
      'at Object.<anonymous> (/app/src/components/Button.js:15:8)',
      'Build failed with exit code 1'
    ],
    expectedErrorType: 'syntax',
    expectedFixFiles: ['src/components/Button.js'],
    description: 'Tests Phoenix handling of JavaScript syntax errors'
  },
  
  {
    name: 'Missing Module',
    buildLogs: [
      'Module not found: Can\'t resolve \'lodash\'',
      'Did you forget to install this dependency?',
      'npm ERR! code MODULE_NOT_FOUND',
      'Build failed with exit code 1'
    ],
    expectedErrorType: 'dependency',
    expectedFixFiles: ['package.json'],
    description: 'Tests Phoenix handling of missing module errors'
  },
  
  {
    name: 'Configuration Error',
    buildLogs: [
      'Configuration file not found: tsconfig.json',
      'Invalid TypeScript configuration',
      'Build failed with exit code 1'
    ],
    expectedErrorType: 'config',
    expectedFixFiles: ['tsconfig.json'],
    description: 'Tests Phoenix handling of configuration errors'
  }
]

// Test framework
class PhoenixTestRunner {
  private aiOrchestrator: MockAIOrchestrator
  private phoenixService: PhoenixLoopService
  private testResults: { scenario: string; success: boolean; duration: number; issues: string[]; session: { id: string; status: string; errorType: string; retryCount: number; commitChanges: number } | null }[] = []
  
  constructor() {
    this.aiOrchestrator = new MockAIOrchestrator()
    this.phoenixService = getPhoenixLoopService(this.aiOrchestrator, {
      enabled: true,
      autoRetry: true,
      maxRetries: 2,
      requireApproval: false,
      enableCircuitBreaker: true
    })
  }
  
  async runAllTests(): Promise<void> {
    console.log('🔥 Phoenix: Starting end-to-end test suite...')
    console.log(`🔥 Phoenix: Running ${testScenarios.length} test scenarios\n`)
    
    for (const scenario of testScenarios) {
      await this.runSingleTest(scenario)
    }
    
    this.printTestSummary()
  }
  
  private async runSingleTest(scenario: TestScenario): Promise<void> {
    console.log(`🔥 Phoenix: Testing scenario: ${scenario.name}`)
    console.log(`📝 ${scenario.description}`)
    
    const startTime = Date.now()
    
    try {
      // Mock file system
      const mockFiles = this.generateMockFiles(scenario)
      
      // Trigger Phoenix loop
      const session = await this.phoenixService.handleBuildFailure(
        `build_${Date.now()}`,
        scenario.buildLogs,
        {
          command: 'npm run build',
          exitCode: 1,
          files: mockFiles,
          lastOperation: 'build'
        }
      )
      
      // Wait for completion
      await this.waitForCompletion(session)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Validate results
      const result = this.validateTestResults(scenario, session, duration)
      this.testResults.push(result)
      
      console.log(`✅ Test completed in ${duration}ms`)
      console.log(`📊 Result: ${result.success ? 'PASS' : 'FAIL'}`)
      
      if (!result.success) {
        console.log(`❌ Issues: ${result.issues.join(', ')}`)
      }
      
    } catch (error) {
      const result = {
        scenario: scenario.name,
        success: false,
        duration: Date.now() - startTime,
        issues: [`Test failed with error: ${error}`],
        session: null
      }
      
      this.testResults.push(result)
      console.log(`❌ Test failed: ${error}`)
    }
    
    console.log('---\n')
  }
  
  private generateMockFiles(scenario: TestScenario): Record<string, string> {
    const baseFiles = {
      'package.json': JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^17.0.0',
          'next': '^14.0.0'
        }
      }, null, 2),
      
      'src/components/Button.js': `
import React from 'react';

export default function Button() {
  return (
    <button className="btn">
      Click me
    </button>
  );
}
      `,
      
      'next.config.js': `
module.exports = {
  reactStrictMode: true,
}
      `
    }
    
    // Add scenario-specific files
    if (scenario.expectedErrorType === 'syntax') {
      baseFiles['src/components/Button.js'] = `
import React from 'react';

export default function Button() {
  return (
    <button className="btn">
      Click me
    </button // Missing closing angle bracket
  );
}
      `
    }
    
    return baseFiles
  }
  
  private async waitForCompletion(session: PhoenixSession, timeout: number = 30000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const updatedSession = this.phoenixService.getSession(session.id)
      if (!updatedSession) break
      
      if (updatedSession.status === 'completed' || updatedSession.status === 'failed') {
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    throw new Error('Test timeout - Phoenix did not complete in time')
  }
  
  private validateTestResults(scenario: TestScenario, session: PhoenixSession, duration: number): { scenario: string; success: boolean; duration: number; issues: string[]; session: { id: string; status: string; errorType: string; retryCount: number; commitChanges: number } } {
    const issues: string[] = []
    
    // Check session completed successfully
    if (session.status !== 'completed') {
      issues.push(`Session status: ${session.status} (expected: completed)`)
    }
    
    // Check error type detection
    if (session.error.type !== scenario.expectedErrorType) {
      issues.push(`Error type: ${session.error.type} (expected: ${scenario.expectedErrorType})`)
    }
    
    // Check fix was applied
    if (!session.commit) {
      issues.push('No commit was created')
    } else if (session.commit.changes === 0) {
      issues.push('No files were changed in the fix')
    }
    
    // Check reasonable duration
    if (duration > 20000) {
      issues.push(`Test took too long: ${duration}ms`)
    }
    
    return {
      scenario: scenario.name,
      success: issues.length === 0,
      duration,
      issues,
      session: {
        id: session.id,
        status: session.status,
        errorType: session.error.type,
        retryCount: session.retryCount,
        commitChanges: session.commit?.changes || 0
      }
    }
  }
  
  private printTestSummary(): void {
    console.log('🔥 Phoenix: Test Suite Summary')
    console.log('='.repeat(50))
    
    const passed = this.testResults.filter(r => r.success).length
    const failed = this.testResults.filter(r => r.success === false).length
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0)
    const avgDuration = totalDuration / this.testResults.length
    
    console.log(`Total Tests: ${this.testResults.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`)
    console.log(`📈 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(r => r.success === false)
        .forEach(r => {
          console.log(`  - ${r.scenario}: ${r.issues.join(', ')}`)
        })
    }
    
    console.log('\n🔥 Phoenix Test Suite Complete!')
    
    // Get Phoenix stats
    const stats = this.phoenixService.getStats()
    console.log('\n📊 Phoenix Statistics:')
    console.log(`  - Total Sessions: ${stats.totalSessions}`)
    console.log(`  - Successful Repairs: ${stats.successfulRepairs}`)
    console.log(`  - Failed Repairs: ${stats.failedRepairs}`)
    console.log(`  - Success Rate: ${stats.successRate.toFixed(1)}%`)
    console.log(`  - Avg Repair Time: ${Math.round(stats.avgRepairTime)}ms`)
  }
}

// Export test runner
export async function runPhoenixTests(): Promise<void> {
  const testRunner = new PhoenixTestRunner()
  await testRunner.runAllTests()
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runPhoenixTests().catch(console.error)
}
