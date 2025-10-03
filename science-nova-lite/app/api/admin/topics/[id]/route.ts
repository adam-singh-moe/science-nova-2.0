import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

// PUT /api/admin/topics/[id] - Update topic
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const topicId = params.id

    // Check if topic exists
    const { data: existingTopic } = await svc
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .single()

    if (!existingTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
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

    // Update topic with default Science study area (temporary fix)
    const { data: topic, error } = await svc
      .from('topics')
      .update({
        title: title.trim(),
        grade_level: Number(grade_level),
        study_area_id: '4c6d32d5-8f7f-494e-a1ae-738186896947', // Science study area ID (temporary)
        admin_prompt: admin_prompt?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId)
      .select()
      .single()

    if (error) {
      console.error('Topic update error:', error)
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Topic updated successfully', 
      topic 
    })
  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/topics/[id] - Delete topic
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const topicId = params.id

    // Check if topic exists
    const { data: existingTopic } = await svc
      .from('topics')
      .select('id, title')
      .eq('id', topicId)
      .single()

    if (!existingTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Check if topic is being used by lessons
    const { count: lessonCount } = await svc
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('topic', existingTopic.title)

    if (lessonCount && lessonCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete topic "${existingTopic.title}" as it is being used by ${lessonCount} lesson(s). Please reassign or delete those lessons first.` 
      }, { status: 400 })
    }

    // Check if topic is being used by content cache entries
    const { count: contentCount } = await svc
      .from('content_cache')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topicId)

    if (contentCount && contentCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete topic "${existingTopic.title}" as it has ${contentCount} associated content entries. Please delete those first.` 
      }, { status: 400 })
    }

    // Delete topic
    const { error } = await svc
      .from('topics')
      .delete()
      .eq('id', topicId)

    if (error) {
      console.error('Topic deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Topic deleted successfully' 
    })
  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
