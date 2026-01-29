import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show login page for unauthenticated users', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vibe Coding')
    await expect(page.locator('text=Sign in')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Sign up')
    await expect(page.locator('h2')).toContainText('Create Account')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Sign in')
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in real tests, you'd actually sign in
    await page.goto('/dashboard')
  })

  test('should display dashboard elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('text=Create New Project')).toBeVisible()
    await expect(page.locator('text=My Projects')).toBeVisible()
  })

  test('should create a new project', async ({ page }) => {
    await page.click('text=Create New Project')
    await page.fill('input[name="projectName"]', 'Test Project')
    await page.click('button[type="submit"]')
    
    // Should redirect to workspace
    await expect(page.url()).toContain('/workspace/')
  })
})

test.describe('AI Code Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/test-project')
  })

  test('should generate code from AI prompt', async ({ page }) => {
    await page.fill('[data-testid="ai-input"]', 'Create a React component for a button')
    await page.click('[data-testid="generate-button"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible()
    
    // Should show generated code
    await expect(page.locator('[data-testid="code-output"]')).toBeVisible()
  })

  test('should display AI usage statistics', async ({ page }) => {
    await page.click('[data-testid="usage-stats"]')
    await expect(page.locator('text=AI Requests')).toBeVisible()
    await expect(page.locator('text=Tokens Used')).toBeVisible()
  })
})

test.describe('Code Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/test-project')
  })

  test('should load Monaco editor', async ({ page }) => {
    await expect(page.locator('.monaco-editor')).toBeVisible()
  })

  test('should allow code editing', async ({ page }) => {
    await page.click('.monaco-editor')
    await page.keyboard.type('console.log("Hello World");')
    await expect(page.locator('.monaco-editor')).toContainText('console.log("Hello World");')
  })

  test('should show file tree', async ({ page }) => {
    await expect(page.locator('[data-testid="file-tree"]')).toBeVisible()
    await expect(page.locator('text=src')).toBeVisible()
    await expect(page.locator('text=App.js')).toBeVisible()
  })
})

test.describe('Live Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/test-project')
  })

  test('should show preview panel', async ({ page }) => {
    await page.click('[data-testid="preview-toggle"]')
    await expect(page.locator('[data-testid="preview-frame"]')).toBeVisible()
  })

  test('should update preview on code changes', async ({ page }) => {
    await page.click('[data-testid="preview-toggle"]')
    await page.click('.monaco-editor')
    await page.keyboard.type('<h1>Test Heading</h1>')
    
    // Wait for preview to update
    await page.waitForTimeout(2000)
    
    // Should show updated content in preview
    const previewFrame = page.locator('[data-testid="preview-frame"]')
    const content = await previewFrame.contentFrame().locator('h1').textContent()
    expect(content).toBe('Test Heading')
  })
})

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/billing')
  })

  test('should show subscription plans', async ({ page }) => {
    await expect(page.locator('text=Free Plan')).toBeVisible()
    await expect(page.locator('text=Pro Plan')).toBeVisible()
    await expect(page.locator('text=Enterprise Plan')).toBeVisible()
  })

  test('should allow plan upgrade', async ({ page }) => {
    await page.click('[data-testid="upgrade-to-pro"]')
    await expect(page.locator('text=Checkout')).toBeVisible()
  })

  test('should show usage limits', async ({ page }) => {
    await expect(page.locator('text=Monthly AI Requests')).toBeVisible()
    await expect(page.locator('text=Current Usage')).toBeVisible()
  })
})

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics')
  })

  test('should show analytics charts', async ({ page }) => {
    await expect(page.locator('text=Usage Overview')).toBeVisible()
    await expect(page.locator('text=AI Requests')).toBeVisible()
    await expect(page.locator('text=User Activity')).toBeVisible()
  })

  test('should filter by date range', async ({ page }) => {
    await page.selectOption('[data-testid="date-range"]', 'week')
    await expect(page.locator('[data-testid="analytics-data"]')).toBeVisible()
  })
})
