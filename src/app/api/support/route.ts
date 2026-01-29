import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, email, message, type } = await request.json()

    // Here you would typically:
    // 1. Send email to support team
    // 2. Create support ticket in database
    // 3. Send confirmation to user
    
    console.log('Support request received:', { name, email, message, type })

    // For now, just log and return success
    return NextResponse.json({
      success: true,
      message: 'Support request received. We will get back to you within 24 hours.',
      ticketId: `SUP-${Date.now()}`
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to submit support request'
    }, { status: 500 })
  }
}
