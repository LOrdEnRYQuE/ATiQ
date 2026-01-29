import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class AIService {
  private model: GenerativeModel
  private flashModel: GenerativeModel

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    })
    
    this.flashModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 4096,
      }
    })
  }

  async generateCode(prompt: string, tech: string = 'javascript', useFlash: boolean = false): Promise<string> {
    const systemPrompt = `You are an expert ${tech} developer. Generate production-ready code for the following request:

${prompt}

Requirements:
- No comments explaining obvious code
- No TODO markers or placeholder text
- Production-ready error handling
- TypeScript types if applicable
- Modern ES6+ syntax
- Clean, readable code
- Follow best practices and conventions

Generate only the code, no explanations.`

    try {
      const model = useFlash ? this.flashModel : this.model
      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('AI generation error:', error)
      throw new Error('Failed to generate code')
    }
  }

  async generateWithStreaming(prompt: string, tech: string = 'javascript'): Promise<ReadableStream<string>> {
    const systemPrompt = `You are an expert ${tech} developer. Generate production-ready code for:

${prompt}

Requirements:
- No comments explaining obvious code
- No TODO markers or placeholder text
- Production-ready error handling
- TypeScript types if applicable
- Modern ES6+ syntax
- Clean, readable code
- Follow best practices and conventions

Generate only the code, no explanations.`

    const result = await this.model.generateContentStream(systemPrompt)
    
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            controller.enqueue(chunkText)
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })
  }

  async generateExplanation(code: string): Promise<string> {
    const prompt = `Explain this code in simple terms:

${code}

Provide a clear, concise explanation of what this code does and how it works.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('AI explanation error:', error)
      throw new Error('Failed to generate explanation')
    }
  }
}

export const aiService = new AIService()
