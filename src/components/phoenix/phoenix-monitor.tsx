/**
 * Project Phoenix: Monitoring and Admin Controls
 * Real-time dashboard for Phoenix self-healing operations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhoenixLoopService, PhoenixSession, PhoenixStats } from '../../lib/phoenix/phoenix-loop-service'
import { Flame, Activity, CheckCircle, XCircle, Clock, GitBranch, Settings } from 'lucide-react'

interface PhoenixMonitorProps {
  phoenixService: PhoenixLoopService
}

export function PhoenixMonitor({ phoenixService }: PhoenixMonitorProps) {
  const [stats, setStats] = useState<PhoenixStats>(phoenixService.getStats())
  const [sessions, setSessions] = useState<PhoenixSession[]>(phoenixService.getAllSessions())
  const [enabled, setEnabled] = useState(phoenixService.isEnabled())
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      setStats(phoenixService.getStats())
      setSessions(phoenixService.getAllSessions())
      setEnabled(phoenixService.isEnabled())
      setCurrentTime(Date.now())
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [phoenixService])

  const togglePhoenix = () => {
    const newState = !enabled
    phoenixService.setEnabled(newState)
    setEnabled(newState)
  }

  const getStatusColor = (status: PhoenixSession['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'repairing': case 'committing': case 'rebuilding': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: PhoenixSession['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'repairing': case 'committing': case 'rebuilding': return <Activity className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = endTime ? endTime - startTime : currentTime - startTime
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Project Phoenix</h1>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Active" : "Paused"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch checked={enabled} onCheckedChange={togglePhoenix} />
            <span className="text-sm">Auto-Healing</span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSessions} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulRepairs} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Repair Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.avgRepairTime / 1000)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Per successful repair
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Repairs</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedRepairs}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sessions */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Healing Sessions</CardTitle>
              <CardDescription>
                Real-time Phoenix self-healing operations in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions
                  .filter(s => s.status !== 'completed' && s.status !== 'failed')
                  .map(session => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                          {getStatusIcon(session.status)}
                          <span className="font-medium">{session.error.type}</span>
                          <Badge variant="outline">{session.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(session.startTime)}
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="font-medium">Error:</span> {session.error.message}
                      </div>
                      
                      {session.branch && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{session.branch.name}</span>
                        </div>
                      )}
                      
                      <ScrollArea className="h-20 w-full border rounded p-2">
                        <div className="text-xs space-y-1">
                          {session.logs.map((log: string, index: number) => (
                            <div key={index} className="font-mono">{log}</div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ))}
                
                {sessions.filter(s => s.status !== 'completed' && s.status !== 'failed').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active healing sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Successful Repairs</CardTitle>
              <CardDescription>
                Phoenix successfully healed these build failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions
                  .filter(s => s.status === 'completed')
                  .slice(-10) // Show last 10
                  .map(session => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{session.error.type}</span>
                          <Badge variant="default" className="bg-green-500">Success</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(session.startTime, session.endTime)}
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="font-medium">Fixed:</span> {session.error.message}
                      </div>
                      
                      {session.commit && (
                        <div className="text-xs text-muted-foreground">
                          Commit: {session.commit.commitHash?.substring(0, 8)} • 
                          {session.commit.changes} files changed
                        </div>
                      )}
                    </div>
                  ))}
                
                {sessions.filter(s => s.status === 'completed').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed repairs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Repairs</CardTitle>
              <CardDescription>
                These healing sessions failed and may need manual intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions
                  .filter(s => s.status === 'failed')
                  .slice(-10) // Show last 10
                  .map(session => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{session.error.type}</span>
                          <Badge variant="destructive">Failed</Badge>
                          {session.retryCount > 0 && (
                            <Badge variant="outline">{session.retryCount} retries</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(session.startTime, session.endTime)}
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="font-medium">Error:</span> {session.error.message}
                      </div>
                      
                      <ScrollArea className="h-20 w-full border rounded p-2">
                        <div className="text-xs space-y-1">
                          {session.logs.slice(-5).map((log: string, index: number) => (
                            <div key={index} className="font-mono">{log}</div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ))}
                
                {sessions.filter(s => s.status === 'failed').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No failed repairs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
