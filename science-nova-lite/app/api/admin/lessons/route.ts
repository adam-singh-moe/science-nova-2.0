import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lesson_type = searchParams.get('lesson_type') // INTERACTIVE, VIDEO, TEXT
    const status = searchParams.get('status') || 'published'
    const grade = searchParams.get('grade')
    const topic_id = searchParams.get('topic_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let query = supabase
      .from('lessons')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_area_id,
          study_areas:study_area_id (
            id,
            name
          )
        ),
        profiles:created_by (
          id,
          full_name
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (lesson_type) {
      query = query.eq('lesson_type', lesson_type)
    }
    if (topic_id) {
      query = query.eq('topic_id', topic_id)
    }
    if (grade) {
      query = query.eq('grade_level', parseInt(grade))
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Lessons fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Lessons API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic_id,
      lesson_type, // INTERACTIVE, VIDEO, TEXT
      title,
      description,
      content,
      difficulty_level,
      estimated_duration,
      learning_objectives = [],
      status = 'draft',
      created_by,
      ai_generated = false,
      meta = {}
    } = body

    // Validate required fields
    if (!topic_id || !lesson_type || !title || !content || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, lesson_type, title, content, created_by' },
        { status: 400 }
      )
    }

    // Validate lesson types
    const validLessonTypes = ['INTERACTIVE', 'VIDEO', 'TEXT']
    if (!validLessonTypes.includes(lesson_type)) {
      return NextResponse.json(
        { error: `Invalid lesson_type ${lesson_type} for lessons. Valid types: ${validLessonTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        topic_id,
        lesson_type,
        title,
        description,
        content,
        difficulty_level,
        estimated_duration,
        learning_objectives,
        status,
        created_by,
        ai_generated,
        meta
      })
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_area_id
        )
      `)
      .single()

    if (error) {
      console.error('Lesson creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Lesson creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.created_at
    delete updateData.created_by

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_area_id
        )
      `)
      .single()

    if (error) {
      console.error('Lesson update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Lesson update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Soft delete by updating status to 'deleted'
    const { data, error } = await supabase
      .from('lessons')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title')
      .single()

    if (error) {
      console.error('Lesson deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Lesson deleted successfully',
      data: { id: data.id, title: data.title }
    })
  } catch (error) {
    console.error('Lesson deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}