/**
 * WebContainer Manager - Singleton pattern to prevent multiple instances
 * WebContainer has a limitation of only allowing one instance at a time
 */

import { WebContainer } from '@webcontainer/api'

interface WebContainerInstance {
  container: WebContainer
  projectId: string
  createdAt: Date
}

class WebContainerManager {
  private static instance: WebContainerManager
  private currentContainer: WebContainerInstance | null = null
  private initPromise: Promise<WebContainer> | null = null

  private constructor() {}

  static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager()
    }
    return WebContainerManager.instance
  }

  async getContainer(projectId: string): Promise<WebContainer> {
    // If we already have a container for this project, return it
    if (this.currentContainer?.projectId === projectId) {
      return this.currentContainer.container
    }

    // If there's an ongoing initialization, wait for it
    if (this.initPromise) {
      try {
        const container = await this.initPromise
        this.currentContainer = {
          container,
          projectId,
          createdAt: new Date()
        }
        return container
      } catch (error) {
        this.initPromise = null
        throw error
      }
    }

    // Initialize a new container
    this.initPromise = this.initializeContainer()
    
    try {
      const container = await this.initPromise
      this.currentContainer = {
        container,
        projectId,
        createdAt: new Date()
      }
      return container
    } catch (error) {
      this.initPromise = null
      throw error
    }
  }

  private async initializeContainer(): Promise<WebContainer> {
    // Check for cross-origin isolation with fallback
    if (typeof window !== 'undefined') {
      const hasCrossOriginIsolated = 'crossOriginIsolated' in window
      const isCrossOriginIsolated = hasCrossOriginIsolated ? window.crossOriginIsolated : true
      
      if (!isCrossOriginIsolated) {
        console.warn('WebContainer cross-origin isolation not detected, attempting to continue...')
      }
    }

    return await WebContainer.boot({
      workdirName: 'vibe-coding-project'
    })
  }

  async resetContainer(): Promise<void> {
    if (this.currentContainer) {
      try {
        // Clean up the current container
        await this.currentContainer.container.teardown()
      } catch (error) {
        console.warn('Error during WebContainer teardown:', error)
      }
      this.currentContainer = null
    }
    this.initPromise = null
  }

  getCurrentProjectId(): string | null {
    return this.currentContainer?.projectId || null
  }

  isInitialized(): boolean {
    return this.currentContainer !== null
  }
}

export default WebContainerManager.getInstance()
