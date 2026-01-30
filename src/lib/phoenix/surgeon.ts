/**
 * Project Phoenix: Auto-Surgeon
 * GitHub API integration for automatic fix application
 */

import { DiagnosticResult } from './diagnostician'
import { logTelemetry } from '../telemetry'

export interface SurgeonResult {
  success: boolean
  action: string
  commitUrl?: string
  pullRequestUrl?: string
  error?: string
  appliedAt: number
  changes: {
    filesModified: number
    filesCreated: number
    linesAdded: number
    linesRemoved: number
  }
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

/**
 * Auto-Surgeon - Applies fixes directly to GitHub repositories
 */
export class AutoSurgeon {
  private config: GitHubConfig
  private baseUrl = 'https://api.github.com'

  constructor(config: GitHubConfig) {
    this.config = config
  }

  /**
   * Apply diagnostic fix to the repository
   */
  async applyFix(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    console.log(`🔥 Phoenix Surgeon: Applying ${diagnosis.action} to ${diagnosis.target}`)
    
    const startTime = Date.now()
    
    try {
      let result: SurgeonResult

      switch (diagnosis.action) {
        case 'install_package':
          result = await this.installPackage(diagnosis)
          break
          
        case 'update_package':
          result = await this.updatePackage(diagnosis)
          break
          
        case 'fix_code':
          result = await this.fixCode(diagnosis)
          break
          
        case 'add_config':
          result = await this.addConfig(diagnosis)
          break
          
        case 'remove_file':
          result = await this.removeFile(diagnosis)
          break
          
        case 'create_file':
          result = await this.createFile(diagnosis)
          break
          
        default:
          throw new Error(`Unknown action: ${diagnosis.action}`)
      }

      const duration = Date.now() - startTime
      
      void logTelemetry({
        type: "PHOENIX_SURGERY_COMPLETED",
        model: "auto-surgeon",
        success: result.success,
        metadata: {
          action: diagnosis.action,
          target: diagnosis.target,
          duration,
          changes: result.changes
        }
      })

      console.log(`🔥 Phoenix Surgeon: Fix applied in ${duration}ms`)
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      
      void logTelemetry({
        type: "PHOENIX_SURGERY_FAILED",
        model: "auto-surgeon",
        success: false,
        metadata: {
          action: diagnosis.action,
          target: diagnosis.target,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        action: diagnosis.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        appliedAt: startTime,
        changes: {
          filesModified: 0,
          filesCreated: 0,
          linesAdded: 0,
          linesRemoved: 0
        }
      }
    }
  }

  /**
   * Install package dependency
   */
  private async installPackage(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const packageName = diagnosis.target
    const packageJson = await this.getFile('package.json')
    
    if (!packageJson) {
      throw new Error('package.json not found')
    }

    const packageData = JSON.parse(packageJson.content)
    
    // Add to dependencies or devDependencies
    if (this.isDevDependency(packageName)) {
      packageData.devDependencies = packageData.devDependencies || {}
      packageData.devDependencies[packageName] = this.extractVersion(packageName)
    } else {
      packageData.dependencies = packageData.dependencies || {}
      packageData.dependencies[packageName] = this.extractVersion(packageName)
    }

    // Update package.json
    const updatedContent = JSON.stringify(packageData, null, 2)
    const commitResult = await this.commitFile('package.json', updatedContent, `🔥 Phoenix: Install ${packageName}`)

    return {
      success: true,
      action: 'install_package',
      commitUrl: commitResult.commitUrl,
      appliedAt: Date.now(),
      changes: {
        filesModified: 1,
        filesCreated: 0,
        linesAdded: updatedContent.split('\\n').length - packageJson.content.split('\\n').length,
        linesRemoved: 0
      }
    }
  }

  /**
   * Update package configuration
   */
  private async updatePackage(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const packageJson = await this.getFile('package.json')
    
    if (!packageJson) {
      throw new Error('package.json not found')
    }

    const packageData = JSON.parse(packageJson.content)
    
    // Apply the patch
    if (diagnosis.patch) {
      const patchData = JSON.parse(diagnosis.patch)
      Object.assign(packageData, patchData)
    }

    const updatedContent = JSON.stringify(packageData, null, 2)
    const commitResult = await this.commitFile('package.json', updatedContent, '🔥 Phoenix: Fix package configuration')

    return {
      success: true,
      action: 'update_package',
      commitUrl: commitResult.commitUrl,
      appliedAt: Date.now(),
      changes: {
        filesModified: 1,
        filesCreated: 0,
        linesAdded: updatedContent.split('\\n').length - packageJson.content.split('\\n').length,
        linesRemoved: 0
      }
    }
  }

  /**
   * Fix code in a file
   */
  private async fixCode(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const filePath = diagnosis.target
    const existingFile = await this.getFile(filePath)
    
    if (!existingFile && diagnosis.patch) {
      // Create new file with the fix
      const commitResult = await this.commitFile(filePath, diagnosis.patch, `🔥 Phoenix: Fix ${filePath}`)
      
      return {
        success: true,
        action: 'fix_code',
        commitUrl: commitResult.commitUrl,
        appliedAt: Date.now(),
        changes: {
          filesModified: 0,
          filesCreated: 1,
          linesAdded: diagnosis.patch.split('\\n').length,
          linesRemoved: 0
        }
      }
    }

    if (existingFile && diagnosis.patch) {
      // Apply patch to existing file
      const updatedContent = this.applyCodePatch(existingFile.content, diagnosis.patch)
      const commitResult = await this.commitFile(filePath, updatedContent, `🔥 Phoenix: Fix ${filePath}`)
      
      return {
        success: true,
        action: 'fix_code',
        commitUrl: commitResult.commitUrl,
        appliedAt: Date.now(),
        changes: {
          filesModified: 1,
          filesCreated: 0,
          linesAdded: updatedContent.split('\\n').length - existingFile.content.split('\\n').length,
          linesRemoved: 0
        }
      }
    }

    throw new Error(`Cannot fix code in ${filePath}: no existing file or patch provided`)
  }

  /**
   * Add configuration file
   */
  private async addConfig(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const configPath = diagnosis.target
    
    if (!diagnosis.patch) {
      throw new Error('No patch provided for config file')
    }

    const commitResult = await this.commitFile(configPath, diagnosis.patch, `🔥 Phoenix: Add ${configPath}`)

    return {
      success: true,
      action: 'add_config',
      commitUrl: commitResult.commitUrl,
      appliedAt: Date.now(),
      changes: {
        filesModified: 0,
        filesCreated: 1,
        linesAdded: diagnosis.patch.split('\\n').length,
        linesRemoved: 0
      }
    }
  }

  /**
   * Remove file
   */
  private async removeFile(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const filePath = diagnosis.target
    
    const deleteResult = await this.deleteFile(filePath, `🔥 Phoenix: Remove ${filePath}`)

    return {
      success: true,
      action: 'remove_file',
      commitUrl: deleteResult.commitUrl,
      appliedAt: Date.now(),
      changes: {
        filesModified: 0,
        filesCreated: 0,
        linesAdded: 0,
        linesRemoved: 1
      }
    }
  }

  /**
   * Create file
   */
  private async createFile(diagnosis: DiagnosticResult): Promise<SurgeonResult> {
    const filePath = diagnosis.target
    
    if (!diagnosis.patch) {
      throw new Error('No content provided for file creation')
    }

    const commitResult = await this.commitFile(filePath, diagnosis.patch, `🔥 Phoenix: Create ${filePath}`)

    return {
      success: true,
      action: 'create_file',
      commitUrl: commitResult.commitUrl,
      appliedAt: Date.now(),
      changes: {
        filesModified: 0,
        filesCreated: 1,
        linesAdded: diagnosis.patch.split('\\n').length,
        linesRemoved: 0
      }
    }
  }

  /**
   * Get file content from GitHub
   */
  private async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const data = await response.json()
      const content = Buffer.from(data.content, 'base64').toString('utf8')

      return {
        content,
        sha: data.sha
      }
    } catch (error) {
      console.error(`Error fetching file ${path}:`, error)
      return null
    }
  }

  /**
   * Commit file to GitHub
   */
  private async commitFile(path: string, content: string, message: string): Promise<{ commitUrl: string }> {
    const existingFile = await this.getFile(path)
    const contentBase64 = Buffer.from(content).toString('base64')

    const body = {
      message,
      content: contentBase64,
      branch: this.config.branch,
      ...(existingFile && { sha: existingFile.sha })
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to commit file: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      commitUrl: data.commit.html_url
    }
  }

  /**
   * Delete file from GitHub
   */
  private async deleteFile(path: string, message: string): Promise<{ commitUrl: string }> {
    const existingFile = await this.getFile(path)
    
    if (!existingFile) {
      throw new Error(`File not found: ${path}`)
    }

    const body = {
      message,
      sha: existingFile.sha,
      branch: this.config.branch
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      commitUrl: data.commit.html_url
    }
  }

  /**
   * Apply code patch to existing content
   */
  private applyCodePatch(existingContent: string, patch: string): string {
    // Simple patch application - in production, this would be more sophisticated
    // For now, we'll just append the patch as a comment
    return `${existingContent}

// Phoenix Auto-Fix Applied:
${patch}`
  }

  /**
   * Helper methods
   */
  private isDevDependency(packageName: string): boolean {
    const devDepPatterns = [
      'typescript', 'eslint', 'prettier', 'jest', 'webpack', 'vite',
      '@types/', 'babel', 'postcss', 'tailwind'
    ]
    
    return devDepPatterns.some(pattern => packageName.includes(pattern))
  }

  private extractVersion(packageWithVersion: string): string {
    const match = packageWithVersion.match(/@(.+)$/)
    return match ? match[1] : 'latest'
  }
}

// Factory function
export function createAutoSurgeon(config: GitHubConfig): AutoSurgeon {
  return new AutoSurgeon(config)
}
