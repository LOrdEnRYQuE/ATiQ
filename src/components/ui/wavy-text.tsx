"use client"

import clsx from "clsx"
import { AnimatePresence, motion } from "motion/react"

interface WavyTextProps {
  text?: string
  className?: string
  variant?: "default" | "gradient" | "glow" | "rainbow"
}

export const WavyText: React.FC<WavyTextProps> = ({
  text = "",
  className = "",
  variant = "gradient"
}) => {
  const getVariants = (index: number) => {
    const baseVariants = {
      hidden: { 
        y: 15, 
        opacity: 0,
        scale: 0.8,
        rotateX: 15
      },
      visible: { 
        y: -15, 
        opacity: 1,
        scale: 1,
        rotateX: 0
      },
    }

    // Add different wave patterns based on variant
    if (variant === "rainbow") {
      return {
        ...baseVariants,
        hidden: { 
          ...baseVariants.hidden,
          rotate: index % 2 === 0 ? -10 : 10,
          scale: 0.7
        },
        visible: { 
          ...baseVariants.visible,
          rotate: 0,
          scale: 1.1
        }
      }
    }

    return baseVariants
  }

  const getTextClass = () => {
    const baseClass = "font-display text-center font-bold"
    const sizeClass = "text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
    const spacingClass = "tracking-[-0.02em]"
    const leadingClass = "md:leading-[4rem] lg:leading-[4.5rem] xl:leading-[5rem]"
    
    const variantClasses = {
      default: "text-white drop-shadow-lg",
      gradient: "text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-lg",
      glow: "text-white drop-shadow-2xl",
      rainbow: "text-transparent bg-clip-text bg-linear-to-r from-red-400 via-yellow-400 to-green-400 via-blue-400 to-purple-600 drop-shadow-lg"
    }

    return clsx(baseClass, sizeClass, spacingClass, leadingClass, variantClasses[variant])
  }

  const getContainerClass = () => {
    const baseClass = "flex justify-center space-x-1"
    const variantContainerClasses = {
      default: "",
      gradient: "relative",
      glow: "relative",
      rainbow: "relative"
    }

    return clsx(baseClass, variantContainerClasses[variant], className)
  }

  return (
    <div className={getContainerClass()}>
      {/* Glow effects for specific variants */}
      {variant === "glow" && (
        <div className="absolute inset-0 blur-xl opacity-50">
          <div className="w-full h-full bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full" />
        </div>
      )}
      
      {variant === "rainbow" && (
        <div className="absolute inset-0 blur-xl opacity-30">
          <div className="w-full h-full bg-linear-to-r from-red-400 via-orange-400 to-emerald-400 via-blue-500 to-purple-600 rounded-full" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {text.split("").map((char, i) => (
          <motion.h1
            key={`${i}-${char}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={getVariants(i)}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: variant === "rainbow" ? 0.8 : 0.6,
              delay: i * 0.15,
              ease: "easeInOut",
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
            className={getTextClass()}
            style={{
              textShadow: variant === "glow" 
                ? `0 0 20px rgba(0, 122, 204, 0.8), 0 0 40px rgba(0, 122, 204, 0.4), 0 0 60px rgba(0, 122, 204, 0.2)`
                : variant === "rainbow"
                ? `0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)`
                : "0 4px 6px rgba(0, 0, 0, 0.3)"
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.h1>
        ))}
      </AnimatePresence>

      {/* Additional decorative elements */}
      {variant === "gradient" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-purple-600 via-blue-500 to-cyan-400 opacity-50" />
        </div>
      )}
    </div>
  )
}
