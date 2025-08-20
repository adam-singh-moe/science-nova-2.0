import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader } from '@/lib/server-supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  if (!auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get profile for grade-level targeting
  const { data: profile } = await svc.from('profiles').select('grade_level, learning_preference').eq('id', auth.userId).single()
  const grade = (profile?.grade_level as number) ?? null

  // Recent lessons from telemetry (last 10)
  const { data: recentEvents } = await svc
    .from('lesson_activity_events')
    .select('lesson_id, created_at')
    .eq('user_id', auth.userId)
    .eq('event_type', 'lesson_view')
    .order('created_at', { ascending: false })
    .limit(20)
  const uniqueLessonIds: string[] = []
  for (const r of (recentEvents || []) as any[]) {
    const id = r.lesson_id
    if (id && !uniqueLessonIds.includes(id)) uniqueLessonIds.push(id)
    if (uniqueLessonIds.length >= 10) break
  }
  let recentLessons: any[] = []
  if (uniqueLessonIds.length) {
    const { data: lessons } = await svc.from('lessons').select('id,title,topic,grade_level,layout_json,updated_at,status').in('id', uniqueLessonIds)
    // maintain order
    const map = new Map((lessons || []).map((l:any)=>[l.id, l]))
    recentLessons = uniqueLessonIds.map((id)=> map.get(id)).filter(Boolean)
  }

  // Mission progress: completed lessons / total lessons for grade
  let totalForGrade = 0
  if (typeof grade === 'number') {
    const { count } = await svc.from('lessons').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('grade_level', grade)
    totalForGrade = count || 0
  } else {
    const { count } = await svc.from('lessons').select('*', { count: 'exact', head: true }).eq('status', 'published')
    totalForGrade = count || 0
  }
  const { data: completes } = await svc
    .from('lesson_activity_events')
    .select('lesson_id, data')
    .eq('user_id', auth.userId)
    .eq('event_type', 'crossword_check')
  const completedLessonIds = new Set<string>()
  for (const r of (completes || []) as any[]) {
    if (r?.data?.completed && r.lesson_id) completedLessonIds.add(r.lesson_id)
  }
  const lessonsCompleted = completedLessonIds.size

  // Today’s recommendation: pick a published lesson for student’s grade not yet viewed
  let recommended: any = null
  const viewedSet = new Set(uniqueLessonIds)
  let recQuery = svc.from('lessons').select('id,title,topic,grade_level,layout_json,status').eq('status', 'published').order('updated_at', { ascending: false })
  if (typeof grade === 'number') recQuery = recQuery.eq('grade_level', grade)
  const { data: candidates } = await recQuery.limit(50)
  const candidate = (candidates || []).find((l:any)=> !viewedSet.has(l.id)) || (candidates || [])[0] || null
  if (candidate) recommended = candidate

  // Study badges: derive top 5 groups from recentLessons titles/topics
  const classify = (title?: string|null, topic?: string|null): string | null => {
    const t = `${title||''} ${topic||''}`.toLowerCase()
    if (!t.trim()) return null
    if (/(weather|meteorolog|climate|storm|cloud|wind|precip|hurricane|tornado|barometer)/.test(t)) return 'Meteorology'
    if (/(force|motion|velocity|acceleration|energy|electric|magnet|wave|optics|thermo|gravity)/.test(t)) return 'Physics'
    if (/(atom|molecule|compound|reaction|acid|base|alkali|salt|periodic|bond|stoichi|solution)/.test(t)) return 'Chemistry'
    if (/(map|continent|ocean|river|mountain|plate tectonics|earthquake|volcano|latitude|longitude|biome|ecosystem|landform)/.test(t)) return 'Earth Science'
    if (/(cell|organism|ecosystem|photosynth|respiration|genetic|dna|evolution|anatomy|plant|animal|habitat)/.test(t)) return 'Biology'
    if (/(space|planet|star|galaxy|universe|astronom|solar|orbit|telescope|cosmos|comet|asteroid|lunar)/.test(t)) return 'Astronomy'
    return null
  }
  const freq: Record<string, number> = {}
  for (const l of recentLessons) {
    const g = classify(l?.title, l?.topic)
    if (g) freq[g] = (freq[g] || 0) + 1
  }
  const badges = Object.keys(freq).sort((a,b)=> (freq[b] - freq[a])).slice(0,5)

  return NextResponse.json({
    recentLessons,
    mission: { completed: lessonsCompleted, total: totalForGrade, pct: totalForGrade ? Math.round((lessonsCompleted/totalForGrade)*100) : 0 },
    recommendation: recommended,
    badges,
  })
}
