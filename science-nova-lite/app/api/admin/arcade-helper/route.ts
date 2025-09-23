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
      subtype, // QUIZ, FLASHCARDS, GAME
      description,
      grade_level,
      difficulty = 'MEDIUM',
      count = 5 // Number of questions/cards to generate
    } = body

    if (!topic_id || !subtype || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, subtype, description' },
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

    // Generate content based on subtype
    let prompt = ''
    let responseFormat = ''

    switch (subtype) {
      case 'QUIZ':
        prompt = `Create ${count} multiple choice quiz questions about "${description}" for grade ${grade_level || topicData.grade_level} students studying ${topicData.study_areas?.name}. Topic: ${topicData.title}. Difficulty: ${difficulty}.

${contextContent ? `Reference content:\n${contextContent}\n\n` : ''}

Generate educational quiz questions that test understanding of the topic. Each question should have 4 options with one correct answer.`

        responseFormat = `Respond in JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`
        break

      case 'FLASHCARDS':
        prompt = `Create ${count} educational flashcards about "${description}" for grade ${grade_level || topicData.grade_level} students studying ${topicData.study_areas?.name}. Topic: ${topicData.title}. Difficulty: ${difficulty}.

${contextContent ? `Reference content:\n${contextContent}\n\n` : ''}

Generate flashcards that help students memorize key concepts, definitions, and facts.`

        responseFormat = `Respond in JSON format:
{
  "cards": [
    {
      "front": "Question or term",
      "back": "Answer or definition"
    }
  ]
}`
        break

      case 'GAME':
        prompt = `Create an educational crossword puzzle about "${description}" for grade ${grade_level || topicData.grade_level} students studying ${topicData.study_areas?.name}. Topic: ${topicData.title}. Difficulty: ${difficulty}.

${contextContent ? `Reference content:\n${contextContent}\n\n` : ''}

Generate ${count} crossword clues and answers that teach important vocabulary and concepts.`

        responseFormat = `Respond in JSON format:
{
  "type": "crossword",
  "clues": [
    {
      "clue": "Clue text",
      "answer": "ANSWER",
      "direction": "across" or "down",
      "position": {"row": 0, "col": 0}
    }
  ]
}`
        break

      default:
        return NextResponse.json({ error: 'Invalid subtype' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an educational content generator specializing in creating engaging learning materials for K-12 students. Always ensure content is age-appropriate, accurate, and educational. ${responseFormat}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
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

    // Create the content payload based on subtype
    let payload
    switch (subtype) {
      case 'QUIZ':
        payload = {
          questions: generatedContent.questions || [],
          type: 'multiple_choice',
          generated_at: new Date().toISOString()
        }
        break
      case 'FLASHCARDS':
        payload = {
          cards: generatedContent.cards || [],
          type: 'flashcards',
          generated_at: new Date().toISOString()
        }
        break
      case 'GAME':
        payload = {
          ...generatedContent,
          generated_at: new Date().toISOString()
        }
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        topic_id,
        category: 'ARCADE',
        subtype,
        title: `AI Generated ${subtype} - ${topicData.title}`,
        payload,
        difficulty,
        ai_generated: true,
        meta: {
          description,
          grade_level: grade_level || topicData.grade_level,
          generated_at: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Arcade AI helper error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}