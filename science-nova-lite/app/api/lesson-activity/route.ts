import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })

    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as {
      lessonId?: string
      blockId?: string
      toolKind?: string
      eventType?: string
      data?: any
    }
    const { lessonId, blockId, toolKind, eventType } = body
    const data = body.data ?? {}
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    if (!eventType) return NextResponse.json({ error: 'eventType is required' }, { status: 400 })

    const { error } = await supabase.from('lesson_activity_events').insert({
      user_id: user.id,
      lesson_id: lessonId,
      block_id: blockId || null,
      tool_kind: toolKind || null,
      event_type: eventType,
      data,
    })
    if (error) {
      console.error('Lesson activity insert error:', error)
      return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Lesson activity API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
