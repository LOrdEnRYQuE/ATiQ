'use client'

import { Globe } from 'lucide-react'

interface PreviewFrameProps {
  children: React.ReactNode
  metadata?: {
    type?: string
    framework?: string
  }
}

export function PreviewFrame({ children, metadata }: PreviewFrameProps) {
  const type = metadata?.type || 'web_app'

  if (type === 'mobile_app') {
    return (
      <div className="mx-auto border-14 border-slate-900 rounded-[3rem] h-[800px] w-[375px] overflow-hidden shadow-2xl bg-black relative">
        {/* iPhone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-20"></div>
        
        {/* Status Bar */}
        <div className="absolute top-2 left-0 right-0 flex justify-between items-center px-8 text-white text-xs z-10">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 border border-white rounded-sm"></div>
            <div className="w-4 h-3 bg-white rounded-sm"></div>
            <div className="w-4 h-3 bg-white rounded-sm"></div>
          </div>
        </div>
        
        {/* Screen */}
        <div className="h-full w-full bg-white overflow-hidden">
          {children}
        </div>
      </div>
    )
  }

  if (type === 'desktop_app') {
    return (
      <div className="h-full flex flex-col rounded-xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Title Bar */}
        <div className="h-10 bg-slate-800 flex items-center px-4 gap-2">
          {/* Traffic Lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
          </div>
          
          {/* Window Title */}
          <div className="flex-1 text-center">
            <span className="text-xs text-slate-300 font-medium">
              {metadata?.framework ? `${metadata.framework.charAt(0).toUpperCase() + metadata.framework.slice(1)} Application` : 'Desktop Application'}
            </span>
          </div>
          
          {/* Window Controls Spacer */}
          <div className="w-16"></div>
        </div>
        
        {/* Content */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {children}
        </div>
      </div>
    )
  }

  // Default Web Frame
  return (
    <div className="h-full flex flex-col">
      {/* Browser Bar */}
      <div className="h-10 bg-slate-100 border-b border-slate-300 flex items-center px-3 gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        
        {/* Address Bar */}
        <div className="flex-1 flex items-center bg-white rounded px-3 py-1 border border-slate-300">
          <Globe className="w-3 h-3 text-slate-500 mr-2" />
          <span className="text-xs text-slate-600 font-mono">
            {metadata?.framework === 'nextjs' ? 'localhost:3000' : 'localhost:5173'}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 bg-white">
        {children}
      </div>
    </div>
  )
}
