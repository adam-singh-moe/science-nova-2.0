import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const achievement_type = searchParams.get('achievement_type') // STREAK, MILESTONE, MASTERY, EXPLORATION
    const unlocked_only = searchParams.get('unlocked_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user achievements with achievement details
    let query = supabase
      .from('user_achievements')
      .select(`
        *,
        achievements:achievement_id (
          id,
          title,
          description,
          achievement_type,
          badge_icon,
          points_reward,
          unlock_criteria
        )
      `)
      .eq('user_id', user_id)
      .order('unlocked_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (achievement_type) {
      query = query.eq('achievements.achievement_type', achievement_type)
    }
    if (unlocked_only) {
      query = query.not('unlocked_at', 'is', null)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('User achievements fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('User achievements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      achievement_id,
      progress = 0,
      unlock = false
    } = body

    // Validate required fields
    if (!user_id || !achievement_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, achievement_id' },
        { status: 400 }
      )
    }

    // Check if user achievement already exists
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id, progress, unlocked_at')
      .eq('user_id', user_id)
      .eq('achievement_id', achievement_id)
      .single()

    let result
    if (existing) {
      // Update existing achievement
      const updateData: any = { progress }
      if (unlock && !existing.unlocked_at) {
        updateData.unlocked_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .update(updateData)
        .eq('id', existing.id)
        .select(`
          *,
          achievements:achievement_id (
            id,
            title,
            description,
            achievement_type,
            badge_icon,
            points_reward
          )
        `)
        .single()

      if (error) {
        console.error('Achievement update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    } else {
      // Create new user achievement
      const insertData: any = {
        user_id,
        achievement_id,
        progress
      }
      if (unlock) {
        insertData.unlocked_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .insert(insertData)
        .select(`
          *,
          achievements:achievement_id (
            id,
            title,
            description,
            achievement_type,
            badge_icon,
            points_reward
          )
        `)
        .single()

      if (error) {
        console.error('Achievement creation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ data: result }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('User achievement API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get user achievement summary and check for new unlocks
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's current achievement status
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements:achievement_id (
          id,
          title,
          description,
          achievement_type,
          badge_icon,
          points_reward,
          unlock_criteria
        )
      `)
      .eq('user_id', user_id)

    if (achievementsError) {
      console.error('User achievements fetch error:', achievementsError)
      return NextResponse.json({ error: achievementsError.message }, { status: 500 })
    }

    // Get user's activity stats for achievement checking
    const { data: activityStats } = await supabase
      .from('user_activity')
      .select('content_type, activity_type, score, activity_date, topic_id')
      .eq('user_id', user_id)

    // Calculate achievement progress
    const newUnlocks: any[] = []
    const progressUpdates: any[] = []

    if (activityStats && userAchievements) {
      // Calculate stats
      const stats = {
        total_activities: activityStats.length,
        discovery_views: activityStats.filter(a => a.content_type === 'DISCOVERY' && a.activity_type === 'VIEW').length,
        arcade_completions: activityStats.filter(a => a.content_type === 'ARCADE' && a.activity_type === 'COMPLETE').length,
        lesson_completions: activityStats.filter(a => a.content_type === 'LESSONS' && a.activity_type === 'COMPLETE').length,
        streak_days: calculateStreakDays(activityStats),
        average_arcade_score: calculateAverageArcadeScore(activityStats),
        unique_topics: new Set(activityStats.map(a => a.topic_id).filter(Boolean)).size
      }

      // Check each achievement
      for (const userAch of userAchievements) {
        const achievement = userAch.achievements
        if (!achievement || userAch.unlocked_at) continue // Skip already unlocked

        const criteria = achievement.unlock_criteria as any
        let progress = 0
        let shouldUnlock = false

        switch (achievement.achievement_type) {
          case 'STREAK':
            progress = Math.min(stats.streak_days, criteria.required_days || 1)
            shouldUnlock = stats.streak_days >= (criteria.required_days || 1)
            break
          case 'MILESTONE':
            if (criteria.activity_type === 'discovery_views') {
              progress = Math.min(stats.discovery_views, criteria.required_count || 1)
              shouldUnlock = stats.discovery_views >= (criteria.required_count || 1)
            } else if (criteria.activity_type === 'arcade_completions') {
              progress = Math.min(stats.arcade_completions, criteria.required_count || 1)
              shouldUnlock = stats.arcade_completions >= (criteria.required_count || 1)
            } else if (criteria.activity_type === 'lesson_completions') {
              progress = Math.min(stats.lesson_completions, criteria.required_count || 1)
              shouldUnlock = stats.lesson_completions >= (criteria.required_count || 1)
            }
            break
          case 'MASTERY':
            progress = Math.min(stats.average_arcade_score, criteria.required_score || 100)
            shouldUnlock = stats.average_arcade_score >= (criteria.required_score || 100)
            break
          case 'EXPLORATION':
            progress = Math.min(stats.unique_topics, criteria.required_topics || 1)
            shouldUnlock = stats.unique_topics >= (criteria.required_topics || 1)
            break
        }

        if (progress !== userAch.progress || shouldUnlock) {
          progressUpdates.push({
            id: userAch.id,
            progress,
            unlocked_at: shouldUnlock ? new Date().toISOString() : null
          })

          if (shouldUnlock) {
            newUnlocks.push({
              ...userAch,
              achievements: achievement,
              unlocked_at: new Date().toISOString()
            })
          }
        }
      }

      // Update progress in batch
      for (const update of progressUpdates) {
        await supabase
          .from('user_achievements')
          .update({
            progress: update.progress,
            ...(update.unlocked_at && { unlocked_at: update.unlocked_at })
          })
          .eq('id', update.id)
      }
    }

    // Calculate summary
    const unlockedCount = userAchievements?.filter(a => a.unlocked_at).length || 0
    const totalPoints = userAchievements
      ?.filter(a => a.unlocked_at)
      .reduce((sum, a) => sum + (a.achievements?.points_reward || 0), 0) || 0

    return NextResponse.json({
      summary: {
        total_achievements: userAchievements?.length || 0,
        unlocked_count: unlockedCount,
        total_points: totalPoints,
        completion_percentage: userAchievements?.length 
          ? Math.round((unlockedCount / userAchievements.length) * 100) 
          : 0
      },
      new_unlocks: newUnlocks,
      progress_updates: progressUpdates.length
    })
  } catch (error) {
    console.error('Achievement check API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function calculateStreakDays(activities: any[]): number {
  if (!activities.length) return 0

  const dates = [...new Set(activities.map(a => a.activity_date))].sort()
  let streak = 1
  let maxStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currDate = new Date(dates[i])
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000))

    if (dayDiff === 1) {
      streak++
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 1
    }
  }

  return maxStreak
}

function calculateAverageArcadeScore(activities: any[]): number {
  const arcadeScores = activities
    .filter(a => a.content_type === 'ARCADE' && a.score !== null && a.score !== undefined)
    .map(a => a.score)

  return arcadeScores.length > 0 
    ? arcadeScores.reduce((sum, score) => sum + score, 0) / arcadeScores.length 
    : 0
}