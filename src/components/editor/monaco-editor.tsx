'use client'

import { useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  height?: string
  options?: editor.IStandaloneEditorConstructionOptions
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '100%',
  options = {}
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    automaticLayout: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    padding: { top: 16, bottom: 16 },
    ...options
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save functionality will be handled by parent
      console.log('Save triggered')
    })

    // Add custom themes
    monaco.editor.defineTheme('vibe-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D' },
        { token: 'keyword', foreground: 'F97583' },
        { token: 'string', foreground: '9ECBFF' },
        { token: 'number', foreground: '79B8FF' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editorCursor.foreground': '#aeafad',
        'editorWhitespace.foreground': '#404040'
      }
    })

    // Apply custom theme
    monaco.editor.setTheme('vibe-dark')
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
  }

  return (
    <div className="h-full w-full border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        options={defaultOptions}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      />
    </div>
  )
}
