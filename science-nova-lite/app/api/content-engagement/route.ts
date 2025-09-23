import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      entry_id,
      topic_id,
      category, // ARCADE or DISCOVERY
      subtype, // QUIZ, FLASHCARDS, GAME, FACT, INFO
      event_type, // open, close, complete, progress
      meta = {}
    } = body

    // Validate required fields
    if (!entry_id || !topic_id || !category || !subtype || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: entry_id, topic_id, category, subtype, event_type' },
        { status: 400 }
      )
    }

    // Validate event types
    const validEventTypes = ['open', 'close', 'complete', 'progress', 'view', 'interact']
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert engagement event
    const { data, error } = await supabase
      .from('content_engagement_events')
      .insert({
        entry_id,
        topic_id,
        category,
        subtype,
        event_type,
        meta: {
          ...meta,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Content engagement tracking error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Engagement event tracked successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Content engagement API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entry_id = searchParams.get('entry_id')
    const topic_id = searchParams.get('topic_id')
    const category = searchParams.get('category')
    const event_type = searchParams.get('event_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('content_engagement_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (entry_id) {
      query = query.eq('entry_id', entry_id)
    }
    if (topic_id) {
      query = query.eq('topic_id', topic_id)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Content engagement fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Content engagement fetch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}