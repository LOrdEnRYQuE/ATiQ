/**
 * Project Phoenix: Test Suite
 * End-to-end testing for self-healing workflow
 */

import { errorDiagnostician } from './diagnostician'
import { createAutoSurgeon } from './surgeon'
import { triggerPhoenixHealing } from './phoenix-trigger'

interface TestScenario {
  name: string
  errorLog: string
  expectedAction: string
  expectedTarget: string
  expectedConfidence: number
}

const testScenarios: TestScenario[] = [
  {
    name: 'Missing Dependency',
    errorLog: 'npm ERR! code ERESOLVE\\nnpm ERR! Cannot find module \\"lucide-react\\"\\nModule not found: Can\\'t resolve \\"lucide-react\\"',
    expectedAction: 'install_package',
    expectedTarget: 'lucide-react',
    expectedConfidence: 0.9
  },
  
  {
    name: 'Syntax Error',
    errorLog: 'SyntaxError: Unexpected token \'<\\'\\nat Module._compile (internal/modules/cjs/loader.js)',
    expectedAction: 'fix_code',
    expectedTarget: 'unknown',
    expectedConfidence: 0.7
  },
  
  {
    name: 'Version Conflict',
    errorLog: 'npm ERR! code ERESOLVE\\nnpm ERR! Unable to resolve dependency tree\\nnpm ERR! peer dep missing: react@^18.0.0',
    expectedAction: 'update_package',
    expectedTarget: 'package.json',
    expectedConfidence: 0.8
  },
  
  {
    name: 'Missing Config',
    errorLog: 'Configuration file not found: tsconfig.json\\nInvalid configuration: TypeScript',
    expectedAction: 'create_file',
    expectedTarget: 'tsconfig.json',
    expectedConfidence: 0.9
  }
]

/**
 * Run Phoenix test suite
 */
export async function runPhoenixTests(): Promise<void> {
  console.log('🔥 Phoenix: Starting test suite...')
  console.log(`🔥 Phoenix: Running ${testScenarios.length} test scenarios\\n`)
  
  let passedTests = 0
  let totalTests = testScenarios.length
  
  for (const scenario of testScenarios) {
    console.log(`🔥 Phoenix: Testing scenario: ${scenario.name}`)
    
    try {
      // Test diagnosis
      const diagnosis = await errorDiagnostician.diagnoseError(scenario.errorLog, {
        framework: 'react',
        packageManager: 'npm',
        platform: 'web',
        lastOperation: 'build',
        files: {}
      })
      
      console.log(`🔥 Phoenix: Diagnosis - ${diagnosis.diagnosis}`)
      console.log(`🔥 Phoenix: Action - ${diagnosis.action}`)
      console.log(`🔥 Phoenix: Target - ${diagnosis.target}`)
      console.log(`🔥 Phoenix: Confidence - ${Math.round(diagnosis.confidence * 100)}%`)
      
      // Validate results
      const actionMatch = diagnosis.action === scenario.expectedAction
      const targetMatch = diagnosis.target.includes(scenario.expectedTarget)
      const confidenceMatch = diagnosis.confidence >= scenario.expectedConfidence
      
      if (actionMatch && targetMatch && confidenceMatch) {
        console.log('✅ Test PASSED')
        passedTests++
      } else {
        console.log('❌ Test FAILED')
        console.log(`   Expected action: ${scenario.expectedAction}, got: ${diagnosis.action}`)
        console.log(`   Expected target: ${scenario.expectedTarget}, got: ${diagnosis.target}`)
        console.log(`   Expected confidence: >=${scenario.expectedConfidence}, got: ${diagnosis.confidence}`)
      }
      
    } catch (error) {
      console.log(`❌ Test ERROR: ${error}`)
    }
    
    console.log('---\\n')
  }
  
  // Summary
  const successRate = (passedTests / totalTests) * 100
  console.log('🔥 Phoenix: Test Suite Summary')
  console.log('='.repeat(40))
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${successRate.toFixed(1)}%`)
  
  if (successRate >= 75) {
    console.log('🎉 Phoenix test suite PASSED!')
  } else {
    console.log('⚠️ Phoenix test suite needs improvement')
  }
}

/**
 * Mock GitHub API for testing
 */
export function createMockGitHubConfig() {
  return {
    owner: 'test-owner',
    repo: 'test-repo',
    token: 'mock-token',
    branch: 'main'
  }
}

/**
 * Test complete Phoenix workflow
 */
export async function testCompleteWorkflow(): Promise<void> {
  console.log('🔥 Phoenix: Testing complete workflow...')
  
  const mockConfig = createMockGitHubConfig()
  const mockBuildRun = {
    id: 123,
    status: 'failure' as const,
    name: 'Build and Deploy',
    head_branch: 'main',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    run_number: 456,
    workflow_id: 789,
    jobs: [],
    html_url: 'https://github.com/test/test/actions/runs/123',
    logs: [
      { timestamp: Date.now(), level: 'error', message: 'npm ERR! Cannot find module "lucide-react"' },
      { timestamp: Date.now(), level: 'error', message: 'Module not found: Can\\'t resolve "lucide-react"' }
    ]
  }
  
  try {
    await triggerPhoenixHealing(mockBuildRun, mockConfig)
    console.log('✅ Complete workflow test PASSED')
  } catch (error) {
    console.log(`❌ Complete workflow test FAILED: ${error}`)
  }
}

// Export for manual testing
if (typeof window === 'undefined' && require.main === module) {
  runPhoenixTests().catch(console.error)
  testCompleteWorkflow().catch(console.error)
}
