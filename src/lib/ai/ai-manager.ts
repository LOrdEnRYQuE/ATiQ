import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIProvider {
  name: string
  generateCode(prompt: string, options?: CodeGenerationOptions): Promise<AIResponse>
  analyzeCode(code: string): Promise<CodeAnalysis>
  suggestImprovements(code: string): Promise<string[]>
}

export interface CodeGenerationOptions {
  language?: string
  framework?: string
  style?: 'functional' | 'object-oriented' | 'procedural'
  includeTests?: boolean
  includeComments?: boolean
}

export interface AIResponse {
  code: string
  explanation: string
  language: string
  confidence: number
  tokensUsed: number
  suggestions: string[]
}

export interface CodeAnalysis {
  complexity: number
  maintainability: number
  securityIssues: SecurityIssue[]
  performance: PerformanceMetrics
  suggestions: string[]
}

export interface SecurityIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  line?: number
  suggestion: string
}

export interface PerformanceMetrics {
  timeComplexity: string
  spaceComplexity: string
  bottlenecks: string[]
  optimizations: string[]
}

class GeminiProvider implements AIProvider {
  name = 'Gemini 2.5 Pro'
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async generateCode(prompt: string, options?: CodeGenerationOptions): Promise<AIResponse> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, options)
    
    try {
      const result = await model.generateContent(enhancedPrompt)
      const response = await result.response
      const text = response.text()
      
      return this.parseAIResponse(text, options)
    } catch (error) {
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeCode(code: string): Promise<CodeAnalysis> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    
    const analysisPrompt = `
      Analyze this code and provide:
      1. Complexity score (1-10)
      2. Maintainability score (1-10)
      3. Security issues with severity levels
      4. Performance metrics (time/space complexity)
      5. Suggestions for improvement
      
      Code to analyze:
      ${code}
      
      Respond in JSON format with the structure:
      {
        "complexity": number,
        "maintainability": number,
        "securityIssues": [{"type": string, "severity": "low|medium|high|critical", "description": string, "suggestion": string}],
        "performance": {"timeComplexity": string, "spaceComplexity": string, "bottlenecks": [string], "optimizations": [string]},
        "suggestions": [string]
      }
    `
    
    try {
      const result = await model.generateContent(analysisPrompt)
      const response = await result.response
      const text = response.text()
      
      // Parse JSON response
      const analysis = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
      return analysis as CodeAnalysis
    } catch (error) {
      throw new Error(`Code analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async suggestImprovements(code: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    
    const improvementPrompt = `
      Suggest specific improvements for this code. Focus on:
      1. Performance optimizations
      2. Code readability
      3. Best practices
      4. Modern JavaScript/TypeScript features
      5. Error handling
      
      Code:
      ${code}
      
      Provide suggestions as a JSON array of strings:
      ["suggestion 1", "suggestion 2", ...]
    `
    
    try {
      const result = await model.generateContent(improvementPrompt)
      const response = await result.response
      const text = response.text()
      
      const suggestions = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
      return suggestions as string[]
    } catch (error) {
      throw new Error(`Improvement suggestions failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildEnhancedPrompt(prompt: string, options?: CodeGenerationOptions): string {
    let enhancedPrompt = `Generate high-quality, production-ready code for: ${prompt}`
    
    if (options?.language) {
      enhancedPrompt += `\nLanguage: ${options.language}`
    }
    
    if (options?.framework) {
      enhancedPrompt += `\nFramework: ${options.framework}`
    }
    
    if (options?.style) {
      enhancedPrompt += `\nStyle: ${options.style}`
    }
    
    if (options?.includeTests) {
      enhancedPrompt += `\nInclude comprehensive unit tests`
    }
    
    if (options?.includeComments) {
      enhancedPrompt += `\nInclude detailed comments and documentation`
    }
    
    enhancedPrompt += `
      
Requirements:
- Write clean, readable, and maintainable code
- Follow best practices and coding standards
- Include proper error handling
- Use modern JavaScript/TypeScript features when appropriate
- Optimize for performance
- Ensure security best practices
      
Please provide:
1. The generated code
2. A brief explanation of how it works
3. Confidence level (1-10)
4. Any additional suggestions or considerations
      
Format your response as JSON:
{
  "code": "...",
  "explanation": "...",
  "language": "...",
  "confidence": 8,
  "suggestions": ["...", "..."]
}`
    
    return enhancedPrompt
  }

  private parseAIResponse(text: string, options?: CodeGenerationOptions): AIResponse {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      const parsed = JSON.parse(jsonMatch[1])
      
      return {
        code: parsed.code || text,
        explanation: parsed.explanation || 'Generated code based on your request',
        language: parsed.language || options?.language || 'javascript',
        confidence: parsed.confidence || 7,
        tokensUsed: this.estimateTokens(text),
        suggestions: parsed.suggestions || []
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        code: text,
        explanation: 'Generated code based on your request',
        language: options?.language || 'javascript',
        confidence: 6,
        tokensUsed: this.estimateTokens(text),
        suggestions: []
      }
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}

// AI Manager class to handle multiple providers
export class AIManager {
  private providers: Map<string, AIProvider> = new Map()
  private currentProvider: string = 'gemini'

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      this.providers.set('gemini', new GeminiProvider(geminiApiKey))
    }
  }

  setProvider(providerName: string) {
    if (this.providers.has(providerName)) {
      this.currentProvider = providerName
    } else {
      throw new Error(`Provider ${providerName} not available`)
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async generateCode(prompt: string, options?: CodeGenerationOptions): Promise<AIResponse> {
    const provider = this.providers.get(this.currentProvider)
    if (!provider) {
      throw new Error(`No AI provider available`)
    }
    
    return provider.generateCode(prompt, options)
  }

  async analyzeCode(code: string): Promise<CodeAnalysis> {
    const provider = this.providers.get(this.currentProvider)
    if (!provider) {
      throw new Error(`No AI provider available`)
    }
    
    return provider.analyzeCode(code)
  }

  async suggestImprovements(code: string): Promise<string[]> {
    const provider = this.providers.get(this.currentProvider)
    if (!provider) {
      throw new Error(`No AI provider available`)
    }
    
    return provider.suggestImprovements(code)
  }
}

export const aiManager = new AIManager()
