import { useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'
import { persistenceManager } from '@/lib/persistence'

interface UseFileWriterProps {
  webContainer: WebContainer | null
  setFiles: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onTerminal?: (data: string) => void
}

export function useFileWriter({ webContainer, setFiles, onTerminal }: UseFileWriterProps) {
  
  const writeFile = useCallback(async (path: string, content: string) => {
    // 1. Update React State (UI)
    setFiles((prev) => {
      const newFiles = { ...prev, [path]: content }
      // Trigger auto-save immediately for safety
      persistenceManager.save(newFiles)
      return newFiles
    })

    // 2. Write to WebContainer (Runtime)
    if (webContainer) {
      try {
        await webContainer.fs.writeFile(path, content)
        onTerminal?.(`[system] Wrote file: ${path}\n`)
      } catch (error) {
        console.error(`Failed to write ${path}:`, error)
        onTerminal?.(`[error] Failed to write ${path}\n`)
      }
    }
  }, [webContainer, setFiles, onTerminal])

  const handleBlock = useCallback(async (block: { type: string; content: string; path?: string; isComplete: boolean }) => {
    // Only act on complete blocks
    if (!block.isComplete) return

    if (block.type === 'file' && block.path) {
      await writeFile(block.path, block.content)
    }
    
    // Future: Handle 'shell' blocks here too
    if (block.type === 'shell') {
       // logic to run shell command...
    }
  }, [writeFile])

  return { writeFile, handleBlock }
}
