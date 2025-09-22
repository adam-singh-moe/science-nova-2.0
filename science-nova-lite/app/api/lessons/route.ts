import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

// Lightweight topic -> group classifier using keywords from title/topic
function classifyGroup(title?: string | null, topic?: string | null): string | null {
  const t = `${title || ''} ${topic || ''}`.toLowerCase()
  if (!t.trim()) return null
  // Meteorology
  if (/(weather|meteorolog|climate|storm|cloud|wind|precip|hurricane|tornado|barometer)/.test(t)) return 'meteorology'
  // Physics
  if (/(force|motion|velocity|acceleration|energy|electric|magnet|wave|optics|thermo|gravity)/.test(t)) return 'physics'
  // Chemistry
  if (/(atom|molecule|compound|reaction|acid|base|alkali|salt|periodic|bond|stoichi|solution)/.test(t)) return 'chemistry'
  // Geography
  if (/(map|continent|ocean|river|mountain|plate tectonics|earthquake|volcano|latitude|longitude|biome|ecosystem|landform)/.test(t)) return 'geography'
  // Biology
  if (/(cell|organism|ecosystem|photosynth|respiration|genetic|dna|evolution|anatomy|plant|animal|habitat)/.test(t)) return 'biology'
  // Astronomy
  if (/(space|planet|star|galaxy|universe|astronom|solar|orbit|telescope|cosmos|comet|asteroid|lunar)/.test(t)) return 'astronomy'
  return null
}

export async function GET(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'draft' | 'published' | null
  const id = searchParams.get('id')
  const search = searchParams.get('search')?.trim() || ''
  const grade = searchParams.get('grade')
  const group = searchParams.get('group')?.trim().toLowerCase() || ''
  const sort = searchParams.get('sort')?.trim().toLowerCase() || '' // 'date' | 'difficulty'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
  const offset = parseInt(searchParams.get('offset') || '0', 10) || 0
  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  const rawRole = auth.userId ? await getProfileRole(auth.userId) : null
  // Safer default: if a logged-in user has no role set yet, treat as non-privileged (STUDENT)
  const role = (auth.userId ? ((rawRole as any) || 'STUDENT') : null) as 'TEACHER' | 'ADMIN' | 'DEVELOPER' | 'STUDENT' | null

  // If STUDENT, fetch their profile grade to enforce server-side filtering
  let studentGrade: number | null = null
  if (role === 'STUDENT' && auth.userId) {
    const { data: prof } = await svc.from('profiles').select('grade_level').eq('id', auth.userId).single()
    if (prof && typeof prof.grade_level === 'number') studentGrade = prof.grade_level
  }

  let query = svc.from('lessons').select('*').order('updated_at', { ascending: false })
  if (id) {
    query = svc.from('lessons').select('*').eq('id', id)
  }
  if (role === 'TEACHER') {
    query = query.eq('owner_id', auth.userId)
  }
  const isPrivileged = role === 'ADMIN' || role === 'DEVELOPER' || role === 'TEACHER'
  if (!isPrivileged) {
    // Unauthenticated or STUDENT can only see published
    query = query.eq('status', 'published')
  }
  if (status) query = query.eq('status', status)
  // Students are always filtered by their own grade if available
  // Admins, Teachers, and Developers can view all grades (no filtering)
  if (role === 'STUDENT' && !id) {
    if (typeof studentGrade === 'number') {
      query = query.eq('grade_level', studentGrade)
    } else if (grade) {
      // Fallback to requested grade if profile grade is not set
      const g = Number(grade)
      if (!Number.isNaN(g)) query = query.eq('grade_level', g)
    }
  } else if (grade && !id && !isPrivileged) {
    // Only apply grade filtering for non-privileged users when explicitly requested
    const g = Number(grade)
    if (!Number.isNaN(g)) query = query.eq('grade_level', g)
  }
  if (search && !id) {
    // Simple ilike on title/topic
    query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%`)
  }
  if (!id) {
    query = query.range(offset, offset + limit - 1)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (id) return NextResponse.json({ lesson: (data && data[0]) || null })
  let items = (data || []) as any[]
  // Derive topic group and filter if requested
  if (group) {
    items = items.filter((l) => classifyGroup(l.title, l.topic) === group)
  }
  // Optional sort by difficulty (ascending: Easy->Challenging)
  if (sort === 'difficulty') {
    items = items.slice().sort((a, b) => {
      const da = a?.layout_json?.meta?.difficulty ?? 999
      const db = b?.layout_json?.meta?.difficulty ?? 999
      return (da as number) - (db as number)
    })
  }
  // Attach derived group for clients that want to display it (non-breaking)
  const lessons = items.map((l) => ({ ...l, group: classifyGroup(l.title, l.topic) }))
  return NextResponse.json({ lessons })
}

export async function POST(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  if (!auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rawRole = await getProfileRole(auth.userId)
  const role = (rawRole || 'TEACHER') as 'TEACHER' | 'ADMIN' | 'DEVELOPER' | 'STUDENT'
  if (role === 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, title, topic, grade_level, vanta_effect, layout_json, status } = body

  if (id) {
    // update existing; teacher can only update own
    let updateQuery = svc.from('lessons').update({
      title: title || 'Untitled Lesson',
      topic: topic || '',
      grade_level: Number(grade_level) || null,
      vanta_effect: vanta_effect || 'globe',
      layout_json: layout_json ?? {},
      status: status || 'draft',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (role === 'TEACHER') updateQuery = updateQuery.eq('owner_id', auth.userId)
    const { data, error } = await updateQuery.select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ lesson: data })
  }
  // insert new
  const { data, error } = await svc.from('lessons').insert({
    title: title || 'Untitled Lesson',
    topic: topic || '',
    grade_level: Number(grade_level) || null,
    vanta_effect: vanta_effect || 'globe',
    layout_json: layout_json ?? {},
    status: status || 'draft',
    owner_id: auth.userId,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  if (!auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rawRole = await getProfileRole(auth.userId)
  const role = (rawRole || 'TEACHER') as 'TEACHER' | 'ADMIN' | 'DEVELOPER' | 'STUDENT'
  if (role === 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(()=>({})) as { id?: string }
  const { searchParams } = new URL(req.url)
  const id = body.id || searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let del = svc.from('lessons').delete().eq('id', id)
  if (role === 'TEACHER') {
    del = del.eq('owner_id', auth.userId)
  }
  const { error } = await del
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
