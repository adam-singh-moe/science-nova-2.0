import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchArcadeTopicCandidateIds, pickDeterministicTopic, fetchArcadeEntriesForTopic } from '@/lib/services/arcade'

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

    // Get all arcade topic candidates
    const topicIds = await fetchArcadeTopicCandidateIds()
    
    if (topicIds.length === 0) {
      return NextResponse.json({
        message: 'No arcade content available',
        data: []
      })
    }

    // Filter topics by grade level if specified
    let filteredTopicIds = topicIds
    if (userGrade) {
      const { data: gradeTopics } = await supabase
        .from('topics')
        .select('id')
        .eq('grade_level', parseInt(userGrade))
        .in('id', topicIds)

      if (gradeTopics && gradeTopics.length > 0) {
        filteredTopicIds = gradeTopics.map(t => t.id)
      }
    }

    // Pick deterministic topic for the day
    const selectedTopicId = pickDeterministicTopic(filteredTopicIds, userId, date, 'ARCADE')
    
    if (!selectedTopicId) {
      return NextResponse.json({
        message: 'No arcade content available for today',
        data: []
      })
    }

    // Get arcade entries for the selected topic
    const arcadeEntries = await fetchArcadeEntriesForTopic(selectedTopicId)

    // Fetch full details for each entry
    const entryDetails = await Promise.all(
      arcadeEntries.map(async (entry) => {
        const { data } = await supabase
          .from('topic_content_entries')
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
          .eq('id', entry.id)
          .single()

        return data
      })
    )

    // Filter out any null results
    const validEntries = entryDetails.filter(entry => entry !== null)

    return NextResponse.json({
      data: validEntries,
      selectedDate: date,
      topicId: selectedTopicId,
      totalAvailable: validEntries.length
    })

  } catch (error) {
    console.error('Public arcade API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get specific arcade content by ID
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

    // Fetch the specific arcade content
    const { data, error } = await supabase
      .from('topic_content_entries')
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
      .eq('category', 'ARCADE')
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Arcade content not found' }, { status: 404 })
    }

    // Log engagement event
    try {
      await supabase
        .from('content_engagement_events')
        .insert({
          entry_id: contentId,
          topic_id: data.topic_id,
          category: 'ARCADE',
          subtype: data.subtype,
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
    console.error('Arcade content fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}