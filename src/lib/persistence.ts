/**
 * Persistence Manager - Auto-save and project restoration
 * Protects users from data loss on browser refresh
 */

const STORAGE_KEY = 'vibe_project_files'
const METADATA_KEY = 'vibe_project_metadata'
const LAST_SAVED_KEY = 'vibe_last_saved'

export interface ProjectMetadata {
  name: string
  createdAt: number
  lastModified: number
  fileCount: number
  totalSize: number
  version: string
}

export interface PersistenceStats {
  hasSavedProject: boolean
  lastSaved?: number
  fileSize?: number
  fileCount?: number
  storageUsed?: number
}

export const persistenceManager = {
  /**
   * Save the current file system to LocalStorage
   * Debounced to prevent thrashing and includes metadata
   */
  save: (files: Record<string, string>, projectName = 'Untitled Project'): boolean => {
    try {
      // Calculate project stats
      const fileCount = Object.keys(files).length
      const totalSize = Object.values(files).reduce((sum: number, content: unknown) => sum + (content as string).length, 0)
      
      // Check storage limits (LocalStorage typically ~5MB)
      const estimatedSize = JSON.stringify(files).length + JSON.stringify({
        name: projectName,
        fileCount,
        totalSize
      }).length
      
      if (estimatedSize > 4.5 * 1024 * 1024) { // 4.5MB limit
        console.warn('Project too large for LocalStorage. Consider downloading instead.')
        return false
      }

      // Save files
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
      
      // Save metadata
      const metadata: ProjectMetadata = {
        name: projectName,
        createdAt: Date.now(),
        lastModified: Date.now(),
        fileCount,
        totalSize,
        version: '1.0.0'
      }
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata))
      
      // Save timestamp
      localStorage.setItem(LAST_SAVED_KEY, Date.now().toString())
      
      console.log(`✅ Project auto-saved: ${fileCount} files, ${(totalSize / 1024).toFixed(1)}KB`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to auto-save project:', error)
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Project too large for auto-save.')
      }
      
      return false
    }
  },

  /**
   * Load files from LocalStorage on boot
   */
  load: (): { files: Record<string, string>; metadata: ProjectMetadata } | null => {
    try {
      const storedFiles = localStorage.getItem(STORAGE_KEY)
      const storedMetadata = localStorage.getItem(METADATA_KEY)
      
      if (!storedFiles) {
        console.log('No saved project found')
        return null
      }

      const files = JSON.parse(storedFiles as string)
      const totalSize = Object.values(files).reduce((sum: number, content: unknown) => sum + (content as string).length, 0);
      const metadata = storedMetadata ? JSON.parse(storedMetadata as string) : {
        name: 'Untitled Project',
        createdAt: Date.now(),
        lastModified: Date.now(),
        fileCount: Object.keys(files).length,
        totalSize,
        version: '1.0.0'
      }

      console.log(`✅ Project restored: ${metadata.fileCount} files`)
      return { files, metadata }
      
    } catch (error) {
      console.error('❌ Failed to load project from storage:', error)
      return null
    }
  },

  /**
   * Get persistence statistics
   */
  getStats: (): PersistenceStats => {
    const hasProject = !!localStorage.getItem(STORAGE_KEY)
    const lastSaved = localStorage.getItem(LAST_SAVED_KEY)
    
    if (!hasProject) {
      return { hasSavedProject: false }
    }

    try {
      const metadata = JSON.parse(localStorage.getItem(METADATA_KEY) as string)
      const filesSize = localStorage.getItem(STORAGE_KEY)?.length || 0
      const metadataSize = localStorage.getItem(METADATA_KEY)?.length || 0
      const timestampSize = localStorage.getItem(LAST_SAVED_KEY)?.length || 0
      
      return {
        hasSavedProject: true,
        lastSaved: lastSaved ? parseInt(lastSaved) : undefined,
        fileSize: metadata.totalSize,
        fileCount: metadata.fileCount,
        storageUsed: filesSize + metadataSize + timestampSize
      }
    } catch (error) {
      console.error('Failed to get persistence stats:', error)
      return { hasSavedProject: true }
    }
  },

  /**
   * Check if we have a saved project
   */
  hasSavedProject: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEY)
  },

  /**
   * Get project metadata without loading full files
   */
  getMetadata: (): ProjectMetadata | null => {
    try {
      const stored = localStorage.getItem(METADATA_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to get project metadata:', error)
      return null
    }
  },

  /**
   * Clear storage (for "New Project")
   */
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(METADATA_KEY)
    localStorage.removeItem(LAST_SAVED_KEY)
    console.log('🗑️ Project storage cleared')
  },

  /**
   * Export project as JSON (for manual backup)
   */
  exportAsJSON: (): string => {
    const data = {
      files: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
      metadata: JSON.parse(localStorage.getItem(METADATA_KEY) || '{}'),
      exportedAt: Date.now(),
      version: '1.0.0'
    }
    
    return JSON.stringify(data, null, 2)
  },

  /**
   * Import project from JSON
   */
  importFromJSON: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString as string)
      
      if (!data.files || !data.metadata) {
        throw new Error('Invalid project format')
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.files))
      localStorage.setItem(METADATA_KEY, JSON.stringify(data.metadata))
      localStorage.setItem(LAST_SAVED_KEY, Date.now().toString())
      
      console.log('✅ Project imported successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to import project:', error)
      return false
    }
  }
}

/**
 * Debounced save utility to prevent excessive writes
 */
export function createDebouncedSave(delay = 1000) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (files: Record<string, string>, projectName?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      persistenceManager.save(files, projectName)
      timeoutId = null
    }, delay)
  }
}

