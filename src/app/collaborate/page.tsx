'use client'

import { ArrowLeft, Users, UserPlus, Mail, Copy, Crown, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar: string
  joinedAt: string
  lastActive: string
}

export default function Collaborate() {
  const router = useRouter()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'activity'>('members')

  // Mock team members data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      avatar: 'JD',
      joinedAt: '2024-01-15',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
      avatar: 'JS',
      joinedAt: '2024-01-20',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'editor',
      avatar: 'MJ',
      joinedAt: '2024-02-01',
      lastActive: '3 hours ago'
    }
  ])

  const handleInvite = async () => {
    if (!inviteEmail) return

    try {
      // Mock invite functionality
      console.log('Inviting:', inviteEmail, 'as', inviteRole)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('editor')
    } catch (error) {
      console.error('Failed to invite:', error)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId))
  }

  const handleChangeRole = (memberId: string, newRole: TeamMember['role']) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      )
    )
  }

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-400" />
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-400" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'admin':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      case 'editor':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
      case 'viewer':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

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
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Team Collaboration</h1>
          <p className="text-gray-400 text-lg">
            Manage team members and collaborate on projects in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Members</p>
                <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Now</p>
                <p className="text-2xl font-bold text-white">2</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Invites</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'members'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Team Members
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invites'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Pending Invites
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Activity Log
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'members' && (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-linear-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-medium">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                        <p className="text-gray-500 text-xs">
                          Joined {member.joinedAt} • Last active {member.lastActive}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as TeamMember['role'])}
                        className={`px-3 py-1 rounded-lg text-sm border ${getRoleColor(member.role)} focus:outline-none`}
                        disabled={member.role === 'owner'}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'invites' && (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No pending invites</h3>
                <p className="text-gray-400 mb-6">
                  Invite team members to collaborate on your projects
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Send First Invite
                </button>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">Jane Smith</span> joined the team
                    </p>
                    <p className="text-gray-400 text-sm">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">Mike Johnson</span> was promoted to Editor
                    </p>
                    <p className="text-gray-400 text-sm">1 week ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">John Doe</span> created a new project
                    </p>
                    <p className="text-gray-400 text-sm">2 weeks ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Invite Team Member</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="editor">Editor - Can edit and comment</option>
                  <option value="viewer">Viewer - Can view only</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
