export type BlockType = 'thinking' | 'shell' | 'file'

export interface ParsedBlock {
  type: BlockType
  content: string
  attributes?: Record<string, string>
  isComplete: boolean // False if we are currently streaming this block
}

export interface StreamState {
  status: 'idle' | 'thinking' | 'shell' | 'writing' | 'complete'
  currentFile?: string
  thinking?: string
  shellCommand?: string
  blocks: ParsedBlock[]
}

export class XmlStreamParser {
  private buffer: string = ''
  private lastProcessedIndex: number = 0
  
  // Regex patterns for the top-level tags
  // Note: We use [\s\S]*? for non-greedy multiline matching
  private patterns = {
    thinking: /<thinking>([\s\S]*?)(?:<\/thinking>|$)/,
    shell: /<shell>([\s\S]*?)(?:<\/shell>|$)/,
    file: /<file\s+path="([^"]+)"\s+type="([^"]+)">([\s\S]*?)(?:<\/file>|$)/
  }

  /**
   * Appends a new chunk from the LLM and returns any detected blocks
   */
  parse(chunk: string): ParsedBlock[] {
    this.buffer += chunk
    const blocks: ParsedBlock[] = []

    // 1. Check for <thinking>
    const thinkingMatch = this.buffer.match(this.patterns.thinking)
    if (thinkingMatch) {
      blocks.push({
        type: 'thinking',
        content: thinkingMatch[1],
        isComplete: this.buffer.includes('</thinking>')
      })
    }

    // 2. Check for <shell>
    const shellMatch = this.buffer.match(this.patterns.shell)
    if (shellMatch) {
      blocks.push({
        type: 'shell',
        content: shellMatch[1].trim(),
        isComplete: this.buffer.includes('</shell>')
      })
    }

    // 3. Check for <file>
    // We use matchAll because there might be multiple files in one stream
    const fileMatches = this.buffer.matchAll(/<file\s+path="([^"]+)"\s+type="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g)
    
    for (const match of fileMatches) {
      blocks.push({
        type: 'file',
        attributes: {
          path: match[1],
          type: match[2]
        },
        content: match[3],
        isComplete: match[0].includes('</file>')
      })
    }

    return blocks
  }

  /**
   * Special parser just for the Search/Replace blocks inside a file content
   */
  static parsePatch(fileContent: string): { search: string; replace: string } | null {
    const searchMatch = fileContent.match(/<search>([\s\S]*?)<\/search>/)
    const replaceMatch = fileContent.match(/<replace>([\s\S]*?)<\/replace>/)
    
    if (!searchMatch || !replaceMatch) return null
    
    return {
      search: searchMatch[1], // Note: Don't trim() here! Whitespace matters.
      replace: replaceMatch[1]
    }
  }

  /**
   * Reset the parser for a new stream
   */
  reset(): void {
    this.buffer = ''
    this.lastProcessedIndex = 0
  }

  /**
   * Get the current buffer content (for debugging)
   */
  getBuffer(): string {
    return this.buffer
  }

  /**
   * Check if we have any incomplete blocks that are still streaming
   */
  hasIncompleteBlocks(): boolean {
    return (
      (this.buffer.includes('<thinking>') && !this.buffer.includes('</thinking>')) ||
      (this.buffer.includes('<shell>') && !this.buffer.includes('</shell>')) ||
      (this.buffer.includes('<file>') && !this.buffer.includes('</file>'))
    )
  }

  /**
   * Extract incomplete thinking content (for real-time display)
   */
  getIncompleteThinking(): string | null {
    const thinkingStart = this.buffer.indexOf('<thinking>')
    const thinkingEnd = this.buffer.indexOf('</thinking>')
    
    if (thinkingStart !== -1 && thinkingEnd === -1) {
      const content = this.buffer.slice(thinkingStart + '<thinking>'.length)
      return content.trim()
    }
    
    return null
  }

  /**
   * Extract incomplete shell command (for real-time display)
   */
  getIncompleteShell(): string | null {
    const shellStart = this.buffer.indexOf('<shell>')
    const shellEnd = this.buffer.indexOf('</shell>')
    
    if (shellStart !== -1 && shellEnd === -1) {
      const content = this.buffer.slice(shellStart + '<shell>'.length)
      return content.trim()
    }
    
    return null
  }

  /**
   * Extract incomplete file being written (for real-time display)
   */
  getIncompleteFile(): { path: string; type: string; content: string } | null {
    const fileStart = this.buffer.lastIndexOf('<file')
    const fileEnd = this.buffer.indexOf('</file>', fileStart)
    
    if (fileStart !== -1 && fileEnd === -1) {
      const partialContent = this.buffer.slice(fileStart)
      const pathMatch = partialContent.match(/path="([^"]+)"/)
      const typeMatch = partialContent.match(/type="([^"]+)"/)
      const contentMatch = partialContent.match(/>([\s\S]*)$/)
      
      if (pathMatch && typeMatch) {
        return {
          path: pathMatch[1],
          type: typeMatch[1],
          content: contentMatch ? contentMatch[1] : ''
        }
      }
    }
    
    return null
  }
}

/**
 * Utility function to handle file writes from parsed blocks (with fuzzy patching)
 */
export async function handleFileWrite(
  block: ParsedBlock,
  currentFiles: Record<string, string>,
  onFileUpdate: (path: string, content: string) => void,
  onRepairNeeded?: (path: string, error: string, currentContent: string) => void
): Promise<void> {
  // Import fuzzy patcher dynamically to avoid circular dependencies
  const { handleFileWriteWithFuzzyPatch } = await import('./fuzzy-patcher')
  
  // Convert ParsedBlock to the expected format
  const convertedBlock = {
    type: block.type,
    attributes: block.attributes ? {
      path: block.attributes.path,
      type: block.attributes.type
    } : undefined,
    content: block.content,
    isComplete: block.isComplete
  }
  
  return handleFileWriteWithFuzzyPatch(convertedBlock, currentFiles, onFileUpdate, onRepairNeeded)
}
