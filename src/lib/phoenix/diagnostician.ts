/**
 * Project Phoenix: Error Diagnostician
 * AI-powered error analysis and structured patch generation
 */

export interface DiagnosticResult {
  diagnosis: string
  action: 'install_package' | 'update_package' | 'fix_code' | 'add_config' | 'remove_file' | 'create_file'
  target: string // package name, file path, or config key
  patch?: string // code patch or content to add
  confidence: number // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical'
  estimatedFixTime: number // seconds
  dependencies?: string[] // additional packages needed
}

export interface BuildContext {
  framework: 'react' | 'vue' | 'angular' | 'next' | 'expo' | 'unknown'
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown'
  platform: 'web' | 'mobile' | 'desktop' | 'unknown'
  lastOperation: string
  files: Record<string, string>
}

/**
 * Error Diagnostician - AI agent that analyzes build errors and generates structured fixes
 */
export class ErrorDiagnostician {
  private errorPatterns = {
    // Missing dependencies
    missingDependency: [
      /Cannot find module ['"]([^'"]+)['"]/,
      /Module not found: Can't resolve ['"]([^'"]+)['"]/,
      /Error: Cannot find package ['"]([^'"]+)['"]/,
      /UNMET PEER DEPENDENCY ([^\\s]+)/,
      /npm ERR! peer dep missing: ([^\\s]+)/,
      /Could not resolve dependency ([^\\s]+)/
    ],

    // Version conflicts
    versionConflict: [
      /npm ERR! code ERESOLVE/,
      /Unable to resolve dependency tree/,
      /Conflicting peer dependency/,
      /Version mismatch between (.+) and (.+)/
    ],

    // Syntax errors
    syntaxError: [
      /SyntaxError: (.+)/,
      /Unexpected token (.+)/,
      /Parsing error: (.+)/,
      /TS\\d+: (.+)/
    ],

    // Configuration errors
    configError: [
      /Configuration file not found: (.+)/,
      /Invalid configuration: (.+)/,
      /Missing required configuration (.+)/,
      /Config file (.+) is missing/
    ],

    // Import/export errors
    importError: [
      /Import declaration (.+) is not found/,
      /The requested module (.+) does not exist/,
      /Cannot import (.+)/,
      /export ['"](.+)['"] was not found/
    ],

    // Type errors
    typeError: [
      /Type '(.+)' is not assignable to type '(.+)'/,
      /Property '(.+)' does not exist on type '(.+)'/,
      /Argument of type '(.+)' is not assignable to parameter of type '(.+)'/,
      /Cannot find name '(.+)'/
    ]
  }

  /**
   * Analyze build error and generate structured diagnosis
   */
  async diagnoseError(
    errorLog: string,
    context: BuildContext
  ): Promise<DiagnosticResult> {
    console.log('🔥 Phoenix Diagnostician: Analyzing error...')
    
    // Extract key error information
    const errorLines = errorLog.split('\\n').filter(line => line.trim())
    const primaryError = this.extractPrimaryError(errorLines)
    
    // Match against known patterns
    const diagnosis = this.matchErrorPattern(primaryError, context)
    
    // Generate structured fix
    const result = await this.generateStructuredFix(diagnosis, context)
    
    console.log(`🔥 Phoenix Diagnostician: ${result.action} - ${result.target} (${Math.round(result.confidence * 100)}% confidence)`)
    
    return result
  }

  /**
   * Extract the primary error from log lines
   */
  private extractPrimaryError(errorLines: string[]): string {
    // Look for the most specific error line
    for (const line of errorLines) {
      // Skip generic lines and focus on specific errors
      if (line.includes('Error:') || 
          line.includes('Cannot') || 
          line.includes('Module not found') ||
          line.includes('SyntaxError') ||
          line.includes('npm ERR!')) {
        return line
      }
    }
    
    // Fallback to first error-like line
    return errorLines.find(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed')
    ) || errorLines[0]
  }

  /**
   * Match error against known patterns
   */
  private matchErrorPattern(errorLine: string, context: BuildContext): {
    type: keyof typeof this.errorPatterns
    matches: RegExpMatchArray[]
    confidence: number
  } {
    let bestMatch = {
      type: 'syntaxError' as keyof typeof this.errorPatterns,
      matches: [] as RegExpMatchArray[],
      confidence: 0
    }

    for (const [patternType, patterns] of Object.entries(this.errorPatterns)) {
      for (const pattern of patterns) {
        const match = errorLine.match(pattern)
        if (match) {
          const confidence = this.calculatePatternConfidence(patternType as keyof typeof this.errorPatterns, errorLine, context)
          
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              type: patternType as keyof typeof this.errorPatterns,
              matches: [match],
              confidence
            }
          }
        }
      }
    }

    return bestMatch
  }

  /**
   * Calculate confidence based on pattern and context
   */
  private calculatePatternConfidence(
    patternType: keyof typeof this.errorPatterns,
    errorLine: string,
    context: BuildContext
  ): number {
    let confidence = 0.5 // Base confidence

    // Boost confidence for specific patterns
    switch (patternType) {
      case 'missingDependency':
        if (errorLine.includes('Cannot find module') || errorLine.includes('Module not found')) {
          confidence += 0.4
        }
        if (context.framework !== 'unknown') {
          confidence += 0.1
        }
        break

      case 'versionConflict':
        if (errorLine.includes('ERESOLVE')) {
          confidence += 0.4
        }
        if (context.packageManager !== 'unknown') {
          confidence += 0.1
        }
        break

      case 'syntaxError':
        if (errorLine.includes('SyntaxError')) {
          confidence += 0.3
        }
        if (errorLine.includes('TS\\d+:')) {
          confidence += 0.2
        }
        break

      case 'configError':
        if (errorLine.includes('not found')) {
          confidence += 0.3
        }
        break

      case 'importError':
        if (errorLine.includes('import')) {
          confidence += 0.3
        }
        break

      case 'typeError':
        if (errorLine.includes('TypeScript') || errorLine.includes('TS\\d+')) {
          confidence += 0.3
        }
        break
    }

    return Math.min(1.0, confidence)
  }

  /**
   * Generate structured fix based on diagnosis
   */
  private async generateStructuredFix(
    diagnosis: { type: keyof typeof this.errorPatterns; matches: RegExpMatchArray[]; confidence: number },
    context: BuildContext
  ): Promise<DiagnosticResult> {
    const match = diagnosis.matches[0]
    
    switch (diagnosis.type) {
      case 'missingDependency':
        return this.generateDependencyFix(match, diagnosis.confidence, context)
      
      case 'versionConflict':
        return this.generateVersionFix(match, diagnosis.confidence, context)
      
      case 'syntaxError':
        return this.generateSyntaxFix(match, diagnosis.confidence, context)
      
      case 'configError':
        return this.generateConfigFix(match, diagnosis.confidence, context)
      
      case 'importError':
        return this.generateImportFix(match, diagnosis.confidence, context)
      
      case 'typeError':
        return this.generateTypeFix(match, diagnosis.confidence, context)
      
      default:
        return this.generateGenericFix(diagnosis.confidence)
    }
  }

  /**
   * Generate dependency installation fix
   */
  private generateDependencyFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    const packageName = match[1] || match[0]
    
    // Determine if it's a dev dependency or regular dependency
    const isDevDep = this.isLikelyDevDependency(packageName, context)
    
    // Suggest version based on framework
    const suggestedVersion = this.suggestPackageVersion(packageName, context)
    
    return {
      diagnosis: `Missing dependency '${packageName}'`,
      action: isDevDep ? 'install_package' : 'install_package',
      target: `${packageName}${suggestedVersion ? '@' + suggestedVersion : ''}`,
      confidence,
      severity: 'high',
      estimatedFixTime: 30,
      dependencies: []
    }
  }

  /**
   * Generate version conflict fix
   */
  private generateVersionFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    return {
      diagnosis: 'Dependency version conflict detected',
      action: 'update_package',
      target: 'package.json',
      patch: this.generateVersionConflictPatch(context),
      confidence,
      severity: 'medium',
      estimatedFixTime: 45,
      dependencies: []
    }
  }

  /**
   * Generate syntax error fix
   */
  private generateSyntaxFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    const errorMessage = match[1] || match[0]
    const fileMatch = errorMessage.match(/at (.+):(\\d+):(\\d+)/)
    const filePath = fileMatch?.[1] || 'unknown'
    
    return {
      diagnosis: `Syntax error: ${errorMessage}`,
      action: 'fix_code',
      target: filePath,
      patch: this.generateSyntaxPatch(errorMessage),
      confidence: confidence * 0.8, // Lower confidence for syntax fixes
      severity: 'high',
      estimatedFixTime: 60,
      dependencies: []
    }
  }

  /**
   * Generate configuration fix
   */
  private generateConfigFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    const configName = match[1] || 'tsconfig.json'
    
    return {
      diagnosis: `Missing configuration file: ${configName}`,
      action: 'create_file',
      target: configName,
      patch: this.generateConfigContent(configName, context),
      confidence,
      severity: 'medium',
      estimatedFixTime: 30,
      dependencies: []
    }
  }

  /**
   * Generate import error fix
   */
  private generateImportFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    const importName = match[1] || match[0]
    
    return {
      diagnosis: `Import error: ${importName}`,
      action: 'fix_code',
      target: 'import_fix',
      patch: this.generateImportPatch(importName, context),
      confidence: confidence * 0.9,
      severity: 'medium',
      estimatedFixTime: 45,
      dependencies: []
    }
  }

  /**
   * Generate type error fix
   */
  private generateTypeFix(
    match: RegExpMatchArray,
    confidence: number,
    context: BuildContext
  ): DiagnosticResult {
    const typeError = match[1] || match[0]
    
    return {
      diagnosis: `Type error: ${typeError}`,
      action: 'fix_code',
      target: 'type_fix',
      patch: this.generateTypePatch(typeError, context),
      confidence: confidence * 0.7, // Lower confidence for type fixes
      severity: 'low',
      estimatedFixTime: 90,
      dependencies: []
    }
  }

  /**
   * Generate generic fix for unknown errors
   */
  private generateGenericFix(confidence: number): DiagnosticResult {
    return {
      diagnosis: 'Unknown error - requires manual investigation',
      action: 'fix_code',
      target: 'unknown',
      confidence: confidence * 0.3,
      severity: 'low',
      estimatedFixTime: 300,
      dependencies: []
    }
  }

  /**
   * Helper methods for generating patches
   */
  private isLikelyDevDependency(packageName: string, context: BuildContext): boolean {
    const devDepPatterns = [
      'typescript', 'eslint', 'prettier', 'jest', 'webpack', 'vite',
      '@types/', 'babel', 'postcss', 'tailwind'
    ]
    
    return devDepPatterns.some(pattern => packageName.includes(pattern))
  }

  private suggestPackageVersion(packageName: string, context: BuildContext): string {
    // Framework-specific version suggestions
    const versions: Record<string, string> = {
      'react': context.framework === 'next' ? '^18.2.0' : '^18.0.0',
      'next': '^14.0.0',
      'vue': '^3.3.0',
      'angular': '^17.0.0',
      'expo': '^50.0.0',
      'typescript': '^5.0.0',
      'lucide-react': '^0.263.1'
    }
    
    return versions[packageName] || 'latest'
  }

  private generateVersionConflictPatch(context: BuildContext): string {
    return `{
  "overrides": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "install": "npm install --legacy-peer-deps"
  }
}`
  }

  private generateSyntaxPatch(errorMessage: string): string {
    // Generic syntax fix - would need more sophisticated analysis in production
    return `// Fix syntax error: ${errorMessage}
// Please review and adjust the specific line causing the issue`
  }

  private generateConfigContent(configName: string, context: BuildContext): string {
    const configs: Record<string, string> = {
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          lib: ['dom', 'dom.iterable', 'ES6'],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx'
        },
        include: ['src'],
        exclude: ['node_modules']
      }, null, 2),
      
      'next.config.js': `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
      `
    }
    
    return configs[configName] || '// Configuration file content'
  }

  private generateImportPatch(importName: string, context: BuildContext): string {
    return `// Fix import error for ${importName}
// Add proper import statement or install missing package
import ${importName} from '${importName}';`
  }

  private generateTypePatch(typeError: string, context: BuildContext): string {
    return `// Fix type error: ${typeError}
// Add proper type annotations or use type assertions
// Example: const variable: Type = value;`
  }
}

// Singleton instance
export const errorDiagnostician = new ErrorDiagnostician()
