import { describe, it, expect } from 'vitest'

// Placeholder tests – real integration would mock Supabase; here we assert route module exports exist.

describe('content route handlers shape', () => {
  it('exports GET and POST on /api/admin/content', async () => {
  const mod = await import('@/app/api/admin/content/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.POST).toBe('function')
  })
  it('exports GET PATCH DELETE on /api/admin/content/[id]', async () => {
  const mod = await import('@/app/api/admin/content/[id]/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.PATCH).toBe('function')
    expect(typeof mod.DELETE).toBe('function')
  })
})
