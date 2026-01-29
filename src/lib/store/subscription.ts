'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { createPortalSession } from '@/lib/stripe'
import type { Json } from '@/types/database'

interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  price_id: string
  current_period_end: string
  trial_end?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  stripe_customer_id?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

interface SubscriptionStore {
  user: User | null
  subscription: Subscription | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchUserSubscription: () => Promise<void>
  upgradeSubscription: (priceId: string) => Promise<void>
  cancelSubscription: () => Promise<void>
  openBillingPortal: () => Promise<void>
  clearError: () => void
  getUsageStats: () => Promise<{
    projectsUsed: number
    projectsLimit: number
    aiRequestsUsed: number
    aiRequestsLimit: number
  }>
}

// Helper function to convert Json to string
const jsonToString = (json: Json): string => {
  if (typeof json === 'string') return json
  return JSON.stringify(json)
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      loading: false,
      error: null,

      fetchUserSubscription: async () => {
        set({ loading: true, error: null })
        
        if (!supabase) {
          set({ error: 'Database not available', loading: false })
          return
        }
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          // Fetch user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (userError && userError.code !== 'PGRST116') throw userError

          // Fetch subscription data
          let subscriptionData = null
          if (userData?.stripe_customer_id) {
            const { data: subData, error: subError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (subError && subError.code !== 'PGRST116') throw subError
            subscriptionData = subData
          }

          // Convert database user to interface user
          const userObj: User = userData ? {
            id: userData.id,
            email: userData.email,
            stripe_customer_id: userData.stripe_customer_id || undefined,
            subscription_tier: (userData.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free',
            created_at: userData.created_at || '',
            updated_at: userData.updated_at || ''
          } : {
            id: user.id,
            email: user.email || '',
            subscription_tier: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Convert database subscription to interface subscription
          const subscriptionObj: Subscription | null = subscriptionData ? {
            id: subscriptionData.id,
            user_id: subscriptionData.user_id || '',
            status: subscriptionData.status as 'active' | 'canceled' | 'past_due' | 'trialing',
            price_id: subscriptionData.price_id,
            current_period_end: subscriptionData.current_period_end,
            trial_end: (subscriptionData as any).trial_end || undefined,
            created_at: subscriptionData.created_at || '',
            updated_at: subscriptionData.updated_at || ''
          } : null

          set({
            user: userObj,
            subscription: subscriptionObj,
            loading: false
          })
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch subscription',
            loading: false 
          })
        }
      },

      upgradeSubscription: async (priceId: string) => {
        set({ loading: true, error: null })

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          const { user: currentUser } = get()
          if (!currentUser?.stripe_customer_id) {
            throw new Error('No Stripe customer found')
          }

          // Create checkout session for upgrade
          const { session, error } = await createPortalSession({
            customerId: currentUser.stripe_customer_id,
            returnUrl: `${window.location.origin}/billing`
          })

          if (error) throw error

          if (session?.url) {
            window.location.href = session.url
          }
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upgrade subscription',
            loading: false 
          })
        }
      },

      cancelSubscription: async () => {
        set({ loading: true, error: null })

        try {
          const { user: currentUser } = get()
          if (!currentUser?.stripe_customer_id) {
            throw new Error('No active subscription found')
          }

          // Open billing portal for cancellation
          const { session, error } = await createPortalSession({
            customerId: currentUser.stripe_customer_id,
            returnUrl: `${window.location.origin}/billing`
          })

          if (error) throw error

          if (session?.url) {
            window.location.href = session.url
          }
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel subscription',
            loading: false 
          })
        }
      },

      openBillingPortal: async () => {
        set({ loading: true, error: null })

        try {
          const { user: currentUser } = get()
          if (!currentUser?.stripe_customer_id) {
            throw new Error('No Stripe customer found')
          }

          const { session, error } = await createPortalSession({
            customerId: currentUser.stripe_customer_id,
            returnUrl: `${window.location.origin}/billing`
          })

          if (error) throw error

          if (session?.url) {
            window.location.href = session.url
          }
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to open billing portal',
            loading: false 
          })
        }
      },

      getUsageStats: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          // Get user's subscription tier
          const { data: userData } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

          const tier = userData?.subscription_tier || 'free'

          // Get project count
          const { count: projectsCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          // Get AI request count for current month
          const now = new Date()
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          
          const { count: aiRequestsCount } = await supabase
            .from('ai_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth.toISOString())

          // Define limits based on tier
          const limits: Record<string, { projects: number; aiRequests: number }> = {
            free: { projects: 5, aiRequests: 100 },
            pro: { projects: 50, aiRequests: 5000 },
            enterprise: { projects: Infinity, aiRequests: Infinity }
          }

          const tierLimits = limits[tier]

          return {
            projectsUsed: projectsCount || 0,
            projectsLimit: tierLimits.projects,
            aiRequestsUsed: aiRequestsCount || 0,
            aiRequestsLimit: tierLimits.aiRequests
          }
        } catch (error: unknown) {
          console.error('Error fetching usage stats:', error)
          return {
            projectsUsed: 0,
            projectsLimit: 5,
            aiRequestsUsed: 0,
            aiRequestsLimit: 100
          }
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'subscription-store',
      partialize: (state) => ({ 
        user: state.user,
        subscription: state.subscription
      })
    }
  )
)
