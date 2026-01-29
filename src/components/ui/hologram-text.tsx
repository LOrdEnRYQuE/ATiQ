"use client"

import { useState, useEffect, useRef } from "react"

interface HologramTextProps {
  text: string
  className?: string
  glitch?: boolean
}

export function HologramText({ text, className = "", glitch = false }: HologramTextProps) {
  const [glitchText, setGlitchText] = useState(text)
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!glitch) return

    const interval = setInterval(() => {
      setIsGlitching(true)
      
      const glitchChars = '!@#$%^&*()_+-=[]{}|;:<>?,./'
      let glitchedText = ''
      
      for (let i = 0; i < text.length; i++) {
        if (Math.random() > 0.8) {
          glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)]
        } else {
          glitchedText += text[i]
        }
      }
      
      setGlitchText(glitchedText)
      offsetRef.current = {
        x: Math.random() * 4 - 2,
        y: Math.random() * 4 - 2
      }
      setGlitchOffset(offsetRef.current)
      
      setTimeout(() => {
        setGlitchText(text)
        setIsGlitching(false)
        setGlitchOffset({ x: 0, y: 0 })
      }, 100)
    }, 3000)

    return () => clearInterval(interval)
  }, [text, glitch])

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          relative inline-block
          ${isGlitching ? 'animate-pulse' : ''}
        `}
      >
        <span className="relative z-20 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600">
          {text}
        </span>
        <span 
          className="absolute inset-0 text-transparent bg-clip-text bg-linear-to-r from-pink-400 via-red-500 to-orange-600"
          style={{
            transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)`,
            opacity: isGlitching ? 0.8 : 0,
          }}
        >
          {glitchText}
        </span>
        <span 
          className="absolute inset-0 text-transparent bg-clip-text bg-linear-to-r from-green-400 via-emerald-500 to-teal-600"
          style={{
            transform: `translate(${glitchOffset.x * 1.5}px, ${glitchOffset.y * 1.5}px)`,
            opacity: isGlitching ? 0.6 : 0,
          }}
        >
          {glitchText}
        </span>
      </div>
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 blur-xl opacity-50"
        style={{
          background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3), rgba(0, 255, 0, 0.3))',
          filter: 'blur(20px)',
          transform: isGlitching ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.1s',
        }}
      />
    </div>
  )
}
