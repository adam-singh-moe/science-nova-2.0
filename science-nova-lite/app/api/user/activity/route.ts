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
    const activity_type = searchParams.get('activity_type') // VIEW, COMPLETE, INTERACT
    const content_type = searchParams.get('content_type') // DISCOVERY, ARCADE, LESSONS
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('user_activity')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_areas:study_area_id (
            name
          )
        )
      `)
      .eq('user_id', user_id)
      .order('activity_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (activity_type) {
      query = query.eq('activity_type', activity_type)
    }
    if (content_type) {
      query = query.eq('content_type', content_type)
    }
    if (date_from) {
      query = query.gte('activity_date', date_from)
    }
    if (date_to) {
      query = query.lte('activity_date', date_to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('User activity fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('User activity API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      content_type, // DISCOVERY, ARCADE, LESSONS
      content_id,
      topic_id,
      activity_type, // VIEW, COMPLETE, INTERACT
      duration_seconds,
      score,
      meta = {}
    } = body

    // Validate required fields
    if (!user_id || !content_type || !content_id || !activity_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, content_type, content_id, activity_type' },
        { status: 400 }
      )
    }

    // Validate activity types
    const validActivityTypes = ['VIEW', 'COMPLETE', 'INTERACT']
    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: `Invalid activity_type ${activity_type}. Valid types: ${validActivityTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate content types
    const validContentTypes = ['DISCOVERY', 'ARCADE', 'LESSONS']
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: `Invalid content_type ${content_type}. Valid types: ${validContentTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id,
        content_type,
        content_id,
        topic_id,
        activity_type,
        duration_seconds,
        score,
        activity_date: new Date().toISOString().split('T')[0], // Current date
        meta
      })
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level
        )
      `)
      .single()

    if (error) {
      console.error('User activity creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('User activity creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get user activity summary/stats
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, date_from, date_to } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Build date filters
    const startDate = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
    const endDate = date_to || new Date().toISOString().split('T')[0] // Today

    // Get activity summary
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('content_type, activity_type, duration_seconds, score')
      .eq('user_id', user_id)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)

    if (activityError) {
      console.error('Activity summary fetch error:', activityError)
      return NextResponse.json({ error: activityError.message }, { status: 500 })
    }

    // Calculate summary statistics
    const summary = {
      total_activities: activityData?.length || 0,
      total_duration: activityData?.reduce((sum, activity) => sum + (activity.duration_seconds || 0), 0) || 0,
      average_score: 0,
      content_breakdown: {
        DISCOVERY: { count: 0, duration: 0 },
        ARCADE: { count: 0, duration: 0, total_score: 0, activities_with_score: 0 },
        LESSONS: { count: 0, duration: 0 }
      },
      activity_breakdown: {
        VIEW: 0,
        COMPLETE: 0,
        INTERACT: 0
      }
    }

    if (activityData) {
      const scoresWithValues = activityData.filter(a => a.score !== null && a.score !== undefined)
      summary.average_score = scoresWithValues.length > 0 
        ? scoresWithValues.reduce((sum, a) => sum + a.score, 0) / scoresWithValues.length 
        : 0

      activityData.forEach(activity => {
        // Content type breakdown
        if (summary.content_breakdown[activity.content_type as keyof typeof summary.content_breakdown]) {
          const breakdown = summary.content_breakdown[activity.content_type as keyof typeof summary.content_breakdown]
          breakdown.count++
          breakdown.duration += activity.duration_seconds || 0
          
          if (activity.content_type === 'ARCADE' && activity.score !== null) {
            ;(breakdown as any).total_score += activity.score
            ;(breakdown as any).activities_with_score++
          }
        }

        // Activity type breakdown
        if (summary.activity_breakdown[activity.activity_type as keyof typeof summary.activity_breakdown] !== undefined) {
          summary.activity_breakdown[activity.activity_type as keyof typeof summary.activity_breakdown]++
        }
      })

      // Calculate average arcade score
      if (summary.content_breakdown.ARCADE.activities_with_score > 0) {
        ;(summary.content_breakdown.ARCADE as any).average_score = 
          (summary.content_breakdown.ARCADE as any).total_score / 
          (summary.content_breakdown.ARCADE as any).activities_with_score
      }
    }

    return NextResponse.json({
      summary,
      date_range: { from: startDate, to: endDate }
    })
  } catch (error) {
    console.error('User activity summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}