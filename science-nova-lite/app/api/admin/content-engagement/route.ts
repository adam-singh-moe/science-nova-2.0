import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Create Supabase clients
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // User client for token verification
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Service client for admin operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user role using service client
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'TEACHER', 'DEVELOPER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get real content engagement data from database
    try {
      // Get topics with content counts from discovery_content
      const { data: topicsData, error: topicsError } = await serviceSupabase
        .from('topics')
        .select(`
          id,
          title,
          discovery_content (
            id,
            content_type
          )
        `)

      if (topicsError) {
        console.error('Topics fetch error:', topicsError)
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
      }

      // Process topics to count different content types
      const topics = (topicsData || []).map((topic: any) => {
        // For discovery content, we'll count by the actual content_type values (info, fact, etc.)
        const discovery_count = topic.discovery_content?.length || 0
        const arcade_count = 0 // No arcade content found in tables yet
        
        return {
          id: topic.id,
          name: topic.title,
          arcade_count,
          discovery_count
        }
      })

      // Get recent content entries with topic info from discovery_content
      const { data: entriesData, error: entriesError } = await serviceSupabase
        .from('discovery_content')
        .select(`
          id,
          title,
          content_type,
          status,
          topic_id,
          created_at,
          topics (
            grade_level
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (entriesError) {
        console.error('Entries fetch error:', entriesError)
        return NextResponse.json({ error: 'Failed to fetch content entries' }, { status: 500 })
      }

      // Format entries for response
      const entries = (entriesData || []).map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        category: 'DISCOVERY', // All entries from discovery_content are discovery type
        subtype: entry.content_type, // Use content_type as subtype (info, fact, etc.)
        grade_level: entry.topics?.grade_level || null,
        status: entry.status?.toUpperCase() || 'UNKNOWN',
        topic_id: entry.topic_id
      }))

      return NextResponse.json({
        topics,
        entries
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Content engagement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}