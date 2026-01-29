import AuthGuard from '@/components/auth/auth-guard'
import SubscriptionCard from '@/components/billing/subscription-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Shield, Check } from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  // In a real app, this would come from user data
  const currentPlan = 'free'

  const plans = [
    {
      tier: 'free' as const,
      price: '$0',
      priceId: undefined,
      features: [
        '5 projects',
        '100 AI requests per month',
        '100MB file storage',
        'Basic code editor',
        'Community support'
      ],
      highlighted: false
    },
    {
      tier: 'pro' as const,
      price: '$29',
      priceId: 'price_pro_monthly', // Will be updated after Stripe setup
      features: [
        '50 projects',
        '5,000 AI requests per month',
        '1GB file storage',
        'Advanced code editor',
        'Live preview',
        'Priority support',
        'Custom themes'
      ],
      highlighted: true
    },
    {
      tier: 'enterprise' as const,
      price: '$99',
      priceId: 'price_enterprise_monthly', // Will be updated after Stripe setup
      features: [
        'Unlimited projects',
        'Unlimited AI requests',
        '10GB file storage',
        'All Pro features',
        'Real-time collaboration',
        'Advanced analytics',
        'Dedicated support',
        'Custom integrations'
      ],
      highlighted: false
    }
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                  <Crown className="h-8 w-8 text-yellow-500 mr-3" />
                  <h1 className="text-xl font-semibold text-gray-900">Billing & Plans</h1>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Current Plan Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-500" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium capitalize">{currentPlan} Plan</h3>
                    <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                      {currentPlan === 'free' ? 'Free' : 'Active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentPlan === 'free' 
                      ? 'Upgrade to unlock more features and higher limits'
                      : 'Your subscription is active and renewed monthly'
                    }
                  </p>
                </div>
                {currentPlan !== 'free' && (
                  <Button variant="outline">
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <SubscriptionCard
                key={plan.tier}
                tier={plan.tier}
                price={plan.price}
                priceId={plan.priceId}
                features={plan.features}
                highlighted={plan.highlighted}
                currentPlan={currentPlan}
              />
            ))}
          </div>

          {/* Features Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                Feature Comparison
              </CardTitle>
              <CardDescription>
                Compare all features across our pricing plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">Free</th>
                      <th className="text-center py-3 px-4">Pro</th>
                      <th className="text-center py-3 px-4">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Projects</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">50</td>
                      <td className="text-center py-3 px-4">Unlimited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">AI Requests</td>
                      <td className="text-center py-3 px-4">100/month</td>
                      <td className="text-center py-3 px-4">5,000/month</td>
                      <td className="text-center py-3 px-4">Unlimited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">File Storage</td>
                      <td className="text-center py-3 px-4">100MB</td>
                      <td className="text-center py-3 px-4">1GB</td>
                      <td className="text-center py-3 px-4">10GB</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Live Preview</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Priority Support</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Real-time Collaboration</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">
                      Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                    </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What happens if I exceed limits?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You&apos;ll be notified when approaching limits. Upgrade to Pro or Enterprise for higher limits.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is there a free trial?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes! Start with our free plan to explore all features. No credit card required.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How do I cancel?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Cancel anytime from your billing dashboard. Your access continues until the end of the billing period.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
