import { type NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { generateEducationalContent, getAI } from '@/lib/simple-ai'

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

async function searchRelevantTextbookContent(query: string, gradeLevel: number) {
  try {
    const client = getSupabase()
    if (!client) return []
    const { data: embeddings } = await client
      .from('textbook_embeddings')
      .select('content, metadata, file_name')
      .eq('grade_level', gradeLevel)
      .limit(10)
    return embeddings || []
  } catch { return [] }
}

function formatTextbookContentForPrompt(textbookContent: any[]) {
  if (!textbookContent?.length) return "No specific textbook content available for this topic."
  const formatted = textbookContent.slice(0,5).map((c: any, i: number) => `[Textbook Reference ${i+1}]:\n${c.content}\n`).join('\n')
  return `Use the following textbook content as reference material to create accurate, curriculum-aligned content:\n\n${formatted}\n\nBased on this textbook content and educational guidelines:`
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
    const relevantTextbookContent = await searchRelevantTextbookContent(topicData.title, gradeLevel)
    
    // Use the new simple AI system
    const ai = getAI()
    console.log('AI Status:', ai.getStatus())
    
    let parsedContent: any
    try {
      parsedContent = await generateEducationalContent(topicData.title, gradeLevel, {
        type: 'lesson',
        style: 'fun'
      })
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
