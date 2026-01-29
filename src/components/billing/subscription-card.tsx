'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap } from 'lucide-react'
import { createCheckoutSession } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

interface SubscriptionCardProps {
  tier: 'free' | 'pro' | 'enterprise'
  price: string
  priceId?: string
  features: string[]
  highlighted?: boolean
  currentPlan?: string
}

export default function SubscriptionCard({
  tier,
  price,
  priceId,
  features,
  highlighted = false,
  currentPlan
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!priceId || tier === 'free') return

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { session, error } = await createCheckoutSession({
        userId: user.id,
        priceId,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
        customerEmail: user.email || undefined
      })

      if (error) throw error

      if (session?.url) {
        window.location.href = session.url
      }
    } catch (error: unknown) {
      console.error('Subscription error:', error)
      alert(error instanceof Error ? error.message : 'Failed to process subscription')
    } finally {
      setLoading(false)
    }
  }

  const isCurrentPlan = currentPlan === tier
  const isDowngrade = currentPlan === 'enterprise' && tier === 'pro'
  const isDowngradeToFree = currentPlan === 'pro' && tier === 'free'

  return (
    <Card className={`relative ${highlighted ? 'border-blue-500 shadow-lg' : ''}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-xl capitalize">{tier}</CardTitle>
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold">{price}</span>
          {tier !== 'free' && <span className="text-gray-500 ml-1">/month</span>}
        </div>
        <CardDescription>
          {tier === 'free' && 'Perfect for getting started'}
          {tier === 'pro' && 'For professional developers'}
          {tier === 'enterprise' && 'For teams and large projects'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full ${highlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          variant={isCurrentPlan ? 'outline' : 'default'}
          onClick={handleSubscribe}
          disabled={
            loading || 
            isCurrentPlan || 
            isDowngrade || 
            isDowngradeToFree ||
            tier === 'free'
          }
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isDowngrade ? (
            'Downgrade'
          ) : tier === 'free' ? (
            'Get Started'
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>

        {isDowngrade && (
          <p className="text-xs text-gray-500 text-center">
            Contact support to downgrade
          </p>
        )}

        {tier === 'free' && currentPlan && currentPlan !== 'free' && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/billing/portal'}
          >
            Cancel Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
