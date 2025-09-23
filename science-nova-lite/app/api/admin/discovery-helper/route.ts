import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic_id,
      description,
      grade_level,
      subtype = 'FACT', // FACT or INFO
      length = 'medium' // short, medium, long
    } = body

    if (!topic_id || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, description' },
        { status: 400 }
      )
    }

    // Fetch topic and related content for context
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select(`
        *,
        study_areas:study_area_id (name)
      `)
      .eq('id', topic_id)
      .single()

    if (topicError || !topicData) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Get relevant embeddings for context
    let contextContent = ''
    try {
      const { data: embeddings } = await supabase
        .from('textbook_embeddings')
        .select('content')
        .eq('grade_level', grade_level || topicData.grade_level)
        .limit(5)

      if (embeddings && embeddings.length > 0) {
        contextContent = embeddings.map(e => e.content).join('\n\n')
      }
    } catch (embeddingError) {
      console.warn('Could not fetch embeddings for context:', embeddingError)
    }

    // Generate content based on length and subtype
    let lengthGuideline = ''
    switch (length) {
      case 'short':
        lengthGuideline = 'Keep the preview to 1-2 sentences and the full explanation to 2-3 sentences.'
        break
      case 'medium':
        lengthGuideline = 'Keep the preview to 2-3 sentences and the full explanation to 1-2 paragraphs.'
        break
      case 'long':
        lengthGuideline = 'Keep the preview to 2-3 sentences and the full explanation to 2-3 detailed paragraphs.'
        break
    }

    const contentType = subtype === 'FACT' ? 'interesting fun fact' : 'educational information'

    const prompt = `Create an engaging ${contentType} about "${description}" for grade ${grade_level || topicData.grade_level} students studying ${topicData.study_areas?.name}. Topic: ${topicData.title}.

${contextContent ? `Reference content for accuracy:\n${contextContent}\n\n` : ''}

Generate educational content that:
1. Is age-appropriate and engaging for the grade level
2. Is scientifically accurate and educational
3. Sparks curiosity and interest in learning
4. Includes a short preview and detailed explanation
5. ${lengthGuideline}

${subtype === 'FACT' ? 'Focus on surprising, interesting, or little-known facts that make learning fun.' : 'Focus on clear, informative explanations that build understanding.'}

Include source information if referencing specific studies, books, or authoritative sources.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an educational content generator specializing in creating engaging discovery content for K-12 students. Always ensure content is age-appropriate, scientifically accurate, and educational. Respond in JSON format:
{
  "title": "Catchy title for the discovery item",
  "preview_text": "Short preview that appears on the card (1-3 sentences)",
  "full_text": "Detailed explanation that appears when opened",
  "source": "Optional source information or 'Educational AI' if no specific source",
  "tags": ["tag1", "tag2", "tag3"]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let generatedContent
    try {
      generatedContent = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('Invalid AI response format')
    }

    // Create the content payload
    const payload = {
      preview_text: generatedContent.preview_text || '',
      full_text: generatedContent.full_text || '',
      source: generatedContent.source || 'Educational AI',
      tags: generatedContent.tags || [],
      type: subtype.toLowerCase(),
      generated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: {
        topic_id,
        category: 'DISCOVERY',
        subtype,
        title: generatedContent.title || `Discovery - ${topicData.title}`,
        payload,
        ai_generated: true,
        meta: {
          description,
          grade_level: grade_level || topicData.grade_level,
          length,
          generated_at: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Discovery AI helper error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}