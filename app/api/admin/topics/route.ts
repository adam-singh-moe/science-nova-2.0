import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('📖 GET /api/admin/topics - Fetching topics...')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch topics with study areas
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        *,
        study_areas (
          id,
          name,
          vanta_effect
        )
      `)
      .order('created_at', { ascending: false })

    if (topicsError) {
      console.error('❌ Error fetching topics:', topicsError)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedTopics = topics?.map(topic => ({
      id: topic.id,
      title: topic.title,
      grade_level: topic.grade_level,
      admin_prompt: topic.admin_prompt,
      study_areas: topic.study_areas ? [topic.study_areas] : [],
      created_at: topic.created_at,
      updated_at: topic.updated_at
    })) || []

    console.log(`✅ Found ${transformedTopics.length} topics`)
    return NextResponse.json({ 
      topics: transformedTopics,
      count: transformedTopics.length 
    })

  } catch (error) {
    console.error('❌ Error in GET /api/admin/topics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🆕 POST /api/admin/topics - Creating new topic...')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get topic data from request
    const body = await request.json()
    const { title, grade_level, study_area_ids, admin_prompt } = body

    // Validate required fields
    if (!title || !grade_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, grade_level' 
      }, { status: 400 })
    }

    // For now, use the first study area ID or a default one
    let study_area_id = null
    if (study_area_ids && study_area_ids.length > 0) {
      study_area_id = study_area_ids[0]
    } else {
      // Get a default study area (General)
      const { data: defaultArea } = await supabase
        .from('study_areas')
        .select('id')
        .eq('name', 'General')
        .single()
      
      study_area_id = defaultArea?.id
    }

    // Validate grade level
    if (grade_level < 1 || grade_level > 12) {
      return NextResponse.json({ 
        error: 'Grade level must be between 1 and 12' 
      }, { status: 400 })
    }

    // Create the topic
    const { data: newTopic, error: insertError } = await supabase
      .from('topics')
      .insert({
        title,
        grade_level,
        study_area_id,
        admin_prompt: admin_prompt || null,
        creator_id: user.id
      })
      .select(`
        *,
        study_areas (
          id,
          name,
          vanta_effect
        )
      `)
      .single()

    if (insertError) {
      console.error('❌ Error inserting topic:', insertError)
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    // Transform the response
    const transformedTopic = {
      id: newTopic.id,
      title: newTopic.title,
      grade_level: newTopic.grade_level,
      admin_prompt: newTopic.admin_prompt,
      study_areas: newTopic.study_areas ? [newTopic.study_areas] : [],
      created_at: newTopic.created_at
    }

    console.log(`✅ Created topic: ${title}`)
    return NextResponse.json({ topic: transformedTopic })

  } catch (error) {
    console.error('❌ Error in POST /api/admin/topics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE /api/admin/topics - Deleting topic...')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get topic ID from request
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 })
    }

    // Delete the topic
    const { error: deleteError } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Error deleting topic:', deleteError)
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
    }

    console.log(`✅ Deleted topic: ${id}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/topics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
