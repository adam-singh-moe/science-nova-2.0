import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // ARCADE or DISCOVERY
    const subtype = searchParams.get('subtype') // QUIZ, FLASHCARDS, GAME, FACT, INFO
    const status = searchParams.get('status') || 'published'
    const grade = searchParams.get('grade')
    const topic_id = searchParams.get('topic_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let query = supabase
      .from('topic_content_entries')
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

    if (category) {
      query = query.eq('category', category)
    }
    if (subtype) {
      query = query.eq('subtype', subtype)
    }
    if (topic_id) {
      query = query.eq('topic_id', topic_id)
    }
    if (grade) {
      query = query.eq('topics.grade_level', parseInt(grade))
    }
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Content fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic_id,
      category, // ARCADE or DISCOVERY
      subtype, // QUIZ, FLASHCARDS, GAME, FACT, INFO
      title,
      payload,
      difficulty,
      status = 'draft',
      created_by,
      ai_generated = false,
      meta = {}
    } = body

    // Validate required fields
    if (!topic_id || !category || !subtype || !payload || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, category, subtype, payload, created_by' },
        { status: 400 }
      )
    }

    // Validate category and subtype combinations
    const validCombinations = {
      ARCADE: ['QUIZ', 'FLASHCARDS', 'GAME'],
      DISCOVERY: ['FACT', 'INFO']
    }

    if (!validCombinations[category as keyof typeof validCombinations]?.includes(subtype)) {
      return NextResponse.json(
        { error: `Invalid subtype ${subtype} for category ${category}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('topic_content_entries')
      .insert({
        topic_id,
        category,
        subtype,
        title,
        payload,
        difficulty,
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
      console.error('Content creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Content creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.created_at
    delete updateData.created_by
    delete updateData.version

    // Set updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('topic_content_entries')
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
      console.error('Content update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Content update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    // Soft delete by updating status to 'deleted'
    const { data, error } = await supabase
      .from('topic_content_entries')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title')
      .single()

    if (error) {
      console.error('Content deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Content deleted successfully',
      data: { id: data.id, title: data.title }
    })
  } catch (error) {
    console.error('Content deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}