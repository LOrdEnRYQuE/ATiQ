'use client'

import { useState } from 'react'
import { CheckCircle, Plus, Trash2, ExternalLink, Shield, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/simple-dialog'
import { 
  useIntegrations, 
  Provider, 
  INTEGRATION_CONFIG,
  IntegrationConfig 
} from '@/lib/store/integrations'

interface ConnectDialogProps {
  provider: Provider
  config: IntegrationConfig
  onSave: (key: string) => void
  children: React.ReactNode
}

function ConnectDialog({ provider, config, onSave, children }: ConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!key.trim()) return
    
    setLoading(true)
    try {
      onSave(key.trim())
      setKey('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to save integration:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="bg-black border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">{config.icon}</span>
            <span>Connect {config.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">API Key</label>
            <Input
              type="password"
              placeholder={config.keyPlaceholder}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-400">
              {config.keyHelp}
            </p>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <Shield className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">
              Your API keys are stored securely and only used for deployments.
            </span>
          </div>

          <div className="flex justify-between items-center">
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Get API Key</span>
            </a>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-700 hover:bg-gray-900/50"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!key.trim() || loading}
                className="bg-linear-to-r from-green-400 via-blue-400 to-purple-400 text-black font-semibold hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function IntegrationsGrid() {
  const { hasKey, setKey, removeKey } = useIntegrations()

  const providers: Provider[] = ['vercel', 'github', 'expo', 'netlify', 'apple', 'google']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => {
        const config = INTEGRATION_CONFIG[provider]
        const isConnected = hasKey(provider)
        
        return (
          <div 
            key={provider} 
            className="relative p-6 border border-gray-800 rounded-xl bg-gray-900/50 backdrop-blur-sm overflow-hidden group hover:border-gray-700 transition-all duration-300"
          >
            {/* Background gradient effect */}
            <div className={`absolute inset-0 bg-linear-to-br ${config.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-2xl">{config.icon}</span>
                </div>
                
                {isConnected ? (
                  <span className="flex items-center text-green-400 text-xs font-bold uppercase bg-green-400/10 border border-green-400/30 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs font-bold uppercase bg-gray-800/50 border border-gray-700 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-lg text-white mb-2">{config.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{config.description}</p>

              {/* Action Button */}
              {isConnected ? (
                <Button
                  variant="outline"
                  onClick={() => removeKey(provider)}
                  className="w-full border-red-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-600 hover:text-red-300 transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <ConnectDialog
                  provider={provider}
                  config={config}
                  onSave={(key) => setKey(provider, key)}
                >
                  <Button className="w-full bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 text-black font-semibold hover:opacity-90 transition-opacity">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </ConnectDialog>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
