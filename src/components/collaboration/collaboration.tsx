'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Settings, Share2, Lock, Unlock, MessageSquare, GitBranch, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar_url?: string
  last_active: string
  permissions: {
    can_edit: boolean
    can_share: boolean
    can_delete: boolean
    can_manage_members: boolean
  }
}

interface Project {
  id: string
  name: string
  description?: string
  is_public: boolean
  owner_id: string
  created_at: string
  updated_at: string
  team_members?: TeamMember[]
}

interface CollaborationProps {
  projectId: string
  onProjectUpdate?: (project: Project) => void
}

export default function Collaboration({ projectId, onProjectUpdate }: CollaborationProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'activity'>('members')

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails()
      fetchTeamMembers()
    }
  }, [projectId])

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      
      // Map database data to Project interface
      const mappedProject: Project = {
        id: data.id,
        name: data.name,
        description: undefined,
        is_public: false,
        owner_id: data.user_id || '',
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        team_members: []
      }
      
      setProject(mappedProject)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      // For now, get basic project info without collaboration features
      // TODO: Implement full collaboration after database migration
      const { data: projectData } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      if (projectData?.user_id) {
        // Get the owner as a team member
        const { data: userData } = await supabase.auth.admin.getUserById(projectData.user_id)
        
        const ownerMember: TeamMember = {
          id: projectData.user_id,
          user_id: projectData.user_id,
          email: userData.user?.email || 'Unknown',
          full_name: userData.user?.user_metadata?.full_name || 'Project Owner',
          role: 'owner',
          last_active: new Date().toISOString(),
          permissions: {
            can_edit: true,
            can_share: true,
            can_delete: true,
            can_manage_members: true
          }
        }

        setTeamMembers([ownerMember])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
      setIsLoading(false)
    }
  }

  const inviteTeamMember = async () => {
    // TODO: Implement team member invitations when database schema is updated
    console.log('Invite team member not implemented yet')
    setInviteEmail('')
    setShowInviteModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-600">Collaboration Settings</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {teamMembers.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {teamMembers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-4">Invite team members to collaborate on this project</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite First Member
              </button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {member.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.full_name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Project Visibility</h4>
                  <p className="text-sm text-gray-600">
                    Only team members can access this project
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={inviteTeamMember}
                disabled={!inviteEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
