# Vibe Coding - Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Environment Variables Setup

Copy the environment variables from `.env.production.example` to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from `.env.production.example`

**Critical Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini AI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PK` - Stripe publishable key

### 2. Database Migration

Run the database migration to add collaboration features:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20240129000001_add_collaboration_features.sql
```

### 3. Deploy Application

```bash
# Install dependencies
npm install

# Build and deploy
npm run build
vercel --prod
```

### 4. Verify Deployment

Check these endpoints:
- Health Check: `https://your-domain.vercel.app/api/health`
- Application: `https://your-domain.vercel.app`

## 🔧 Configuration Details

### Supabase Setup
1. Create a new Supabase project
2. Run the provided migration script
3. Enable Row Level Security (RLS)
4. Set up authentication providers

### Stripe Setup
1. Create a Stripe account
2. Get API keys from Stripe Dashboard
3. Configure webhooks for payment processing

### Monitoring Setup
1. Vercel Analytics is automatically enabled
2. Optional: Set up Sentry for error tracking
3. Monitor health check endpoint

## 📊 Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migration applied
- [ ] Stripe webhooks configured
- [ ] Custom domain set up (optional)
- [ ] Error monitoring configured
- [ ] Health check passing
- [ ] User registration/login working
- [ ] AI code generation functional
- [ ] Payment processing working

## 🚨 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys
- Check if migration was applied
- Ensure RLS policies are correct

### Authentication Issues
- Verify Supabase auth configuration
- Check redirect URLs in Supabase settings
- Ensure environment variables match

### Payment Issues
- Verify Stripe API keys
- Check webhook endpoint configuration
- Ensure webhook secret matches

## 📈 Monitoring

### Health Check Endpoint
`GET /api/health` returns:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": { "configured": 7, "total": 7 }
}
```

### Analytics
- Vercel Analytics: Automatic page views and performance
- Custom analytics: AI usage and user activity
- Error tracking: Sentry integration (optional)

## 🎯 Post-Deployment

1. **Monitor Performance**: Check Vercel Analytics
2. **Test User Flows**: Registration → AI Generation → Payment
3. **Set Up Alerts**: Configure error notifications
4. **Custom Domain**: Add branded domain
5. **Documentation**: Create user guides

## 🆘 Support

For issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection
4. Review application logs
5. Contact support via `/api/support` endpoint
