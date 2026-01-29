'use client'

import { useState, useEffect } from 'react'
import { Code, Eye, PanelLeft, PanelRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MonacoEditor from '@/components/editor/monaco-editor'
import AIChat from '@/components/ai/ai-chat'
import FileTree from '@/components/files/file-tree'
import LivePreview from '@/components/preview/live-preview'
import { useProjectStore } from '@/lib/store/projects'

interface WorkspaceLayoutProps {
  projectId: string
}

export default function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  const [files, setFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string>('')
  const [activeContent, setActiveContent] = useState<string>('')
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const { currentProject, updateProjectFiles, fetchProjects } = useProjectStore()

  // Initialize files from project
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleFileSelect = (path: string, content: string) => {
    setActiveFile(path)
    setActiveContent(content)
  }

  const handleFileUpdate = (path: string, content: string) => {
    const newFiles = { ...files, [path]: content }
    setFiles(newFiles)
    
    if (currentProject) {
      updateProjectFiles(currentProject.id, newFiles)
    }
    
    if (path === activeFile) {
      setActiveContent(content)
    }
  }

  const handleFileDelete = (path: string) => {
    const newFiles = { ...files }
    delete newFiles[path]
    setFiles(newFiles)
    
    if (currentProject) {
      updateProjectFiles(currentProject.id, newFiles)
    }
    
    if (path === activeFile) {
      const remainingFiles = Object.keys(newFiles)
      if (remainingFiles.length > 0) {
        const nextFile = remainingFiles[0]
        setActiveFile(nextFile)
        setActiveContent(newFiles[nextFile])
      } else {
        setActiveFile('')
        setActiveContent('')
      }
    }
  }

  const handleFileCreate = (path: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      const extension = path.includes('.') ? '' : '.js'
      const fullPath = path + extension
      const newFiles = { ...files, [fullPath]: `// ${fullPath}\n` }
      setFiles(newFiles)
      
      if (currentProject) {
        updateProjectFiles(currentProject.id, newFiles)
      }
      
      setActiveFile(fullPath)
      setActiveContent(`// ${fullPath}\n`)
    }
  }

  const handleCodeGenerated = (code: string, language: string) => {
    const extension = language === 'typescript' ? '.ts' : '.js'
    const fileName = `generated_${Date.now()}${extension}`
    const newFiles = { ...files, [fileName]: code }
    
    setFiles(newFiles)
    
    if (currentProject) {
      updateProjectFiles(currentProject.id, newFiles)
    }
    
    setActiveFile(fileName)
    setActiveContent(code)
  }

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'jsx': return 'javascript'
      case 'tsx': return 'typescript'
      case 'html': return 'html'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'md': return 'markdown'
      default: return 'plaintext'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/90 backdrop-blur-sm border-b border-gray-900 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-white">Vibe Coding</h1>
            <span className="text-sm text-gray-400">Project: {projectId}</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Electro gradient preview toggle button */}
            <div className="group relative inline-block">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
              </div>
              <div className="absolute inset-0 rounded-lg p-px">
                <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                     style={{ 
                       background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                       backgroundSize: '200% 200%',
                       animation: 'electro 2s ease-in-out infinite'
                     }} />
              </div>
              <button 
                className="relative px-3 py-1 bg-black text-white text-sm font-medium rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 flex items-center"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <Code className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showPreview ? 'Code' : 'Preview'}
              </button>
            </div>
            <button
              className="px-3 py-1 bg-black/50 border border-gray-700 rounded-lg text-white text-sm font-medium hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 flex items-center"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            >
              {leftPanelCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </button>
            <button
              className="px-3 py-1 bg-black/50 border border-gray-700 rounded-lg text-white text-sm font-medium hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 flex items-center"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            >
              {rightPanelCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Panel - AI Chat */}
        {!leftPanelCollapsed && (
          <div className="w-96 border-r border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <AIChat onCodeGenerated={handleCodeGenerated} />
          </div>
        )}

        {/* Center - Code Editor or Preview */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
            <Tabs value={activeFile} onValueChange={(value: string) => {
              setActiveFile(value)
              setActiveContent(files[value] || '')
            }}>
              <TabsList className="h-8 bg-transparent border-b-0">
                {Object.keys(files).map(filename => (
                  <TabsTrigger
                    key={filename}
                    value={filename}
                    className="data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white border-gray-700"
                  >
                    {filename}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Editor or Preview */}
          <div className="flex-1">
            {showPreview ? (
              <LivePreview files={files} activeFile={activeFile} />
            ) : activeFile ? (
              <MonacoEditor
                value={activeContent}
                onChange={(value) => handleFileUpdate(activeFile, value)}
                language={getFileLanguage(activeFile)}
                height="100%"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="mb-4 text-lg">No file selected</p>
                  {/* Electro gradient create file button */}
                  <div className="group relative inline-block">
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                      <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                      <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
                    </div>
                    <div className="absolute inset-0 rounded-lg p-px">
                      <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                           style={{ 
                             background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                             backgroundSize: '200% 200%',
                             animation: 'electro 2s ease-in-out infinite'
                           }} />
                    </div>
                    <button 
                      className="relative px-4 py-2 bg-black text-white font-bold rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25"
                      onClick={() => handleFileCreate('new-file', 'file')}
                    >
                      Create a file
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - File Tree */}
        {!rightPanelCollapsed && (
          <div className="w-64 border-l border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <FileTree
              files={files}
              onFileSelect={handleFileSelect}
              onFileUpdate={handleFileUpdate}
              onFileDelete={handleFileDelete}
              onFileCreate={handleFileCreate}
              selectedFile={activeFile}
            />
          </div>
        )}
      </div>
    </div>
  )
}
