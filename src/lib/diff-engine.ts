import { FilePatch, PatchOperation } from './ai-orchestrator'

export interface DiffResult {
  operations: PatchOperation[]
  similarity: number
  changes: number
}

export interface TextDiff {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
}

export class DiffEngine {
  /**
   * Generate a minimal patch between two versions of content
   */
  generatePatch(oldContent: string, newContent: string): FilePatch {
    if (oldContent === newContent) {
      return {
        type: 'patch',
        file: '',
        operations: []
      }
    }

    // For very small files or large changes, use full replacement
    if (oldContent.length < 100 || newContent.length < 100) {
      const similarity = this.calculateSimilarity(oldContent, newContent)
      if (similarity < 0.3) {
        return {
          type: 'full',
          file: '',
          operations: [],
          content: newContent
        }
      }
    }

    const operations = this.createDiffOperations(oldContent, newContent)
    const checksum = this.generateChecksum(newContent)

    return {
      type: 'patch',
      file: '',
      operations,
      checksum
    }
  }

  /**
   * Apply a patch to content
   */
  applyPatch(content: string, patch: FilePatch): string {
    if (patch.type === 'full') {
      return patch.content || content
    }

    return patch.operations.reduce((currentContent, operation) => {
      return this.applyOperation(currentContent, operation)
    }, content)
  }

  /**
   * Verify if a patch was applied correctly
   */
  verifyPatch(originalContent: string, patch: FilePatch, expectedContent: string): boolean {
    const result = this.applyPatch(originalContent, patch)
    return result === expectedContent
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    )

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Create diff operations using a simple line-based approach
   */
  private createDiffOperations(oldContent: string, newContent: string): PatchOperation[] {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    
    const operations: PatchOperation[] = []
    let oldIndex = 0
    let newIndex = 0

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Insert remaining new lines
        operations.push({
          type: 'insert',
          position: this.getAbsolutePosition(oldContent, oldLines.length, newIndex),
          content: newLines.slice(newIndex).join('\n') + '\n'
        })
        break
      }

      if (newIndex >= newLines.length) {
        // Delete remaining old lines
        const deletePosition = this.getAbsolutePosition(oldContent, oldIndex, 0)
        const deleteLength = oldContent.length - deletePosition
        operations.push({
          type: 'delete',
          position: deletePosition,
          length: deleteLength
        })
        break
      }

      const oldLine = oldLines[oldIndex]
      const newLine = newLines[newIndex]

      if (oldLine === newLine) {
        oldIndex++
        newIndex++
      } else {
        // Try to find the next matching line
        const matchResult = this.findNextMatch(oldLines, newLines, oldIndex, newIndex)
        
        if (matchResult.found) {
          // Handle the difference between current positions and next match
          const oldDiff = matchResult.oldIndex - oldIndex
          const newDiff = matchResult.newIndex - newIndex

          if (oldDiff > 0 && newDiff > 0) {
            // Replace lines
            const position = this.getAbsolutePosition(oldContent, oldIndex, 0)
            const oldLength = this.getSectionLength(oldContent, oldIndex, matchResult.oldIndex)
            const replacementContent = newLines.slice(newIndex, matchResult.newIndex).join('\n') + '\n'
            
            operations.push({
              type: 'replace',
              position,
              length: oldLength,
              content: replacementContent
            })
          } else if (oldDiff > 0) {
            // Delete old lines
            const position = this.getAbsolutePosition(oldContent, oldIndex, 0)
            const length = this.getSectionLength(oldContent, oldIndex, matchResult.oldIndex)
            operations.push({
              type: 'delete',
              position,
              length
            })
          } else if (newDiff > 0) {
            // Insert new lines
            const position = this.getAbsolutePosition(oldContent, oldIndex, 0)
            operations.push({
              type: 'insert',
              position,
              content: newLines.slice(newIndex, matchResult.newIndex).join('\n')
            })
          }

          oldIndex = matchResult.oldIndex
          newIndex = matchResult.newIndex
        } else {
          // No more matches found, handle remaining content
          if (oldIndex < oldLines.length && newIndex < newLines.length) {
            const position = this.getAbsolutePosition(oldContent, oldIndex, 0)
            const oldLength = this.getSectionLength(oldContent, oldIndex, oldLines.length)
            operations.push({
              type: 'replace',
              position,
              length: oldLength,
              content: newLines.slice(newIndex).join('\n')
            })
          }
          break
        }
      }
    }

    return this.optimizeOperations(operations)
  }

  /**
   * Find the next matching line between two arrays
   */
  private findNextMatch(
    oldLines: string[], 
    newLines: string[], 
    oldStart: number, 
    newStart: number
  ): { found: boolean; oldIndex: number; newIndex: number } {
    const maxSearchDistance = 10 // Limit search to avoid performance issues

    for (let oldOffset = 0; oldOffset < maxSearchDistance; oldOffset++) {
      const oldIndex = oldStart + oldOffset
      if (oldIndex >= oldLines.length) break

      for (let newOffset = 0; newOffset < maxSearchDistance; newOffset++) {
        const newIndex = newStart + newOffset
        if (newIndex >= newLines.length) break

        if (oldLines[oldIndex] === newLines[newIndex]) {
          return { found: true, oldIndex, newIndex }
        }
      }
    }

    return { found: false, oldIndex: -1, newIndex: -1 }
  }

  /**
   * Get absolute character position for a line index
   */
  private getAbsolutePosition(content: string, lineIndex: number, charIndex: number = 0): number {
    if (lineIndex === 0) return charIndex

    const lines = content.split('\n')
    let position = 0

    for (let i = 0; i < Math.min(lineIndex, lines.length); i++) {
      position += lines[i].length + 1 // +1 for newline
    }

    return Math.min(position + charIndex, content.length)
  }

  /**
   * Get the length of a section of content between two line indices
   */
  private getSectionLength(content: string, startLine: number, endLine: number): number {
    const startPosition = this.getAbsolutePosition(content, startLine)
    const endPosition = this.getAbsolutePosition(content, endLine)
    return endPosition - startPosition
  }

  /**
   * Apply a single operation to content
   */
  private applyOperation(content: string, operation: PatchOperation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position)

      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0))

      case 'replace':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position + (operation.length || 0))

      default:
        return content
    }
  }

  /**
   * Optimize operations by merging adjacent operations of the same type
   */
  private optimizeOperations(operations: PatchOperation[]): PatchOperation[] {
    if (operations.length <= 1) return operations

    const optimized: PatchOperation[] = []
    let current = operations[0]

    for (let i = 1; i < operations.length; i++) {
      const next = operations[i]

      if (current.type === next.type && this.canMergeOperations(current, next)) {
        current = this.mergeOperations(current, next)
      } else {
        optimized.push(current)
        current = next
      }
    }

    optimized.push(current)
    return optimized
  }

  /**
   * Check if two operations can be merged
   */
  private canMergeOperations(op1: PatchOperation, op2: PatchOperation): boolean {
    if (op1.type !== op2.type) return false

    switch (op1.type) {
      case 'insert':
        return op1.position + (op1.content?.length || 0) === op2.position
      
      case 'delete':
        return op1.position + (op1.length || 0) === op2.position
      
      case 'replace':
        return op1.position + (op1.length || 0) === op2.position
      
      default:
        return false
    }
  }

  /**
   * Merge two operations of the same type
   */
  private mergeOperations(op1: PatchOperation, op2: PatchOperation): PatchOperation {
    switch (op1.type) {
      case 'insert':
        return {
          type: 'insert',
          position: op1.position,
          content: (op1.content || '') + (op2.content || '')
        }
      
      case 'delete':
        return {
          type: 'delete',
          position: op1.position,
          length: (op1.length || 0) + (op2.length || 0)
        }
      
      case 'replace':
        return {
          type: 'replace',
          position: op1.position,
          length: (op1.length || 0) + (op2.length || 0),
          content: (op1.content || '') + (op2.content || '')
        }
      
      default:
        return op1
    }
  }

  /**
   * Generate a simple checksum for content verification
   */
  private generateChecksum(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Create a reverse patch (undo operation)
   */
  createReversePatch(originalContent: string, patch: FilePatch): FilePatch {
    if (patch.type === 'full') {
      return {
        type: 'full',
        file: patch.file,
        operations: [],
        content: originalContent
      }
    }

    const modifiedContent = this.applyPatch(originalContent, patch)
    const reverseOperations = this.createDiffOperations(modifiedContent, originalContent)

    return {
      type: 'patch',
      file: patch.file,
      operations: reverseOperations
    }
  }

  /**
   * Batch multiple patches together
   */
  batchPatches(patches: FilePatch[]): FilePatch[] {
    // Group patches by file and merge operations
    const patchesByFile = new Map<string, FilePatch[]>()

    patches.forEach(patch => {
      if (!patchesByFile.has(patch.file)) {
        patchesByFile.set(patch.file, [])
      }
      patchesByFile.get(patch.file)!.push(patch)
    })

    const batchedPatches: FilePatch[] = []

    patchesByFile.forEach((filePatches, filename) => {
      if (filePatches.length === 1) {
        batchedPatches.push(filePatches[0])
      } else {
        // Merge all operations for the same file
        const allOperations = filePatches.flatMap(p => p.operations)
        const optimizedOperations = this.optimizeOperations(allOperations)

        batchedPatches.push({
          type: 'patch',
          file: filename,
          operations: optimizedOperations
        })
      }
    })

    return batchedPatches
  }
}

// Global diff engine instance
export const diffEngine = new DiffEngine()

// Utility functions for common diff operations
export function createTextDiff(oldText: string, newText: string): TextDiff[] {
  const patch = diffEngine.generatePatch(oldText, newText)
  return patch.operations.map(op => ({
    type: op.type as 'insert' | 'delete' | 'replace',
    position: op.position,
    content: op.content,
    length: op.length
  }))
}

export function applyTextDiff(text: string, diffs: TextDiff[]): string {
  const patch: FilePatch = {
    type: 'patch',
    file: '',
    operations: diffs.map(diff => ({
      type: diff.type,
      position: diff.position,
      content: diff.content,
      length: diff.length
    }))
  }

  return diffEngine.applyPatch(text, patch)
}

export function calculateTextSimilarity(text1: string, text2: string): number {
  return diffEngine['calculateSimilarity'](text1, text2)
}
