'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import AuthGuard from '@/components/auth/auth-guard'
import { useProjectStore } from '@/lib/store/projects'

const ELECTRO_GRADIENT =
  'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)'

export default function NewWorkspacePage() {
  const router = useRouter()
  const { createProject, loading, error, clearError } = useProjectStore()
  const [name, setName] = useState('Vibe Project')
  const [placeholderName] = useState(() => {
    const rand = Math.floor(Math.random() * 900) + 100
    return `Vibe Project ${rand}`
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const disabled = loading || name.trim().length === 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()
    const projectName = name.trim() || placeholderName

    try {
      console.log('Creating project:', projectName)
      const project = await createProject(projectName)
      console.log('Project created:', project)
      router.push(`/workspace/${project.id}`)
    } catch (err) {
      console.error('Create project error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setLocalError(message)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-10 top-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute right-0 top-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute left-1/3 bottom-10 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
        </div>

        <main className="relative z-10 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-3xl bg-gray-900/80 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div
              className="p-px"
              style={{
                backgroundImage: ELECTRO_GRADIENT,
                backgroundSize: '200% 200%',
                animation: 'electro 3s ease-in-out infinite'
              }}
            >
              <div className="bg-black rounded-2xl">
                <div className="p-8 sm:p-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="relative p-2 bg-gray-900 rounded-lg border border-gray-800">
                      <Sparkles className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-white">Create a new workspace</h1>
                      <p className="text-gray-400 text-sm">Name your project and launch the AI-powered builder.</p>
                    </div>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Project name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={placeholderName}
                        className="w-full rounded-lg border border-gray-800 bg-gray-950/80 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                      />
                      <p className="text-xs text-gray-500">You can change this later in project settings.</p>
                    </div>

                    {(localError || error) && (
                      <div className="flex items-start space-x-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span className="text-sm">{localError || error}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-xs text-gray-400">
                        Starter files: <code className="text-gray-200">index.js</code>, <code className="text-gray-200">README.md</code>
                      </div>
                      <button
                        type="submit"
                        disabled={disabled}
                        className={`group relative inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
                        }`}
                        style={{
                          backgroundColor: disabled ? 'rgba(55,65,81,0.8)' : undefined,
                          backgroundImage: disabled ? 'none' : ELECTRO_GRADIENT,
                          backgroundSize: disabled ? undefined : '200% 200%',
                          animation: disabled ? undefined : 'electro 2.5s ease-in-out infinite'
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Launch workspace
                            <span className="ml-2 opacity-80 group-hover:translate-x-0.5 transition-transform">→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
