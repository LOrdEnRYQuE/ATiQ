'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  Clock, 
  AlertTriangle,
  Activity,
  Eye,
  MousePointer,
  Code,
  CreditCard
} from 'lucide-react'
import { analytics } from '@/lib/analytics'

interface UsageStats {
  totalEvents: number
  pageViews: number
  userActions: number
  aiRequests: number
  aiErrors: number
  projectActions: number
  subscriptionEvents: number
  errors: number
  performanceEvents: number
  avgAIResponseTime: number
  aiSuccessRate: number
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usageStats = await analytics.getUsageStats(timeRange)
        setStats(usageStats)
      } catch (error) {
        console.error('Failed to fetch analytics stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeRange])

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getResponseTimeColor = (time: number) => {
    if (time <= 2000) return 'text-green-600'
    if (time <= 5000) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Unable to load analytics data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Analytics Dashboard
          </CardTitle>
          <div className="flex items-center space-x-2">
            {(['day', 'week', 'month', 'year'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Track application usage and performance metrics
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-2xl font-bold">{stats.totalEvents}</span>
            </div>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-2xl font-bold">{stats.pageViews}</span>
            </div>
            <p className="text-sm text-gray-600">Page Views</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MousePointer className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-2xl font-bold">{stats.userActions}</span>
            </div>
            <p className="text-sm text-gray-600">User Actions</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold">{stats.aiRequests}</span>
            </div>
            <p className="text-sm text-gray-600">AI Requests</p>
          </div>
        </div>

        {/* AI Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">AI Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  Average Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getResponseTimeColor(stats.avgAIResponseTime)}`}>
                    {stats.avgAIResponseTime}ms
                  </span>
                  <Badge variant={stats.avgAIResponseTime <= 2000 ? 'default' : 'destructive'}>
                    {stats.avgAIResponseTime <= 2000 ? 'Good' : 'Slow'}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((stats.avgAIResponseTime / 5000) * 100, 100)} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getSuccessRateColor(stats.aiSuccessRate)}`}>
                    {stats.aiSuccessRate.toFixed(1)}%
                  </span>
                  <Badge variant={stats.aiSuccessRate >= 95 ? 'default' : 'destructive'}>
                    {stats.aiSuccessRate >= 95 ? 'Excellent' : 'Needs Improvement'}
                  </Badge>
                </div>
                <Progress 
                  value={stats.aiSuccessRate} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Activity Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Code className="h-4 w-4 mr-2 text-blue-500" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projectActions}</div>
                <p className="text-sm text-gray-600">Actions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-green-500" />
                  Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subscriptionEvents}</div>
                <p className="text-sm text-gray-600">Events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <p className="text-sm text-gray-600">Total Errors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-purple-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.performanceEvents}</div>
                <p className="text-sm text-gray-600">Metrics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
