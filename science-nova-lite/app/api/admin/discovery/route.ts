import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subtype = searchParams.get('subtype') // FACT, INFO
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
      .eq('category', 'DISCOVERY')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
      query = query.or(`title.ilike.%${search}%,payload->>preview_text.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Discovery fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Discovery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic_id,
      subtype = 'FACT', // FACT or INFO
      title,
      payload,
      status = 'draft',
      created_by,
      ai_generated = false,
      meta = {}
    } = body

    // Validate required fields
    if (!topic_id || !payload || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, payload, created_by' },
        { status: 400 }
      )
    }

    // Validate discovery subtypes
    const validSubtypes = ['FACT', 'INFO']
    if (!validSubtypes.includes(subtype)) {
      return NextResponse.json(
        { error: `Invalid subtype ${subtype} for discovery content` },
        { status: 400 }
      )
    }

    // Validate payload structure for discovery content
    if (!payload.preview_text || !payload.full_text) {
      return NextResponse.json(
        { error: 'Discovery payload must include preview_text and full_text' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('topic_content_entries')
      .insert({
        topic_id,
        category: 'DISCOVERY',
        subtype,
        title,
        payload,
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
      console.error('Discovery creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Discovery creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Discovery content ID is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.created_at
    delete updateData.created_by
    delete updateData.category

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('topic_content_entries')
      .update(updateData)
      .eq('id', id)
      .eq('category', 'DISCOVERY')
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
      console.error('Discovery update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Discovery content not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Discovery update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Discovery content ID is required' }, { status: 400 })
    }

    // Soft delete by updating status to 'deleted'
    const { data, error } = await supabase
      .from('topic_content_entries')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('category', 'DISCOVERY')
      .select('id, title')
      .single()

    if (error) {
      console.error('Discovery deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Discovery content not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Discovery content deleted successfully',
      data: { id: data.id, title: data.title }
    })
  } catch (error) {
    console.error('Discovery deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}