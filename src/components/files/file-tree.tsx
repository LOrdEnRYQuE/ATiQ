'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
}

interface FileTreeProps {
  files: Record<string, string>
  onFileSelect: (path: string, content: string) => void
  onFileUpdate: (path: string, content: string) => void
  onFileDelete: (path: string) => void
  onFileCreate: (path: string, type: 'file' | 'folder') => void
  selectedFile?: string
}

export default function FileTree({
  files,
  onFileSelect,
  onFileUpdate,
  onFileDelete,
  onFileCreate,
  selectedFile
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))
  const [newItemPath, setNewItemPath] = useState<string>('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file')

  // Convert flat file structure to tree
  const buildTree = (files: Record<string, string>): FileNode[] => {
    const root: FileNode[] = []
    const tree: Record<string, FileNode> = {}

    // Create all nodes
    Object.keys(files).forEach(path => {
      const parts = path.split('/')
      let currentPath = ''

      parts.forEach((part, index) => {
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!tree[currentPath]) {
          const isFile = index === parts.length - 1
          tree[currentPath] = {
            id: currentPath,
            name: part,
            type: isFile ? 'file' : 'folder',
            content: isFile ? files[path] : undefined,
            children: []
          }

          if (parentPath && tree[parentPath]) {
            tree[parentPath].children!.push(tree[currentPath])
          } else if (!parentPath) {
            root.push(tree[currentPath])
          }
        }
      })
    })

    return root
  }

  const tree = buildTree(files)

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleCreateItem = (parentPath: string, type: 'file' | 'folder') => {
    setNewItemPath(parentPath)
    setNewItemType(type)
    setNewItemName('')
  }

  const handleCreateConfirm = () => {
    if (newItemName.trim()) {
      const fullPath = newItemPath ? `${newItemPath}/${newItemName.trim()}` : newItemName.trim()
      onFileCreate(fullPath, newItemType)
      setNewItemPath('')
      setNewItemName('')
    }
  }

  const handleCreateCancel = () => {
    setNewItemPath('')
    setNewItemName('')
  }

  const renderNode = (node: FileNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFile === node.id
    const isCreating = newItemPath === node.id

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer rounded ${
            isSelected ? 'bg-cyan-900/50' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === 'folder' && (
            <button
              className="h-4 w-4 p-0 mr-1 bg-transparent border-none text-gray-400 hover:text-white"
              onClick={() => toggleFolder(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}

          {node.type === 'folder' ? (
            <FolderOpen className="h-4 w-4 mr-2 text-yellow-400" />
          ) : (
            <File className="h-4 w-4 mr-2 text-cyan-400" />
          )}

          <span
            className="flex-1 text-sm text-gray-300"
            onClick={() => {
              if (node.type === 'file') {
                onFileSelect(node.id, node.content || '')
              } else {
                toggleFolder(node.id)
              }
            }}
          >
            {node.name}
          </span>

          <div className="flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
            {node.type === 'folder' && (
              <button
                className="h-4 w-4 p-0 bg-transparent border-none text-gray-400 hover:text-white"
                onClick={() => handleCreateItem(node.id, 'file')}
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            <button
              className="h-4 w-4 p-0 bg-transparent border-none text-red-400 hover:text-red-300"
              onClick={() => onFileDelete(node.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* New item input */}
        {isCreating && (
          <div className="flex items-center py-1 px-2" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
            {newItemType === 'folder' ? (
              <Folder className="h-4 w-4 mr-2 text-yellow-400" />
            ) : (
              <File className="h-4 w-4 mr-2 text-cyan-400" />
            )}
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateConfirm()
                if (e.key === 'Escape') handleCreateCancel()
              }}
              placeholder={`New ${newItemTypeName}...`}
              className="h-6 text-sm bg-black/50 border-gray-700 text-white placeholder-gray-400"
              autoFocus
            />
            <button className="ml-1 h-6 px-2 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700" onClick={handleCreateConfirm}>
              ✓
            </button>
            <button className="ml-1 h-6 px-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600" onClick={handleCreateCancel}>
              ✕
            </button>
          </div>
        )}

        {/* Render children */}
        {node.type === 'folder' && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Files</h3>
        {/* Electro gradient new file button */}
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
            onClick={() => handleCreateItem('', 'file')}
          >
            <Plus className="h-4 w-4 mr-1" />
            New File
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-3rem)]">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            {/* Electro gradient create first file button */}
            <div className="group relative inline-block mt-4">
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
                onClick={() => handleCreateItem('', 'file')}
              >
                Create your first file
              </button>
            </div>
          </div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  )
}

function newItemTypeName(type: 'file' | 'folder'): string {
  return type === 'file' ? 'file' : 'folder'
}
