import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Services no longer needed as we query directly

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const gradeLevel = searchParams.get('grade')
    const search = searchParams.get('search') // For searching specific topics

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's grade level if not provided
    let userGrade = gradeLevel
    if (!userGrade) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', userId)
        .single()
      
      userGrade = userProfile?.grade_level?.toString()
    }

    // If searching, return search results instead of daily content
    if (search) {
      let query = supabase
        .from('discovery_content')
        .select(`
          *,
          topics:topic_id (
            id,
            title,
            grade_level,
            study_areas:study_area_id (
              name
            )
          )
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${search}%,preview_text.ilike.%${search}%`)
        .limit(10)

      if (userGrade) {
        query = query.eq('topics.grade_level', parseInt(userGrade))
      }

      const { data: searchResults, error } = await query

      if (error) {
        console.error('Discovery search error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data: searchResults || [],
        searchTerm: search,
        totalFound: searchResults?.length || 0
      })
    }

    // Instead of picking one topic, get diverse content from multiple topics
    // Get random discovery content with variety of content types
    let query = supabase
      .from('discovery_content')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_areas:study_area_id (
            name
          )
        )
      `)
      .eq('status', 'published')
      .limit(20) // Get more items to ensure variety

    if (userGrade) {
      query = query.eq('topics.grade_level', parseInt(userGrade))
    }

    const { data: allContent, error } = await query

    if (error) {
      console.error('Discovery content fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!allContent || allContent.length === 0) {
      return NextResponse.json({
        message: 'No discovery content available',
        data: []
      })
    }

    // Separate content by type to ensure variety
    const factContent = allContent.filter(item => item.content_type === 'fact')
    const infoContent = allContent.filter(item => item.content_type === 'info')
    
    // Shuffle arrays for randomness
    const shuffledFacts = factContent.sort(() => Math.random() - 0.5)
    const shuffledInfo = infoContent.sort(() => Math.random() - 0.5)
    
    // Select 3 of each type (or as many as available)
    const selectedFacts = shuffledFacts.slice(0, 3)
    const selectedInfo = shuffledInfo.slice(0, 3)
    
    const validFacts = [...selectedInfo, ...selectedFacts]

    return NextResponse.json({
      data: validFacts,
      selectedDate: date,
      totalAvailable: validFacts.length,
      factCount: selectedFacts.length,
      infoCount: selectedInfo.length
    })

  } catch (error) {
    console.error('Public discovery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get specific discovery content by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, userId } = body

    if (!contentId || !userId) {
      return NextResponse.json(
        { error: 'Content ID and User ID are required' },
        { status: 400 }
      )
    }

    // Fetch the specific discovery content
    const { data, error } = await supabase
      .from('discovery_content')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_areas:study_area_id (
            name
          )
        )
      `)
      .eq('id', contentId)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Discovery content not found' }, { status: 404 })
    }

    // Log engagement event
    try {
      await supabase
        .from('content_engagement_events')
        .insert({
          entry_id: contentId,
          topic_id: data.topic_id,
          category: 'DISCOVERY',
          subtype: data.content_type,
          event_type: 'open',
          meta: {
            user_id: userId,
            accessed_at: new Date().toISOString()
          }
        })
    } catch (engagementError) {
      console.warn('Failed to log engagement event:', engagementError)
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Discovery content fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Random discovery content endpoint
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gradeLevel } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's grade level if not provided
    let userGrade = gradeLevel
    if (!userGrade) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', userId)
        .single()
      
      userGrade = userProfile?.grade_level
    }

    // Get random discovery content
    let query = supabase
      .from('discovery_content')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level,
          study_areas:study_area_id (
            name
          )
        )
      `)
      .eq('status', 'published')

    if (userGrade) {
      query = query.eq('topics.grade_level', userGrade)
    }

    const { data: allFacts, error } = await query

    if (error) {
      console.error('Random discovery fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!allFacts || allFacts.length === 0) {
      return NextResponse.json({
        message: 'No discovery content available',
        data: null
      })
    }

    // Pick a random fact
    const randomIndex = Math.floor(Math.random() * allFacts.length)
    const randomFact = allFacts[randomIndex]

    return NextResponse.json({
      data: randomFact,
      totalAvailable: allFacts.length
    })

  } catch (error) {
    console.error('Random discovery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}