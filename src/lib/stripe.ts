import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20' as any,
  typescript: true,
}) : null

// Price IDs for subscription tiers
export const PRICES = {
  PRO_MONTHLY: 'price_1O2H2R2eZvKYlV5cR5K5K5K5K5K', // Will be updated after creation
  PRO_YEARLY: 'price_1O2H2R2eZvKYlV5cR5K5K5K5K5K', // Will be updated after creation
  ENTERPRISE_MONTHLY: 'price_1O2H2R2eZvKYlV5cR5K5K5K5K5K', // Will be updated after creation
  ENTERPRISE_YEARLY: 'price_1O2H2R2eZvKYlV5cR5K5K5K5K5K', // Will be updated after creation
}

export const SUBSCRIPTION_LIMITS = {
  free: {
    projects: 5,
    aiRequests: 100,
    fileStorage: '100MB'
  },
  pro: {
    projects: 50,
    aiRequests: 5000,
    fileStorage: '1GB'
  },
  enterprise: {
    projects: -1, // unlimited
    aiRequests: -1, // unlimited
    fileStorage: '10GB'
  }
} as const

export interface CreateCheckoutSessionParams {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl,
  customerEmail
}: CreateCheckoutSessionParams) {
  if (!stripe) {
    return { session: null, error: 'Stripe is not configured' }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      allow_promotion_codes: true,
    })

    return { session, error: null }
  } catch (error) {
    console.error('Stripe checkout session creation error:', error)
    return { session: null, error: error instanceof Error ? error.message : 'Failed to create checkout session' }
  }
}

export interface CreateCustomerParams {
  email: string
  name?: string
  userId: string
}

export async function createCustomer({ email, name, userId }: CreateCustomerParams) {
  if (!stripe) {
    return { customer: null, error: 'Stripe is not configured' }
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })

    return { customer, error: null }
  } catch (error) {
    console.error('Stripe customer creation error:', error)
    return { customer: null, error: error instanceof Error ? error.message : 'Failed to create customer' }
  }
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

export async function createPortalSession({ customerId, returnUrl }: CreatePortalSessionParams) {
  if (!stripe) {
    return { session: null, error: 'Stripe is not configured' }
  }

  try {
    const session = await (stripe.billingPortal as any).sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { session, error: null }
  } catch (error) {
    console.error('Stripe portal session creation error:', error)
    return { session: null, error: error instanceof Error ? error.message : 'Failed to create portal session' }
  }
}

export async function retrieveSubscription(subscriptionId: string) {
  if (!stripe) {
    return { subscription: null, error: 'Stripe is not configured' }
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return { subscription, error: null }
  } catch (error) {
    console.error('Stripe subscription retrieval error:', error)
    return { subscription: null, error: error instanceof Error ? error.message : 'Failed to retrieve subscription' }
  }
}

export async function cancelSubscription(subscriptionId: string, _immediately = false) {
  if (!stripe) {
    return { subscription: null, error: 'Stripe is not configured' }
  }

  try {
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: { reason: 'requested_by_customer' } as any
    })

    return { subscription: updatedSubscription, error: null }
  } catch (error) {
    console.error('Stripe subscription cancellation error:', error)
    return { subscription: null, error: error instanceof Error ? error.message : 'Failed to cancel subscription' }
  }
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  if (!stripe) {
    return { subscription: null, error: 'Stripe is not configured' }
  }

  try {
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: priceId,
        quantity: 1,
      }],
      proration_behavior: 'create_prorations',
    })

    return { subscription, error: null }
  } catch (error) {
    console.error('Stripe subscription update error:', error)
    return { subscription: null, error: error instanceof Error ? error.message : 'Failed to update subscription' }
  }
}

export async function listPrices() {
  if (!stripe) {
    return { prices: null, error: 'Stripe is not configured' }
  }

  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      limit: 100,
    })

    return { prices, error: null }
  } catch (error) {
    console.error('Stripe prices list error:', error)
    return { prices: null, error: error instanceof Error ? error.message : 'Failed to list prices' }
  }
}

export async function createProduct(name: string, description?: string) {
  if (!stripe) {
    return { product: null, error: 'Stripe is not configured' }
  }

  try {
    const product = await stripe.products.create({
      name,
      description,
    })

    return { product, error: null }
  } catch (error) {
    console.error('Stripe product creation error:', error)
    return { product: null, error: error instanceof Error ? error.message : 'Failed to create product' }
  }
}

export async function createPrice(
  productId: string,
  amount: number,
  currency: string = 'usd',
  interval: 'month' | 'year' = 'month'
) {
  if (!stripe) {
    return { price: null, error: 'Stripe is not configured' }
  }

  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
      recurring: {
        interval,
      },
    })

    return { price, error: null }
  } catch (error) {
    console.error('Stripe price creation error:', error)
    return { price: null, error: error instanceof Error ? error.message : 'Failed to create price' }
  }
}
