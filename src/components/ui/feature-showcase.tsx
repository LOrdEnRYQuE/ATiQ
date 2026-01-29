"use client"

import { useState } from "react"

interface FeatureShowcaseProps {
  className?: string
}

export function FeatureShowcase({ className = "" }: FeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: "⚡",
      title: "Quantum Speed",
      description: "Process code at the speed of thought with advanced AI algorithms",
      color: "from-cyan-400 to-blue-600"
    },
    {
      icon: "🧠",
      title: "Neural Intelligence",
      description: "Deep learning models that understand your coding patterns",
      color: "from-purple-400 to-pink-600"
    },
    {
      icon: "🔮",
      title: "Predictive Coding",
      description: "AI that anticipates your next move before you type",
      color: "from-blue-400 to-cyan-600"
    },
    {
      icon: "🚀",
      title: "Instant Deployment",
      description: "Deploy your code to production with a single click",
      color: "from-green-400 to-emerald-600"
    }
  ]

  return (
    <div className={`relative ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-linear-to-br from-cyan-500 via-blue-500 to-purple-500" />
      </div>

      <div className="relative z-10">
        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`
                relative p-6 rounded-2xl border cursor-pointer transition-all duration-500
                ${activeFeature === index 
                  ? 'bg-gray-900/80 border-cyan-500/50 shadow-xl shadow-cyan-500/20 scale-105' 
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                }
              `}
            >
              {/* Glow effect for active card */}
              {activeFeature === index && (
                <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-cyan-500/20 to-blue-500/20 blur-xl" />
              )}
              
              <div className="relative z-10">
                <div className={`text-4xl mb-4 bg-linear-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active feature display */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-800 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className={`text-6xl mb-4 bg-linear-to-r ${features[activeFeature].color} bg-clip-text text-transparent`}>
                {features[activeFeature].icon}
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{features[activeFeature].title}</h3>
              <p className="text-xl text-gray-300 mb-6">{features[activeFeature].description}</p>
              
              {/* Feature highlights */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <span className="text-gray-400">Advanced AI algorithms</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-gray-400">Real-time processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-gray-400">Seamless integration</span>
                </div>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="relative">
              <div className="h-64 bg-gray-800/50 rounded-2xl border border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-linear-to-r ${features[activeFeature].color} animate-pulse`} />
                  <div className="text-gray-400">Interactive Demo</div>
                </div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-400/20 rounded-full animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400/20 rounded-full animate-pulse animation-delay-1000" />
              <div className="absolute top-1/2 -right-8 w-6 h-6 bg-purple-400/20 rounded-full animate-pulse animation-delay-2000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
