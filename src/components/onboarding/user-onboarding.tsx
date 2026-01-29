'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Code, 
  Users, 
  Zap, 
  Crown,
  Rocket,
  Target,
  Lightbulb
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: string
  completed: boolean
  href?: string
}

export default function UserOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to Vibe Coding',
      description: 'Get started with AI-powered web development',
      icon: <Rocket className="w-6 h-6" />,
      action: 'Get Started',
      completed: false
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Start building with AI assistance',
      icon: <Code className="w-6 h-6" />,
      action: 'Create Project',
      completed: false,
      href: '/dashboard'
    },
    {
      id: 'try-ai',
      title: 'Try AI Code Generation',
      description: 'Experience the power of AI coding',
      icon: <Zap className="w-6 h-6" />,
      action: 'Try AI Assistant',
      completed: false,
      href: '/workspace/new'
    },
    {
      id: 'explore-features',
      title: 'Explore Features',
      description: 'Discover collaboration and analytics tools',
      icon: <Users className="w-6 h-6" />,
      action: 'Explore Dashboard',
      completed: false,
      href: '/dashboard'
    },
    {
      id: 'upgrade',
      title: 'Upgrade Your Plan',
      description: 'Unlock unlimited AI requests and premium features',
      icon: <Crown className="w-6 h-6" />,
      action: 'View Plans',
      completed: false,
      href: '/billing'
    }
  ])

  const progress = (steps.filter(step => step.completed).length / steps.length) * 100

  const handleStepAction = (stepIndex: number) => {
    const step = steps[stepIndex]
    
    if (step.href) {
      setTimeout(() => {
        window.location.href = step.href || '/'
      }, 100)
    }
    
    // Mark step as completed
    const updatedSteps = [...steps]
    updatedSteps[stepIndex].completed = true
    setSteps(updatedSteps)
    
    // Move to next step
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1)
    }
  }

  const skipOnboarding = () => {
    // Save preference to skip onboarding
    localStorage.setItem('onboarding_completed', 'true')
    window.location.href = '/dashboard'
  }

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true')
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-full">
              <Lightbulb className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Vibe Coding
          </h1>
          <p className="text-xl text-gray-600">
            Let&apos;s get you started with AI-powered web development
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Onboarding Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card 
              key={step.id}
              className={`relative transition-all duration-200 ${
                index === currentStep 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'hover:shadow-md'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-full ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentStep 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : index === currentStep ? (
                      <Target className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  {step.completed && (
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleStepAction(index)}
                  disabled={step.completed}
                  className="w-full"
                  variant={step.completed ? "secondary" : "default"}
                >
                  {step.completed ? 'Completed' : step.action}
                  {!step.completed && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Step Detail */}
        {currentStep < steps.length && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  {steps[currentStep].icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                  <CardDescription className="text-lg">
                    {steps[currentStep].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={skipOnboarding}
                >
                  Skip Onboarding
                </Button>
                <Button 
                  onClick={() => handleStepAction(currentStep)}
                  size="lg"
                >
                  {steps[currentStep].action}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion */}
        {progress === 100 && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 text-green-600 p-4 rounded-full">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl">🎉 You're All Set!</CardTitle>
              <CardDescription className="text-lg">
                You&apos;ve completed the onboarding. Start building amazing projects with AI!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={completeOnboarding} size="lg">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
