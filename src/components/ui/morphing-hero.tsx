"use client"

import { useState, useEffect, useMemo } from "react"

interface MorphingHeroProps {
  className?: string
}

export function MorphingHero({ className = "" }: MorphingHeroProps) {
  const [currentWord, setCurrentWord] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const words = [
    "CODE",
    "CREATE", 
    "INNOVATE",
    "TRANSFORM",
    "ACCELERATE"
  ]

  const subWords = [
    "at the speed of thought",
    "with AI intelligence", 
    "beyond imagination",
    "your ideas into reality",
    "development 10x faster"
  ]

  const particles = useMemo(() => 
    [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2
    })), []
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      
      setTimeout(() => {
        setCurrentWord((prev) => (prev + 1) % words.length)
        setIsTransitioning(false)
      }, 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <div className={`relative ${className}`}>
      {/* Background morphing shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#007acc] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#ff00ff] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-[#00ff00] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />
      </div>

      {/* Morphing text */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <h1 
            className={`
              text-6xl md:text-8xl lg:text-9xl font-bold transition-all duration-500 transform
              ${isTransitioning ? 'opacity-0 scale-110 rotate-3' : 'opacity-100 scale-100 rotate-0'}
            `}
          >
            <span className="inline-block text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse">
              {words[currentWord]}
            </span>
          </h1>
        </div>

        <div className="mb-12">
          <p 
            className={`
              text-2xl md:text-3xl lg:text-4xl text-[#cccccc] transition-all duration-500 transform
              ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
            `}
          >
            {subWords[currentWord]}
          </p>
        </div>

        {/* Animated underline */}
        <div className="relative inline-block">
          <div className="absolute inset-0 h-1 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse" />
          <div className="h-1 w-full bg-linear-to-r from-transparent via-cyan-400 to-transparent animate-pulse animation-delay-1000" />
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-[#007acc] rounded-full animate-pulse"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}
