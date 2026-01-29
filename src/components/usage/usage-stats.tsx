'use client'

import { useEffect, useState } from 'react'
import { Zap, FolderOpen, TrendingUp, AlertTriangle } from 'lucide-react'
import { useSubscriptionStore } from '@/lib/store/subscription'
import Link from 'next/link'

interface UsageStats {
  projectsUsed: number
  projectsLimit: number
  aiRequestsUsed: number
  aiRequestsLimit: number
}

export default function UsageStats() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, subscription } = useSubscriptionStore()

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const store = useSubscriptionStore.getState()
        const stats = await store.getUsageStats()
        setUsageStats(stats)
      } catch (error) {
        console.error('Error fetching usage stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageStats()
  }, [])

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 75) return 'text-yellow-400'
    return 'text-green-400'
  }

  const isNearLimit = (used: number, limit: number) => {
    if (limit === Infinity) return false
    return (used / limit) >= 0.8
  }

  if (loading) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Usage Statistics</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    )
  }

  if (!usageStats) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Usage Statistics</h3>
        </div>
        <div className="text-center text-gray-400">
          Unable to load usage statistics
        </div>
      </div>
    )
  }

  const projectsPercentage = getUsagePercentage(usageStats.projectsUsed, usageStats.projectsLimit)
  const aiRequestsPercentage = getUsagePercentage(usageStats.aiRequestsUsed, usageStats.aiRequestsLimit)

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Usage Statistics</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          user?.subscription_tier === 'free' 
            ? 'bg-gray-800 text-gray-300 border border-gray-700' 
            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
        }`}>
          {user?.subscription_tier?.toUpperCase()}
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Track your usage and upgrade when you need more resources
      </p>

      <div className="space-y-6">
        {/* Projects Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium text-white">Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getUsageColor(projectsPercentage)}`}>
                {usageStats.projectsUsed} / {usageStats.projectsLimit === Infinity ? '∞' : usageStats.projectsLimit}
              </span>
              {isNearLimit(usageStats.projectsUsed, usageStats.projectsLimit) && (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                projectsPercentage >= 90 ? 'bg-red-500' :
                projectsPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${projectsPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {usageStats.projectsLimit === Infinity 
              ? 'Unlimited projects with your current plan'
              : `${usageStats.projectsLimit - usageStats.projectsUsed} projects remaining`
            }
          </p>
        </div>

        {/* AI Requests Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium text-white">AI Requests (This Month)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getUsageColor(aiRequestsPercentage)}`}>
                {usageStats.aiRequestsUsed} / {usageStats.aiRequestsLimit === Infinity ? '∞' : usageStats.aiRequestsLimit}
              </span>
              {isNearLimit(usageStats.aiRequestsUsed, usageStats.aiRequestsLimit) && (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                aiRequestsPercentage >= 90 ? 'bg-red-500' :
                aiRequestsPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${aiRequestsPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {usageStats.aiRequestsLimit === Infinity 
              ? 'Unlimited AI requests with your current plan'
              : `${usageStats.aiRequestsLimit - usageStats.aiRequestsUsed} requests remaining this month`
            }
          </p>
        </div>

        {/* Billing Status */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Billing Status</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              subscription?.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
              subscription?.status === 'past_due' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}>
              {subscription?.status || 'No subscription'}
            </div>
          </div>
          {subscription?.current_period_end && (
            <p className="text-xs text-gray-400">
              Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Upgrade CTA */}
        {user?.subscription_tier === 'free' && (
          <div className="border-t border-gray-800 pt-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-400">
                Upgrade to Pro for more resources and advanced features
              </p>
              {/* Electro gradient upgrade button */}
              <Link href="/billing">
                <div className="group relative inline-block w-full">
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                    <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
                  </div>
                  <div className="absolute inset-0 rounded-lg p-px">
                    <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                         style={{ 
                           background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                           backgroundSize: '200% 200%',
                           animation: 'electro 2s ease-in-out infinite'
                         }} />
                  </div>
                  <button className="relative w-full px-4 py-2 bg-black text-white font-bold rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                    Upgrade Plan
                  </button>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Manage Billing */}
        {user?.subscription_tier !== 'free' && user?.stripe_customer_id && (
          <div className="border-t border-gray-800 pt-4">
            <Link href="/billing">
              <button className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-medium hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105">
                Manage Billing
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
