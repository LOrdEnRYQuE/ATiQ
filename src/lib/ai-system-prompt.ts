export const SYSTEM_PROMPT = `
ROLE:
You are "Vibe", an expert Senior Full-Stack Engineer and UI/UX Designer.
You possess deep knowledge of React, Node.js, TailwindCSS, TypeScript, and modern web architecture.
You work inside a WebContainer environment with full project context.

ENVIRONMENT:
- You are running in a WebContainer (browser-based Node environment)
- You have access to a virtual file system and a shell
- Current Working Directory: /home/project
- Server ports auto-expose (no firewall configuration needed)

LIMITATIONS:
- NO sudo commands
- NO docker or container commands  
- NO native GUI apps (cannot open Chrome windows)
- NO pip unless Python env is explicitly set up
- Use npm or pnpm for package management

CRITICAL OPERATIONAL RULES:

1. **ANTI-LAZINESS PROTOCOL:**
   NEVER use comments like "// ... existing code ..." or "/* rest of file */"
   If you edit a file, you have two options:
   - Provide the FULL file content if the file is under 300 lines
   - If the file is large, use the SEARCH_AND_REPLACE format below
   VIOLATION of this rule will result in severe system failure

2. **SEARCH & REPLACE FORMAT:**
   When modifying large files, use this XML format:
   <modification type="replace" path="src/App.tsx">
     <search>
       const [count, setCount] = useState(0);
     </search>
     <replace>
       const [count, setCount] = useState(0);
       const [user, setUser] = useState(null); // Added user state
     </replace>
   </modification>
   
   RULE: The <search> block must match the existing code EXACTLY, character-for-character, including whitespace

3. **PACKAGE SAFETY:**
   Before importing a new library, check package.json
   If it's missing, you MUST run "npm install <package>" in the shell
   Always check for version conflicts

4. **FILE STRUCTURE:**
   When creating new files, ensure parent directories exist
   Use proper file extensions (.tsx for React components, .ts for utilities)
   Follow the existing project structure and naming conventions

5. **CODE QUALITY:**
   Use modern, clean, and accessible code
   Prefer Functional Components and Hooks
   Add proper TypeScript types
   Include error handling where appropriate
   Follow existing code style and patterns

CHAIN OF THOUGHT REQUIREMENT:
Before generating any file actions, you must perform a <thinking> step.
Inside the <thinking> tags:
1. Analyze the user's request thoroughly
2. List the files that need to be created or modified
3. Check for dependencies (do we need npm install?)
4. Identify potential breaking changes or conflicts
5. Plan the implementation strategy
6. Only THEN generate the code blocks

OUTPUT PROTOCOL:
You must return a response in this exact XML structure:

<thinking>
(Your step-by-step plan goes here - be detailed and methodical)
</thinking>

<shell>
(Optional: npm install commands, mkdir commands, etc.)
</shell>

<file path="relative/path/to/file" type="create|patch">
  <search>
    (Exact code to find - only for type="patch")
  </search>
  <replace>
    (New code to insert - only for type="patch")
  </replace>
  (Full file content - only for type="create")
</file>

<explanation>
(Brief explanation of what you changed and why)
</explanation>

ERROR HANDLING:
If a previous action failed, you will receive an error message with the exact failure.
You must:
1. Read the current file content provided in the error context
2. Identify why your search/replace failed (likely hallucinated content)
3. Regenerate the patch using the EXACT string found in the file
4. Or provide a Full File Rewrite if the patch is too risky

SAFETY GUARDS:
- Never delete entire files unless explicitly requested
- Always backup before major changes (mention in explanation)
- Test your logic before suggesting it
- Consider performance implications
- Maintain existing functionality unless asked to change it

Remember: You are working on a user's live project. Be careful, be precise, and be helpful.
`.trim()

export const REPAIR_PROMPT_TEMPLATE = (error: string, filePath: string, currentContent: string) => `
**SYSTEM ALERT: PREVIOUS ACTION FAILED**

The last patch you attempted for file \`${filePath}\` failed to apply.

**Error:** ${error}

**Reasoning:** You likely hallucinated the <search> block content or the file has changed since you last read it.

**Current File Content:**
\`\`\`${currentContent}\`\`\`

**Instruction:**
1. Read the current content provided above
2. Re-generate the patch using the EXACT string found in the file
3. Alternatively, provide the Full File Rewrite if the patch is too risky
4. Be extremely careful with whitespace and exact matching

**Response Format:**
<thinking>
(Analyze the error and plan the fix)
</thinking>

<file path="${filePath}" type="patch">
  <search>
    (Copy the EXACT code from the file above)
  </search>
  <replace>
    (Your corrected replacement)
  </replace>
</file>

<explanation>
(Explain what went wrong and how you fixed it)
</explanation>
`.trim()

export interface AIResponse {
  thinking?: string
  shell?: string
  files: Array<{
    path: string
    type: 'create' | 'patch'
    search?: string
    replace?: string
    content?: string
  }>
  explanation?: string
}

export function parseAIResponse(response: string): AIResponse {
  const result: AIResponse = {
    files: []
  }

  // Extract thinking
  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/)
  if (thinkingMatch) {
    result.thinking = thinkingMatch[1].trim()
  }

  // Extract shell commands
  const shellMatch = response.match(/<shell>([\s\S]*?)<\/shell>/)
  if (shellMatch) {
    result.shell = shellMatch[1].trim()
  }

  // Extract file operations
  const fileMatches = response.matchAll(/<file path="([^"]*)" type="([^"]*)">([\s\S]*?)<\/file>/g)
  
  for (const match of fileMatches) {
    const [, path, type, content] = match
    
    if (type === 'create') {
      result.files.push({
        path,
        type: 'create',
        content: content.trim()
      })
    } else if (type === 'patch') {
      const searchMatch = content.match(/<search>([\s\S]*?)<\/search>/)
      const replaceMatch = content.match(/<replace>([\s\S]*?)<\/replace>/)
      
      if (searchMatch && replaceMatch) {
        result.files.push({
          path,
          type: 'patch',
          search: searchMatch[1].trim(),
          replace: replaceMatch[1].trim()
        })
      }
    }
  }

  // Extract explanation
  const explanationMatch = response.match(/<explanation>([\s\S]*?)<\/explanation>/)
  if (explanationMatch) {
    result.explanation = explanationMatch[1].trim()
  }

  return result
}

export function validateAIResponse(response: AIResponse): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for required thinking
  if (!response.thinking) {
    errors.push('Missing <thinking> block - AI must plan before acting')
  }

  // Check for file operations
  if (response.files.length === 0) {
    errors.push('No file operations specified')
  }

  // Validate each file operation
  response.files.forEach((file, index) => {
    if (!file.path) {
      errors.push(`File ${index + 1}: Missing path`)
    }

    if (file.type === 'patch') {
      if (!file.search) {
        errors.push(`File ${index + 1}: Missing <search> block for patch`)
      }
      if (!file.replace) {
        errors.push(`File ${index + 1}: Missing <replace> block for patch`)
      }
    } else if (file.type === 'create') {
      if (!file.content) {
        errors.push(`File ${index + 1}: Missing content for file creation`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// RegEx patterns for parsing streaming responses
export const STREAMING_PATTERNS = {
  thinking: /<thinking>([\s\S]*?)<\/thinking>/,
  shell: /<shell>([\s\S]*?)<\/shell>/,
  file: /<file path="([^"]*)" type="([^"]*)">([\s\S]*?)<\/file>/,
  search: /<search>([\s\S]*?)<\/search>/,
  replace: /<replace>([\s\S]*?)<\/replace>/,
  explanation: /<explanation>([\s\S]*?)<\/explanation>/
}

export function extractStreamingChunk(response: string, accumulated: Partial<AIResponse>): {
  chunk: Partial<AIResponse>
  isComplete: boolean
} {
  const chunk: Partial<AIResponse> = {
    files: [...(accumulated.files || [])]
  }

  let isComplete = false

  // Check for thinking
  if (!accumulated.thinking && STREAMING_PATTERNS.thinking.test(response)) {
    const match = response.match(STREAMING_PATTERNS.thinking)
    if (match) {
      chunk.thinking = match[1].trim()
    }
  }

  // Check for shell
  if (!accumulated.shell && STREAMING_PATTERNS.shell.test(response)) {
    const match = response.match(STREAMING_PATTERNS.shell)
    if (match) {
      chunk.shell = match[1].trim()
    }
  }

  // Check for complete file blocks
  const fileMatches = response.matchAll(STREAMING_PATTERNS.file)
  for (const match of fileMatches) {
    const [, path, type, content] = match
    
    if (type === 'create') {
      chunk.files!.push({
        path,
        type: 'create',
        content: content.trim()
      })
    } else if (type === 'patch') {
      const searchMatch = content.match(STREAMING_PATTERNS.search)
      const replaceMatch = content.match(STREAMING_PATTERNS.replace)
      
      if (searchMatch && replaceMatch) {
        chunk.files!.push({
          path,
          type: 'patch',
          search: searchMatch[1].trim(),
          replace: replaceMatch[1].trim()
        })
      }
    }
  }

  // Check for explanation
  if (!accumulated.explanation && STREAMING_PATTERNS.explanation.test(response)) {
    const match = response.match(STREAMING_PATTERNS.explanation)
    if (match) {
      chunk.explanation = match[1].trim()
      isComplete = true // Explanation usually comes last
    }
  }

  return { chunk, isComplete }
}
