'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/simple-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Rocket, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Settings,
  Zap,
  Github,
  Terminal
} from 'lucide-react'
import { 
  DeployTarget, 
  DeploymentConfig, 
  DeploymentResult,
  executeDeployment,
  detectDeploymentTarget
} from '@/lib/deployment-service'
import { publishService, PublishResult } from '@/lib/publish-service'
import { useIntegrations } from '@/lib/store/integrations'
import LiveTerminal from '@/components/build/live-terminal'
import { triggerWorkflowAndGetRunId } from '@/hooks/use-build-stream'

interface DeployDialogProps {
  files: Record<string, string>
  projectName: string
  children: React.ReactNode
}

export default function DeployDialog({ files, projectName, children }: DeployDialogProps) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<DeployTarget | null>(null)
  const [token, setToken] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [result, setResult] = useState<DeploymentResult | PublishResult | null>(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [buildRunId, setBuildRunId] = useState<number | undefined>()
  const [repoUrl, setRepoUrl] = useState<string>('')
  const { hasKey, getKey } = useIntegrations()

  // Auto-detect deployment target when dialog opens
  useEffect(() => {
    if (open && !target) {
      const detected = detectDeploymentTarget(files)
      setTarget(detected)
    }
  }, [open, files, target])

  const handleDeploy = async () => {
    if (!target || !token.trim()) return

    setDeploying(true)
    setResult(null)
    setShowTerminal(false)

    try {
      // Check if we have GitHub token for advanced deployment
      const githubToken = getKey('github')
      
      if (githubToken && target !== 'vercel') {
        // Use advanced deployment with live terminal
        const publishResult = await publishService.publishToStores({
          target: target === 'expo' ? 'mobile' : target === 'github' ? 'desktop' : 'web',
          projectName: projectName.replace(/\s+/g, '-').toLowerCase(),
          files,
          version: '1.0.0'
        })

        setResult(publishResult)
        
        if (publishResult.status === 'success' && publishResult.repoUrl) {
          setRepoUrl(publishResult.repoUrl)
          
          // Extract owner/repo from URL
          const repoMatch = publishResult.repoUrl.match(/github\.com\/(.+?)(?:\.git)?$/)
          if (repoMatch) {
            const repo = repoMatch[1]
            
            // Trigger workflow and get run ID
            const workflowFile = target === 'expo' ? 'deploy-mobile.yml' : 
                                 target === 'github' ? 'deploy-desktop.yml' : 'deploy-web.yml'
            
            const runId = await triggerWorkflowAndGetRunId(repo, githubToken, workflowFile)
            if (runId) {
              setBuildRunId(runId)
              setShowTerminal(true)
            }
          }
        }
      } else {
        // Use simple deployment
        const config: DeploymentConfig = {
          target,
          token: token.trim(),
          projectName: projectName.replace(/\s+/g, '-').toLowerCase()
        }

        const deploymentResult = await executeDeployment(files, config)
        setResult(deploymentResult)
      }

    } catch (error) {
      setResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Deployment failed'
      })
    } finally {
      setDeploying(false)
    }
  }

  const getTargetIcon = (target: DeployTarget) => {
    switch (target) {
      case 'vercel':
        return '⚡'
      case 'expo':
        return '📱'
      case 'github':
        return '🐙'
      default:
        return '🚀'
    }
  }

  const getTargetName = (target: DeployTarget) => {
    switch (target) {
      case 'vercel':
        return 'Vercel (Web)'
      case 'expo':
        return 'Expo (Mobile)'
      case 'github':
        return 'GitHub Actions (Desktop)'
      default:
        return 'Unknown'
    }
  }

  const getTokenPlaceholder = (target: DeployTarget) => {
    switch (target) {
      case 'vercel':
        return 'Enter your Vercel API Token...'
      case 'expo':
        return 'Enter your Expo Access Token...'
      case 'github':
        return 'Enter your GitHub Personal Access Token...'
      default:
        return 'Enter API Token...'
    }
  }

  const getTokenHelpText = (target: DeployTarget) => {
    switch (target) {
      case 'vercel':
        return 'Get your token from Vercel dashboard → Settings → Tokens'
      case 'expo':
        return 'Get your token from Expo account → Settings → Access Tokens'
      case 'github':
        return 'Create a token with repo permissions at GitHub → Settings → Developer settings'
      default:
        return ''
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      
      <DialogContent className="bg-black border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-yellow-400" />
            <span>Deploy Your App</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Deployment Target</label>
            
            {target ? (
              <div className="flex items-center space-x-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                <span className="text-2xl">{getTargetIcon(target)}</span>
                <div className="flex-1">
                  <div className="font-medium">{getTargetName(target)}</div>
                  <div className="text-xs text-gray-400">
                    {target === 'vercel' && 'Instant web deployment'}
                    {target === 'expo' && 'Mobile app building'}
                    {target === 'github' && 'Desktop app releases'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTarget(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {(['vercel', 'expo', 'github'] as DeployTarget[]).map((t) => (
                  <Button
                    key={t}
                    variant="outline"
                    onClick={() => setTarget(t)}
                    className="justify-start h-auto p-3 border-gray-700 hover:border-gray-600 hover:bg-gray-900/50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getTargetIcon(t)}</span>
                      <div className="text-left">
                        <div className="font-medium">{getTargetName(t)}</div>
                        <div className="text-xs text-gray-400">
                          {t === 'vercel' && 'Instant web deployment'}
                          {t === 'expo' && 'Mobile app building'}
                          {t === 'github' && 'Desktop app releases'}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Token Input */}
          {target && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">API Token</label>
              <Input
                type="password"
                placeholder={getTokenPlaceholder(target)}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-400">
                {getTokenHelpText(target)}
              </p>
            </div>
          )}

          {/* Deployment Status */}
          {result && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-900/20 border-green-700/50' 
                  : result.status === 'error'
                  ? 'bg-red-900/20 border-red-700/50'
                  : result.status === 'configuring'
                  ? 'bg-yellow-900/20 border-yellow-700/50'
                  : 'bg-blue-900/20 border-blue-700/50'
              }`}>
                <div className="flex items-start space-x-2">
                  {result.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  )}
                  {result.status === 'configuring' && (
                    <Settings className="h-4 w-4 text-yellow-400 mt-0.5" />
                  )}
                  {result.status === 'building' && (
                    <Loader2 className="h-4 w-4 text-blue-400 mt-0.5 animate-spin" />
                  )}
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {result.status === 'success' && 'Deployment Successful!'}
                      {result.status === 'error' && 'Deployment Failed'}
                      {result.status === 'configuring' && 'Configuration Needed'}
                      {result.status === 'building' && 'Building...'}
                    </div>
                    
                    {result.message && (
                      <div className="text-xs text-gray-300 mt-1">{result.message}</div>
                    )}
                    
                    {result.instructions && (
                      <div className="text-xs text-yellow-400 mt-2 bg-yellow-900/20 p-2 rounded">
                        <strong>Next Steps:</strong> {result.instructions}
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="text-xs text-red-400 mt-1">{result.error}</div>
                    )}
                    
                    {result.url && (
                      <div className="flex items-center space-x-2 mt-2">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View Deployment</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => copyToClipboard(result.url!)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {result.workflowUrl && (
                      <div className="flex items-center space-x-2 mt-2">
                        <a
                          href={result.workflowUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View GitHub Actions</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Build Terminal */}
          {showTerminal && buildRunId && repoUrl && (
            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <Terminal className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">Live Build Terminal</span>
              </div>
              
              <LiveTerminal
                repo={repoUrl.replace('https://github.com/', '').replace('.git', '')}
                token={getKey('github')!}
                runId={buildRunId}
                onComplete={(result) => {
                  console.log('Build completed:', result)
                }}
              />
            </div>
          )}

          {/* Deploy Button */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-700 hover:bg-gray-900/50"
            >
              Cancel
            </Button>
            
            {target && (
              <Button
                onClick={handleDeploy}
                disabled={!token.trim() || deploying || result?.status === 'success'}
                className="bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 text-black font-semibold hover:opacity-90 transition-opacity"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : result?.status === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Deployed
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
