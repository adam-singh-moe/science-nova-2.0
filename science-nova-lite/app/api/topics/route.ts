import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/server-supabase'

export async function GET(request: NextRequest) {
  try {
    const svc = getServiceClient()
    if (!svc) {
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 })
    }

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || '100'), 200)
    const grade = url.searchParams.get('grade')

    // Fetch topics directly from topics table
    let query = svc
      .from('topics')
      .select(`
        id,
        title,
        grade_level
      `)
      .order('title')
      .limit(limit)

    // Filter by grade if provided
    if (grade) {
      const gradeNum = parseInt(grade, 10)
      if (!isNaN(gradeNum)) {
        query = query.eq('grade_level', gradeNum)
      }
    }

    const { data: topics, error } = await query

    if (error) {
      console.error('Topics API error:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedTopics = (topics || []).map(topic => ({
      id: topic.id,
      title: topic.title,
      grade_level: topic.grade_level?.toString() || null,
      study_area: 'Science', // Always science since this is a science learning platform
      vanta_effect: 'globe' // Default effect for all topics
    }))

    return NextResponse.json({ 
      items: transformedTopics
    })
  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
