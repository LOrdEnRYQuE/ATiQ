import { describe, it, expect, jest } from '@jest/globals'

// Simple integration test for API health check
describe('API Integration Tests', () => {
  it('should have health check endpoint', async () => {
    // Test that the health check endpoint exists and responds correctly
    const response = await fetch('http://localhost:3000/api/health')
    expect(response.ok).toBe(true)
    
    const data = await response.json()
    expect(data).toHaveProperty('status')
    expect(data.status).toBe('ok')
  })

  it('should handle CORS headers', async () => {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })
    
    expect(response.ok).toBe(true)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })
})
