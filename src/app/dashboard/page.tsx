'use client'

import { useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import { Code, Zap, Users, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UsageStats from '@/components/usage/usage-stats'
import SidebarMenu from '@/components/sidebar/sidebar-menu'
import { NewProjectWizard } from '@/components/dashboard/new-project-wizard'
import { ProjectBlueprint } from '@/lib/blueprint'
import { useProjectStore } from '@/lib/store/projects'

export default function Dashboard() {
  const router = useRouter()
  const { createProject } = useProjectStore()
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const handleLaunch = async (blueprint: ProjectBlueprint) => {
    const project = await createProject(blueprint.name)
    localStorage.setItem(`genesis_blueprint_${project.id}`, JSON.stringify(blueprint))
    router.push(`/workspace/${project.id}?genesis=true`)
  }


  const handleTemplates = () => {
    // Navigate to templates page
    router.push('/templates')
  }

  const handleCollaborate = () => {
    // Navigate to collaboration page
    router.push('/collaborate')
  }

  const handleSettings = () => {
    // Navigate to settings page
    router.push('/settings')
  }
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <SidebarMenu />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
          </div>

          {/* Header */}
          <header className="relative z-10 bg-black/90 backdrop-blur-sm border-b border-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center h-10" />
                <div className="flex items-center space-x-4">
                  {/* Electro gradient settings button */}
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
                      onClick={handleSettings}
                      className="relative px-4 py-2 bg-black text-white text-sm font-medium rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Welcome Section */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome to your AI coding workspace
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Start building with AI-powered code generation and real-time collaboration
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Electro gradient New Project card */}
                  <Link href="/workspace/new">
                    <div className="group relative inline-block w-full">
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
                      <div className="relative bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                        <div className="flex items-center text-lg font-bold text-white mb-3">
                          <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                          New Project
                        </div>
                        <p className="text-gray-400 text-sm">
                          Create a new AI-powered coding project
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Other cards with matching theme */}
                  <div 
                    onClick={handleTemplates}
                    className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-center text-lg font-bold text-white mb-3">
                      <Code className="h-5 w-5 mr-2 text-cyan-400" />
                      Templates
                    </div>
                    <p className="text-gray-400 text-sm">
                      Start with pre-built project templates
                    </p>
                  </div>

                  <div 
                    onClick={handleCollaborate}
                    className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-green-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-center text-lg font-bold text-white mb-3">
                      <Users className="h-5 w-5 mr-2 text-green-400" />
                      Collaborate
                    </div>
                    <p className="text-gray-400 text-sm">
                      Invite team members to your projects
                    </p>
                  </div>

                  <div 
                    onClick={handleSettings}
                    className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-center text-lg font-bold text-white mb-3">
                      <Settings className="h-5 w-5 mr-2 text-purple-400" />
                      Settings
                    </div>
                    <p className="text-gray-400 text-sm">
                      Manage your account and preferences
                    </p>
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Recent Projects</h3>
                  <p className="text-gray-400 mb-6">Your latest coding projects</p>
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No projects yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Create your first AI-powered project to get started
                    </p>
                    {/* Electro gradient New Project card */}
                    <button onClick={() => setIsWizardOpen(true)} className="group relative inline-block w-full">
                      <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                        <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                        <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
                      </div>
                      <div className="absolute inset-0 rounded-lg p-px">
                        <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                             style={{ 
                               backgroundImage: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                               backgroundSize: '200% 200%',
                               animation: 'electro 2.5s ease-in-out infinite'
                             }} />
                      </div>
                      <div className="relative flex flex-col items-center justify-center p-6 rounded-lg bg-black text-white border border-gray-800 hover:border-purple-500/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-400/25">
                        <Plus className="h-8 w-8 mb-2 text-purple-400" />
                        <span className="text-lg font-bold text-purple-400">New Project</span>
                        <span className="text-sm text-gray-400">Launch the AI Builder</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Usage Stats */}
              <div className="space-y-8">
                <UsageStats />
              </div>
            </div>
          </main>
        </div>
      </div>

      <NewProjectWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onLaunch={handleLaunch} 
      />
    </AuthGuard>
  )
}
