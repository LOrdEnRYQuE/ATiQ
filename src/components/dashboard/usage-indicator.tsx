'use client'

import { Zap, AlertTriangle, Lock, Crown, Rocket, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsageStore } from '@/lib/store/usage'
import { getUsageColor } from '@/lib/token-utils'

export function UsageIndicator() {
  const { 
    tokensUsed, 
    dailyLimit, 
    tier, 
    upgradeTier,
    getUsageStats,
    getOperationBreakdown
  } = useUsageStore()
  
  const stats = getUsageStats()
  const breakdown = getOperationBreakdown()
  const percentage = stats.percentage
  const isLow = percentage > 80
  const isCritical = percentage >= 100
  const usageColors = getUsageColor(percentage)

  const getTierIcon = () => {
    switch (tier) {
      case 'free':
        return <Zap className="w-4 h-4" />
      case 'pro':
        return <Crown className="w-4 h-4" />
      case 'enterprise':
        return <Rocket className="w-4 h-4" />
      default:
        return <Lock className="w-4 h-4" />
    }
  }

  const handleUpgrade = () => {
    if (tier === 'free') {
      upgradeTier('pro')
    } else if (tier === 'pro') {
      upgradeTier('enterprise')
    }
  }

  return (
    <div className="p-4 border border-gray-800 rounded-xl bg-black space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${usageColors.border} ${usageColors.bg} ${usageColors.text} transition-all duration-300`}>
            {getTierIcon()}
          </div>
          <div>
            <span className="font-bold text-sm text-white">Vibe Power</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{stats.tierName}</span>
              {tier !== 'free' && (
                <TrendingUp className="w-3 h-3 text-green-400" />
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs font-mono text-gray-400">
            {stats.formattedUsed} / {stats.formattedRemaining}
          </div>
          <div className="text-xs text-gray-500">
            {stats.costToday ? `$${stats.costToday.toFixed(4)} today` : ''}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Usage</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${usageColors.bg}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Operation Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
          <span className="text-gray-400">Genesis</span>
          <span className="text-purple-400 font-medium">{breakdown.genesis.count}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
          <span className="text-gray-400">Consult</span>
          <span className="text-blue-400 font-medium">{breakdown.consult.count}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
          <span className="text-gray-400">Modify</span>
          <span className="text-green-400 font-medium">{breakdown.modify.count}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
          <span className="text-gray-400">Deploy</span>
          <span className="text-orange-400 font-medium">{breakdown.deployment.count}</span>
        </div>
      </div>

      {/* Status Messages */}
      {isCritical ? (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div>
              <span className="text-red-500 text-xs font-bold">Fuel Empty</span>
              <div className="text-red-400 text-xs">
                Upgrade to continue using Vibe Coding
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleUpgrade}
            className="h-8 text-xs bg-red-600 hover:bg-red-700"
          >
            {tier === 'free' ? 'Go Pro' : 'Go Enterprise'}
          </Button>
        </div>
      ) : isLow ? (
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <div>
              <span className="text-yellow-500 text-xs font-bold">Fuel Low</span>
              <div className="text-yellow-400 text-xs">
                {stats.formattedRemaining} tokens remaining
              </div>
            </div>
          </div>
          {tier === 'free' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleUpgrade}
              className="h-8 text-xs border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
            >
              Upgrade
            </Button>
          )}
        </div>
      ) : (
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{tier === 'free' ? 'Starter Plan' : `${stats.tierName} Plan`}</span>
          <span>Resets at midnight UTC</span>
        </div>
      )}

      {/* Upgrade Prompt for Free Users */}
      {tier === 'free' && !isLow && (
        <div className="text-center">
          <Button 
            size="sm" 
            onClick={handleUpgrade}
            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro - Unlimited Power
          </Button>
          <div className="text-xs text-gray-500 mt-1">
            10M tokens/month • All features unlocked
          </div>
        </div>
      )}
    </div>
  )
}
