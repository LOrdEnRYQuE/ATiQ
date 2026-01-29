import { NextRequest, NextResponse } from 'next/server'
import { runAllTests } from '@/lib/testing'

export async function POST(req: NextRequest) {
  try {
    // Run all tests
    const { summary, results } = await runAllTests()

    return NextResponse.json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('Test execution error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during testing',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Return test status
    return NextResponse.json({
      message: 'Test endpoint is ready. Use POST to run all tests.',
      availableTests: [
        'Database Connectivity',
        'Authentication System',
        'Rate Limiting System',
        'Input Validation System',
        'Analytics System',
        'Performance Tests'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
