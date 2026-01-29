import AuthGuard from '@/components/auth/auth-guard'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                  <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
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
            {/* Page Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Application Analytics
              </h2>
              <p className="text-gray-600">
                Monitor your application&apos;s performance, user engagement, and system health
              </p>
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    Track how users interact with your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Daily Active Users</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Session Duration</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Bounce Rate</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Feature Adoption</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>
                    Monitor system health and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Database Performance</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Server Load</span>
                      <span className="text-sm text-gray-600">Coming soon</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track subscription revenue and customer metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">$0</div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">$0</div>
                    <p className="text-sm text-gray-600">Average Revenue Per User</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">0%</div>
                    <p className="text-sm text-gray-600">Churn Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common analytics tasks and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Generate Report</div>
                      <div className="text-sm text-gray-600">Create custom analytics report</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Set Up Alerts</div>
                      <div className="text-sm text-gray-600">Configure monitoring alerts</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Export Data</div>
                      <div className="text-sm text-gray-600">Download analytics data</div>
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
