import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AnimatedBadge from '@/components/ui/animated-badge'
import { AnimatedShinyButton } from '@/components/ui/animated-shiny-button'
import { WordPullUpText } from '@/components/ui/word-pull-up-text'
import { BlurInText } from '@/components/ui/blur-in-text'
import HolographicCard from '@/components/ui/holographic-card'
import { OrbitRotation } from '@/components/ui/orbit-rotation'
import SvgRippleEffect from '@/components/ui/svg-ripple-effect'
import { Grid } from '@/components/ui/grid'
import { Cobe } from '@/components/ui/cobe-globe'
import { MacbookPro } from '@/components/ui/macbook-pro'
import { LetterPullUpText } from '@/components/ui/letter-pull-up-text'
import ScaleLetterText from '@/components/ui/scale-letter-text'
import NovatrixBackground from '@/components/ui/novatrix-background'
import { MultiDirectionSlideText } from '@/components/ui/multi-direction-slide-text'
import { EnhancedHero } from '@/components/ui/enhanced-hero'
import { FeatureShowcase } from '@/components/ui/feature-showcase'
import { AnimatedStats } from '@/components/ui/animated-stats'
import { TestimonialShowcase } from '@/components/ui/testimonial-showcase'
import { 
  Code, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Rocket, 
  Shield, 
  Globe,
  Terminal,
  Sparkles,
  Github,
  Play,
  Zap,
  Users
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white"> {/* Pure black background */}
      {/* Background Effects - Pure black theme */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse animation-delay-4000" />
      </div>

      {/* Header - Pure black theme */}
      <header className="relative z-10 border-b border-gray-900 backdrop-blur-sm bg-black/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-[#cccccc] hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-[#cccccc] hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-[#cccccc] hover:text-white transition-colors">Testimonials</a>
            </nav>
            
            {/* Center - Logo only */}
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/ATiQ_Logo.png" 
                alt="ATiQ Logo" 
                className="h-44 w-44 object-contain"
              />
            </div>
            
            {/* Right side - Auth buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-[#cccccc] hover:bg-[#333333]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <div className="group relative inline-block">
                  {/* Electro gradient background */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                    <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
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
                  <button className="relative px-4 py-2 bg-black text-white text-sm font-medium rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                    Get Started Free
                  </button>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ENHANCED HERO SECTION */}
      <main className="relative z-10">
        <section className="w-full h-screen">
          <EnhancedHero />
        </section>

        {/* NEURAL NETWORK DEMO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              NEURAL SYNAPSES
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Watch the AI brain come alive with quantum processing
            </p>
          </div>
          
          <div className="relative">
            <div className="h-96 rounded-2xl border border-gray-800 bg-gray-900/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">Neural Network Active</h3>
                <p className="text-gray-400">Quantum processing enabled</p>
              </div>
            </div>
          </div>
        </section>

        {/* ENHANCED FEATURES SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              FEATURES THAT REDEFINE POSSIBLE
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of AI-powered development
            </p>
          </div>
          <FeatureShowcase />
        </section>

        {/* ANIMATED STATS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              TRUSTED BY THE BEST
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of developers building the future
            </p>
          </div>
          <AnimatedStats />
        </section>

        {/* TESTIMONIAL SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              LOVED BY DEVELOPERS WORLDWIDE
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what industry leaders are saying
            </p>
          </div>
          <TestimonialShowcase />
        </section>

        {/* Technology Stack Section - Cursor dark theme */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powered by Modern
              <span className="text-[#007acc]">
                {" "}Technology
              </span>
            </h2>
            <p className="text-xl text-[#cccccc] max-w-3xl mx-auto">
              Built with the latest and greatest tools in the development ecosystem.
            </p>
          </div>
          
          <div className="flex justify-center mb-16">
            <OrbitRotation size="lg" className="scale-75 md:scale-100" />
          </div>
        </section>

        {/* Global Impact Section - Cursor dark theme */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <BlurInText 
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              text="Global Impact"
            />
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join developers worldwide transforming the future of coding
            </p>
          </div>
          
          <div className="flex justify-center mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-[#007acc]/10 rounded-full blur-3xl"></div>
              <Cobe className="relative z-10" />
            </div>
          </div>
        </section>

        {/* Device Showcase Section - Cursor dark theme */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <BlurInText 
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              text="Code Anywhere, Anytime"
            />
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the power of AI-driven development on any device
            </p>
          </div>
          
          <div className="flex justify-center">
            <MacbookPro 
              src="http://localhost:3000"
              className="scale-75 md:scale-100"
            />
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <BlurInText 
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              text="Everything You Need to Build Faster"
            />
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powerful features that accelerate your development workflow and help you ship better code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-64 flex flex-col justify-center items-center text-center hover:border-gray-700 transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Code Generation</h3>
              <p className="text-gray-400">Intelligent code completion and generation</p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-64 flex flex-col justify-center items-center text-center hover:border-gray-700 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Refactoring</h3>
              <p className="text-gray-400">Automated code optimization and cleanup</p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-64 flex flex-col justify-center items-center text-center hover:border-gray-700 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Team Collaboration</h3>
              <p className="text-gray-400">Real-time collaborative coding environment</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader>
                <div className="bg-linear-to-r from-red-500 to-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-base">
                  Bank-level encryption, SOC 2 compliance, and advanced security features to keep your code safe.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader>
                <div className="bg-linear-to-r from-yellow-500 to-yellow-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">One-Click Deploy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-base">
                  Deploy to Vercel, Netlify, AWS, or any platform with a single click. Automatic CI/CD included.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader>
                <div className="bg-linear-to-r from-indigo-500 to-indigo-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Global CDN</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-base">
                  Lightning-fast loading times with global CDN distribution and edge computing.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Development?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Join thousands of developers building the future with AI-powered coding tools.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth">
                <div className="group relative inline-block">
                  {/* Electro gradient background */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                    <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
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
                      Get Started Free
                      <Rocket className="ml-2 h-5 w-5" />
                    </span>
                  </button>
                </div>
              </Link>
              
              <div className="group relative inline-block">
                {/* Electro gradient background */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                  <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                  <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
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
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                  </span>
                </button>
              </div>
            </div>
            
            <div className="mt-12 flex justify-center space-x-8 text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                <span>100 free AI requests</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                <span>Setup in 30 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Cursor dark theme */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="relative">
            <div className="absolute inset-0 opacity-10">
              <Grid columns={12} rows={4} height="h-full" showPlusIcons={false} />
            </div>
            <div className="relative bg-[#007acc] rounded-2xl p-12 text-center">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">100K+</div>
                  <div className="text-[#e6f3ff]">Developers</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">5M+</div>
                  <div className="text-[#e6f3ff]">Code Generated</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-[#e6f3ff]">Uptime</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
                  <div className="text-[#e6f3ff]">Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Loved by
              <span className="bg-linear-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {" "}Developers
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See what developers are saying about Vibe Coding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  &ldquo;This tool has completely changed how I approach development. I can build prototypes in minutes instead of hours.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full mr-3" />
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-gray-400 text-sm">Frontend Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  &ldquo;The AI code quality is impressive. It&apos;s like having a senior developer pair programming with you.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-linear-to-r from-green-500 to-blue-600 rounded-full mr-3" />
                  <div>
                    <div className="font-semibold">Mike Rodriguez</div>
                    <div className="text-gray-400 text-sm">Full Stack Engineer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  &ldquo;Our team&apos;s productivity increased 3x after adopting Vibe Coding. Absolutely essential tool.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-600 rounded-full mr-3" />
                  <div>
                    <div className="font-semibold">Emily Johnson</div>
                    <div className="text-gray-400 text-sm">Tech Lead</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Code at the Speed of Thought?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are building faster and better with AI.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 text-lg px-8 py-4 h-auto">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Cursor dark theme */}
      <footer className="relative z-10 border-t border-[#333333] backdrop-blur-sm bg-[#1e1e1e]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-[#007acc] p-2 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Vibe Coding</h3>
              </div>
              <p className="text-[#cccccc]">
                The future of AI-powered development is here.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[#cccccc]">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[#cccccc]">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[#cccccc]">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#333333] mt-12 pt-8 text-center text-[#cccccc]">
            <p>&copy; 2026 Vibe Coding. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
