import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'TEACHER', 'DEVELOPER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Mock content engagement data - replace with actual queries when content tables exist
    const mockTopics = [
      { id: 1, name: 'Biology', arcade_count: 5, discovery_count: 3 },
      { id: 2, name: 'Chemistry', arcade_count: 3, discovery_count: 4 },
      { id: 3, name: 'Physics', arcade_count: 2, discovery_count: 2 },
    ]

    const mockEntries = [
      {
        id: 1,
        title: 'Cell Structure Quiz',
        category: 'ARCADE',
        subtype: 'QUIZ',
        grade_level: 4,
        status: 'PUBLISHED',
        topic_id: 1
      },
      {
        id: 2,
        title: 'Animal Habitats Explorer',
        category: 'DISCOVERY',
        subtype: 'INTERACTIVE',
        grade_level: 3,
        status: 'PUBLISHED',
        topic_id: 1
      },
      {
        id: 3,
        title: 'States of Matter Game',
        category: 'ARCADE',
        subtype: 'GAME',
        grade_level: 4,
        status: 'DRAFT',
        topic_id: 2
      },
    ]

    return NextResponse.json({
      topics: mockTopics,
      entries: mockEntries
    })

  } catch (error) {
    console.error('Content engagement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}