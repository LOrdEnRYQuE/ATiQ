'use client'

import { useState, useEffect } from 'react'
import { 
  Crown, 
  Rocket, 
  Battery, 
  CheckCircle, 
  XCircle,
  Zap,
  CreditCard,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { usageService, UserQuota } from '@/lib/usage-service'
import { Button } from '@/components/ui/button'

interface QuotaManagementProps {
  userId?: string
  onTierChange?: (newTier: 'free' | 'pro' | 'enterprise') => void
}

export default function QuotaManagement({ userId = 'current-user', onTierChange }: QuotaManagementProps) {
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    const loadQuota = () => {
      try {
        const userQuota = usageService.getUserQuota(userId)
        setQuota(userQuota)
      } catch (error) {
        console.error('Failed to load quota:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuota()
  }, [userId])

  const handleUpgrade = async (newTier: 'pro' | 'enterprise') => {
    setUpgrading(true)
    try {
      // Simulate API call to payment processor
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      usageService.upgradeTier(userId, newTier)
      const updatedQuota = usageService.getUserQuota(userId)
      setQuota(updatedQuota)
      
      onTierChange?.(newTier)
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setUpgrading(false)
    }
  }

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Battery className="h-6 w-6" />
      case 'pro':
        return <Crown className="h-6 w-6" />
      case 'enterprise':
        return <Rocket className="h-6 w-6" />
      default:
        return <Battery className="h-6 w-6" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'border-gray-600 bg-gray-900/50'
      case 'pro':
        return 'border-blue-600 bg-blue-900/50'
      case 'enterprise':
        return 'border-purple-600 bg-purple-900/50'
      default:
        return 'border-gray-600 bg-gray-900/50'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-700 text-gray-300'
      case 'pro':
        return 'bg-blue-600 text-white'
      case 'enterprise':
        return 'bg-purple-600 text-white'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }

  const tiers = [
    {
      id: 'free',
      name: 'Recruit',
      price: '$0',
      description: 'Perfect for getting started',
      dailyLimit: 50000,
      monthlyLimit: 1000000,
      features: [
        'Local previews only',
        '50K tokens/day',
        '1M tokens/month',
        'Basic AI models'
      ],
      excludedFeatures: ['GitHub deployment', 'Vercel deployment', 'Expo deployment', 'Advanced AI']
    },
    {
      id: 'pro',
      name: 'Commander',
      price: '$29',
      description: 'For serious developers',
      dailyLimit: 500000,
      monthlyLimit: 10000000,
      features: [
        'Everything in Free',
        '500K tokens/day',
        '10M tokens/month',
        'GitHub deployment',
        'Vercel deployment',
        'Expo deployment',
        'Advanced AI models'
      ],
      excludedFeatures: []
    },
    {
      id: 'enterprise',
      name: 'Admiral',
      price: '$99',
      description: 'For teams and power users',
      dailyLimit: 5000000,
      monthlyLimit: 100000000,
      features: [
        'Everything in Pro',
        '5M tokens/day',
        '100M tokens/month',
        'Priority support',
        'Custom models',
        'Team collaboration',
        'Advanced analytics'
      ],
      excludedFeatures: []
    }
  ]

  if (loading) {
    return (
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!quota) {
    return (
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <div className="text-center text-gray-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load quota information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Status */}
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg border ${getTierColor(quota.tier)}`}>
              {getTierIcon(quota.tier)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <p className="text-sm text-gray-400 capitalize">{quota.tier} Tier</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(quota.tier)}`}>
            {quota.tier.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Daily Usage</div>
            <div className="text-lg font-semibold text-white">
              {formatTokens(quota.usedToday)} / {formatTokens(quota.dailyLimit)}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((quota.usedToday / quota.dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Monthly Usage</div>
            <div className="text-lg font-semibold text-white">
              {formatTokens(quota.usedThisMonth)} / {formatTokens(quota.monthlyLimit)}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((quota.usedThisMonth / quota.monthlyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
        
        <div className="space-y-4">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === quota.tier
            const canUpgrade = quota.tier === 'free' && (tier.id === 'pro' || tier.id === 'enterprise')
            const isUpgrade = tiers.findIndex(t => t.id === quota.tier) < tiers.findIndex(t => t.id === tier.id)

            return (
              <div 
                key={tier.id}
                className={`border rounded-lg p-4 transition-all ${
                  isCurrentTier 
                    ? `${getTierColor(tier.id)} border-opacity-100` 
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg border ${getTierColor(tier.id)}`}>
                      {getTierIcon(tier.id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-white">{tier.name}</h4>
                        {isCurrentTier && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(tier.id)}`}>
                            Current
                          </span>
                        )}
                        {isUpgrade && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
                            Upgrade
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{tier.description}</p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-2xl font-bold text-white">{tier.price}</span>
                        <span className="text-sm text-gray-400">/month</span>
                      </div>

                      <div className="space-y-1">
                        {tier.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-gray-300">{feature}</span>
                          </div>
                        ))}
                        
                        {tier.excludedFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <XCircle className="h-3 w-3 text-gray-600" />
                            <span className="text-gray-500">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {isCurrentTier ? (
                      <div className="text-center">
                        <div className="text-sm font-medium text-white mb-1">Active</div>
                        <div className="text-xs text-gray-400">
                          {formatTokens(tier.dailyLimit)} tokens/day
                        </div>
                      </div>
                    ) : canUpgrade ? (
                      <Button
                        onClick={() => handleUpgrade(tier.id as 'pro' | 'enterprise')}
                        disabled={upgrading}
                        className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
                      >
                        {upgrading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Upgrade
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-500">Higher Tier</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Usage Warnings */}
      {(quota.usedToday / quota.dailyLimit) > 0.8 && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">High Usage Alert</h4>
              <p className="text-sm text-yellow-300">
                You&apos;ve used {Math.round((quota.usedToday / quota.dailyLimit) * 100)}% of your daily quota. 
                Consider upgrading to Pro for more tokens and advanced features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
