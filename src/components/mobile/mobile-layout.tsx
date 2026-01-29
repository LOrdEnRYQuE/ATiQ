'use client'

import React, { useState, useEffect } from 'react'
import { 
  Menu, 
  X, 
  Home, 
  Code, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  ChevronDown,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
}

export default function MobileLayout({ 
  children, 
  title, 
  showBackButton = false, 
  onBack 
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title || 'Vibe Coding'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user?.user_metadata?.full_name || 'User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              <a
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              
              <a
                href="/workspace"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Code className="w-5 h-5" />
                <span>Workspace</span>
              </a>
              
              <a
                href="/ai-chat"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Plus className="w-5 h-5" />
                <span>AI Assistant</span>
              </a>
              
              <a
                href="/team"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Users className="w-5 h-5" />
                <span>Team</span>
              </a>
              
              <a
                href="/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Bell className="w-5 h-5" />
                <span>Analytics</span>
              </a>
              
              <a
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </a>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="pb-20">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-around py-2">
          <a
            href="/dashboard"
            className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
          
          <a
            href="/workspace"
            className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Code className="w-5 h-5" />
            <span className="text-xs mt-1">Code</span>
          </a>
          
          <a
            href="/ai-chat"
            className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">AI</span>
          </a>
          
          <a
            href="/team"
            className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Team</span>
          </a>
          
          <a
            href="/analytics"
            className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs mt-1">Alerts</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
