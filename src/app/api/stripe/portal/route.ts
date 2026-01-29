import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { customerId, returnUrl } = await req.json()

    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerId, returnUrl' },
        { status: 400 }
      )
    }

    // Verify the customer belongs to the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.stripe_customer_id !== customerId) {
      return NextResponse.json({ error: 'Invalid customer' }, { status: 403 })
    }

    // Create portal session
    const { session, error } = await createPortalSession({
      customerId,
      returnUrl
    })

    if (error) {
      console.error('Portal session creation error:', error)
      return NextResponse.json(
        { error: typeof error === 'string' ? error : 'Failed to create portal session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session?.url })
  } catch (error: unknown) {
    console.error('Portal API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
