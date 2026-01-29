"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Rocket, Play } from "lucide-react"

interface EnhancedHeroProps {
  className?: string
}

export function EnhancedHero({ className = "" }: EnhancedHeroProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length)
        setIsTransitioning(false)
      }, 800)
    }, 4000)

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      {/* Enhanced background with subtle gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black opacity-50" />
      
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse animation-delay-6000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center flex flex-col justify-center items-center min-h-screen px-4">
        <div className="mb-12">
          {/* Main morphing word */}
          <h1 className="relative">
            <div
              className={`
                text-6xl md:text-8xl lg:text-9xl font-bold transition-all duration-1000 ease-in-out
                ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
              `}
            >
              <span className="inline-block text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600">
                {words[currentWordIndex]}
              </span>
            </div>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="mb-12">
          <p 
            className={`
              text-2xl md:text-3xl lg:text-4xl text-gray-300 transition-all duration-1000 ease-in-out
              ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
            `}
          >
            {subWords[currentWordIndex]}
          </p>
        </div>

        {/* Enhanced underline */}
        <div className="relative inline-block mb-12">
          <div className="h-1 w-32 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full" />
          <div className="absolute inset-0 h-1 w-32 bg-linear-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse" />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <Link href="/auth">
            <div className="group relative inline-block">
              {/* Electro gradient background */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse" style={{ background: 'linear-gradient(45deg, #3498db, #9b59b6, #e74c3c, #3498db)' }} />
                <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" style={{ background: 'linear-gradient(135deg, #06b6d4, #03a9f4, #7a4dff, #06b6d4)' }} />
              </div>
              {/* Electric border effect */}
              <div className="absolute inset-0 rounded-lg p-px">
                <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                     style={{
                       background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                       backgroundSize: '200% 200%',
                       animation: 'electro 2s ease-in-out infinite'
                     }} />
              </div>
              <button className="relative px-8 py-4 bg-black text-white text-lg font-bold rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                <span className="flex items-center">
                  Enter the Matrix
                  <Rocket className="ml-2 h-5 w-5" />
                </span>
              </button>
            </div>
          </Link>
          
          <button className="relative px-8 py-4 bg-gray-900/50 backdrop-blur-sm text-gray-300 text-lg font-bold rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105">
            <span className="flex items-center">
              <Play className="mr-2 h-5 w-5" />
              Watch Reality
            </span>
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center space-x-12 text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Break boundaries</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Redefine possible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span>Transform reality</span>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes sweep {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        
        @keyframes electro {
          0% {
            background-position: 0% 50%;
            opacity: 0.6;
          }
          25% {
            background-position: 100% 50%;
            opacity: 1;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.8;
          }
          75% {
            background-position: 0% 50%;
            opacity: 1;
          }
          100% {
            background-position: 0% 50%;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}
