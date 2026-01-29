"use client"

import { useEffect, useRef, useState } from "react"

interface RealityDistortionProps {
  className?: string
  children?: React.ReactNode
}

export function RealityDistortion({ className = "", children }: RealityDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [distortionLevel, setDistortionLevel] = useState(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: Array<{
      x: number
      y: number
      originalX: number
      originalY: number
      vx: number
      vy: number
      size: number
      color: string
      phase: number
    }> = []

    // Initialize particles in a grid pattern
    for (let i = 0; i < 100; i++) {
      const x = (i % 10) * 80 + 40
      const y = Math.floor(i / 10) * 80 + 40
      
      particles.push({
        x,
        y,
        originalX: x,
        originalY: y,
        vx: 0,
        vy: 0,
        size: Math.random() * 3 + 1,
        color: `hsl(${180 + Math.random() * 180}, 70%, 50%)`,
        phase: Math.random() * Math.PI * 2
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(30, 30, 30, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const time = Date.now() * 0.001

      particles.forEach((particle, i) => {
        // Calculate distance from mouse
        const dx = mousePosition.x - particle.x
        const dy = mousePosition.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Reality distortion effect
        if (distance < 200) {
          const force = (200 - distance) / 200
          const angle = Math.atan2(dy, dx)
          
          // Apply distortion force
          particle.vx += Math.cos(angle) * force * 2
          particle.vy += Math.sin(angle) * force * 2
          
          // Add spiral motion
          const spiralAngle = angle + Math.PI / 2
          particle.vx += Math.cos(spiralAngle) * force * 1
          particle.vy += Math.sin(spiralAngle) * force * 1
        }

        // Return to original position
        const returnForce = 0.05
        particle.vx += (particle.originalX - particle.x) * returnForce
        particle.vy += (particle.originalY - particle.y) * returnForce

        // Apply velocity
        particle.x += particle.vx
        particle.y += particle.vy

        // Apply damping
        particle.vx *= 0.9
        particle.vy *= 0.9

        // Add wave motion
        const waveX = Math.sin(time + particle.phase) * 10
        const waveY = Math.cos(time + particle.phase) * 10

        // Draw particle with glow effect
        const finalX = particle.x + waveX * distortionLevel
        const finalY = particle.y + waveY * distortionLevel

        // Outer glow
        ctx.beginPath()
        ctx.arc(finalX, finalY, particle.size * 3, 0, Math.PI * 2)
        const glowGradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, particle.size * 3)
        glowGradient.addColorStop(0, particle.color.replace('50%', '30%').replace(')', ', 0.3)'))
        glowGradient.addColorStop(1, particle.color.replace('50%', '30%').replace(')', ', 0)'))
        ctx.fillStyle = glowGradient
        ctx.fill()

        // Core particle
        ctx.beginPath()
        ctx.arc(finalX, finalY, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // Draw connections to nearby particles
        particles.slice(i + 1).forEach(otherParticle => {
          const dx2 = otherParticle.x - particle.x
          const dy2 = otherParticle.y - particle.y
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

          if (distance2 < 100) {
            ctx.beginPath()
            ctx.moveTo(finalX, finalY)
            ctx.lineTo(otherParticle.x + Math.sin(time + otherParticle.phase) * 10 * distortionLevel, 
                      otherParticle.y + Math.cos(time + otherParticle.phase) * 10 * distortionLevel)
            
            const opacity = (1 - distance2 / 100) * 0.5
            ctx.strokeStyle = `rgba(0, 122, 204, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [mousePosition, distortionLevel])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setMousePosition({ x, y })
    setDistortionLevel(Math.min(1, Math.sqrt(x * x + y * y) / 500))
  }

  const handleMouseLeave = () => {
    setDistortionLevel(0)
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
