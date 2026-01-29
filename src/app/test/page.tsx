'use client'

import AuthGuard from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  RefreshCw,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: Record<string, unknown>
}

interface TestSummary {
  passed: number
  total: number
  successRate: number
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setTestResults(null)
    setTestSummary(null)

    try {
      const response = await fetch('/api/test/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setTestResults(data.results)
        setTestSummary(data.summary)
        setLastRun(data.timestamp)
      } else {
        console.error('Test execution failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (passed: boolean) => {
    return passed ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    )
  }

  const getDurationColor = (duration: number) => {
    if (duration < 100) return 'text-green-600'
    if (duration < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                  <TestTube className="h-8 w-8 text-purple-500 mr-3" />
                  <h1 className="text-xl font-semibold text-gray-900">Testing Dashboard</h1>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={runTests}
                  disabled={isRunning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Test Status Overview */}
            {testSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    Test Results Summary
                  </CardTitle>
                  <CardDescription>
                    {lastRun && `Last run: ${new Date(lastRun).toLocaleString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{testSummary.total}</div>
                      <p className="text-sm text-gray-600">Total Tests</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{testSummary.passed}</div>
                      <p className="text-sm text-gray-600">Passed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{testSummary.total - testSummary.passed}</div>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        testSummary.successRate === 100 ? 'text-green-600' : 
                        testSummary.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {testSummary.successRate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Results */}
            {testResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Test Results</CardTitle>
                  <CardDescription>
                    Individual test execution results and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <h3 className="font-medium">{result.testName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(result.passed)}
                              <span className={`text-sm ${getDurationColor(result.duration)}`}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {result.duration}ms
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {result.error && (
                          <div className="text-red-600 text-sm max-w-md">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Database Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Operations</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Operations</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authentication Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Session Management</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Retrieval</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Security Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate Limiting</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Input Validation</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">XSS Protection</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analytics Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Event Tracking</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Usage Stats</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Queries</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Times</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integration Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Endpoints</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Handling</span>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common testing and debugging tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Run Individual Tests</div>
                      <div className="text-sm text-gray-600">Test specific components</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">View Test Logs</div>
                      <div className="text-sm text-gray-600">Detailed test output</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Export Results</div>
                      <div className="text-sm text-gray-600">Download test report</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
