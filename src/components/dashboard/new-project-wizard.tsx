"use client"

import { useState } from "react"
import { ProjectBlueprint } from "@/lib/blueprint"
import { 
  Sparkles, Loader2, Server, Smartphone, Globe, Monitor, 
  Check, ArrowRight, Layout 
} from "lucide-react"

interface NewProjectWizardProps {
  isOpen: boolean
  onClose: () => void
  onLaunch: (blueprint: ProjectBlueprint) => void
}

function Button({ className = "", variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" | "ghost" }) {
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500"
  const variants = variant === "outline"
    ? "border border-gray-700 text-gray-200 hover:border-purple-400"
    : variant === "ghost"
    ? "text-slate-400 hover:text-white hover:bg-slate-800"
    : "bg-purple-600 hover:bg-purple-700 text-white"
  return <button className={`${base} ${variants} ${className}`} {...props} />
}

export function NewProjectWizard({ isOpen, onClose, onLaunch }: NewProjectWizardProps) {
  const [step, setStep] = useState(1)
  const [description, setDescription] = useState("")
  const [isConsulting, setIsConsulting] = useState(false)
  
  const [blueprint, setBlueprint] = useState<ProjectBlueprint>({
    name: "My Project",
    type: "web_app",
    framework: "react",
    styling: "tailwind",
    description: "",
    features: [],
    rationale: ""
  })

  const consultAI = async () => {
    if (!description.trim()) return
    setIsConsulting(true)
    setStep(2)

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: description }),
      })
      
      if (!res.ok) throw new Error("Consultation failed")
      
      const data = await res.json()
      
      setBlueprint(prev => ({
        ...prev,
        ...data,
        name: generateNameFromDescription(description),
        description: description
      }))
      setStep(3)
    } catch (e) {
      console.error(e)
      setBlueprint(prev => ({ ...prev, description }))
      setStep(3)
    } finally {
      setIsConsulting(false)
    }
  }

  const generateNameFromDescription = (desc: string) => {
    const words = desc.split(' ').slice(0, 3).map(w => w.replace(/[^a-zA-Z]/g, ''))
    return words.join('') || "MyProject"
  }

  const handleLaunch = () => {
    onLaunch(blueprint)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-3xl w-full mx-4 bg-slate-950 text-white border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        
        {/* Step 1: Input */}
        {step === 1 && (
          <div className="flex-1 p-8 flex flex-col justify-center space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-blue-400">
                What are you building?
              </h2>
              <p className="text-slate-400 text-lg">
                Describe your idea. Our AI Architect will design the stack.
              </p>
            </div>
            
            <textarea 
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-5 text-lg focus:border-purple-500 outline-none resize-none transition-all placeholder:text-slate-600"
              placeholder="e.g. A marketplace for vintage cameras with a bidding system and user profiles..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); consultAI(); }}}
            />
            
            <Button 
              onClick={consultAI} 
              disabled={!description.trim()}
              className="w-full h-14 text-lg font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-all"
            >
              Analyze & Build Blueprint <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Step 2: Analysis Animation */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse" />
              <Loader2 className="w-20 h-20 text-purple-400 animate-spin relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-medium text-white">Architecting Solution...</h3>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Selecting the best framework, designing the database schema, and planning component structure.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: The Blueprint Review */}
        {step === 3 && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-400" />
                  Project Blueprint
                </h3>
                <p className="text-sm text-slate-400 mt-1">{blueprint.rationale}</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                AI OPTIMIZED
              </div>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {/* Stack Info */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Architecture</span>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      {blueprint.type.includes('mobile') ? <Smartphone className="w-5 h-5 text-blue-400"/> : 
                       blueprint.type.includes('desktop') ? <Monitor className="w-5 h-5 text-blue-400"/> : 
                       <Globe className="w-5 h-5 text-blue-400"/>}
                      <span className="capitalize text-lg">{blueprint.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Server className="w-5 h-5 text-purple-400"/>
                      <span className="capitalize text-lg">{blueprint.framework} Framework</span>
                    </div>
                  </div>
                </div>

                {/* Styling Info */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Design System</span>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex items-center h-full">
                     <span className="capitalize text-lg">{blueprint.styling.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Modules</span>
                <div className="flex flex-wrap gap-2">
                  {blueprint.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200">
                      <Check className="w-4 h-4 text-green-400" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                Back to Idea
              </Button>
              <Button 
                onClick={handleLaunch} 
                className="flex-1 h-12 text-lg font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
              >
                Launch Workspace <RocketIcon className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  )
}
