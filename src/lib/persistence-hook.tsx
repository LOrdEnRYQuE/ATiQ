'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { persistenceManager, createDebouncedSave, PersistenceStats } from './persistence'

/**
 * React hook for persistence management
 */
export function usePersistence(files: Record<string, string>, projectName?: string) {
  const [stats, setStats] = useState<PersistenceStats>(persistenceManager.getStats())
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  
  // Debounced save function
  const debouncedSave = useMemo(() => createDebouncedSave(1000), [])
  
  // Auto-save when files change
  useEffect(() => {
    if (Object.keys(files).length === 0) return
    
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true)
      debouncedSave(files, projectName)
      
      // Update stats after a short delay
      setTimeout(() => {
        setStats(persistenceManager.getStats())
        setIsAutoSaving(false)
      }, 1100)
    }, 0)
    
    return () => clearTimeout(timeoutId)
  }, [files, projectName, debouncedSave])
  
  const clearProject = useCallback(() => {
    persistenceManager.clear()
    setStats(persistenceManager.getStats())
  }, [])
  
  const exportProject = useCallback(() => {
    return persistenceManager.exportAsJSON()
  }, [])
  
  const importProject = useCallback((jsonString: string) => {
    const success = persistenceManager.importFromJSON(jsonString)
    if (success) {
      setStats(persistenceManager.getStats())
    }
    return success
  }, [])
  
  const save = useCallback((files: Record<string, string>, name?: string) => {
    return persistenceManager.save(files, name)
  }, [])
  
  const load = useCallback(() => {
    return persistenceManager.load()
  }, [])
  
  return {
    stats,
    isAutoSaving,
    clearProject,
    exportProject,
    importProject,
    save,
    load,
    hasProject: stats.hasSavedProject
  }
}
