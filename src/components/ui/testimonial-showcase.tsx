"use client"

import { useState } from "react"

interface TestimonialShowcaseProps {
  className?: string
}

export function TestimonialShowcase({ className = "" }: TestimonialShowcaseProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Developer at TechCorp",
      content: "This AI coding assistant has completely transformed our workflow. We're shipping features 10x faster and the code quality is exceptional.",
      avatar: "👩‍💻",
      rating: 5,
      company: "TechCorp"
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO at StartupXYZ",
      content: "I've tried every AI coding tool out there, but this one is on another level. The accuracy and speed are unmatched.",
      avatar: "👨‍💼",
      rating: 5,
      company: "StartupXYZ"
    },
    {
      name: "Emily Watson",
      role: "Lead Developer at DevStudio",
      content: "The neural network integration is mind-blowing. It feels like the AI reads my mind and writes exactly what I'm thinking.",
      avatar: "👩‍🎨",
      rating: 5,
      company: "DevStudio"
    }
  ]

  return (
    <div className={`relative ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by Developers
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See what the industry leaders are saying about our AI coding platform
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`
                relative cursor-pointer transition-all duration-500
                ${activeTestimonial === index 
                  ? 'scale-105' 
                  : 'scale-100 opacity-70 hover:opacity-90'
                }
              `}
            >
              {/* Card */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full">
                {/* Rating */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>

              {/* Glow effect for active */}
              {activeTestimonial === index && (
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10" />
              )}
            </div>
          ))}
        </div>

        {/* Active testimonial highlight */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="text-4xl">{testimonials[activeTestimonial].avatar}</div>
              <div className="text-left">
                <div className="font-bold text-white text-lg">{testimonials[activeTestimonial].name}</div>
                <div className="text-gray-400">{testimonials[activeTestimonial].role}</div>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-2xl mx-1">⭐</span>
              ))}
            </div>
            
            <p className="text-xl text-gray-300 italic max-w-3xl mx-auto">
              "{testimonials[activeTestimonial].content}"
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${activeTestimonial === index 
                  ? 'bg-cyan-400 w-8' 
                  : 'bg-gray-600 hover:bg-gray-500'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
