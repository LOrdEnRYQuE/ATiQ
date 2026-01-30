/**
 * Fuzzy patching utilities for handling AI-generated patches with whitespace/indentation issues
 */
import { XmlStreamParser } from './streaming-parser'

/**
 * Tries to apply a patch even if whitespace/indentation doesn't match exactly.
 * Uses a Three-Tier Fallback System:
 * 1. Strict Match (Fastest)
 * 2. Normalized Match (Magic Fix) 
 * 3. Context Anchoring (Safety Net)
 */
export function applyFuzzyPatch(originalFile: string, patch: { search: string; replace: string }): string | null {
  // Tier 1: Try Strict Match first (Fastest)
  if (originalFile.includes(patch.search)) {
    return originalFile.replace(patch.search, patch.replace)
  }

  // Tier 2: Try Normalized Match (The Magic Fix)
  const normalizedResult = applyNormalizedPatch(originalFile, patch)
  if (normalizedResult !== null) {
    return normalizedResult
  }

  // Tier 3: Context Anchoring (The Safety Net)
  const anchoredResult = applyContextAnchoredPatch(originalFile, patch)
  if (anchoredResult !== null) {
    return anchoredResult
  }

  // All tiers failed - trigger Self-Correction/Repair mechanism
  return null
}

/**
 * Tier 2: Normalized Match - Ignores all whitespace/indentation differences
 * This fixes 90% of AI whitespace hallucinations
 */
function applyNormalizedPatch(originalFile: string, patch: { search: string; replace: string }): string | null {
  const normalize = (str: string) => str.replace(/\s+/g, '')
  
  const normSearch = normalize(patch.search)
  const normFile = normalize(originalFile)
  
  // If the normalized search string isn't in the normalized file, give up
  if (!normFile.includes(normSearch)) {
    return null
  }

  // Find the fuzzy match location
  const matchResult = findFuzzyMatch(originalFile, patch.search)
  if (!matchResult) {
    return null
  }

  // Apply the replacement at the found location
  const { startIndex, endIndex } = matchResult
  return originalFile.substring(0, startIndex) + patch.replace + originalFile.substring(endIndex)
}

/**
 * Tier 3: Context Anchoring - Uses first/last lines as anchors
 * This is the safety net when normalized matching fails
 */
function applyContextAnchoredPatch(originalFile: string, patch: { search: string; replace: string }): string | null {
  const searchLines = patch.search.split('\n').filter(line => line.trim().length > 0)
  const fileLines = originalFile.split('\n')
  
  if (searchLines.length < 2) {
    return null // Not enough context to anchor
  }

  // Try to find the region using first and last non-empty lines as anchors
  const firstLine = searchLines[0].trim()
  const lastLine = searchLines[searchLines.length - 1].trim()
  
  let startRegion = -1
  let endRegion = -1
  
  // Find start region using first line
  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].trim() === firstLine) {
      startRegion = i
      break
    }
  }
  
  // Find end region using last line
  for (let i = fileLines.length - 1; i >= 0; i--) {
    if (fileLines[i].trim() === lastLine) {
      endRegion = i
      break
    }
  }
  
  if (startRegion === -1 || endRegion === -1 || startRegion >= endRegion) {
    return null
  }

  // Extract the region and try to apply patch within it
  const regionContent = fileLines.slice(startRegion, endRegion + 1).join('\n')
  const regionWithPatch = applyNormalizedPatch(regionContent, patch)
  
  if (regionWithPatch === null) {
    return null
  }

  // Reconstruct the file with the patched region
  const beforeRegion = fileLines.slice(0, startRegion).join('\n')
  const afterRegion = fileLines.slice(endRegion + 1).join('\n')
  
  return beforeRegion + regionWithPatch + afterRegion
}

/**
 * Finds the fuzzy match location for a search block in original text
 * Uses a sliding window approach to find the best match
 */
function findFuzzyMatch(text: string, searchBlock: string): { startIndex: number; endIndex: number } | null {
  const searchLines = searchBlock.split('\n')
  const fileLines = text.split('\n')
  
  let bestMatch: { startIndex: number; endIndex: number; score: number } | null = null
  
  // Try different window sizes around the expected size
  const windowSizes = [searchLines.length, searchLines.length + 1, searchLines.length - 1]
  
  for (const windowSize of windowSizes) {
    if (windowSize <= 0) continue
    
    for (let i = 0; i <= fileLines.length - windowSize; i++) {
      const windowContent = fileLines.slice(i, i + windowSize).join('\n')
      const score = calculateSimilarity(windowContent, searchBlock)
      
      if (score > 0.8 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          startIndex: i,
          endIndex: i + windowSize,
          score
        }
      }
    }
  }
  
  return bestMatch
}

/**
 * Simple similarity calculation for fuzzy matching
 * Uses character-level similarity with whitespace normalization
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = str1.replace(/\s+/g, '')
  const norm2 = str2.replace(/\s+/g, '')
  
  if (norm1.length === 0 && norm2.length === 0) return 1.0
  if (norm1.length === 0 || norm2.length === 0) return 0.0
  
  let matches = 0
  const maxLength = Math.max(norm1.length, norm2.length)
  
  for (let i = 0; i < maxLength; i++) {
    if (norm1[i] === norm2[i]) {
      matches++
    }
  }
  
  return matches / maxLength
}

/**
 * Alternative implementation using diff-match-patch library (recommended for production)
 * This is more robust and handles edge cases better
 */
export async function applyRobustPatch(originalContent: string, searchBlock: string, replaceBlock: string): Promise<string | null> {
  try {
    // Dynamic import for diff-match-patch
    const { diff_match_patch } = await import('diff-match-patch')
    const dmp = new diff_match_patch()
    
    // Compute the diff between search and replace blocks
    const patches = dmp.patch_make(searchBlock, replaceBlock)
    
    // Apply the patch to the original content
    const [newContent, results] = dmp.patch_apply(patches, originalContent)
    
    // Check if all patches applied successfully
    const success = results.every((res: boolean) => res === true)
    
    if (!success) {
      throw new Error('Fuzzy match failed - Confidence too low')
    }
    
    return newContent
  } catch (error) {
    console.warn('diff-match-patch not available, falling back to custom implementation')
    return applyFuzzyPatch(originalContent, { search: searchBlock, replace: replaceBlock })
  }
}

/**
 * Enhanced file write handler with fuzzy patching
 */
export async function handleFileWriteWithFuzzyPatch(
  block: { type: string; attributes?: { path: string; type: string }; content: string; isComplete: boolean },
  currentFiles: Record<string, string>,
  onFileUpdate: (path: string, content: string) => void,
  onRepairNeeded?: (path: string, error: string, currentContent: string) => void
): Promise<void> {
  if (!block.attributes || !block.isComplete) return

  const { path, type } = block.attributes
  
  if (type === 'create') {
    // Easy: Just overwrite the file
    onFileUpdate(path, block.content)
  } else if (type === 'patch') {
    // Hard: Apply the patch with fuzzy matching
    const currentFileContent = currentFiles[path] || ''
    
    try {
      // Parse the patch content first
      const parsedPatch = XmlStreamParser.parsePatch(block.content)
      if (!parsedPatch) {
        console.error('Failed to parse patch blocks')
        return
      }
      
      // Try robust patching first
      const newContent = await applyRobustPatch(currentFileContent, parsedPatch.search, parsedPatch.replace)
      if (newContent) {
        onFileUpdate(path, newContent)
        return
      }
      
      // Fallback to fuzzy patching
      const fuzzyResult = applyFuzzyPatch(currentFileContent, parsedPatch)
      if (fuzzyResult) {
        onFileUpdate(path, fuzzyResult)
        return
      }
      
      // All methods failed - trigger Self-Correction
      const error = `Search block not found in file. Expected:\n${parsedPatch.search}\n\nFile content:\n${currentFileContent.substring(0, 500)}...`
      onRepairNeeded?.(path, error, currentFileContent)
      
    } catch (patchError) {
      console.error('Patch application failed:', patchError)
      onRepairNeeded?.(path, patchError instanceof Error ? patchError.message : 'Unknown error', currentFileContent)
    }
  }
}
