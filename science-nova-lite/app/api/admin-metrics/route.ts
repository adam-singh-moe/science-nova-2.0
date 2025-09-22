import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

export const runtime = 'nodejs'

type DayPoint = { day: string; views: number; quizzes: number }
type TopicSlice = { name: string; value: number; color: string }

function isoDayStart(d: Date) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); return x.toISOString() }
function isoDayEnd(d: Date) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23,59,59,999)); return x.toISOString() }

export async function GET(req: NextRequest) {
  const svc = getServiceClient()
  if (!svc) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })

  const auth = getUserFromAuthHeader(req.headers.get('authorization'))
  if (!auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await getProfileRole(auth.userId)
  if (!role || !['TEACHER','ADMIN','DEVELOPER'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const start7 = new Date(todayUTC); start7.setUTCDate(start7.getUTCDate() - 6)
    const prevStart7 = new Date(todayUTC); prevStart7.setUTCDate(prevStart7.getUTCDate() - 13)
    const prevEnd7 = new Date(todayUTC); prevEnd7.setUTCDate(prevEnd7.getUTCDate() - 7)

    const start7Iso = isoDayStart(start7)
    const end7Iso = isoDayEnd(todayUTC)
    const prevStart7Iso = isoDayStart(prevStart7)
    const prevEnd7Iso = isoDayEnd(prevEnd7)

    // Total students (profiles with role STUDENT)
    const { count: totalStudents = 0 } = await svc.from('profiles').select('*', { count: 'exact', head: true }).eq('role','STUDENT')

    // Active students: unique users with any event in window
    const { data: activeRows } = await svc
      .from('lesson_activity_events')
      .select('user_id')
      .gte('created_at', start7Iso)
      .lte('created_at', end7Iso)
    const activeSet = new Set((activeRows || []).map((r:any)=> r.user_id).filter(Boolean))
    const activeStudents = activeSet.size

    const { data: prevActiveRows } = await svc
      .from('lesson_activity_events')
      .select('user_id')
      .gte('created_at', prevStart7Iso)
      .lte('created_at', prevEnd7Iso)
    const prevActiveSet = new Set((prevActiveRows || []).map((r:any)=> r.user_id).filter(Boolean))
    const prevActiveStudents = prevActiveSet.size

    const pctChange = (cur: number, prev: number) => {
      if (!prev) return cur ? 100 : 0
      return Math.round(((cur - prev) / prev) * 1000) / 10
    }

    // Lessons viewed in window and previous window
  const { count: views7Raw } = await svc
      .from('lesson_activity_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type','lesson_view')
      .gte('created_at', start7Iso)
      .lte('created_at', end7Iso)
  const { count: viewsPrev7Raw } = await svc
      .from('lesson_activity_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type','lesson_view')
      .gte('created_at', prevStart7Iso)
      .lte('created_at', prevEnd7Iso)
  const views7 = views7Raw || 0
  const viewsPrev7 = viewsPrev7Raw || 0

    // Quiz scores (avg pct) in window and previous window
    const { data: quiz7 } = await svc
      .from('lesson_activity_events')
      .select('data')
      .eq('event_type','quiz_submit')
      .gte('created_at', start7Iso)
      .lte('created_at', end7Iso)
    const { data: quizPrev } = await svc
      .from('lesson_activity_events')
      .select('data')
      .eq('event_type','quiz_submit')
      .gte('created_at', prevStart7Iso)
      .lte('created_at', prevEnd7Iso)
    const avg = (arr: any[]) => {
      const xs = (arr || []).map((r:any)=> Number(r?.data?.pct) || 0).filter((n:number)=> n>0)
      if (!xs.length) return 0
      return Math.round((xs.reduce((a:number,b:number)=>a+b,0)/xs.length)*10)/10
    }
    const avgQuiz = avg(quiz7 || [])
    const avgQuizPrev = avg(quizPrev || [])

    // Engagement: percent of all students who were active in the window
    const engagement = totalStudents ? Math.round((activeStudents / totalStudents) * 1000)/10 : 0
    const prevEngagement = totalStudents ? Math.round((prevActiveStudents / totalStudents) * 1000)/10 : 0

    // Time series for last 7 days: views and quizzes per day
    const days: DayPoint[] = []
    for (let i=0;i<7;i++) {
      const d = new Date(todayUTC); d.setUTCDate(d.getUTCDate() - (6 - i))
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      days.push({ day: dayLabel, views: 0, quizzes: 0 })
    }
    const dayKey = (iso: string) => {
      const d = new Date(iso); return d.toLocaleDateString('en-US', { weekday: 'short' })
    }
    const { data: viewsRows } = await svc
      .from('lesson_activity_events')
      .select('created_at')
      .eq('event_type','lesson_view')
      .gte('created_at', start7Iso)
      .lte('created_at', end7Iso)
    const { data: quizRows } = await svc
      .from('lesson_activity_events')
      .select('created_at')
      .eq('event_type','quiz_submit')
      .gte('created_at', start7Iso)
      .lte('created_at', end7Iso)
    const dayMap = new Map(days.map(d=>[d.day,d]))
    for (const r of (viewsRows || []) as any[]) {
      const k = dayKey(r.created_at); const dp = dayMap.get(k); if (dp) dp.views++
    }
    for (const r of (quizRows || []) as any[]) {
      const k = dayKey(r.created_at); const dp = dayMap.get(k); if (dp) dp.quizzes++
    }

    // Topic focus over last 30 days from viewed lessons
    const start30 = new Date(todayUTC); start30.setUTCDate(start30.getUTCDate() - 29)
    const { data: views30 } = await svc
      .from('lesson_activity_events')
      .select('lesson_id')
      .eq('event_type','lesson_view')
      .gte('created_at', isoDayStart(start30))
      .lte('created_at', end7Iso)
    const lessonIds = Array.from(new Set((views30 || []).map((r:any)=> r.lesson_id).filter(Boolean)))
    let topicSlices: TopicSlice[] = []
    if (lessonIds.length) {
      const { data: lessons } = await svc
        .from('lessons')
        .select('id,title,topic')
        .in('id', lessonIds)
      const classify = (title?: string|null, topic?: string|null): string | null => {
        const t = `${title||''} ${topic||''}`.toLowerCase()
        if (!t.trim()) return null
        if (/(cell|organism|ecosystem|photosynth|respiration|genetic|dna|evolution|anatomy|plant|animal|habitat)/.test(t)) return 'Biology'
        if (/(force|motion|velocity|acceleration|energy|electric|magnet|wave|optics|thermo|gravity)/.test(t)) return 'Physics'
        if (/(atom|molecule|compound|reaction|acid|base|alkali|salt|periodic|bond|stoichi|solution)/.test(t)) return 'Chemistry'
        if (/(map|continent|ocean|river|mountain|plate tectonics|earthquake|volcano|latitude|longitude|biome|ecosystem|landform)/.test(t)) return 'Earth Sci.'
        if (/(weather|meteorolog|climate|storm|cloud|wind|precip|hurricane|tornado|barometer)/.test(t)) return 'Meteorology'
        if (/(space|planet|star|galaxy|universe|astronom|solar|orbit|telescope|cosmos|comet|asteroid|lunar)/.test(t)) return 'Astronomy'
        return 'Other'
      }
      const freq: Record<string, number> = {}
      for (const l of (lessons || []) as any[]) {
        const g = classify(l?.title, l?.topic) || 'Other'
        freq[g] = (freq[g] || 0) + 1
      }
      const palette = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']
      const entries = Object.entries(freq).sort((a,b)=> b[1]-a[1]).slice(0,6)
      const total = entries.reduce((s,[,v])=> s+v, 0) || 1
      topicSlices = entries.map(([name, v], i)=> ({ 
        name, 
        value: Math.round((v/total)*100), 
        color: palette[i % palette.length] 
      }))
      
      // Ensure we have at least some data for better visualization
      if (topicSlices.length === 0) {
        topicSlices = [
          { name: 'No Data', value: 100, color: '#e5e7eb' }
        ]
      }
    }

    const payload = {
      stats: {
        activeStudents: { value: activeStudents, delta: pctChange(activeStudents, prevActiveStudents) },
        avgQuizScore: { value: avgQuiz, delta: pctChange(avgQuiz, avgQuizPrev), suffix: '%' },
  lessonsViewed: { value: views7, delta: pctChange(views7, viewsPrev7) },
        engagement: { value: engagement, delta: pctChange(engagement, prevEngagement), suffix: '%' },
        totals: { students: totalStudents }
      },
      engagementData: days,
      topicData: topicSlices,
      window: { start: start7Iso, end: end7Iso }
    }

    const res = NextResponse.json(payload)
    res.headers.set('Cache-Control','private, max-age=60, stale-while-revalidate=600')
    res.headers.set('Vary','Authorization')
    return res
  } catch (e) {
    console.error('admin-metrics error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
