import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getServiceClient, getUserFromAuthHeader } from '@/lib/server-supabase'
import crypto from 'crypto'

export const runtime = 'nodejs'

type TopicRow = { id: string; title: string; grade_level: number; study_areas: { name: string } | { name: string }[] | null }
type ProgressRow = { topic_id: string; completed: boolean; last_accessed: string; topics: TopicRow | TopicRow[] | null }
type LessonActivityAgg = {
  lessonsViewed: number
  lessonMinutes: number
  groupsExplored: number
  difficulty: { easy: number; moderate: number; challenging: number }
  quizSubmits: number
  quizBest: number
  quiz80: number
  quiz90: number
  quiz100: number
  crossComplete: number
  flashCycles: number
  flashFlips: number
}

function calculateStreak(progressData: ProgressRow[]): number {
  if (!progressData.length) return 0
  const dates = progressData
    .map((p) => new Date(p.last_accessed))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  let streak = 0
  let currentDate = new Date()
  for (const date of dates) {
    const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 1) { streak++; currentDate = date } else { break }
  }
  return streak
}

function buildAchievements(
  progress: { level: number; totalXP: number; nextLevelXP: number; currentLevelXP: number; streak: number; topicsCompleted: number; studyAreasExplored: number; totalTimeSpent: number },
  studyAreasCount: number,
  earnedDateISO?: string,
) {
  return [
    { id: '1', title: 'First Steps', description: 'Complete your first science topic', icon: '🎯', category: 'learning', earned: progress.topicsCompleted > 0, earnedDate: progress.topicsCompleted > 0 ? earnedDateISO : undefined },
    { id: '2', title: 'Explorer', description: 'Explore 3 different study areas', icon: '🗺️', category: 'exploration', earned: studyAreasCount >= 3, earnedDate: studyAreasCount >= 3 ? earnedDateISO : undefined, progress: studyAreasCount, maxProgress: 3 },
    { id: '3', title: 'Consistent Learner', description: 'Learn for 5 days in a row', icon: '🔥', category: 'consistency', earned: progress.streak >= 5, earnedDate: progress.streak >= 5 ? earnedDateISO : undefined, progress: progress.streak, maxProgress: 5 },
    { id: '4', title: 'Topic Master', description: 'Complete 10 topics', icon: '📚', category: 'mastery', earned: progress.topicsCompleted >= 10, earnedDate: progress.topicsCompleted >= 10 ? earnedDateISO : undefined, progress: progress.topicsCompleted, maxProgress: 10 },
    { id: '5', title: 'Science Enthusiast', description: 'Complete 25 topics', icon: '🧪', category: 'mastery', earned: progress.topicsCompleted >= 25, earnedDate: progress.topicsCompleted >= 25 ? earnedDateISO : undefined, progress: progress.topicsCompleted, maxProgress: 25 },
    { id: '6', title: 'All-Rounder', description: 'Explore all 7 study areas', icon: '🌟', category: 'exploration', earned: studyAreasCount >= 7, earnedDate: studyAreasCount >= 7 ? earnedDateISO : undefined, progress: studyAreasCount, maxProgress: 7 },
    { id: '7', title: 'Streak Master', description: 'Maintain a 10-day learning streak', icon: '⚡', category: 'consistency', earned: progress.streak >= 10, earnedDate: progress.streak >= 10 ? earnedDateISO : undefined, progress: progress.streak, maxProgress: 10 },
    { id: '9', title: 'Time Traveler', description: 'Spend 2+ hours learning', icon: '⏰', category: 'consistency', earned: progress.totalTimeSpent >= 120, earnedDate: progress.totalTimeSpent >= 120 ? earnedDateISO : undefined, progress: Math.floor(progress.totalTimeSpent / 60), maxProgress: 2 },
    { id: '10', title: 'Level Up', description: 'Reach level 5', icon: '⭐', category: 'mastery', earned: progress.level >= 5, earnedDate: progress.level >= 5 ? earnedDateISO : undefined, progress: progress.level, maxProgress: 5 },
  ]
}

export async function GET(request: NextRequest) {
  try {
    await cookies() // ensure edge-safe headers access if needed later
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Prefer Authorization header (service client), fallback to cookie session
    const serviceClient = getServiceClient()
    const auth = getUserFromAuthHeader(request.headers.get('authorization'))
    let userId: string | null = auth.userId
    // Fallback path is best-effort; primary path expects Authorization header
    if (!userId) userId = null
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = serviceClient ?? createClient(supabaseUrl, supabaseAnon)
    const { data: profile } = await db
      .from('profiles').select('grade_level').eq('id', userId).single()
    const gradeLevel = profile?.grade_level ?? null

    const { data: progressData, error: progressError } = await db
      .from('user_progress')
      .select(`
        topic_id,
        completed,
        last_accessed,
        topics (
          id,
          title,
          grade_level,
          study_areas ( name )
        )
      `)
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false })

    if (progressError) {
      console.error('User progress fetch error:', progressError)
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 })
    }

    const progress = (progressData || []) as ProgressRow[]

    let totalTopicsForGrade = 0
    if (gradeLevel !== null) {
  const { data: gradeTopics } = await db.from('topics').select('id').eq('grade_level', gradeLevel)
      totalTopicsForGrade = gradeTopics?.length || 0
    }

  // No adventure feature in lite; skip adventures

    const topicsCompleted = progress.filter((p) => p.completed).length
    const topicsAccessed = progress.length
    const studyAreasExplored = new Set(
      progress
        .map((p) => {
          const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
          const sa = Array.isArray(topic?.study_areas) ? topic?.study_areas[0] : topic?.study_areas
          return (sa as any)?.name || null
        })
        .filter(Boolean)
    ).size

  const totalXP = topicsAccessed * 10 + topicsCompleted * 50
    const level = Math.floor(totalXP / 500) + 1
    const currentLevelXP = (level - 1) * 500
    const nextLevelXP = level * 500
    const streak = calculateStreak(progress)
  // Use lessonMinutes as time spent metric for lite (computed below)
    const lastAccessDate = progress[0]?.last_accessed || new Date().toISOString()

    const recentActivity = progress.slice(0, 5).map((p) => {
      const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
      const sa = Array.isArray(topic?.study_areas) ? topic?.study_areas[0] : topic?.study_areas
      return { id: p.topic_id, title: (topic as any)?.title || 'Unknown Topic', study_area: (sa as any)?.name || 'Science', accessed_at: p.last_accessed, completed: !!p.completed }
    })

    // Lesson activity aggregations
  const dbAgg = db
    const agg: LessonActivityAgg = {
      lessonsViewed: 0,
      lessonMinutes: 0,
      groupsExplored: 0,
      difficulty: { easy: 0, moderate: 0, challenging: 0 },
      quizSubmits: 0,
      quizBest: 0,
      quiz80: 0,
      quiz90: 0,
      quiz100: 0,
      crossComplete: 0,
      flashCycles: 0,
      flashFlips: 0,
    }
    try {
      // lessons viewed
      const { data: views } = await dbAgg
        .from('lesson_activity_events')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('event_type', 'lesson_view')
      const viewedIds = Array.from(new Set((views || []).map(v => (v as any).lesson_id)))
      agg.lessonsViewed = viewedIds.length

      // heartbeat seconds
      const { data: beats } = await dbAgg
        .from('lesson_activity_events')
        .select('data')
        .eq('user_id', userId)
        .eq('event_type', 'lesson_heartbeat')
      const seconds = (beats || []).reduce((sum, r) => sum + (Number(((r as any).data?.sec)) || 0), 0)
      agg.lessonMinutes = Math.round(seconds / 60)

      // difficulty and groups via join to lessons
      if (viewedIds.length) {
  const { data: lessonsMeta } = await dbAgg.from('lessons').select('id,title,topic,layout_json').in('id', viewedIds)
        const seenGroups = new Set<string>()
        for (const l of (lessonsMeta || []) as any[]) {
          const t = `${l?.title || ''} ${l?.topic || ''}`.toLowerCase()
          if (/(weather|meteorolog|climate|storm|cloud|wind|precip|hurricane|tornado|barometer)/.test(t)) seenGroups.add('meteorology')
          else if (/(force|motion|velocity|acceleration|energy|electric|magnet|wave|optics|thermo|gravity)/.test(t)) seenGroups.add('physics')
          else if (/(atom|molecule|compound|reaction|acid|base|alkali|salt|periodic|bond|stoichi|solution)/.test(t)) seenGroups.add('chemistry')
          else if (/(map|continent|ocean|river|mountain|plate tectonics|earthquake|volcano|latitude|longitude|biome|ecosystem|landform)/.test(t)) seenGroups.add('geography')
          else if (/(cell|organism|ecosystem|photosynth|respiration|genetic|dna|evolution|anatomy|plant|animal|habitat)/.test(t)) seenGroups.add('biology')
          else if (/(space|planet|star|galaxy|universe|astronom|solar|orbit|telescope|cosmos|comet|asteroid|lunar)/.test(t)) seenGroups.add('astronomy')
          const diff = Number(l?.layout_json?.meta?.difficulty) || 0
          if (diff === 1) agg.difficulty.easy++
          else if (diff === 2) agg.difficulty.moderate++
          else if (diff >= 3) agg.difficulty.challenging++
        }
        agg.groupsExplored = seenGroups.size
      }

      // quiz
      const { data: quiz } = await dbAgg
        .from('lesson_activity_events')
        .select('data')
        .eq('user_id', userId)
        .eq('event_type', 'quiz_submit')
      const scores: number[] = []
      for (const r of (quiz || []) as any[]) {
        const pct = Number(r?.data?.pct) || 0
        scores.push(pct)
        if (pct >= 80) agg.quiz80++
        if (pct >= 90) agg.quiz90++
        if (pct === 100) agg.quiz100++
      }
      agg.quizSubmits = scores.length
      agg.quizBest = scores.length ? Math.max(...scores) : 0

      // crosswords
      const { data: cross } = await dbAgg
        .from('lesson_activity_events')
        .select('data')
        .eq('user_id', userId)
        .eq('event_type', 'crossword_check')
      agg.crossComplete = (cross || []).reduce((n, r) => n + ((r as any)?.data?.completed ? 1 : 0), 0)

      // flashcards
      const { data: flashC } = await dbAgg
        .from('lesson_activity_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'flash_cycle')
      agg.flashCycles = flashC?.length || 0
      const { data: flashF } = await dbAgg
        .from('lesson_activity_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'flash_flip')
      agg.flashFlips = flashF?.length || 0
    } catch {}

    // After lesson aggregations, set totalTimeSpent from lessonMinutes
    const stats = {
      topicsAccessed,
      topicsCompleted,
      studyAreasExplored,
      totalTimeSpent: agg.lessonMinutes,
      currentStreak: streak,
      lastAccessDate,
      level,
      totalXP,
      nextLevelXP,
      currentLevelXP,
      totalTopicsForGrade,
      lessonsViewed: agg.lessonsViewed,
      lessonMinutes: agg.lessonMinutes,
      lessonGroupsExplored: agg.groupsExplored,
      lessonDifficulty: agg.difficulty,
      quizSubmits: agg.quizSubmits,
      quizBest: agg.quizBest,
      quiz80: agg.quiz80,
      quiz90: agg.quiz90,
      quiz100: agg.quiz100,
      crosswordsCompleted: agg.crossComplete,
      flashCycles: agg.flashCycles,
      flashFlips: agg.flashFlips,
    }

    const achievementsBase = buildAchievements(
      { level, totalXP, nextLevelXP, currentLevelXP, streak, topicsCompleted, studyAreasExplored, totalTimeSpent: agg.lessonMinutes },
      studyAreasExplored,
      lastAccessDate,
    )

    // Lesson-based achievements
    const lessonAchievements = [
      { id: 'L1', title: 'First Lesson', description: 'View any lesson', icon: '📖', category: 'lesson', earned: (agg.lessonsViewed >= 1), earnedDate: (agg.lessonsViewed >= 1) ? lastAccessDate : undefined },
      { id: 'L2', title: 'Curious Explorer', description: 'View 5 lessons', icon: '🧭', category: 'lesson', earned: (agg.lessonsViewed >= 5), earnedDate: (agg.lessonsViewed >= 5) ? lastAccessDate : undefined, progress: agg.lessonsViewed, maxProgress: 5 },
      { id: 'L3', title: 'Subject Sampler', description: 'Explore 3 lesson subjects', icon: '🗂️', category: 'lesson', earned: (agg.groupsExplored >= 3), earnedDate: (agg.groupsExplored >= 3) ? lastAccessDate : undefined, progress: agg.groupsExplored, maxProgress: 3 },
      { id: 'L4', title: 'Challenge Accepted', description: 'View 3 challenging lessons', icon: '💪', category: 'lesson', earned: (agg.difficulty.challenging >= 3), earnedDate: (agg.difficulty.challenging >= 3) ? lastAccessDate : undefined, progress: agg.difficulty.challenging, maxProgress: 3 },
      { id: 'Q1', title: 'Quiz Starter', description: 'Submit your first quiz', icon: '📝', category: 'quiz', earned: (agg.quizSubmits >= 1), earnedDate: (agg.quizSubmits >= 1) ? lastAccessDate : undefined },
      { id: 'Q2', title: 'Bronze Brain', description: 'Score 80% on a quiz', icon: '🥉', category: 'quiz', earned: (agg.quiz80 > 0), earnedDate: (agg.quiz80 > 0) ? lastAccessDate : undefined },
      { id: 'Q3', title: 'Silver Brain', description: 'Score 90% on a quiz', icon: '🥈', category: 'quiz', earned: (agg.quiz90 > 0), earnedDate: (agg.quiz90 > 0) ? lastAccessDate : undefined },
      { id: 'Q4', title: 'Perfect Score', description: 'Score 100% on a quiz', icon: '🏆', category: 'quiz', earned: (agg.quiz100 > 0), earnedDate: (agg.quiz100 > 0) ? lastAccessDate : undefined },
      { id: 'C1', title: 'Wordsmith', description: 'Complete a crossword', icon: '🧩', category: 'crossword', earned: (agg.crossComplete >= 1), earnedDate: (agg.crossComplete >= 1) ? lastAccessDate : undefined },
      { id: 'F1', title: 'First Cycle', description: 'Finish a flashcard deck', icon: '🎴', category: 'flashcards', earned: (agg.flashCycles >= 1), earnedDate: (agg.flashCycles >= 1) ? lastAccessDate : undefined },
    ]
    const achievements = [...achievementsBase, ...lessonAchievements]

    // Build payload and compute ETag from stable string
    const payload = { stats, recentActivity, achievements }
    const stableStringify = (obj: any): string => {
      if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
      if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'
      const keys = Object.keys(obj).sort()
      return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
    }
  const bodyString = stableStringify(payload)
  const etag = 'W/"' + crypto.createHash('sha256').update(bodyString).digest('hex') + '"'
  const lastModified = (lastAccessDate ? new Date(lastAccessDate) : new Date()).toUTCString()

    // Conditional request handling
    const ifNoneMatch = request.headers.get('if-none-match')
    const ifModifiedSince = request.headers.get('if-modified-since')
    if (ifNoneMatch && ifNoneMatch === etag) {
      const headers = new Headers({
        'ETag': etag,
        'Last-Modified': lastModified,
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=600',
        'Vary': 'Authorization',
      })
      return new NextResponse(null, { status: 304, headers })
    }
    if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= new Date(lastModified).getTime()) {
      const headers = new Headers({
        'ETag': etag,
        'Last-Modified': lastModified,
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=600',
        'Vary': 'Authorization',
      })
      return new NextResponse(null, { status: 304, headers })
    }

    const res = NextResponse.json(payload)
    res.headers.set('ETag', etag)
    res.headers.set('Last-Modified', lastModified)
  res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=600')
  res.headers.set('Vary', 'Authorization')
    return res
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
