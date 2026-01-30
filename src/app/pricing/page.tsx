import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Navigation */}
      <header className="relative z-10 border-b border-gray-900 backdrop-blur-sm bg-black/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-[#cccccc] hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-white font-semibold">Pricing</Link>
              <Link href="/#testimonials" className="text-[#cccccc] hover:text-white transition-colors">Testimonials</Link>
            </nav>
            
            {/* Center - Logo */}
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <Image 
                src="/ATiQ_Logo.png" 
                alt="ATiQ Logo" 
                width={176}
                height={176}
                className="object-contain"
              />
            </div>

            {/* Right side - CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth" className="text-[#cccccc] hover:text-white transition-colors">Sign In</Link>
              <Button size="sm" className="bg-black text-white hover:bg-gray-900 border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" className="text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Simple, Transparent
              <span className="bg-linear-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {" "}Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your needs. Start free, scale as you grow. No hidden fees, no surprises.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 hover:text-white text-lg px-8 py-4 h-auto border border-gray-800 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="bg-black text-white border-gray-800 hover:bg-gray-800 hover:border-yellow-400/50 hover:text-white text-lg px-8 py-4 h-auto transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 text-white hover:border-gray-700 transition-all duration-300 relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="text-5xl font-bold text-white">
                $0
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <CardDescription className="text-gray-300">
                Perfect for individuals and small projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>100 AI requests per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Basic code completion</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Public projects only</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Basic templates</span>
                </li>
              </ul>
              <Button className="w-full bg-black text-white hover:bg-gray-800 hover:text-white py-3 border border-gray-800 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-black/90 backdrop-blur-sm border-2 border-yellow-400/50 text-white relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-5xl font-bold text-white">
                $29
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <CardDescription className="text-gray-300">
                For professional developers and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>5,000 AI requests per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Advanced code generation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Real-time collaboration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Private projects</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Advanced templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Button className="w-full bg-black text-white hover:bg-gray-800 hover:text-white py-3 border border-gray-800 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 text-white hover:border-gray-700 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="text-5xl font-bold text-white">
                Custom
              </div>
              <CardDescription className="text-gray-300">
                For large organizations with custom needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Unlimited AI requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Custom AI models</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>SSO & advanced security</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>On-premise deployment</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Dedicated support team</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>Custom training</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 shrink-0" />
                  <span>SLA guarantee</span>
                </li>
              </ul>
              <Button className="w-full bg-black text-white hover:bg-gray-800 hover:text-white py-3 border border-gray-800 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Compare Features
          </h2>
          <p className="text-xl text-gray-300">
            See exactly what you get with each plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-300">Feature</th>
                <th className="text-center p-4 text-white">Free</th>
                <th className="text-center p-4 text-white">Pro</th>
                <th className="text-center p-4 text-white">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">AI Requests</td>
                <td className="text-center p-4 text-white">100/month</td>
                <td className="text-center p-4 text-white">5,000/month</td>
                <td className="text-center p-4 text-white">Unlimited</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Code Generation</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Real-time Collaboration</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Private Projects</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Priority Support</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Custom AI Models</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 text-gray-300">SSO & Security</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4 text-gray-500">—</td>
                <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-green-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-300">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate any differences.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">What happens if I exceed my AI request limit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                You&apos;ll receive a notification when you&apos;re approaching your limit. You can upgrade your plan or wait for your monthly reset.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Do you offer discounts for annual billing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Yes! Save 20% with annual billing on all paid plans. Contact sales for enterprise pricing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Is my data secure?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Absolutely. We use enterprise-grade encryption, are SOC 2 compliant, and never share your code with third parties.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-black/90 backdrop-blur-sm border border-gray-800 text-center">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of developers building faster with ATiQ
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 hover:text-white text-lg px-8 py-4 h-auto border border-gray-800 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="bg-black text-white border-gray-800 hover:bg-gray-800 hover:border-yellow-400/50 hover:text-white text-lg px-8 py-4 h-auto transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25">
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
