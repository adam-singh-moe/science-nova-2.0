import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAIRecommendedTopics(gradeLevel: number, availableTopics: any[], limit: number = 6) {
  try {
    // Ensure we have enough topics to work with
    if (availableTopics.length < 3) {
      console.warn(`Only ${availableTopics.length} topics available for Grade ${gradeLevel}, returning all`)
      return availableTopics
    }

    // Adjust limit to ensure we get 3-6 topics
    const adjustedLimit = Math.min(Math.max(limit, 3), Math.min(6, availableTopics.length))
    
    const topicsText = availableTopics.map(topic => 
      `- ${topic.title} (${topic.study_areas.name})`
    ).join('\n')

    const prompt = `You are an AI educational advisor. From the following Grade ${gradeLevel} science topics, recommend exactly ${adjustedLimit} topics that would be most engaging and educationally valuable for students.

Available topics:
${topicsText}

Consider:
- Educational value and curriculum alignment
- Student engagement potential
- Building foundational knowledge
- Variety across different science areas
- Age-appropriate complexity for Grade ${gradeLevel}

You must select exactly ${adjustedLimit} topics (no more, no less) from the available list.

Respond with ONLY a JSON array containing the exact topic titles in order of recommendation:
${adjustedLimit === 3 ? '["Topic Title 1", "Topic Title 2", "Topic Title 3"]' : 
  adjustedLimit === 4 ? '["Topic Title 1", "Topic Title 2", "Topic Title 3", "Topic Title 4"]' :
  adjustedLimit === 5 ? '["Topic Title 1", "Topic Title 2", "Topic Title 3", "Topic Title 4", "Topic Title 5"]' :
  '["Topic Title 1", "Topic Title 2", "Topic Title 3", "Topic Title 4", "Topic Title 5", "Topic Title 6"]'}`

    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      maxTokens: 200,
    })

    // Clean the response - remove markdown code blocks if present
    let cleanedText = result.text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const recommendedTitles = JSON.parse(cleanedText)
    
    // Map back to full topic objects
    const recommendedTopics = recommendedTitles
      .map((title: string) => availableTopics.find(topic => topic.title === title))
      .filter(Boolean)
      .slice(0, adjustedLimit)

    // Ensure we have at least 3 topics
    if (recommendedTopics.length < 3 && availableTopics.length >= 3) {
      console.warn('AI returned fewer than 3 topics, filling with additional topics')
      const additionalTopics = availableTopics
        .filter(topic => !recommendedTopics.find((rt: any) => rt.id === topic.id))
        .slice(0, 3 - recommendedTopics.length)
      recommendedTopics.push(...additionalTopics)
    }

    return recommendedTopics

  } catch (error) {
    console.error('Error getting AI recommendations:', error)
    // Fallback: return 3-6 topics if AI fails
    const fallbackCount = Math.min(Math.max(3, limit), Math.min(6, availableTopics.length))
    return availableTopics.slice(0, fallbackCount)
  }
}

async function getDatabaseRecommendedTopics(userId: string, gradeLevel: number, limit: number = 6) {
  try {
    console.log(`🗄️ Database recommendations temporarily disabled due to function issue`)
    
    // TODO: Fix database function ambiguous column reference issue
    // The database function get_recommended_topics has an ambiguous user_id column reference
    // For now, we'll rely on AI recommendations which are working excellently
    
    return []

  } catch (error) {
    console.error('Error getting database recommendations:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gradeLevel = parseInt(url.searchParams.get('gradeLevel') || '3')
    const limit = parseInt(url.searchParams.get('limit') || '6')
    const userId = url.searchParams.get('userId') // Optional user ID for personalized recommendations

    console.log(`🎯 Getting recommended topics for Grade ${gradeLevel}${userId ? ` (User: ${userId})` : ''}`)

    // Fetch all topics for the grade level
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        id,
        title,
        grade_level,
        study_areas!inner (
          name,
          vanta_effect
        )
      `)
      .eq('grade_level', gradeLevel)
      .order('created_at', { ascending: false })

    if (topicsError) {
      console.error('Error fetching topics:', topicsError)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    if (!topics || topics.length === 0) {
      console.log(`⚠️ No topics found for Grade ${gradeLevel}`)
      return NextResponse.json({ 
        recommendedTopics: [],
        totalTopics: 0,
        gradeLevel,
        method: 'none' 
      })
    }

    // Format topics data
    const formattedTopics = topics.map(topic => ({
      ...topic,
      study_areas: Array.isArray(topic.study_areas) ? topic.study_areas[0] : topic.study_areas
    }))

    let recommendedTopics = []
    let method = 'ai'

    // Try personalized database recommendations first if user ID provided
    if (userId) {
      recommendedTopics = await getDatabaseRecommendedTopics(userId, gradeLevel, limit)
      if (recommendedTopics.length > 0) {
        method = 'personalized'
      }
    }

    // Fallback to AI recommendations if no personalized results or no user ID
    if (recommendedTopics.length === 0) {
      recommendedTopics = await getAIRecommendedTopics(gradeLevel, formattedTopics, limit)
      method = 'ai'
    }

    // Final fallback to simple selection if AI fails
    if (recommendedTopics.length === 0) {
      const fallbackCount = Math.min(Math.max(3, limit), Math.min(6, formattedTopics.length))
      recommendedTopics = formattedTopics.slice(0, fallbackCount)
      method = 'fallback'
    }

    console.log(`✅ Recommended ${recommendedTopics.length} topics out of ${formattedTopics.length} available (method: ${method})`)

    return NextResponse.json({
      recommendedTopics,
      totalTopics: formattedTopics.length,
      gradeLevel,
      method,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in recommended topics API:', error)
    return NextResponse.json(
      { error: 'Failed to get recommended topics' },
      { status: 500 }
    )
  }
}
