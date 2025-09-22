import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

// GET /api/admin/topics - List all topics
export async function GET(request: NextRequest) {
  try {
    const svc = getServiceClient()
    if (!svc) {
      return NextResponse.json({ error: 'Server client unavailable' }, { status: 500 })
    }

    // Check authentication
    const user = await getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const role = await getProfileRole(user.userId)
    if (!role || !['ADMIN', 'DEVELOPER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get topics
    const { data: topics, error } = await svc
      .from('topics')
      .select(`
        id,
        title,
        grade_level,
        admin_prompt,
        creator_id,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Topics fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    return NextResponse.json({ topics: topics || [] })
  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/topics - Create new topic
export async function POST(request: NextRequest) {
  try {
    const svc = getServiceClient()
    if (!svc) {
      return NextResponse.json({ error: 'Server client unavailable' }, { status: 500 })
    }

    // Check authentication
    const user = await getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const role = await getProfileRole(user.userId)
    if (!role || !['ADMIN', 'DEVELOPER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { title, grade_level, admin_prompt } = body

    // Validate required fields
    if (!title?.trim() || !grade_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: title and grade_level are required' 
      }, { status: 400 })
    }

    // Validate grade level
    if (![1, 2, 3, 4, 5, 6].includes(Number(grade_level))) {
      return NextResponse.json({ 
        error: 'Invalid grade level. Must be 1-6.' 
      }, { status: 400 })
    }

    // Create topic with default Science study area (temporary fix)
    const { data: topic, error } = await svc
      .from('topics')
      .insert({
        title: title.trim(),
        grade_level: Number(grade_level),
        study_area_id: '4c6d32d5-8f7f-494e-a1ae-738186896947', // Science study area ID (temporary)
        admin_prompt: admin_prompt?.trim() || null,
        creator_id: user.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Topic creation error:', error)
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Topic created successfully', 
      topic 
    }, { status: 201 })
  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
