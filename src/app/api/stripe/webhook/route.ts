import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import type Stripe from 'stripe'

/* eslint-disable @typescript-eslint/no-explicit-any */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get user ID from metadata
        const userId = session.metadata?.userId
        if (!userId) {
          console.error('No user ID in session metadata')
          break
        }

        // Get customer ID and subscription ID
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id

        // Determine subscription tier based on price
        let subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'
        if (priceId?.includes('pro')) {
          subscriptionTier = 'pro'
        } else if (priceId?.includes('enterprise')) {
          subscriptionTier = 'enterprise'
        }

        // Update user's subscription in database
        const { error } = await supabase
          .from('users')
          .update({
            stripe_customer_id: customerId,
            subscription_tier: subscriptionTier,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating user subscription:', error)
          break
        }

        // Create subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            status: subscription.status,
            price_id: priceId,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (subError) {
          console.error('Error creating subscription record:', subError)
        }

        console.log(`User ${userId} subscribed to ${subscriptionTier} plan`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string | undefined

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
          
          // Update subscription record
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subscriptionId)

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string | undefined

        if (subscriptionId) {
          // Update subscription status
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subscriptionId)

          if (error) {
            console.error('Error updating subscription status:', error)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price?.id

        // Determine new subscription tier
        let subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'
        if (priceId?.includes('pro')) {
          subscriptionTier = 'pro'
        } else if (priceId?.includes('enterprise')) {
          subscriptionTier = 'enterprise'
        }

        // Update user's subscription tier
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: subscriptionTier,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating user subscription tier:', error)
        }

        // Update subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            price_id: priceId,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)

        if (subError) {
          console.error('Error updating subscription record:', subError)
        }

        console.log(`Subscription updated for customer ${customerId} to ${subscriptionTier}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Update user to free tier
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating user to free tier:', error)
        }

        // Update subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)

        if (subError) {
          console.error('Error updating subscription record:', subError)
        }

        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
