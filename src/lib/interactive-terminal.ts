/**
 * Interactive terminal handler for detecting and responding to prompts
 * Prevents hanging processes that wait for user input
 */

export interface TerminalPrompt {
  type: 'yes_no' | 'choice' | 'text' | 'password'
  question: string
  options?: string[]
  defaultResponse?: string
}

export interface TerminalCommand {
  command: string
  args: string[]
  interactive: boolean
  autoResponse?: string
}

/**
 * Detects if a command is likely to be interactive
 */
export function detectInteractiveCommand(command: string): boolean {
  const interactivePatterns = [
    /npm install/i,
    /npm audit fix/i,
    /npm config/i,
    /git init/i,
    /git config/i,
    /python -m pip install/i,
    /pip install/i,
    /docker build/i,
    /docker run/i,
    /ssh/i,
    /sudo/i,
    /read/i,
    /select/i,
    /choose/i,
  ]

  return interactivePatterns.some(pattern => pattern.test(command))
}

/**
 * Detects common interactive prompts and provides auto-responses
 */
export function detectTerminalPrompt(output: string): TerminalPrompt | null {
  const lines = output.split('\n')
  
  // Yes/No prompts
  const yesNoPatterns = [
    /\?\s*\(Y\/n\)/i,
    /\?\s*\(y\/N\)/i,
    /\?\s*\[Y\/n\]/i,
    /\?\s*\[y\/N\]/i,
    /continue\?\s*\[Y\/n\]/i,
    /proceed\?\s*\[Y\/n\]/i,
    /overwrite\?\s*\[Y\/n\]/i,
    /delete\?\s*\[Y\/n\]/i,
    /send anonymous usage data\?/i,
    /allow telemetry\?/i,
  ]

  for (const line of lines) {
    for (const pattern of yesNoPatterns) {
      const match = line.match(pattern)
      if (match) {
        return {
          type: 'yes_no',
          question: line.trim(),
          defaultResponse: 'Y' // Default to yes for most prompts
        }
      }
    }
  }

  // Choice prompts
  const choicePatterns = [
    /\?\s*\(([^)]+)\)/i,
    /select.*\[(\d+(?:,\s*\d+)*)\]/i,
    /choose.*\(([^)]+)\)/i,
  ]

  for (const line of lines) {
    for (const pattern of choicePatterns) {
      const match = line.match(pattern)
      if (match) {
        const options = match[1].split(/[,\/]\s*/).map(opt => opt.trim())
        return {
          type: 'choice',
          question: line.trim(),
          options,
          defaultResponse: options[0] // Default to first option
        }
      }
    }
  }

  // Text input prompts
  const textPatterns = [
    /enter.*name:/i,
    /input.*:/i,
    /please enter:/i,
    /provide.*:/i,
    /specify.*:/i,
  ]

  for (const line of lines) {
    for (const pattern of textPatterns) {
      if (pattern.test(line)) {
        return {
          type: 'text',
          question: line.trim(),
          defaultResponse: '' // Empty default for text input
        }
      }
    }
  }

  return null
}

/**
 * Prepares a command to handle interactive prompts automatically
 */
export function prepareInteractiveCommand(command: string, prompt?: TerminalPrompt): TerminalCommand {
  const isInteractive = detectInteractiveCommand(command)
  
  if (!isInteractive && !prompt) {
    return {
      command,
      args: command.split(' '),
      interactive: false
    }
  }

  // Auto-respond strategies
  let autoResponse: string | undefined

  if (prompt) {
    switch (prompt.type) {
      case 'yes_no':
        autoResponse = prompt.defaultResponse || 'Y'
        break
      case 'choice':
        autoResponse = prompt.defaultResponse || (prompt.options ? prompt.options[0] : '')
        break
      case 'text':
        autoResponse = prompt.defaultResponse || ''
        break
      case 'password':
        autoResponse = prompt.defaultResponse || ''
        break
    }
  } else if (isInteractive) {
    // Default auto-responses for common commands
    if (command.includes('npm install')) {
      autoResponse = 'Y' // Auto-accept npm prompts
    } else if (command.includes('git init')) {
      autoResponse = '' // Accept defaults for git init
    } else if (command.includes('pip install')) {
      autoResponse = 'Y' // Auto-accept pip prompts
    }
  }

  return {
    command,
    args: command.split(' '),
    interactive: true,
    autoResponse
  }
}

/**
 * Enhanced shell command executor with interactive prompt handling
 */
export class InteractiveShellExecutor {
  private pendingPrompts: Map<number, TerminalPrompt> = new Map()
  private commandQueue: TerminalCommand[] = []
  private isExecuting = false

  /**
   * Execute a command with automatic prompt handling
   */
  async executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    const terminalCommand = prepareInteractiveCommand(command)
    
    if (!terminalCommand.interactive) {
      // Execute non-interactive command normally
      return this.executeNonInteractiveCommand(terminalCommand)
    }

    // Execute interactive command with auto-responses
    return this.executeInteractiveCommand(terminalCommand)
  }

  /**
   * Execute non-interactive command
   */
  private async executeNonInteractiveCommand(command: TerminalCommand): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      // This would integrate with your WebContainer shell execution
      // For now, return a mock response
      return {
        success: true,
        output: `Command executed: ${command.command}`
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute interactive command with auto-responses
   */
  private async executeInteractiveCommand(command: TerminalCommand): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      // Execute command with auto-responses
      let output = ''
      
      // Simulate command execution with prompt detection
      const mockOutput = this.simulateCommandOutput(command.command)
      output += mockOutput
      
      // Detect prompts in output
      const prompt = detectTerminalPrompt(output)
      if (prompt && command.autoResponse) {
        output += `\nAuto-responding: ${command.autoResponse}\n`
        // Continue execution with auto-response
        output += this.simulatePromptResponse(prompt, command.autoResponse)
      }

      return {
        success: true,
        output
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Simulate command output (replace with actual WebContainer execution)
   */
  private simulateCommandOutput(command: string): string {
    // Mock common command outputs for demonstration
    if (command.includes('npm install')) {
      return `npm install\n? Do you want to send anonymous usage data? (Y/n)`
    } else if (command.includes('git init')) {
      return `git init\nInitialized empty Git repository in /project/.git/\n? What is your name?`
    } else if (command.includes('pip install')) {
      return `pip install requests\n? Do you want to install the dependencies? [Y/n]`
    }
    
    return `Executing: ${command}\n`
  }

  /**
   * Simulate prompt response (replace with actual terminal interaction)
   */
  private simulatePromptResponse(prompt: TerminalPrompt, response: string): string {
    switch (prompt.type) {
      case 'yes_no':
        return `Response: ${response}\nContinuing...\n`
      case 'choice':
        return `Selected: ${response}\nProcessing...\n`
      case 'text':
        return `Input: ${response}\nAccepted.\n`
      case 'password':
        return `Password entered.\n`
      default:
        return `Response: ${response}\n`
    }
  }

  /**
   * Check if a process is hanging on interactive input
   */
  isProcessHanging(output: string): boolean {
    const prompt = detectTerminalPrompt(output)
    return prompt !== null
  }

  /**
   * Get user input for interactive prompts (fallback when auto-response fails)
   */
  async requestUserInput(prompt: TerminalPrompt): Promise<string> {
    // This would integrate with your UI to show a prompt dialog
    // For now, return the default response
    return prompt.defaultResponse || ''
  }
}
