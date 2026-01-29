"use client"

import { useEffect, useRef, useState } from "react"

interface NeuralNetworkProps {
  className?: string
  nodeCount?: number
  connections?: number
}

export function NeuralNetwork({ className = "", nodeCount = 20, connections = 30 }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number | null>(null)
  const nodesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, radius: number, pulse: number}>>([])
  const connectionsRef = useRef<Array<{from: number, to: number, strength: number}>>([])

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

    // Initialize nodes
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 3 + 2,
      pulse: 0
    }))

    // Initialize connections
    connectionsRef.current = Array.from({ length: connections }, () => ({
      from: Math.floor(Math.random() * nodeCount),
      to: Math.floor(Math.random() * nodeCount),
      strength: Math.random()
    }))

    const animate = () => {
      ctx.fillStyle = 'rgba(30, 30, 30, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nodes = nodesRef.current
      const connections = connectionsRef.current

      // Update nodes
      nodes.forEach((node, i) => {
        // Movement
        node.x += node.vx
        node.y += node.vy

        // Bounce off walls
        if (node.x < node.radius || node.x > canvas.width - node.radius) {
          node.vx *= -1
          node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x))
        }
        if (node.y < node.radius || node.y > canvas.height - node.radius) {
          node.vy *= -1
          node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y))
        }

        // Mouse interaction
        const dx = mousePosition.x - node.x
        const dy = mousePosition.y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          node.vx += (dx / distance) * force * 0.1
          node.vy += (dy / distance) * force * 0.1
          node.pulse = Math.min(1, node.pulse + 0.1)
        } else {
          node.pulse = Math.max(0, node.pulse - 0.05)
        }

        // Apply damping
        node.vx *= 0.99
        node.vy *= 0.99
      })

      // Draw connections
      connections.forEach(connection => {
        const fromNode = nodes[connection.from]
        const toNode = nodes[connection.to]
        
        if (fromNode && toNode) {
          const dx = toNode.x - fromNode.x
          const dy = toNode.y - fromNode.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 200) {
            ctx.beginPath()
            ctx.moveTo(fromNode.x, fromNode.y)
            ctx.lineTo(toNode.x, toNode.y)
            
            const opacity = (1 - distance / 200) * connection.strength * 0.5
            const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y)
            gradient.addColorStop(0, `rgba(0, 122, 204, ${opacity})`)
            gradient.addColorStop(0.5, `rgba(255, 0, 255, ${opacity})`)
            gradient.addColorStop(1, `rgba(0, 255, 255, ${opacity})`)
            
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      })

      // Draw nodes
      nodes.forEach(node => {
        const pulseRadius = node.radius * (1 + node.pulse * 0.5)
        
        // Outer glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, pulseRadius * 3, 0, Math.PI * 2)
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseRadius * 3)
        glowGradient.addColorStop(0, `rgba(0, 122, 204, ${0.3 * node.pulse})`)
        glowGradient.addColorStop(1, 'rgba(0, 122, 204, 0)')
        ctx.fillStyle = glowGradient
        ctx.fill()
        
        // Node core
        ctx.beginPath()
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2)
        const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseRadius)
        nodeGradient.addColorStop(0, '#ffffff')
        nodeGradient.addColorStop(0.5, '#007acc')
        nodeGradient.addColorStop(1, '#005a9e')
        ctx.fillStyle = nodeGradient
        ctx.fill()
        
        // Inner bright core
        ctx.beginPath()
        ctx.arc(node.x, node.y, pulseRadius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + node.pulse * 0.2})`
        ctx.fill()
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
  }, [nodeCount, connections, mousePosition])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
