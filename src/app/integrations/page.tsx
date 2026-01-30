'use client'

import AuthGuard from '@/components/auth/auth-guard'
import SidebarMenu from '@/components/sidebar/sidebar-menu'
import { IntegrationsGrid } from '@/components/dashboard/integrations-grid'
import { Shield, Zap } from 'lucide-react'

export default function IntegrationsPage() {
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
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-800">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">Integrations</h1>
                    <p className="text-sm text-gray-400">Connect your deployment platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Security Notice */}
            <div className="mb-8 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-400 mb-1">Secure Key Storage</h3>
                  <p className="text-sm text-blue-300">
                    Your API keys are stored securely in your browser and only used for deployments. 
                    Never share your API keys with others.
                  </p>
                </div>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Connected Services</h2>
                <p className="text-gray-400 mb-6">
                  Connect your favorite deployment platforms to enable one-click publishing from your workspace.
                </p>
              </div>
              
              <IntegrationsGrid />
            </div>

            {/* Getting Started Guide */}
            <div className="mt-12 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Getting Started</h2>
                <p className="text-gray-400 mb-6">
                  Follow these steps to set up your deployment pipeline:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-gray-800 rounded-lg bg-gray-900/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <h3 className="font-semibold text-white">Connect Platforms</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Add your API keys for Vercel, GitHub, Expo, and other platforms you want to deploy to.
                  </p>
                </div>

                <div className="p-6 border border-gray-800 rounded-lg bg-gray-900/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <h3 className="font-semibold text-white">Build Your App</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Create your project in the workspace using AI-powered development tools.
                  </p>
                </div>

                <div className="p-6 border border-gray-800 rounded-lg bg-gray-900/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <h3 className="font-semibold text-white">Deploy with One Click</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Click the Deploy button in your workspace to publish your app to any connected platform.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
