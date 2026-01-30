'use client'

import { useState, useEffect } from 'react'
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Battery, 
  Crown,
  Rocket,
  Calendar,
  DollarSign
} from 'lucide-react'
import { usageService, UserQuota, UsageStats } from '@/lib/usage-service'

interface UsageGraphProps {
  userId?: string
  className?: string
}

export default function UsageGraph({ userId = 'current-user', className = '' }: UsageGraphProps) {
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      try {
        const userQuota = usageService.getUserQuota(userId)
        const usageStats = usageService.getUsageStats(userId)
        
        setQuota(userQuota)
        setStats(usageStats)
      } catch (error) {
        console.error('Failed to load usage data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Update every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [userId])

  if (loading) {
    return (
      <div className={`bg-black border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-800 rounded mb-4"></div>
          <div className="h-3 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!quota || !stats) {
    return (
      <div className={`bg-black border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load usage data</p>
        </div>
      </div>
    )
  }

  const remainingQuota = usageService.getRemainingQuota(userId)
  const quotaPercentage = usageService.getQuotaPercentage(userId)

  const getTierIcon = () => {
    switch (quota.tier) {
      case 'free':
        return <Battery className="h-4 w-4" />
      case 'pro':
        return <Crown className="h-4 w-4" />
      case 'enterprise':
        return <Rocket className="h-4 w-4" />
      default:
        return <Battery className="h-4 w-4" />
    }
  }

  const getTierColor = () => {
    switch (quota.tier) {
      case 'free':
        return 'text-gray-400 border-gray-600'
      case 'pro':
        return 'text-blue-400 border-blue-600'
      case 'enterprise':
        return 'text-purple-400 border-purple-600'
      default:
        return 'text-gray-400 border-gray-600'
    }
  }

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
  }

  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(cost)
  }

  return (
    <div className={`bg-black border border-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border ${getTierColor()}`}>
              {getTierIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-white">Vibe Usage</h3>
              <p className="text-xs text-gray-400 capitalize">{quota.tier} Tier</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              {formatTokens(remainingQuota.daily)} left today
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Daily Quota */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Daily Quota</span>
            <span className="text-xs text-gray-400">
              {formatTokens(quota.usedToday)} / {formatTokens(quota.dailyLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getQuotaColor(quotaPercentage.daily)}`}
              style={{ width: `${Math.min(quotaPercentage.daily, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{quotaPercentage.daily.toFixed(1)}% used</span>
            <span className="text-xs text-gray-500">{formatTokens(remainingQuota.daily)} remaining</span>
          </div>
        </div>

        {/* Monthly Quota */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Monthly Quota</span>
            <span className="text-xs text-gray-400">
              {formatTokens(quota.usedThisMonth)} / {formatTokens(quota.monthlyLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getQuotaColor(quotaPercentage.monthly)}`}
              style={{ width: `${Math.min(quotaPercentage.monthly, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{quotaPercentage.monthly.toFixed(1)}% used</span>
            <span className="text-xs text-gray-500">{formatTokens(remainingQuota.monthly)} remaining</span>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">This Month</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCost(stats.totalCost)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Projected</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCost(stats.projectedMonthlyCost)}
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        {stats.today.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Today's Activity</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stats.today.slice(-5).reverse().map((usage, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-900/30 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      usage.operation === 'genesis' ? 'bg-purple-400' :
                      usage.operation === 'consultant' ? 'bg-blue-400' :
                      usage.operation === 'deployment' ? 'bg-green-400' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-gray-300 capitalize">{usage.operation}</span>
                    {usage.projectId && (
                      <span className="text-gray-500">#{usage.projectId.slice(-6)}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{formatTokens(usage.totalTokens)}</span>
                    <span className="text-gray-500">{formatCost(usage.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {quota.tier === 'free' && quotaPercentage.daily > 75 && (
          <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-blue-300 mb-2">
              Running low on tokens? Upgrade to Pro for unlimited access to all features.
            </p>
            <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
              Upgrade Now
            </button>
          </div>
        )}

        {/* Warning for High Usage */}
        {quotaPercentage.daily > 90 && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">High Usage Alert</span>
            </div>
            <p className="text-xs text-yellow-300">
              You've used {quotaPercentage.daily.toFixed(1)}% of your daily quota. Consider upgrading for more tokens.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
