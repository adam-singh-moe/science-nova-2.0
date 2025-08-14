import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await userSupabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })

    const { data: progress, error } = await userSupabase
      .from('user_progress')
      .select(`
        *,
        topics (
          id,
          title,
          grade_level,
          study_areas (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('last_accessed', { ascending: false })

    if (error) {
      console.error('User progress fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 })
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('User progress API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const { topicId, completed } = await request.json().catch(() => ({}))
    if (!topicId) return NextResponse.json({ error: 'topicId is required' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
    }

    const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userSupabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })

    // Upsert progress for this user/topic
    const { data, error } = await userSupabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          topic_id: topicId,
          completed: completed === true ? true : false,
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,topic_id' }
      )
      .select('*')

    if (error) {
      console.error('User progress upsert error:', error)
      return NextResponse.json({ error: 'Failed to update user progress' }, { status: 500 })
    }

    return NextResponse.json({ progress: data?.[0] || null })
  } catch (error) {
    console.error('User progress POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
