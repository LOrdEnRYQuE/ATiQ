import { NextRequest } from 'next/server'

// Validation schemas
export const VALIDATION_RULES = {
  // User input validation
  USERNAME: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens'
  },
  
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  
  PASSWORD: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  },
  
  PROJECT_NAME: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s_-]+$/,
    message: 'Project name must be 1-100 characters and contain only letters, numbers, spaces, underscores, and hyphens'
  },
  
  FILE_NAME: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9._-]+$/,
    message: 'File name must be 1-255 characters and contain only letters, numbers, dots, underscores, and hyphens'
  },
  
  AI_PROMPT: {
    minLength: 1,
    maxLength: 10000,
    message: 'AI prompt must be 1-10,000 characters'
  },
  
  CODE_SNIPPET: {
    minLength: 1,
    maxLength: 100000,
    message: 'Code snippet must be 1-100,000 characters'
  }
} as const

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: string
}

// Base validator class
export class InputValidator {
  // Sanitize input string
  static sanitize(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JavaScript URLs
      .replace(/on\w+=/gi, '') // Remove potential event handlers
  }

  // Validate string against rules
  static validateString(input: string, rules: typeof VALIDATION_RULES[keyof typeof VALIDATION_RULES]): ValidationResult {
    const errors: string[] = []
    let sanitized = this.sanitize(input)

    // Check minimum length
    if ('minLength' in rules && rules.minLength && sanitized.length < rules.minLength) {
      errors.push(`Input must be at least ${rules.minLength} characters long`)
    }

    // Check maximum length
    if ('maxLength' in rules && rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`Input must be no more than ${rules.maxLength} characters long`)
      sanitized = sanitized.substring(0, rules.maxLength)
    }

    // Check pattern
    if ('pattern' in rules && rules.pattern && !rules.pattern.test(sanitized)) {
      errors.push(rules.message)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  // Validate email
  static validateEmail(email: string): ValidationResult {
    return this.validateString(email, VALIDATION_RULES.EMAIL)
  }

  // Validate password
  static validatePassword(password: string): ValidationResult {
    return this.validateString(password, VALIDATION_RULES.PASSWORD)
  }

  // Validate username
  static validateUsername(username: string): ValidationResult {
    return this.validateString(username, VALIDATION_RULES.USERNAME)
  }

  // Validate project name
  static validateProjectName(name: string): ValidationResult {
    return this.validateString(name, VALIDATION_RULES.PROJECT_NAME)
  }

  // Validate file name
  static validateFileName(fileName: string): ValidationResult {
    return this.validateString(fileName, VALIDATION_RULES.FILE_NAME)
  }

  // Validate AI prompt
  static validateAIPrompt(prompt: string): ValidationResult {
    const result = this.validateString(prompt, {
      minLength: VALIDATION_RULES.AI_PROMPT.minLength,
      maxLength: VALIDATION_RULES.AI_PROMPT.maxLength,
      message: VALIDATION_RULES.AI_PROMPT.message
    })

    // Additional AI-specific validation
    if (result.isValid) {
      // Check for potentially harmful content
      const harmfulPatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /key/i,
        /hack/i,
        /exploit/i,
        /malicious/i
      ]

      for (const pattern of harmfulPatterns) {
        if (pattern.test(result.sanitized || '')) {
          result.errors.push('Prompt contains potentially sensitive or harmful content')
          result.isValid = false
          break
        }
      }
    }

    return result
  }

  // Validate code snippet
  static validateCodeSnippet(code: string): ValidationResult {
    const result = this.validateString(code, {
      minLength: VALIDATION_RULES.CODE_SNIPPET.minLength,
      maxLength: VALIDATION_RULES.CODE_SNIPPET.maxLength,
      message: VALIDATION_RULES.CODE_SNIPPET.message
    })

    if (result.isValid && result.sanitized) {
      // Check for potentially dangerous code patterns
      const dangerousPatterns = [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /document\.write/gi,
        /innerHTML\s*=/gi,
        /outerHTML\s*=/gi
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(result.sanitized)) {
          result.errors.push('Code contains potentially dangerous patterns')
          result.isValid = false
          break
        }
      }
    }

    return result
  }

  // Validate request body
  static validateRequestBody(body: unknown, schema: Record<string, (value: unknown) => ValidationResult>): ValidationResult {
    const errors: string[] = []
    const sanitized: Record<string, unknown> = {}

    if (typeof body !== 'object' || body === null) {
      return {
        isValid: false,
        errors: ['Request body must be a valid object']
      }
    }

    for (const [key, validator] of Object.entries(schema)) {
      const value = (body as Record<string, unknown>)[key]
      const result = validator(value)

      if (!result.isValid) {
        errors.push(`${key}: ${result.errors.join(', ')}`)
      } else if (result.sanitized !== undefined) {
        sanitized[key] = result.sanitized
      } else {
        sanitized[key] = value
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: JSON.stringify(sanitized)
    }
  }

  // Validate file upload
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: string[] = []

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size ${file.size} bytes exceeds maximum allowed size of ${maxSize} bytes`)
    }

    // Check file name
    const nameResult = this.validateFileName(file.name)
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate query parameters
  static validateQueryParams(params: URLSearchParams, schema: Record<string, (value: string) => ValidationResult>): ValidationResult {
    const errors: string[] = []
    const sanitized: Record<string, string> = {}

    for (const [key, validator] of Object.entries(schema)) {
      const value = params.get(key)
      
      if (value === null) {
        errors.push(`Missing required query parameter: ${key}`)
        continue
      }

      const result = validator(value)
      if (!result.isValid) {
        errors.push(`${key}: ${result.errors.join(', ')}`)
      } else if (result.sanitized) {
        sanitized[key] = result.sanitized
      } else {
        sanitized[key] = value
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: JSON.stringify(sanitized)
    }
  }

  // Check for SQL injection patterns
  static checkSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\*|;|'|\"|`|\/\*|\*\/)/g,
      /\b(OR|AND)\s+\d+\s*=\s*\d+/gi,
      /\b(OR|AND)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/gi
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }

  // Check for XSS patterns
  static checkXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*on\w+[^>]*>/gi
    ]

    return xssPatterns.some(pattern => pattern.test(input))
  }

  // Comprehensive security check
  static securityCheck(input: string): ValidationResult {
    const errors: string[] = []
    const sanitized = this.sanitize(input)

    // Check for SQL injection
    if (this.checkSQLInjection(sanitized)) {
      errors.push('Input contains potentially malicious SQL patterns')
    }

    // Check for XSS
    if (this.checkXSS(sanitized)) {
      errors.push('Input contains potentially malicious script patterns')
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }
}

// Middleware helper for request validation
export function createValidationMiddleware(schema: Record<string, (value: unknown) => ValidationResult>) {
  return async (req: NextRequest): Promise<{ isValid: boolean; errors: string[]; body?: unknown }> => {
    try {
      const body = await req.json()
      const result = InputValidator.validateRequestBody(body, schema)
      
      return {
        isValid: result.isValid,
        errors: result.errors,
        body: result.sanitized ? JSON.parse(result.sanitized) : body
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid request body format']
      }
    }
  }
}

// Common validation schemas
export const VALIDATION_SCHEMAS = {
  // User registration
  REGISTER: {
    email: (value: unknown) => InputValidator.validateEmail(String(value)),
    password: (value: unknown) => InputValidator.validatePassword(String(value)),
    username: (value: unknown) => InputValidator.validateUsername(String(value))
  },

  // Project creation
  CREATE_PROJECT: {
    name: (value: unknown) => InputValidator.validateProjectName(String(value)),
    description: (value: unknown) => InputValidator.validateString(String(value), {
      minLength: 0,
      maxLength: 500,
      pattern: /.*/,
      message: 'Description must be 0-500 characters'
    } as any)
  },

  // AI request
  AI_REQUEST: {
    prompt: (value: unknown) => InputValidator.validateAIPrompt(String(value)),
    model: (value: unknown) => {
      const validModels = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
      const model = String(value)
      return {
        isValid: validModels.includes(model),
        errors: validModels.includes(model) ? [] : ['Invalid AI model specified'],
        sanitized: model
      }
    }
  },

  // File upload
  FILE_UPLOAD: {
    fileName: (value: unknown) => InputValidator.validateFileName(String(value)),
    content: (value: unknown) => InputValidator.validateCodeSnippet(String(value))
  }
} as const

export default InputValidator
