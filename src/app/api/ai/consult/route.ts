import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    
    const apiKey = req.headers.get('x-api-key') || undefined
    const genAI = new GoogleGenerativeAI(apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const CONSULTANT_PROMPT = `
      ROLE: You are a Senior CTO & Software Architect.
      
      USER IDEA: "${prompt}"
      
      TASK: Analyze the idea and recommend the optimal technical architecture.
      
      CONSTRAINTS & OPTIONS:
      - Types: 'web_app' (SaaS/Tools), 'landing_page' (Marketing), 'mobile_app' (Phone), 'desktop_app' (Windows/Mac), 'api_service' (Backend).
      - Stacks: 
        * For Web: 'nextjs' (SEO/Complex), 'react' (SPA/Dashboards)
        * For Mobile: 'react' (React Native/Expo)
        * For Desktop: 'electron'
      - Styling: 'tailwind' (Default/Best), 'css_modules'.
      
      OUTPUT FORMAT:
      Return strictly valid JSON. No markdown formatting.
      {
        "type": "project_type_enum",
        "framework": "framework_enum",
        "styling": "styling_enum",
        "features": ["list", "of", "4-6", "key", "technical", "features", "e.g. Auth", "Database"],
        "rationale": "One concise sentence explaining why this stack is best."
      }
    `

    const result = await model.generateContent(CONSULTANT_PROMPT)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    
    return NextResponse.json(JSON.parse(text))
  } catch (error) {
    console.error('Consultation Error:', error)
    return NextResponse.json(
      { error: 'Failed to consult AI architect.' }, 
      { status: 500 }
    )
  }
}
