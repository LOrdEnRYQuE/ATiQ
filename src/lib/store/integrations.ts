import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'vercel' | 'github' | 'expo' | 'netlify' | 'apple' | 'google'

interface IntegrationStore {
  keys: Record<Provider, string>
  setKey: (provider: Provider, key: string) => void
  removeKey: (provider: Provider) => void
  hasKey: (provider: Provider) => boolean
  getKey: (provider: Provider) => string | undefined
  clearAll: () => void
}

export const useIntegrations = create<IntegrationStore>()(
  persist(
    (set, get) => ({
      keys: {} as Record<Provider, string>,
      setKey: (provider, key) => set((state) => ({ 
        keys: { ...state.keys, [provider]: key } 
      })),
      removeKey: (provider) => set((state) => {
        const newKeys = { ...state.keys }
        delete newKeys[provider]
        return { keys: newKeys }
      }),
      hasKey: (provider) => !!get().keys[provider],
      getKey: (provider) => get().keys[provider],
      clearAll: () => set({ keys: {} as Record<Provider, string> })
    }),
    { 
      name: 'vibe-integrations-vault',
      // Add encryption for sensitive data in production
      // For now, basic localStorage persistence
    }
  )
)

// Integration metadata
export const INTEGRATION_CONFIG = {
  vercel: {
    name: 'Vercel',
    description: 'One-click web deployment',
    icon: '⚡',
    color: 'from-gray-900 to-gray-700',
    keyPlaceholder: 'Enter your Vercel API Token...',
    keyHelp: 'Get your token from Vercel dashboard → Settings → Tokens',
    docsUrl: 'https://vercel.com/docs/rest-api#creating-an-access-token'
  },
  github: {
    name: 'GitHub',
    description: 'Code storage & Build pipeline',
    icon: '🐙',
    color: 'from-gray-800 to-gray-600',
    keyPlaceholder: 'Enter your GitHub Personal Access Token...',
    keyHelp: 'Create a token with repo permissions at GitHub → Settings → Developer settings',
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
  },
  expo: {
    name: 'Expo',
    description: 'iOS & Android Publishing',
    icon: '📱',
    color: 'from-blue-600 to-blue-400',
    keyPlaceholder: 'Enter your Expo Access Token...',
    keyHelp: 'Get your token from Expo account → Settings → Access Tokens',
    docsUrl: 'https://docs.expo.dev/accounts/programmatic-access/'
  },
  netlify: {
    name: 'Netlify',
    description: 'Static site hosting',
    icon: '🌐',
    color: 'from-cyan-600 to-cyan-400',
    keyPlaceholder: 'Enter your Netlify Personal Access Token...',
    keyHelp: 'Get your token from Netlify → User settings → Applications',
    docsUrl: 'https://docs.netlify.com/cli/get-started/#obtain-a-site-api-token'
  },
  apple: {
    name: 'Apple Developer',
    description: 'App Store publishing',
    icon: '🍎',
    color: 'from-gray-700 to-gray-500',
    keyPlaceholder: 'Enter your Apple Developer API Key...',
    keyHelp: 'Create API key from Apple Developer → Certificates, Identifiers & Profiles',
    docsUrl: 'https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_the_app_store_connect_api'
  },
  google: {
    name: 'Google Play Console',
    description: 'Android app publishing',
    icon: '🤖',
    color: 'from-green-600 to-green-400',
    keyPlaceholder: 'Enter your Google Play Service Account Key...',
    keyHelp: 'Create service account from Google Play Console → Setup → API access',
    docsUrl: 'https://developers.google.com/android-publisher/getting_started'
  }
} as const

export type IntegrationConfig = typeof INTEGRATION_CONFIG[Provider]
