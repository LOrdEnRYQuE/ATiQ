# How to Get a New Gemini API Key

## Step 1: Go to Google AI Studio
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account

## Step 2: Create New API Key
1. Click "Create API Key" button
2. Give your API key a name (e.g., "Vibe Coding App")
3. Click "Create Key"

## Step 3: Copy the New API Key
1. Copy the generated API key (it starts with "AIzaSy...")
2. Keep it secure - don't share it publicly

## Step 4: Update Your Environment Variables

### For Local Development:
Edit your `.env.local` file and replace the old API key:

```bash
# Google Gemini AI Configuration
GEMINI_API_KEY=your_new_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_new_api_key_here
```

### For Production (Vercel):
1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Update both `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY`
4. Redeploy your application

## Step 5: Restart Development Server
```bash
# Kill existing server
pkill -f "next dev"

# Start new server
npm run dev
```

## Important Notes:
- The old API key `AIzaSyAboGZibSMu0wzpph98zeXczJgPh5BdXTs` is permanently blocked
- Never commit API keys to git repositories
- Use different keys for development and production if possible
- Monitor your API usage in Google AI Studio

## Security Best Practices:
1. Use environment variables (never hardcode keys)
2. Rotate API keys periodically
3. Use Vercel's environment variable protection
4. Monitor for unusual API usage patterns

## If You Need Help:
- Google AI Studio documentation: https://ai.google.dev/docs
- Gemini API documentation: https://ai.google.dev/docs/gemini_api_overview
