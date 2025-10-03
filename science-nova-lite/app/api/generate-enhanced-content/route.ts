import { type NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { generateEducationalContent, getAI } from '@/lib/simple-ai'
import { generateEmbedding, cosineSimilarity } from '@/lib/openai-embeddings'

export const runtime = 'nodejs'
let svcClient: SupabaseClient | null = null
function getSupabase(): SupabaseClient | null {
  // Prefer service role for broader access; fall back to anon for read-only.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) return null
  if (!svcClient) {
    const keyToUse = serviceKey || anon
    if (!keyToUse) return null
    svcClient = createClient(url, keyToUse)
  }
  return svcClient
}

async function searchRelevantTextbookContent(query: string, gradeLevel: number, limit: number = 10) {
  try {
    const client = getSupabase()
    if (!client) {
      console.warn('🚨 Supabase client not available for textbook search')
      return []
    }

    console.log(`🔍 Searching textbook content for grade ${gradeLevel}, query: "${query}"`)

    // Generate embedding for the search query
    let queryEmbedding: number[] | null = null
    try {
      queryEmbedding = await generateEmbedding(query)
      console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)`)
    } catch (embeddingError) {
      console.error('⚠️ Failed to generate query embedding:', embeddingError)
      // Fall back to basic text search without vector similarity
    }

    // Search for textbook embeddings with exact grade match first
    const { data: exactGradeEmbeddings, error: exactError } = await client
      .from('textbook_embeddings')
      .select('content, metadata, file_name, embedding')
      .eq('grade_level', gradeLevel)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to allow for similarity filtering

    if (exactError) {
      console.error('❌ Error fetching exact grade embeddings:', exactError)
    }

    let results: any[] = exactGradeEmbeddings || []
    console.log(`📚 Found ${results.length} textbook entries for grade ${gradeLevel}`)

    // If we have a query embedding and textbook embeddings, calculate similarities
    if (queryEmbedding && results.length > 0) {
      const scoredResults = results
        .filter(item => item.embedding && Array.isArray(item.embedding))
        .map(item => {
          try {
            const similarity = cosineSimilarity(queryEmbedding!, item.embedding)
            return { ...item, similarity }
          } catch (simError) {
            console.warn('⚠️ Error calculating similarity for item:', simError)
            return { ...item, similarity: 0 }
          }
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      console.log(`🎯 Top ${Math.min(3, scoredResults.length)} similarity scores:`, 
        scoredResults.slice(0, 3).map(r => `${r.similarity?.toFixed(3)}`).join(', '))
      
      results = scoredResults
    } else {
      // Fallback: basic filtering by content relevance (text matching)
      const queryLower = query.toLowerCase()
      results = results
        .map(item => ({
          ...item,
          relevanceScore: (item.content?.toLowerCase().includes(queryLower) ? 2 : 0) +
                         (item.metadata?.title?.toLowerCase().includes(queryLower) ? 1 : 0) +
                         (item.metadata?.topic?.toLowerCase().includes(queryLower) ? 1 : 0)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
      
      console.log(`📝 Using text-based relevance filtering`)
    }

    // If we don't have enough results for the exact grade, search adjacent grades
    if (results.length < limit / 2 && gradeLevel > 1) {
      console.log(`🔄 Searching adjacent grades for additional content...`)
      
      const adjacentGrades = [gradeLevel - 1, gradeLevel + 1].filter(g => g >= 1 && g <= 12)
      
      for (const adjGrade of adjacentGrades) {
        const { data: adjEmbeddings } = await client
          .from('textbook_embeddings')
          .select('content, metadata, file_name, embedding')
          .eq('grade_level', adjGrade)
          .limit(Math.floor(limit / 2))
        
        if (adjEmbeddings?.length) {
          console.log(`📚 Found ${adjEmbeddings.length} additional entries from grade ${adjGrade}`)
          
          if (queryEmbedding) {
            const adjScored = adjEmbeddings
              .filter(item => item.embedding && Array.isArray(item.embedding))
              .map(item => {
                try {
                  const similarity = cosineSimilarity(queryEmbedding!, item.embedding)
                  return { ...item, similarity: similarity * 0.8 } // Slight penalty for adjacent grade
                } catch {
                  return { ...item, similarity: 0 }
                }
              })
            
            results.push(...adjScored)
          } else {
            results.push(...adjEmbeddings.map(item => ({ ...item, similarity: 0 })))
          }
        }
      }
      
      // Re-sort and limit
      results = results
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit)
    }

    // Clean up the results (remove embedding data for response size)
    const cleanResults = results.map(({ embedding, ...rest }) => rest)
    
    console.log(`✅ Returning ${cleanResults.length} textbook references`)
    return cleanResults

  } catch (error) {
    console.error('❌ Error in searchRelevantTextbookContent:', error)
    return []
  }
}

function formatTextbookContentForPrompt(textbookContent: any[], gradeLevel: number) {
  if (!textbookContent?.length) {
    return `No specific textbook content available for this topic. Please generate Grade ${gradeLevel} appropriate content based on standard science curriculum guidelines.`
  }
  
  const formatted = textbookContent.slice(0, 6).map((c: any, i: number) => {
    const source = c.file_name ? ` (Source: ${c.file_name})` : ''
    const metadata = c.metadata?.title ? ` - ${c.metadata.title}` : ''
    const similarity = c.similarity ? ` [Relevance: ${(c.similarity * 100).toFixed(1)}%]` : ''
    
    return `[Textbook Reference ${i+1}${source}${metadata}]${similarity}:\n${c.content.slice(0, 500)}${c.content.length > 500 ? '...' : ''}\n`
  }).join('\n')
  
  return `IMPORTANT: You must base your content generation EXCLUSIVELY on the following Grade ${gradeLevel} textbook references. Do not add information that is not supported by these sources:

${formatted}

Instructions:
- Generate content that directly aligns with the textbook material above
- Use only information found in these textbook references
- Maintain Grade ${gradeLevel} appropriate language and complexity
- Reference specific concepts mentioned in the textbook content
- Ensure all generated content can be traced back to the provided references

Based strictly on this textbook content:`
}

async function generateEducationalContentWithTextbooks(
  topic: string, 
  gradeLevel: number, 
  textbookContext: string,
  adminPrompt: string,
  options: {
    type?: 'lesson' | 'discovery' | 'quiz';
    count?: number;
    style?: 'fun' | 'serious' | 'curious';
  } = {}
) {
  const ai = getAI()
  const { type = 'lesson', count = 5, style = 'fun' } = options

  // Build the enhanced prompt with textbook context
  let prompt = `${textbookContext}\n\n`
  
  // Add admin guidance if provided
  if (adminPrompt?.trim()) {
    prompt += `ADDITIONAL TEACHER GUIDANCE: ${adminPrompt.trim()}\n\n`
  }

  if (type === 'lesson') {
    prompt += `Create comprehensive educational content for Grade ${gradeLevel} about "${topic}".

    CRITICAL REQUIREMENTS:
    1. Base ALL content exclusively on the textbook references provided above
    2. Do not invent facts or add information not found in the textbook content
    3. Directly reference and build upon the concepts mentioned in the textbook materials
    4. Maintain Grade ${gradeLevel} appropriate language and complexity
    5. Make connections between different textbook references when applicable
    
    Generate content in this exact JSON format:
    {
      "lessonContent": "500-800 words explaining the topic using ONLY information from the textbook references above. Include specific references to textbook content and maintain grade-appropriate language.",
      "contentImagePrompts": ["visual description based on textbook content", "diagram or illustration mentioned in textbook"],
      "flashcards": [
        {"id":"1","front":"question based on textbook content","back":"answer directly from textbook material","imagePrompt":"visual related to textbook concept"},
        {"id":"2","front":"question based on textbook content","back":"answer directly from textbook material","imagePrompt":"visual related to textbook concept"},
        {"id":"3","front":"question based on textbook content","back":"answer directly from textbook material","imagePrompt":"visual related to textbook concept"},
        {"id":"4","front":"question based on textbook content","back":"answer directly from textbook material","imagePrompt":"visual related to textbook concept"},
        {"id":"5","front":"question based on textbook content","back":"answer directly from textbook material","imagePrompt":"visual related to textbook concept"}
      ],
      "quiz": [
        {"id":"1","question":"question about textbook content","options":["A","B","C","D"],"correctAnswer":0,"explanation":"explanation based on textbook material"},
        {"id":"2","question":"question about textbook content","options":["A","B","C","D"],"correctAnswer":1,"explanation":"explanation based on textbook material"},
        {"id":"3","question":"question about textbook content","options":["A","B","C","D"],"correctAnswer":2,"explanation":"explanation based on textbook material"},
        {"id":"4","question":"question about textbook content","options":["A","B","C","D"],"correctAnswer":3,"explanation":"explanation based on textbook material"},
        {"id":"5","question":"question about textbook content","options":["A","B","C","D"],"correctAnswer":0,"explanation":"explanation based on textbook material"}
      ]
    }
    
    Remember: Every piece of generated content must be traceable to the textbook references provided above.`
  }

  const response = await ai.generateText(prompt, {
    maxTokens: type === 'lesson' ? 3000 : 1500,
    temperature: 0.6 // Slightly lower temperature for more consistent textbook-based content
  })

  try {
    const parsed = JSON.parse(response)
    
    // Add metadata about textbook usage
    parsed._textbookBased = true
    parsed._textbookReferencesUsed = textbookContext.includes('[Textbook Reference') ? 'yes' : 'no'
    parsed._gradeLevel = gradeLevel
    
    return parsed
  } catch (parseError) {
    console.error('❌ Failed to parse AI response as JSON:', parseError)
    console.log('Raw AI response:', response.substring(0, 500) + '...')
    
    // Return fallback that still indicates textbook usage
    return {
      lessonContent: `Learning about ${topic} (Grade ${gradeLevel}):\n\n${textbookContext.includes('No specific textbook') ? 'This content is based on standard curriculum guidelines.' : 'This content is based on your uploaded textbook materials.'}\n\n[AI parsing error - using fallback content]`,
      contentImagePrompts: [`Educational illustration of ${topic}`, `Grade ${gradeLevel} ${topic} concept`],
      flashcards: Array.from({length: 5}, (_, i) => ({
        id: String(i + 1),
        front: `Question ${i + 1} about ${topic}`,
        back: `Answer based on Grade ${gradeLevel} curriculum for ${topic}`,
        imagePrompt: `${topic} educational visual ${i + 1}`
      })),
      quiz: Array.from({length: 5}, (_, i) => ({
        id: String(i + 1),
        question: `Question ${i + 1} about ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: i % 4,
        explanation: `Explanation based on Grade ${gradeLevel} understanding of ${topic}`
      })),
      _textbookBased: false,
      _parseError: true
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { topicId } = await request.json()
  if (!topicId) { const r = NextResponse.json({ error: "Topic ID is required" }, { status: 400 }); r.headers.set('Cache-Control','no-store'); r.headers.set('Vary','Authorization'); return r }

    try {
      const supa = getSupabase()
      const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333'
      const { data: cachedContent } = supa
        ? await supa
            .from('content_cache')
            .select('*')
            .eq('topic_id', topicId)
            .eq('user_id', userId)
            .single()
        : { data: null as any }
      if (cachedContent?.content) {
        const parsed = JSON.parse(cachedContent.content)
        if (cachedContent.generation_metadata?.cached_without_images) {
          const contentPrompts = cachedContent.generation_metadata?.content_prompts || []
          const flashcardPrompts = cachedContent.generation_metadata?.flashcard_prompts || []
          const contentImages: string[] = []
          for (let i=0;i<contentPrompts.length;i++) contentImages.push('')
          if (parsed.flashcards && flashcardPrompts.length > 0) {
            for (let i=0;i<Math.min(parsed.flashcards.length, flashcardPrompts.length); i++) parsed.flashcards[i].coverImage = ''
          }
          let processedLessonContent = parsed.lessonContent || ''
          const imagePromptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/g
          let imageIndex = 0
          processedLessonContent = processedLessonContent.replace(imagePromptRegex, (match: string, promptText: string) => { imageIndex++; return `\n\n<div class="content-image-placeholder"><div class="placeholder-text">📖 ${promptText.trim()}</div></div>\n\n` })
          const finalCachedContent = { ...parsed, lessonContent: processedLessonContent, contentImages, fromCache: true, imagesRegeneratedFromPrompts: true, cacheTimestamp: cachedContent.created_at }
          const response = NextResponse.json(finalCachedContent)
          response.headers.set('X-Cache', 'HIT-PROMPTS')
          response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          response.headers.set('Cache-Control','no-store')
          response.headers.set('Vary','Authorization')
          return response
        } else {
          const response = NextResponse.json({ ...parsed, fromCache: true, cacheTimestamp: cachedContent.created_at })
          response.headers.set('X-Cache', 'HIT-LEGACY')
          response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          response.headers.set('Cache-Control','no-store')
          response.headers.set('Vary','Authorization')
          return response
        }
      }
    } catch {}

    const supa = getSupabase()
  if (!supa) { const r = NextResponse.json({ error: "Server misconfigured: Supabase env vars missing" }, { status: 503 }); r.headers.set('Cache-Control','no-store'); r.headers.set('Vary','Authorization'); return r }

    const { data: topicData, error: topicError } = await supa
      .from("topics")
      .select(`title, grade_level, admin_prompt`).eq("id", topicId).single()
  if (topicError || !topicData) { const r = NextResponse.json({ error: "Topic not found" }, { status: 404 }); r.headers.set('Cache-Control','no-store'); r.headers.set('Vary','Authorization'); return r }

    const studyAreaName = 'Science' // Always science since this is a science learning platform
    const gradeLevel = topicData.grade_level
    
    // Create a more comprehensive search query including admin prompt context
    const searchQuery = `${topicData.title} ${topicData.admin_prompt || ''}`.trim()
    const relevantTextbookContent = await searchRelevantTextbookContent(searchQuery, gradeLevel, 8)
    
    // Use the new simple AI system with textbook context
    const ai = getAI()
    console.log('AI Status:', ai.getStatus())
    
    // Format textbook content for the AI prompt
    const textbookContext = formatTextbookContentForPrompt(relevantTextbookContent, gradeLevel)
    
    let parsedContent: any
    try {
      parsedContent = await generateEducationalContentWithTextbooks(
        topicData.title, 
        gradeLevel, 
        textbookContext,
        topicData.admin_prompt || '',
        {
          type: 'lesson',
          style: 'fun'
        }
      )
    } catch (error) {
      console.error('AI generation error:', error)
      // Fallback content
      parsedContent = {
        lessonContent: `Learning about ${topicData.title} (Grade ${gradeLevel}):\n\nThis topic is designed to help students understand key concepts in ${studyAreaName}. The content is tailored for Grade ${gradeLevel} learners and provides engaging, age-appropriate explanations.\n\n[IMAGE_PROMPT: Students learning about ${topicData.title}]`,
        contentImagePrompts: [
          `Educational illustration of ${topicData.title}`,
          `Students exploring ${topicData.title} concepts`
        ],
        flashcards: [
          { id: "1", front: `What is ${topicData.title}?`, back: `${topicData.title} is an important concept in ${studyAreaName}.`, imagePrompt: `${topicData.title} concept illustration` },
          { id: "2", front: "Why is this topic important?", back: `Understanding ${topicData.title} helps us learn about ${studyAreaName}.`, imagePrompt: `Importance of ${topicData.title}` },
          { id: "3", front: "How does this relate to real life?", back: `${topicData.title} can be observed in many everyday situations.`, imagePrompt: `Real world ${topicData.title}` },
          { id: "4", front: `What grade level is this for?`, back: `This content is designed for Grade ${gradeLevel} students.`, imagePrompt: `Grade ${gradeLevel} learning` },
          { id: "5", front: `What subject area?`, back: `${topicData.title} belongs to ${studyAreaName}.`, imagePrompt: `${studyAreaName} subject area` }
        ],
        quiz: [
          { id: "1", question: `What subject area does ${topicData.title} belong to?`, options: ["Math", "Science", "History", "Art"], correctAnswer: 1, explanation: `${topicData.title} is part of ${studyAreaName}.` },
          { id: "2", question: `What grade is this content for?`, options: [`Grade ${gradeLevel-1}`, `Grade ${gradeLevel}`, `Grade ${gradeLevel+1}`, "All grades"], correctAnswer: 1, explanation: `Designed for Grade ${gradeLevel}.` },
          { id: "3", question: "What's the best way to learn?", options: ["Memorize only", "Ask questions", "Skip lessons", "Rush through"], correctAnswer: 1, explanation: "Asking questions helps understanding." },
          { id: "4", question: "Why study science?", options: ["It's required", "To understand the world", "For tests only", "No reason"], correctAnswer: 1, explanation: "Science helps us understand our world." },
          { id: "5", question: "What makes learning effective?", options: ["Speed", "Curiosity", "Avoiding questions", "Memorization"], correctAnswer: 1, explanation: "Curiosity drives effective learning." }
        ]
      }
    }

    if (!parsedContent.flashcards || parsedContent.flashcards.length < 5) {
      parsedContent.flashcards = [
        { id: "1", front: `What is ${topicData.title}?`, back: `${topicData.title} is an important concept in ${studyAreaName}.` },
        { id: "2", front: "Why should we learn this?", back: `Understanding ${topicData.title} helps us comprehend the world better.` },
        { id: "3", front: "How is this relevant?", back: `${topicData.title} connects to many aspects of daily life and science.` },
        { id: "4", front: `What makes ${topicData.title} interesting?`, back: `${topicData.title} has many fascinating aspects to explore.` },
        { id: "5", front: `How can we apply ${topicData.title}?`, back: `We can apply ${topicData.title} concepts in various real-world situations.` }
      ]
    }
    if (!parsedContent.quiz || parsedContent.quiz.length < 5) {
      parsedContent.quiz = [
        { id: "1", question: `Which subject area does ${topicData.title} belong to?`, options: ["Mathematics", studyAreaName, "History", "Literature"], correctAnswer: 1, explanation: `${topicData.title} is a key topic in ${studyAreaName}.` },
        { id: "2", question: "What makes scientific learning effective?", options: ["Memorization only", "Active engagement", "Passive listening", "Avoiding practice"], correctAnswer: 1, explanation: "Active engagement leads to better understanding." },
        { id: "3", question: `For which grade is this ${topicData.title} content designed?`, options: [`Grade ${gradeLevel-1}`, `Grade ${gradeLevel}`, `Grade ${gradeLevel+1}`, "All grades equally"], correctAnswer: 1, explanation: `Tailored for Grade ${gradeLevel}.` },
        { id: "4", question: "Why do we study science concepts?", options: ["For tests only", "To understand nature and our world", "Because it's mandatory", "For entertainment"], correctAnswer: 1, explanation: "Science helps us understand the natural world." },
        { id: "5", question: "What's the best approach to learning new concepts?", options: ["Rush through material", "Ask questions and explore", "Memorize without understanding", "Avoid challenging topics"], correctAnswer: 1, explanation: "Curiosity and exploration matter." }
      ]
    }

    const finalContent = { ...parsedContent, generatedAt: new Date().toISOString(), gradeLevel, studyArea: studyAreaName, textbookReferences: relevantTextbookContent.length, topicId }

    try {
      const cacheableContent = { ...finalContent, contentImages: [], flashcards: parsedContent.flashcards?.map((f: any) => ({ ...f, coverImage: null })) || [] }
      const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333'
      if (supa) {
        await supa
          .from('content_cache')
          .upsert(
            {
              topic_id: topicId,
              user_id: userId,
              content: JSON.stringify(cacheableContent),
              content_images: [],
              flashcard_images: [],
              generation_metadata: {
                textbook_references: relevantTextbookContent.length,
                ai_model: 'gemini-2.5-flash-lite-preview-06-17',
                cached_without_images: true,
                content_prompts: parsedContent.contentImagePrompts || [],
                flashcard_prompts:
                  parsedContent.flashcards?.map((f: any) => f.imagePrompt).filter(Boolean) || [],
              },
            },
            { onConflict: 'topic_id,user_id' }
          )
      }
    } catch {}

  const response = NextResponse.json(finalContent)
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('X-Textbook-Refs', String(relevantTextbookContent.length))
  response.headers.set('Cache-Control','no-store')
  response.headers.set('Vary','Authorization')
    return response
  } catch (error) {
  const errorResponse = NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    errorResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
  errorResponse.headers.set('Cache-Control','no-store')
  errorResponse.headers.set('Vary','Authorization')
    return errorResponse
  }
}

export async function GET() { const r = NextResponse.json({ status: 'healthy', endpoint: 'generate-enhanced-content', timestamp: new Date().toISOString() }); r.headers.set('Cache-Control','no-store'); r.headers.set('Vary','Authorization'); return r }
