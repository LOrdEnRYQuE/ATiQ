import { NextRequest, NextResponse } from 'next/server'
import { POST as StripeWebhookPOST } from '../stripe/webhook/route'

// Mock dependencies
jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'test-user-id' },
            customer: 'cus_test123',
            subscription: 'sub_test123',
          },
        },
      }

      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      stripe.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: [{ price: { id: 'price_pro_monthly' } }],
        current_period_end: 1640995200,
        trial_end: null,
      })

      const { supabase } = require('@/lib/supabase')

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(supabase.from).toHaveBeenCalledWith('subscriptions')
    })

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub_test123',
          },
        },
      }

      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      stripe.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        current_period_end: 1640995200,
      })

      const { supabase } = require('@/lib/supabase')

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should handle customer.subscription.updated event', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_test123',
            items: [{ price: { id: 'price_enterprise_monthly' } }],
            status: 'active',
            current_period_end: 1640995200,
          },
        },
      }

      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const { supabase } = require('@/lib/supabase')

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test123',
          },
        },
      }

      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const { supabase } = require('@/lib/supabase')

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('should return 400 for invalid signature', async () => {
      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid-signature',
        },
        body: JSON.stringify({}),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
    })

    it('should return 400 for missing signature', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No signature')
    })

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'test-user-id' },
            customer: 'cus_test123',
            subscription: 'sub_test123',
          },
        },
      }

      const { stripe } = require('@/lib/stripe')
      stripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      stripe.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: [{ price: { id: 'price_pro_monthly' } }],
        current_period_end: 1640995200,
        trial_end: null,
      })

      const { supabase } = require('@/lib/supabase')
      supabase.from.mockReturnValue({
        update: jest.fn().mockResolvedValue({ error: new Error('Database error') }),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: new Error('Database error') }),
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await StripeWebhookPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })
})
