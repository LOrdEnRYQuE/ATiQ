'use client'

import { ArrowLeft, User, Bell, Shield, Palette, Globe, Database } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Settings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')

  const handleSave = async () => {
    try {
      // Save settings logic here
      console.log('Settings saved')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'language', name: 'Language', icon: Globe },
    { id: 'data', name: 'Data & Storage', icon: Database }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/90 backdrop-blur-sm border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard">
              <button className="flex items-center text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </Link>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-800 text-cyan-400 border-l-4 border-cyan-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue="John Doe"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        defaultValue="Passionate developer and AI enthusiast"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Email Notifications</h3>
                        <p className="text-gray-400 text-sm">Receive email updates about your projects</p>
                      </div>
                      <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Push Notifications</h3>
                        <p className="text-gray-400 text-sm">Get push notifications in your browser</p>
                      </div>
                      <button className="w-12 h-6 bg-gray-700 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Project Updates</h3>
                        <p className="text-gray-400 text-sm">Notifications about project changes</p>
                      </div>
                      <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-white font-medium mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Appearance Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme
                      </label>
                      <select className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Code Editor Theme
                      </label>
                      <select className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="vscode-dark">VS Code Dark</option>
                        <option value="monokai">Monokai</option>
                        <option value="github-dark">GitHub Dark</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="20"
                        defaultValue="14"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Language Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Interface Language
                      </label>
                      <select className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Code Language Preference
                      </label>
                      <select className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Data & Storage</h2>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-800 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-2">Storage Usage</h3>
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <p className="text-gray-400 text-sm">3.5 GB of 10 GB used</p>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium mb-4">Export Data</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Download all your project data and settings
                      </p>
                      <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                        Export All Data
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-800 pt-4">
                      <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Permanently delete your account and all data
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
