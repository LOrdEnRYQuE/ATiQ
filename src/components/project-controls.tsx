'use client'

import { useState } from 'react'
import { Download, Save, FolderOpen, Trash2, HardDrive } from 'lucide-react'
import { usePersistence } from '@/lib/persistence-hook'
import { downloadProjectAsZip, canExportProject, getExportStats } from '@/lib/project-zipper'

interface ProjectControlsProps {
  files: Record<string, string>
  projectName?: string
  onProjectLoad?: (files: Record<string, string>, metadata?: { name: string; createdAt: number; lastModified: number }) => void
  onProjectClear?: () => void
}

export default function ProjectControls({ 
  files, 
  projectName = 'Untitled Project', 
  onProjectLoad,
  onProjectClear 
}: ProjectControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  const { 
    stats, 
    isAutoSaving, 
    clearProject, 
    exportProject, 
    importProject, 
    hasProject 
  } = usePersistence(files, projectName)

  const handleDownloadZip = async () => {
    if (Object.keys(files).length === 0) {
      alert('No files to export!')
      return
    }

    const exportCheck = canExportProject(files)
    if (!exportCheck.canExport) {
      alert(`Cannot export: ${exportCheck.reason}`)
      return
    }

    setIsExporting(true)
    try {
      await downloadProjectAsZip(files, {
        projectName,
        includeMetadata: true,
        includeReadme: true,
        includeGitignore: true
      })
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export project. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        const content = await file.text()
        const success = importProject(content)
        
        if (success) {
          // Parse and load the imported project
          const data = JSON.parse(content)
          if (data.files && onProjectLoad) {
            onProjectLoad(data.files, data.metadata)
          }
          alert('Project imported successfully!')
        } else {
          alert('Failed to import project. Invalid format.')
        }
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import project. Please check the file format.')
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleExportJSON = () => {
    if (Object.keys(files).length === 0) {
      alert('No files to export!')
      return
    }

    const jsonContent = exportProject()
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}-backup.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetProject = () => {
    clearProject()
    if (onProjectClear) {
      onProjectClear()
    }
    setShowResetConfirm(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return date.toLocaleDateString()
  }

  const exportStats = getExportStats(files)

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
      {/* Auto-save indicator */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded">
        <Save className={`h-4 w-4 ${isAutoSaving ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`} />
        <span className="text-xs text-gray-300">
          {isAutoSaving ? 'Saving...' : 'Auto-saved'}
        </span>
        {stats.lastSaved && (
          <span className="text-xs text-gray-400">
            {formatTime(stats.lastSaved)}
          </span>
        )}
      </div>

      {/* Project info */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded">
        <FolderOpen className="h-4 w-4 text-blue-400" />
        <span className="text-xs text-gray-300">
          {exportStats.fileCount} files
        </span>
        <span className="text-xs text-gray-400">
          {formatFileSize(exportStats.totalSize)}
        </span>
      </div>

      {/* Export controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDownloadZip}
          disabled={isExporting || Object.keys(files).length === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Download as ZIP"
        >
          <Download className="h-3 w-3" />
          {isExporting ? 'Exporting...' : 'ZIP'}
        </button>

        <button
          onClick={handleExportJSON}
          disabled={Object.keys(files).length === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Export as JSON"
        >
          <HardDrive className="h-3 w-3" />
          JSON
        </button>

        <button
          onClick={handleImportProject}
          disabled={isImporting}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Import project"
        >
          <FolderOpen className="h-3 w-3" />
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Reset control */}
      <button
        onClick={() => setShowResetConfirm(true)}
        disabled={!hasProject}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Reset project"
      >
        <Trash2 className="h-3 w-3" />
        Reset
      </button>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Reset Project</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to reset the project? This will delete all files and clear the auto-save. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reset Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage warning */}
      {stats.storageUsed && stats.storageUsed > 3 * 1024 * 1024 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/50 border border-yellow-700 rounded">
          <span className="text-xs text-yellow-400">
            ⚠️ Large project ({formatFileSize(stats.storageUsed)})
          </span>
        </div>
      )}
    </div>
  )
}
