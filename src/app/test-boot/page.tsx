'use client'

import { useState } from 'react'
import WorkspaceLayout from '@/components/workspace/workspace-layout'

export default function TestBootPage() {
  const [testProjectId] = useState('boot-test-123')

  return (
    <div>
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-semibold text-yellow-800">🔥 Boot Template Test</h1>
          <p className="text-yellow-700">Testing the ignition sequence for blank slate prevention</p>
          <p className="text-sm text-yellow-600 mt-1">Project ID: {testProjectId}</p>
        </div>
      </div>
      
      {/* Render workspace without AuthGuard for testing */}
      <WorkspaceLayout projectId={testProjectId} />
    </div>
  )
}
