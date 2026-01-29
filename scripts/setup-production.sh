#!/bin/bash

# Vibe Coding - Production Setup Script
# This script helps configure Vercel environment variables

echo "🚀 Vibe Coding - Production Setup"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "📝 Logging into Vercel..."
vercel login

# Set environment variables
echo "⚙️  Setting up environment variables..."

# Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# AI Configuration
vercel env add GEMINI_API_KEY

# Stripe Configuration
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PK
vercel env add STRIPE_WEBHOOK_SECRET

# Application Configuration
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NODE_ENV

# Optional: Sentry
vercel env add NEXT_PUBLIC_SENTRY_DSN

echo "✅ Environment variables configured!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Fill in the actual values for each environment variable"
echo "3. Redeploy the application"
echo "4. Test the health check endpoint"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
echo "📖 Deployment Guide: ./DEPLOYMENT.md"
