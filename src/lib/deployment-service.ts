import { ProjectBlueprint } from './blueprint'

export type DeployTarget = 'vercel' | 'expo' | 'github'
export type DeploymentStatus = 'idle' | 'configuring' | 'building' | 'deploying' | 'success' | 'error'

export interface DeploymentConfig {
  target: DeployTarget
  token: string
  projectName?: string
  repoUrl?: string
}

export interface DeploymentResult {
  status: DeploymentStatus
  url?: string
  message?: string
  error?: string
  instructions?: string
}

export interface VercelDeploymentFile {
  file: string
  data: string
}

export interface VercelDeploymentResponse {
  id: string
  url: string
  alias: string[]
  readyState: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED'
  createdAt: number
}

export async function deployToVercel(
  files: Record<string, string>, 
  token: string, 
  projectName: string
): Promise<DeploymentResult> {
  try {
    // Prepare files for Vercel API
    const deploymentFiles: VercelDeploymentFile[] = Object.entries(files).map(([file, data]) => ({
      file: file.startsWith('/') ? file.slice(1) : file, // Remove leading slash
      data
    }))

    const body = {
      name: projectName,
      files: deploymentFiles,
      projectSettings: { 
        framework: "vite",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm install"
      }
    }

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Vercel API error: ${response.status}`)
    }

    const deployment: VercelDeploymentResponse = await response.json()
    
    return {
      status: 'success',
      url: deployment.url,
      message: `Deployment started! Your app will be available at ${deployment.url}`
    }
  } catch (error) {
    console.error('Vercel deployment error:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to deploy to Vercel'
    }
  }
}

export async function prepareExpoBuild(files: Record<string, string>): Promise<DeploymentResult> {
  try {
    // Check if eas.json exists
    if (!files['eas.json']) {
      return {
        status: 'configuring',
        instructions: 'eas.json configuration needed. AI will generate this file.',
        message: 'EAS configuration missing'
      }
    }

    // Check if app.json exists
    if (!files['app.json']) {
      return {
        status: 'configuring', 
        instructions: 'app.json configuration needed. AI will generate this file.',
        message: 'App configuration missing'
      }
    }

    return {
      status: 'idle',
      instructions: 'Ready for Expo EAS build. Run "eas build" in your terminal to compile for iOS/Android.',
      message: 'Expo configuration complete'
    }
  } catch (error) {
    console.error('Expo preparation error:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to prepare Expo build'
    }
  }
}

export async function setupGitHubAction(
  files: Record<string, string>,
  token: string,
  repoName: string
): Promise<DeploymentResult> {
  try {
    // Check if .github/workflows directory exists in files
    const hasWorkflow = Object.keys(files).some(key => key.startsWith('.github/workflows/'))
    
    if (!hasWorkflow) {
      return {
        status: 'configuring',
        instructions: 'GitHub Action workflow needed. AI will generate the build configuration.',
        message: 'Build workflow missing'
      }
    }

    // For now, return instructions for manual setup
    // In a real implementation, you'd use GitHub API to create repo/push files
    return {
      status: 'idle',
      instructions: `Create a GitHub repository named "${repoName}" and push your code. The GitHub Action will automatically build .exe and .dmg releases.`,
      message: 'GitHub Action workflow ready'
    }
  } catch (error) {
    console.error('GitHub Action setup error:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to setup GitHub Action'
    }
  }
}

export function detectDeploymentTarget(files: Record<string, string>): DeployTarget | null {
  // Check for .vibe.json to determine project type
  if (files['.vibe.json']) {
    try {
      const vibe = JSON.parse(files['.vibe.json'])
      switch (vibe.type) {
        case 'web_app':
        case 'landing_page':
          return 'vercel'
        case 'mobile_app':
          return 'expo'
        case 'desktop_app':
          return 'github'
      }
    } catch {
      // Fall back to file-based detection
    }
  }

  // File-based detection as fallback
  const fileNames = Object.keys(files)
  
  if (fileNames.includes('app.json') || fileNames.includes('eas.json')) {
    return 'expo'
  }
  
  if (fileNames.some(f => f.includes('electron') || f.includes('main.js'))) {
    return 'github'
  }
  
  if (fileNames.includes('package.json') && 
      (fileNames.includes('index.html') || fileNames.some(f => f.includes('src/')))) {
    return 'vercel'
  }
  
  return null
}

export async function executeDeployment(
  files: Record<string, string>,
  config: DeploymentConfig
): Promise<DeploymentResult> {
  switch (config.target) {
    case 'vercel':
      return deployToVercel(files, config.token, config.projectName || 'vibe-app')
    
    case 'expo':
      return prepareExpoBuild(files)
    
    case 'github':
      return setupGitHubAction(files, config.token, config.projectName || 'vibe-app')
    
    default:
      return {
        status: 'error',
        error: `Unsupported deployment target: ${config.target}`
      }
  }
}
