'use client'

import React, { useState } from 'react'
import { 
  Code, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Home,
  FolderOpen,
  FileText,
  BarChart3,
  HelpCircle,
  LogOut,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
}

interface SidebarMenuProps {
  className?: string
}

export default function SidebarMenu({ className = '' }: SidebarMenuProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderOpen className="h-5 w-5" />,
      href: '/projects'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <Code className="h-5 w-5" />,
      href: '/templates'
    },
    {
      id: 'collaborate',
      label: 'Collaborate',
      icon: <Users className="h-5 w-5" />,
      href: '/collaborate'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/analytics'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Zap className="h-5 w-5" />,
      href: '/integrations'
    },
    {
      id: 'docs',
      label: 'Documentation',
      icon: <FileText className="h-5 w-5" />,
      href: '/docs'
    }
  ]

  const bottomMenuItems: MenuItem[] = [
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle className="h-5 w-5" />,
      href: '/help'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/settings'
    }
  ]

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/auth')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div 
      className={`relative bg-gray-900/90 backdrop-blur-sm border-r border-gray-800 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Logo Section */}
      <div className="flex items-center justify-center p-4 border-b border-gray-800">
        <div className="flex items-center h-20">
          <Image
            src="/ATiQ_Logo.png"
            alt="ATiQ logo"
            width={240}
            height={80}
            className={`h-20 w-auto object-contain transition-opacity ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
            priority
          />
          {isCollapsed && (
            <div className="h-20 w-20 flex items-center justify-center">
              <Image
                src="/ATiQ_Logo.png"
                alt="ATiQ logo"
                width={80}
                height={80}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <div
              className={`group relative flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isCollapsed ? 'justify-center' : 'justify-start'
              } hover:bg-gray-800/50 text-gray-400 hover:text-white`}
            >
              {/* Electro gradient effect for active/hover */}
              <div className="absolute inset-0 rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-linear-to-r from-yellow-400/10 via-cyan-400/10 to-purple-400/10 animate-pulse" />
              </div>
              
              <div className="relative flex items-center space-x-3">
                <div className="shrink-0">
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {item.badge && !isCollapsed && (
                  <span className="ml-auto px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          </Link>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-gray-800 p-4 space-y-2">
        {bottomMenuItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <div
              className={`group relative flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isCollapsed ? 'justify-center' : 'justify-start'
              } hover:bg-gray-800/50 text-gray-400 hover:text-white`}
            >
              <div className="relative flex items-center space-x-3">
                <div className="shrink-0">
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </div>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={`group relative flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 w-full ${
            isCollapsed ? 'justify-center' : 'justify-start'
          } hover:bg-red-900/20 text-gray-400 hover:text-red-400`}
        >
          <div className="relative flex items-center space-x-3">
            <div className="shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </div>

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
