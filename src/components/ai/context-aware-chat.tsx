'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Code, FileText, Folder, Zap, AlertCircle } from 'lucide-react'
import { AIOrchestrator, createAIContext, AIContext, FilePatch, StreamingCallbacks } from '@/lib/ai-orchestrator'
import { diffEngine } from '@/lib/diff-engine'
import { XmlStreamParser } from '@/lib/streaming-parser'
import { useStreamParser, StreamingStatus, ThinkingDisplay } from '@/components/ui/streaming-components'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  patches?: FilePatch[]
  explanation?: string
  thinking?: string
}

interface ContextAwareAIChatProps {
  files: Record<string, string>
  activeFile?: string
  onCodeGenerated?: (patches: FilePatch[]) => void
  onFileUpdate?: (file: string, content: string) => void
}

export default function ContextAwareAIChat({ 
  files, 
  activeFile, 
  onCodeGenerated, 
  onFileUpdate 
}: ContextAwareAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<AIContext | null>(null)
  const [orchestrator, setOrchestrator] = useState<AIOrchestrator | null>(null)
  const { streamState, processChunk, reset: resetStreamParser } = useStreamParser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize AI orchestrator and context
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey === 'your_new_api_key_here') {
      // Don't initialize orchestrator if no valid API key
      setOrchestrator(null)
      return
    }

    try {
      const aiOrchestrator = new AIOrchestrator(apiKey)
      setOrchestrator(aiOrchestrator)
    } catch (error) {
      console.error('Failed to initialize AI orchestrator:', error)
      setOrchestrator(null)
    }

    const aiContext = createAIContext(files, activeFile)
    setContext(aiContext)
  }, [files, activeFile])

  // Add welcome message when context is ready
  useEffect(() => {
    if (!context || messages.length > 0) return

    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `I'm ready to help you with your ${context.projectStructure.type} project${context.projectStructure.framework ? ` built with ${context.projectStructure.framework}` : ''}!

${context.projectStructure.stackContext ? `\nArchitecture: ${context.projectStructure.stackContext}` : ''}

I can see you have ${Object.keys(files).length} files in your project. I have full context of your codebase and can help you:

• **Generate new features** - Just describe what you want to build
• **Modify existing code** - Ask me to change specific files or functionality  
• **Debug issues** - Describe the problem and I'll help fix it
• **Add dependencies** - Tell me what packages you need
• **Refactor code** - Ask me to improve or optimize existing code

What would you like to work on?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [context, messages.length, files])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !orchestrator || !context) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    resetStreamParser()

    try {
      // Determine if this is a new project generation or modification
      const isProjectGeneration = Object.keys(files).length === 0 || 
        input.toLowerCase().includes('create') || 
        input.toLowerCase().includes('build') || 
        input.toLowerCase().includes('generate')

      let response: Message

      if (isProjectGeneration) {
        // Use streaming for project generation
        const callbacks: StreamingCallbacks = {
          onThinking: (content) => {
            // Show thinking in real-time
          },
          onShellCommand: (command) => {
            // Show shell command being executed
          },
          onFileWrite: (block) => {
            // Show file being written
          },
          onBlockComplete: (block) => {
            // Apply completed file operations
            if (block.attributes?.path && block.content && onFileUpdate) {
              const path = block.attributes.path
              onFileUpdate(path, block.content)
            }
          },
          onError: (error) => {
            console.error('Streaming error:', error)
          }
        }

        const project = await orchestrator.generateProjectStreaming(input.trim(), callbacks)
        
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've created a complete project for you! Here's what I built:\n\n${project.setupCommands?.join(', ') || 'npm install && npm run dev'}\n\n**Files created:** ${Object.keys(project.files).length}`,
          timestamp: new Date(),
          thinking: 'Analyzed request and generated complete project structure'
        }

      } else {
        // Use streaming for code modification
        const callbacks: StreamingCallbacks = {
          onThinking: (content) => {
            // Show thinking in real-time
          },
          onFileWrite: (block) => {
            // Show file being modified
          },
          onBlockComplete: (block) => {
            // Apply completed patch operations
            if (block.attributes?.type === 'patch' && onFileUpdate) {
              const currentContent = files[block.attributes.path] || ''
              try {
                const patch = XmlStreamParser.parsePatch(block.content)
                if (patch && currentContent.includes(patch.search)) {
                  const newContent = currentContent.replace(patch.search, patch.replace)
                  onFileUpdate(block.attributes.path, newContent)
                }
              } catch (error) {
                console.error('Failed to parse patch:', error)
              }
            }
          },
          onError: (error) => {
            console.error('Streaming error:', error)
          }
        }

        const patches = await orchestrator.modifyCodeStreaming(context, input.trim(), callbacks)
        
        // Generate explanation
        const explanation = await orchestrator.generateExplanation(context, input.trim())

        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: explanation,
          patches,
          explanation,
          thinking: 'Analyzed code changes and generated explanation',
          timestamp: new Date()
        }

        // Notify parent component about patches
        if (onCodeGenerated && patches.length > 0) {
          onCodeGenerated(patches)
        }
      }

      setMessages(prev => [...prev, response])

    } catch (error: unknown) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getContextSummary = () => {
    if (!context) return null

    return (
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Folder className="h-3 w-3" />
            <span>{context.projectStructure.type}</span>
          </div>
          {context.framework && (
            <div className="flex items-center space-x-1">
              <Code className="h-3 w-3" />
              <span>{context.framework}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>{Object.keys(context.files).length} files</span>
          </div>
          {Object.keys(context.dependencies).length > 0 && (
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>{Object.keys(context.dependencies).length} deps</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-100'
          }`}
        >
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          
          {message.thinking && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Thinking Process:</div>
              <div className="text-xs text-gray-600 font-mono bg-gray-800 p-2 rounded">
                {message.thinking}
              </div>
            </div>
          )}
          
          {message.patches && message.patches.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Files modified:</div>
              <div className="space-y-1">
                {message.patches.map((patch, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <Code className="h-3 w-3 text-blue-400" />
                    <span className="text-gray-300">{patch.file}</span>
                    <span className="text-gray-500">
                      ({patch.operations.length} operations)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    )
  }

  if (!orchestrator) {
    // Don't show API key errors to users - just render a simple chat UI
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="text-center text-gray-400 mt-8">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start a conversation to begin coding with AI</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 p-4">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
              rows={3}
              disabled
            />
            <button
              className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg"
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {getContextSummary()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Show streaming status */}
        <StreamingStatus streamState={streamState} />
        
        {/* Show thinking process */}
        <ThinkingDisplay thinking={streamState.thinking} />

        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start a conversation to begin coding with AI</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              context 
                ? `Ask me to modify your ${context.projectStructure.type} project...`
                : "Describe what you want to build..."
            }
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{streamState.status === 'thinking' ? 'Thinking...' : 'Processing'}</span>
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="text-sm">Send</span>
          </button>
        </div>
        
        {/* Quick Actions */}
        {context && Object.keys(files).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setInput("Add error handling to the application")}
              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Add Error Handling
            </button>
            <button
              onClick={() => setInput("Optimize the performance")}
              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Optimize Performance
            </button>
            <button
              onClick={() => setInput("Add tests for the current functionality")}
              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Add Tests
            </button>
            <button
              onClick={() => setInput("Improve the UI/UX design")}
              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Improve UI/UX
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
