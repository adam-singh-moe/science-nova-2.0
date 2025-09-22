import { describe, it, expect, beforeAll } from 'vitest'

// These integration tests require real Supabase environment variables set:
// NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_TOPIC_ID, TEST_USER_ID
// They exercise create -> list -> get -> patch -> soft delete -> restore for FACT and GAME crossword.

async function authHeaderFor(userId: string) {
  // simple unsigned JWT stub with base64 payload containing sub
  const header = Buffer.from(JSON.stringify({ alg:'none', typ:'JWT'})).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString('base64url')
  return `Bearer ${header}.${payload}.` // unsigned token compatible with getUserFromAuthHeader
}

const base = 'http://localhost:3000'

let FACT_ID: string | null = null
let GAME_ID: string | null = null

const topicId = process.env.TEST_TOPIC_ID || ''
const userId = process.env.TEST_USER_ID || ''

const skip = !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && topicId && userId)

describe.skipIf(skip)('content CRUD integration', () => {
  let authHeader: string
  beforeAll(async ()=> {
    authHeader = await authHeaderFor(userId)
  })

  it('creates FACT draft', async () => {
    const res = await fetch(base + '/api/admin/content', { method:'POST', headers:{ 'Content-Type':'application/json', authorization: authHeader }, body: JSON.stringify({ topic_id: topicId, category:'DISCOVERY', subtype:'FACT', title:'Integration Fact', payload:{ text:'Test fact' }, status:'draft' }) })
    const json:any = await res.json()
    expect(res.status, JSON.stringify(json)).toBe(200)
    FACT_ID = json.item.id
    expect(json.item.payload.text).toBe('Test fact')
  })

  it('creates GAME crossword draft', async () => {
    const payload = { subtype:'GAME', type:'crossword', data:{ words:[{ word:'CAT', clue:'Animal', row:0, col:0, direction:'across'}] } }
    const res = await fetch(base + '/api/admin/content', { method:'POST', headers:{ 'Content-Type':'application/json', authorization: authHeader }, body: JSON.stringify({ topic_id: topicId, category:'ARCADE', subtype:'GAME', title:'Integration Crossword', payload, status:'draft' }) })
    const json:any = await res.json()
    expect(res.status, JSON.stringify(json)).toBe(200)
    GAME_ID = json.item.id
    expect(json.item.payload.type).toBe('crossword')
  })

  it('lists discovery drafts including new FACT', async () => {
    const res = await fetch(base + `/api/admin/discovery?status=draft&topic_id=${topicId}`, { headers:{ authorization: authHeader } })
    const json:any = await res.json()
    expect(res.status).toBe(200)
    const found = json.items.some((x:any)=> x.id === FACT_ID)
    expect(found).toBe(true)
  })

  it('lists arcade drafts including new GAME', async () => {
    const res = await fetch(base + `/api/admin/arcade?status=draft&topic_id=${topicId}`, { headers:{ authorization: authHeader } })
    const json:any = await res.json()
    expect(res.status).toBe(200)
    const found = json.items.some((x:any)=> x.id === GAME_ID)
    expect(found).toBe(true)
  })

  it('updates FACT title & publishes', async () => {
    const res = await fetch(base + `/api/admin/content/${FACT_ID}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', authorization: authHeader }, body: JSON.stringify({ title:'Updated Fact', status:'published' }) })
    const json:any = await res.json()
    expect(res.status, JSON.stringify(json)).toBe(200)
    expect(json.item.status).toBe('published')
    expect(json.item.title).toBe('Updated Fact')
  })

  it('soft deletes GAME crossword', async () => {
    const res = await fetch(base + `/api/admin/content/${GAME_ID}`, { method:'DELETE', headers:{ authorization: authHeader } })
    const json:any = await res.json()
    expect(res.status, JSON.stringify(json)).toBe(200)
    expect(json.ok).toBe(true)
  })

  it('restores GAME crossword (deleted_at null)', async () => {
    const res = await fetch(base + `/api/admin/content/${GAME_ID}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', authorization: authHeader }, body: JSON.stringify({ deleted_at: null }) })
    const json:any = await res.json()
    expect(res.status, JSON.stringify(json)).toBe(200)
    expect(json.item.deleted_at).toBeNull()
  })
})
