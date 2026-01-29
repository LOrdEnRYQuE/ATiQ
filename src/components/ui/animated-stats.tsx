"use client"

import { useState, useEffect } from "react"

interface AnimatedStatsProps {
  className?: string
}

export function AnimatedStats({ className = "" }: AnimatedStatsProps) {
  const [counters, setCounters] = useState({
    developers: 0,
    codeGenerated: 0,
    uptime: 0,
    support: 0
  })

  const targetValues = {
    developers: 100000,
    codeGenerated: 5000000,
    uptime: 99.9,
    support: 24
  }

  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const interval = duration / steps

    const incrementValues = {
      developers: targetValues.developers / steps,
      codeGenerated: targetValues.codeGenerated / steps,
      uptime: targetValues.uptime / steps,
      support: targetValues.support / steps
    }

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      
      setCounters({
        developers: Math.min(Math.floor(currentStep * incrementValues.developers), targetValues.developers),
        codeGenerated: Math.min(Math.floor(currentStep * incrementValues.codeGenerated), targetValues.codeGenerated),
        uptime: Math.min(currentStep * incrementValues.uptime, targetValues.uptime),
        support: Math.min(Math.floor(currentStep * incrementValues.support), targetValues.support)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`
    return num.toString()
  }

  const stats = [
    {
      value: formatNumber(counters.developers),
      label: "Developers",
      color: "from-cyan-400 to-blue-600",
      icon: "👥"
    },
    {
      value: formatNumber(counters.codeGenerated),
      label: "Code Generated",
      color: "from-purple-400 to-pink-600",
      icon: "💻"
    },
    {
      value: `${counters.uptime.toFixed(1)}%`,
      label: "Uptime",
      color: "from-green-400 to-emerald-600",
      icon: "⚡"
    },
    {
      value: `${counters.support}/7`,
      label: "Support",
      color: "from-orange-400 to-red-600",
      icon: "🎯"
    }
  ]

  return (
    <div className={`relative ${className}`}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by the Best
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of developers who are already building the future
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-linear-to-r ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-500`} />
              
              {/* Card */}
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center hover:border-gray-700 transition-all duration-500">
                {/* Icon */}
                <div className={`text-5xl mb-4 bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </div>
                
                {/* Value */}
                <div className={`text-4xl md:text-5xl font-bold mb-2 bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className="text-gray-400 text-lg">
                  {stat.label}
                </div>
                
                {/* Animated underline */}
                <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-linear-to-r ${stat.color} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 px-6 py-3 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-300">Live stats updated in real-time</span>
          </div>
        </div>
      </div>
    </div>
  )
}
