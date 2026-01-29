'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Activity, 
  Server, 
  Database, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { analytics } from '@/lib/analytics'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  database: 'connected' | 'disconnected'
  api: 'operational' | 'degraded'
  auth: 'working' | 'issues'
  lastCheck: string
}

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

interface RevenueData {
  monthlyRevenue: number
  totalRevenue: number
  activeSubscriptions: number
  conversionRate: number
}

export default function MonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange] = useState<'day' | 'week' | 'month'>('week')

  const fetchMonitoringData = useCallback(async () => {
    try {
      // Fetch system health
      const healthResponse = await fetch('/api/health')
      const healthData = await healthResponse.json()
      
      // Fetch usage statistics
      const usageData = await analytics.getUsageStats(timeRange)
      
      // Fetch revenue data (mock for now)
      const revenue = await fetchRevenueData()
      
      setSystemHealth(healthData)
      setUsageStats(usageData)
      setRevenueData(revenue)
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchMonitoringData])

  const fetchRevenueData = async (): Promise<RevenueData> => {
    // Mock revenue data - replace with actual Stripe API calls
    return {
      monthlyRevenue: 2475,
      totalRevenue: 8925,
      activeSubscriptions: 23,
      conversionRate: 4.7
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
      case 'working':
        return 'bg-green-100 text-green-800'
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
      case 'disconnected':
      case 'issues':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
      case 'working':
        return <CheckCircle className="w-4 h-4" />
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />
      case 'error':
      case 'disconnected':
      case 'issues':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={getStatusColor(systemHealth?.status || 'unknown')}>
            {getStatusIcon(systemHealth?.status || 'unknown')}
            System {systemHealth?.status || 'Unknown'}
          </Badge>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(systemHealth?.lastCheck || '').toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getStatusColor(systemHealth?.database || 'unknown')}>
                {getStatusIcon(systemHealth?.database || 'unknown')}
                {systemHealth?.database || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getStatusColor(systemHealth?.api || 'unknown')}>
                {getStatusIcon(systemHealth?.api || 'unknown')}
                {systemHealth?.api || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getStatusColor(systemHealth?.auth || 'unknown')}>
                {getStatusIcon(systemHealth?.auth || 'unknown')}
                {systemHealth?.auth || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {99.9}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{usageStats?.pageViews || 0}</div>
                <p className="text-sm text-gray-600">
                  +{usageStats?.userActions || 0} actions today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{usageStats?.aiRequests || 0}</div>
                <p className="text-sm text-gray-600">
                  {usageStats?.avgAIResponseTime || 0}ms avg response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{usageStats?.totalEvents || 0}</div>
                <p className="text-sm text-gray-600">
                  Created this {timeRange}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${revenueData?.monthlyRevenue || 0}</div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{revenueData?.activeSubscriptions || 0}</div>
                <p className="text-sm text-gray-600">
                  {revenueData?.conversionRate || 0}% conversion rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System performance and response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Response Time</span>
                  <span className="font-mono">{usageStats?.avgAIResponseTime || 0}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Success Rate</span>
                  <span className="font-mono text-green-600">99.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database Query Time</span>
                  <span className="font-mono">45ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Page Load Time</span>
                  <span className="font-mono">1.2s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">All systems operational</p>
                    <p className="text-sm text-gray-600">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">High API usage detected</p>
                    <p className="text-sm text-gray-600">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
