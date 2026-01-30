import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseAIResponse, validateAIResponse, REPAIR_PROMPT_TEMPLATE } from './ai-system-prompt'
import { getActiveSystemPrompt, getPromptVersion } from './ai-orchestrator-prompt'
import { XmlStreamParser, ParsedBlock, handleFileWrite } from './streaming-parser'
import { logTelemetry } from './telemetry'
import { ProjectBlueprint } from './blueprint'

export interface VirtualFileSystem {
  files: Record<string, string>
  packageJson?: string
  setupCommands?: string[]
}

export interface CodeDiff {
  file: string
  oldContent: string
  newContent: string
  operation: 'create' | 'update' | 'delete'
}

export interface FilePatch {
  type: 'patch' | 'full'
  file: string
  operations: PatchOperation[]
  checksum?: string
  content?: string
}

export interface PatchOperation {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
}

export interface AIContext {
  files: Record<string, string>
  activeFile?: string
  projectStructure: ProjectStructure
  dependencies: Record<string, string>
  framework?: 'react' | 'vue' | 'angular' | 'vanilla' | 'node'
  language?: 'typescript' | 'javascript' | 'python'
}

export interface ProjectStructure {
  type: 'frontend' | 'backend' | 'fullstack' | 'static' | 'mobile'
  framework?: string
  entryPoints: string[]
  assets: string[]
  components: string[]
  pages: string[]
  stackContext?: string
}

export interface AIResponse {
  type: 'project' | 'modification' | 'explanation'
  files?: Record<string, string>
  patches?: FilePatch[]
  explanation?: string
  setupCommands?: string[]
  shellCommands?: string[]
  thinking?: string
}

export interface StreamingCallbacks {
  onThinking?: (content: string) => void
  onShellCommand?: (command: string) => void
  onFileWrite?: (block: ParsedBlock) => void
  onBlockComplete?: (block: ParsedBlock) => void
  onError?: (error: string) => void
}

export class AIOrchestrator {
  private genAI: GoogleGenerativeAI
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  }

  async generateProject(prompt: string): Promise<VirtualFileSystem> {
    const contextPrompt = `${getActiveSystemPrompt()}

USER REQUEST: ${prompt}

PROJECT CONTEXT:
- Type: New project generation
- Files to create: Determine based on request
- Framework: Auto-detect from request

Please generate a complete, working web application following the OUTPUT PROTOCOL above.`
    
    try {
      const result = await this.model.generateContent(contextPrompt)
      const response = await result.response
      const text = response.text()
      void logTelemetry({
        type: "PROMPT_USED",
        model: "gemini-2.5-pro",
        prompt_version: getPromptVersion() ?? undefined,
        metadata: { action: "generateProject" }
      })
      return this.parseProjectResponse(text)
    } catch (error) {
      console.error('AI generation error:', error)
      throw new Error('Failed to generate project')
    }
  }

  async modifyCode(context: AIContext, prompt: string): Promise<FilePatch[]> {
    const contextPrompt = `${getActiveSystemPrompt()}

USER REQUEST: ${prompt}

PROJECT CONTEXT:
- Type: Code modification
- Framework: ${context.framework || 'Unknown'}
- Project Structure: ${JSON.stringify(context.projectStructure, null, 2)}
- Dependencies: ${Object.keys(context.dependencies).join(', ')}
- Active File: ${context.activeFile || 'None'}

FILES IN PROJECT:
${Object.keys(context.files).join('\n')}

${context.activeFile ? `CURRENTLY ACTIVE FILE: ${context.activeFile}\nCONTENT:\n${'``'}\n${context.files[context.activeFile]}\n${'```'}` : ''}

Please analyze the request and generate precise modifications using the SEARCH_AND_REPLACE format. Follow the OUTPUT PROTOCOL above.`
    
    try {
      const result = await this.model.generateContent(contextPrompt)
      const response = await result.response
      const text = response.text()
      void logTelemetry({
        type: "PROMPT_USED",
        model: "gemini-2.5-pro",
        prompt_version: getPromptVersion() ?? undefined,
        metadata: { action: "modifyCode", activeFile: context.activeFile }
      })
      return this.parseModificationResponse(text, context.files)
    } catch (error) {
      console.error('AI modification error:', error)
      throw new Error('Failed to modify code')
    }
  }

  async generateExplanation(context: AIContext, code: string): Promise<string> {
    const prompt = `Explain this code in the context of the project:

Project Context:
- Type: ${context.projectStructure.type}
- Framework: ${context.projectStructure.framework || 'Unknown'}
- Files: ${Object.keys(context.files).join(', ')}

Code to explain:
\`\`\`
${code}
\`\`\

Provide a clear, concise explanation of what this code does and how it fits into the project.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('AI explanation error:', error)
      throw new Error('Failed to generate explanation')
    }
  }

  // NEW STREAMING METHODS
  async generateProjectStreaming(prompt: string, callbacks: StreamingCallbacks): Promise<VirtualFileSystem> {
    const contextPrompt = `${getActiveSystemPrompt()}

USER REQUEST: ${prompt}

PROJECT CONTEXT:
- Type: New project generation
- Files to create: Determine based on request
- Framework: Auto-detect from request

Please generate a complete, working web application following the OUTPUT PROTOCOL above.`
    
    const parser = new XmlStreamParser()
    const files: Record<string, string> = {}
    const shellCommands: string[] = []
    
    try {
      const result = await this.model.generateContentStream(contextPrompt)
      
      for await (const chunk of result.stream) {
        const text = chunk.text()
        const blocks = parser.parse(text)
        
        for (const block of blocks) {
          await this.processStreamingBlock(block, files, shellCommands, callbacks)
        }
      }
      
      void logTelemetry({
        type: "PROMPT_USED",
        model: "gemini-2.5-pro",
        prompt_version: getPromptVersion() ?? undefined,
        metadata: { action: "generateProjectStreaming" }
      })
      
      return {
        files,
        setupCommands: shellCommands.length > 0 ? shellCommands : ['npm install', 'npm run dev']
      }
    } catch (error) {
      console.error('AI generation error:', error)
      callbacks.onError?.(error instanceof Error ? error.message : 'Failed to generate project')
      throw new Error('Failed to generate project')
    }
  }

  async modifyCodeStreaming(context: AIContext, prompt: string, callbacks: StreamingCallbacks): Promise<FilePatch[]> {
    const contextPrompt = `${getActiveSystemPrompt()}

USER REQUEST: ${prompt}

PROJECT CONTEXT:
- Type: Code modification
- Framework: ${context.framework || 'Unknown'}
- Project Structure: ${JSON.stringify(context.projectStructure, null, 2)}
- Dependencies: ${Object.keys(context.dependencies).join(', ')}
- Active File: ${context.activeFile || 'None'}

FILES IN PROJECT:
${Object.keys(context.files).join('\n')}

${context.activeFile ? `CURRENTLY ACTIVE FILE: ${context.activeFile}\nCONTENT:\n${'``'}\n${context.files[context.activeFile]}\n${'```'}` : ''}

Please analyze the request and generate precise modifications using the SEARCH_AND_REPLACE format. Follow the OUTPUT PROTOCOL above.`
    
    const parser = new XmlStreamParser()
    const patches: FilePatch[] = []
    
    try {
      const result = await this.model.generateContentStream(contextPrompt)
      
      for await (const chunk of result.stream) {
        const text = chunk.text()
        const blocks = parser.parse(text)
        
        for (const block of blocks) {
          const patch = await this.processStreamingBlock(block, context.files, [], callbacks)
          if (patch) {
            patches.push(patch)
          }
        }
      }
      
      return patches
    } catch (error) {
      console.error('AI modification error:', error)
      callbacks.onError?.(error instanceof Error ? error.message : 'Failed to modify code')
      throw new Error('Failed to modify code')
    }
  }

  private async processStreamingBlock(
    block: ParsedBlock, 
    currentFiles: Record<string, string>,
    shellCommands: string[],
    callbacks: StreamingCallbacks
  ): Promise<FilePatch | null> {
    // Notify about the block
    callbacks.onFileWrite?.(block)
    
    switch (block.type) {
      case 'thinking':
        if (block.isComplete) {
          callbacks.onThinking?.(block.content)
        }
        break
        
      case 'shell':
        if (block.isComplete) {
          callbacks.onShellCommand?.(block.content)
          shellCommands.push(block.content)
        }
        break
        
      case 'file':
        if (block.isComplete && block.attributes) {
          callbacks.onBlockComplete?.(block)
          
          if (block.attributes.type === 'create' && block.content) {
            currentFiles[block.attributes.path] = block.content
          } else if (block.attributes.type === 'patch') {
            const patch = XmlStreamParser.parsePatch(block.content)
            if (patch) {
              return {
                type: 'patch',
                file: block.attributes.path,
                operations: [{
                  type: 'replace',
                  position: 0,
                  length: patch.search.length,
                  content: patch.replace
                }]
              }
            }
          }
        }
        break
    }
    
    return null
  }

  private parseProjectResponse(response: string): VirtualFileSystem {
    try {
      // Try to parse using the new XML format first
      const aiResponse = parseAIResponse(response)
      const validation = validateAIResponse(aiResponse)
      
      if (validation.isValid && aiResponse.files.length > 0) {
        const files: Record<string, string> = {}
        const shellCommands: string[] = []
        
        // Process file operations
        aiResponse.files.forEach(file => {
          if (file.type === 'create' && file.content) {
            files[file.path] = file.content
          }
        })
        
        // Process shell commands
        if (aiResponse.shell) {
          shellCommands.push(aiResponse.shell)
        }
        
        return {
          files,
          setupCommands: shellCommands.length > 0 ? shellCommands : ['npm install', 'npm run dev']
        }
      }
      
      // Fallback to old JSON parsing
      return this.parseProjectResponseLegacy(response)
    } catch (error) {
      console.error('Failed to parse project response:', error)
      return this.parseProjectResponseLegacy(response)
    }
  }

  private parseProjectResponseLegacy(response: string): VirtualFileSystem {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.type !== 'project' || !parsed.files) {
        throw new Error('Invalid project response format')
      }
      
      return {
        files: parsed.files,
        packageJson: parsed.packageJson,
        setupCommands: parsed.setupCommands
      }
    } catch (error) {
      console.error('Failed to parse project response:', error)
      // Fallback: try to extract files manually
      return this.extractFilesManually(response)
    }
  }

  private parseModificationResponse(response: string, currentFiles: Record<string, string>): FilePatch[] {
    try {
      // Try to parse using the new XML format first
      const aiResponse = parseAIResponse(response)
      const validation = validateAIResponse(aiResponse)
      
      if (validation.isValid && aiResponse.files.length > 0) {
        const patches: FilePatch[] = []
        
        // Process file operations
        aiResponse.files.forEach(file => {
          if (file.type === 'patch' && file.search && file.replace) {
            patches.push({
              type: 'patch',
              file: file.path,
              operations: [{
                type: 'replace',
                position: 0, // Will be calculated by diff engine
                length: file.search.length,
                content: file.replace
              }]
            })
          } else if (file.type === 'create' && file.content) {
            patches.push({
              type: 'full',
              file: file.path,
              operations: [],
              content: file.content
            })
          }
        })
        
        return patches
      }
      
      // Fallback to old JSON parsing
      return this.parseModificationResponseLegacy(response, currentFiles)
    } catch (error) {
      console.error('Failed to parse modification response:', error)
      return this.parseModificationResponseLegacy(response, currentFiles)
    }
  }

  private parseModificationResponseLegacy(response: string, currentFiles: Record<string, string>): FilePatch[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.type !== 'modification' || !parsed.patches) {
        throw new Error('Invalid modification response format')
      }
      
      return parsed.patches
    } catch (error) {
      console.error('Failed to parse modification response:', error)
      // Fallback: generate full file updates
      return this.generateFullFileUpdates(response, currentFiles)
    }
  }

  async repairFailedPatch(error: string, filePath: string, currentContent: string): Promise<FilePatch[]> {
    const repairPrompt = REPAIR_PROMPT_TEMPLATE(error, filePath, currentContent)
    
    try {
      const result = await this.model.generateContent(repairPrompt)
      const response = await result.response
      const text = response.text()
      
      return this.parseModificationResponse(text, { [filePath]: currentContent })
    } catch (repairError) {
      console.error('Failed to repair patch:', repairError)
      throw new Error(`Failed to repair patch: ${repairError instanceof Error ? repairError.message : 'Unknown error'}`)
    }
  }

  private extractFilesManually(response: string): VirtualFileSystem {
    const files: Record<string, string> = {}
    
    // Try to extract code blocks
    const codeBlocks = response.match(/```[\s\S]*?```/g) || []
    
    codeBlocks.forEach((block, index) => {
      const content = block.replace(/```\w*\n?/, '').replace(/```$/, '')
      const filename = this.extractFilenameFromBlock(block, index)
      files[filename] = content
    })
    
    // Generate a basic package.json if none exists
    if (!files['package.json']) {
      files['package.json'] = this.generateBasicPackageJson()
    }
    
    return {
      files,
      packageJson: files['package.json'],
      setupCommands: ['npm install', 'npm run dev']
    }
  }

  private extractFilenameFromBlock(block: string, index: number): string {
    // Try to extract filename from code block language
    const match = block.match(/```(\w+):?([\w\-./]+)?/)
    if (match) {
      const [, language, filename] = match
      if (filename) return filename
      
      // Generate filename based on language
      const extensions: Record<string, string> = {
        javascript: 'js',
        typescript: 'ts',
        html: 'html',
        css: 'css',
        json: 'json'
      }
      
      const ext = extensions[language] || 'txt'
      return `file${index + 1}.${ext}`
    }
    
    return `file${index + 1}.txt`
  }

  private generateBasicPackageJson(): string {
    return JSON.stringify({
      name: 'vibe-coding-project',
      version: '0.1.0',
      type: 'module',
      scripts: {
        'dev': 'npx serve . -l 3000',
        'build': 'echo "Build complete"'
      },
      dependencies: {
        'serve': '^14.2.1'
      }
    }, null, 2)
  }

  private generateFullFileUpdates(response: string, currentFiles: Record<string, string>): FilePatch[] {
    // Fallback: treat the entire response as a replacement for the active file
    const patches: FilePatch[] = []
    
    // Extract code blocks and create full file replacements
    const codeBlocks = response.match(/```[\s\S]*?```/g) || []
    
    codeBlocks.forEach((block) => {
      const content = block.replace(/```\w*\n?/, '').replace(/```$/, '')
      const filename = this.extractFilenameFromBlock(block, 0)
      
      if (currentFiles[filename]) {
        patches.push({
          type: 'full',
          file: filename,
          operations: [],
          content
        })
      }
    })
    
    return patches
  }
}

// Utility functions for context analysis
export function analyzeProjectStructure(files: Record<string, string>): ProjectStructure {
  const fileNames = Object.keys(files)
  const hasPackageJson = fileNames.includes('package.json')
  const hasIndexHtml = fileNames.some(f => f.includes('index.html'))
  const hasAppJs = fileNames.some(f => f.includes('app.') || f.includes('main.'))
  const hasReact = fileNames.some(f => f.includes('react') || f.includes('jsx') || f.includes('tsx'))
  const hasVue = fileNames.some(f => f.includes('vue'))
  const hasAngular = fileNames.some(f => f.includes('angular') || f.includes('component.ts'))
  
  let type: ProjectStructure['type'] = 'static'
  let framework: string | undefined
  
  if (hasReact) {
    type = 'frontend'
    framework = 'react'
  } else if (hasVue) {
    type = 'frontend'
    framework = 'vue'
  } else if (hasAngular) {
    type = 'frontend'
    framework = 'angular'
  } else if (hasPackageJson && hasAppJs) {
    type = 'backend'
  } else if (hasIndexHtml) {
    type = 'static'
  } else {
    type = 'fullstack'
  }
  
  const entryPoints = fileNames.filter(f => 
    f.includes('index.') || f.includes('main.') || f.includes('app.')
  )
  
  const assets = fileNames.filter(f => 
    f.includes('assets/') || f.includes('images/') || f.includes('styles/')
  )
  
  const components = fileNames.filter(f => 
    f.includes('components/') || f.includes('.jsx') || f.includes('.tsx')
  )
  
  const pages = fileNames.filter(f => 
    f.includes('pages/') || f.includes('views/') || f.includes('routes/')
  )
  
  return {
    type,
    framework,
    entryPoints,
    assets,
    components,
    pages
  }
}

export function extractDependencies(files: Record<string, string>): Record<string, string> {
  const packageJson = files['package.json']
  if (!packageJson) return {}
  
  try {
    const parsed = JSON.parse(packageJson)
    return {
      ...parsed.dependencies,
      ...parsed.devDependencies
    }
  } catch {
    return {}
  }
}

export function createAIContext(files: Record<string, string>, activeFile?: string): AIContext {
  // 🕵️ Detect DNA from .vibe.json
  let stackContext = "Standard React/Vite project."
  
  if (files['.vibe.json']) {
    try {
      const dna = JSON.parse(files['.vibe.json'])
      if (dna.framework === 'nextjs') {
        stackContext = "Next.js 14 App Router. Use 'src/app'. Server Components by default."
      } else if (dna.framework === 'electron') {
        stackContext = "Electron + Vite. Main process in 'electron/', Renderer in 'src/'."
      } else if (dna.type === 'mobile_app') {
        stackContext = "Expo React Native. Use 'app/' directory for routing."
      }
    } catch { /* ignore */ }
  }

  const projectStructure = analyzeProjectStructure(files)
  
  return {
    files,
    activeFile,
    projectStructure: {
      ...projectStructure,
      type: projectStructure.type || 'web_app',
      stackContext
    },
    dependencies: extractDependencies(files),
    framework: analyzeProjectStructure(files).framework as 'react' | 'vue' | 'angular' | 'vanilla' | 'node' | undefined,
    language: detectLanguage(files)
  }
}

export async function generateGenesisProject(
  blueprint: ProjectBlueprint, 
  onChunk: (chunk: string) => void
): Promise<void> {

  // 1. Define Stack-Specific Rules
  let stackRules = ""
  
  switch (blueprint.framework) {
    case 'nextjs':
      stackRules = `
        - **Framework**: Next.js 14 (App Router).
        - **Structure**: Use 'src/app/page.tsx', 'src/app/layout.tsx'.
        - **Config**: 'next.config.mjs'.
        - **Routing**: Use server components by default, 'use client' for interactivity.
      `
      break
    
    case 'electron':
      stackRules = `
        - **Framework**: Electron + Vite + React.
        - **Structure**: 'electron/main.ts' (Main Process), 'src/App.tsx' (Renderer).
        - **Config**: 'vite.config.ts' (configured for renderer), 'package.json' with "main": "dist-electron/main.js".
        - **Note**: Since we are in a browser, ensure the React renderer works standalone for preview.
      `
      break

    case 'react':
    case 'vue': // Fallback for standard SPA
    default:
      stackRules = `
        - **Framework**: Vite + ${blueprint.framework === 'vue' ? 'Vue' : 'React'}.
        - **Structure**: 'src/main.tsx', 'index.html' in root.
        - **Config**: 'vite.config.ts'.
      `
      break
  }

  // 2. Handle Mobile specificities
  if (blueprint.type === 'mobile_app') {
    stackRules = `
      - **Framework**: Expo (React Native).
      - **Structure**: 'app/index.tsx', 'app/_layout.tsx' (Expo Router).
      - **Styling**: Use 'nativewind' (Tailwind for RN) or 'StyleSheet'.
      - **Important**: Ensure code is web-compatible ('react-native-web') for the preview.
    `
  }

  const GENESIS_PROMPT = `
    ROLE: You are an Elite Solution Architect.
    
    PROJECT GOAL:
    Build a "${blueprint.description}"
    Type: ${blueprint.type}
    Stack: ${blueprint.framework}
    Features: ${blueprint.features.join(', ')}

    TECHNICAL ARCHITECTURE RULES:
    ${stackRules}

    CRITICAL EXECUTION RULES:
    1. **NO PLACEHOLDERS**: Write real, working code.
    2. **REALISTIC DATA**: Populate dashboards with mock data.
    3. **COMPLETE STYLING**: Use ${blueprint.styling} (e.g. Tailwind classes).
    4. **COMPLETE FILES**: Generate ALL necessary config files (package.json, tsconfig.json, etc.).
    5. **METADATA**: Generate a file named '.vibe.json' in the root.
       Content: {
         "type": "${blueprint.type}",
         "framework": "${blueprint.framework}",
         "styling": "${blueprint.styling}",
         "features": ${JSON.stringify(blueprint.features)}
       }
       This file is critical for the AI to understand the project structure later.

    TASK:
    Generate the COMPLETE file system as a stream of XML blocks (<file path="...">...</file>).
    Start immediately.
  `

  // Reuse existing streaming generation logic
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
  
  const result = await model.generateContentStream(GENESIS_PROMPT)
  
  for await (const chunk of result.stream) {
    const text = chunk.text()
    onChunk(text)
  }
}

function detectLanguage(files: Record<string, string>): 'typescript' | 'javascript' | 'python' | undefined {
  const fileNames = Object.keys(files)
  
  if (fileNames.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    return 'typescript'
  } else if (fileNames.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
    return 'javascript'
  } else if (fileNames.some(f => f.endsWith('.py'))) {
    return 'python'
  }
  
  return undefined
}
