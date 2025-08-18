import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

export async function POST(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  if (!auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rawRole = await getProfileRole(auth.userId)
  const role = (rawRole || 'TEACHER') as 'TEACHER' | 'ADMIN' | 'DEVELOPER' | 'STUDENT'
  if (role === 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Teachers can only publish their own lessons; Admin/Developer can publish any
  let query = svc.from('lessons').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id)
  if (role === 'TEACHER') {
    query = query.eq('owner_id', auth.userId)
  }
  const { data, error } = await query.select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}
