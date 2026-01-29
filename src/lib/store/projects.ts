'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'
import type { Json } from '@/types/database'

interface Project {
  id: string
  name: string
  files: Record<string, string>
  created_at: string
  updated_at: string
  user_id: string
}

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (name: string) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  updateProjectFiles: (projectId: string, files: Record<string, string>) => Promise<void>
  clearError: () => void
}

// Helper function to convert Json to Record<string, string>
const jsonToRecord = (json: Json): Record<string, string> => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === 'string') {
        result[key] = value
      }
    }
    return result
  }
  return {}
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,

      fetchProjects: async () => {
        set({ loading: true, error: null })
        
        if (!supabase) {
          set({ error: 'Database not available', loading: false })
          return
        }
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

          if (error) throw error

          const projects: Project[] = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            files: jsonToRecord(item.files),
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            user_id: item.user_id || ''
          }))

          set({ 
            projects, 
            loading: false 
          })
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch projects',
            loading: false 
          })
        }
      },

      createProject: async (name: string) => {
        set({ loading: true, error: null })

        if (!supabase) {
          set({ error: 'Database not available', loading: false })
          throw new Error('Database not available')
        }

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          const newProject: TablesInsert<'projects'> = {
            name,
            user_id: user.id,
            files: {
              'index.js': '// Welcome to your new project\nconsole.log("Hello, World!");',
              'README.md': `# ${name}\n\nStart building your amazing project here!`
            }
          }

          const { data, error } = await supabase
            .from('projects')
            .insert(newProject)
            .select()
            .single()

          if (error) throw error

          const project: Project = {
            id: data.id,
            name: data.name,
            files: jsonToRecord(data.files),
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
            user_id: data.user_id || ''
          }

          set(state => ({
            projects: [project, ...state.projects],
            currentProject: project,
            loading: false
          }))

          return project
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create project',
            loading: false 
          })
          throw error
        }
      },

      updateProject: async (id: string, updates: Partial<Project>) => {
        set({ loading: true, error: null })

        if (!supabase) {
          set({ error: 'Database not available', loading: false })
          throw new Error('Database not available')
        }

        try {
          const { data, error } = await supabase
            .from('projects')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

          if (error) throw error

          const updatedProject: Project = {
            id: data.id,
            name: data.name,
            files: jsonToRecord(data.files),
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
            user_id: data.user_id || ''
          }

          set(state => ({
            projects: state.projects.map(p => p.id === id ? updatedProject : p),
            currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
            loading: false
          }))
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update project',
            loading: false 
          })
        }
      },

      deleteProject: async (id: string) => {
        set({ loading: true, error: null })

        if (!supabase) {
          set({ error: 'Database not available', loading: false })
          throw new Error('Database not available')
        }

        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

          if (error) throw error

          set(state => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            loading: false
          }))
        } catch (error: unknown) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete project',
            loading: false 
          })
        }
      },

      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project })
      },

      updateProjectFiles: async (projectId: string, files: Record<string, string>) => {
        if (!supabase) {
          throw new Error('Database not available')
        }

        try {
          const { error } = await supabase
            .from('projects')
            .update({ 
              files,
              updated_at: new Date().toISOString()
            })
            .eq('id', projectId)

          if (error) throw error

          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId ? { ...p, files, updated_at: new Date().toISOString() } : p
            ),
            currentProject: state.currentProject?.id === projectId 
              ? { ...state.currentProject, files, updated_at: new Date().toISOString() }
              : state.currentProject
          }))
        } catch (error: unknown) {
          console.error('Failed to update project files:', error)
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'project-store',
      partialize: (state) => ({ 
        currentProject: state.currentProject 
      })
    }
  )
)
