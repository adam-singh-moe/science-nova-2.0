import { type NextRequest, NextResponse } from "next/server"
import { streamText, generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createServerClient, parallelQuery, checkDatabaseHealth } from "@/lib/supabase-optimized"
import { searchRelevantTextbookContent, formatTextbookContentForPrompt } from "@/lib/textbook-search-freetier"
import { cacheManager, createCacheHeaders } from "@/lib/cache-manager"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { topicId, userId, stream = false, bypassCache = false } = await request.json()

    if (!topicId || !userId) {
      return NextResponse.json({ error: "Topic ID and User ID are required" }, { status: 400 })
    }

    // Check database health first
    const dbHealth = await checkDatabaseHealth()
    if (dbHealth.status === 'unhealthy') {
      console.warn('Database health check failed:', dbHealth)
    }

    const supabase = createServerClient('content-generation')

    // Check cache first for non-streaming requests (CDN-like behavior)
    if (!stream && !bypassCache) {
      const cachedContent = await cacheManager.getCachedContent(topicId, userId)
      if (cachedContent) {
        const response = NextResponse.json(cachedContent)
        
        // Add CDN-like cache headers
        const cacheHeaders = createCacheHeaders(3600, 86400) // 1 hour cache, 24 hours stale-while-revalidate
        Object.entries(cacheHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
        
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
        
        return response
      }
    }    // Parallel data fetching with optimized connection pooling
    const [topicResult, userProfileResult] = await parallelQuery([
      () => supabase
        .from("topics")
        .select(`title, grade_level, admin_prompt, study_areas (name, vanta_effect)`)
        .eq("id", topicId)
        .single(),
      
      () => supabase
        .from("profiles")
        .select("learning_preference, grade_level")
        .eq("id", userId)
        .single()
    ])

    const { data: topicData, error: topicError } = topicResult as any
    const { data: userProfile, error: profileError } = userProfileResult as any

    if (topicError || !topicData || profileError || !userProfile) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 })
    }

    // Search for relevant textbook content with enhanced caching
    const studyAreaName = (topicData.study_areas as any)?.name || 'Science'
    const gradeLevel = userProfile.grade_level || topicData.grade_level
    
    const relevantTextbookContent = await searchRelevantTextbookContent({
      query: topicData.title,
      gradeLevel: gradeLevel,
      studyArea: studyAreaName,
      topicTitle: topicData.title,
      maxResults: 6, // Optimized for performance
      minSimilarity: 0.65 // Higher threshold for quality
    })

    // Optimized textbook content formatting
    const textbookContentPrompt = formatTextbookContentForPrompt(relevantTextbookContent, 2000)

    const learningStylePrompts = {
      STORY: "Present as engaging stories with characters and narratives",
      VISUAL: "Focus on vivid descriptions, analogies, and visual imagery",
      FACTS: "Present as clear, organized facts with bullet points",
    }

    const basePrompt = `
${textbookContentPrompt}

You are an AI tutor creating educational content for Grade ${gradeLevel} about "${topicData.title}" in ${studyAreaName}.

Learning Style: ${learningStylePrompts[userProfile.learning_preference as keyof typeof learningStylePrompts]}

Create structured content with this JSON format:
{
  "lessonContent": "500-800 words with ## headings, proper paragraph breaks (\\n\\n), and [IMAGE_PROMPT: description] placeholders",
  "flashcards": [
    {"id": "1", "front": "Question", "back": "Answer"},
    {"id": "2", "front": "Question", "back": "Answer"},
    {"id": "3", "front": "Question", "back": "Answer"}
    // Include at least 3 flashcards, ideally 5-6
  ],
  "quiz": [
    {"id": "1", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Detailed explanation"},
    {"id": "2", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": 1, "explanation": "Detailed explanation"},
    {"id": "3", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": 2, "explanation": "Detailed explanation"},
    {"id": "4", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": 3, "explanation": "Detailed explanation"},
    {"id": "5", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Detailed explanation"}
    // Include exactly 5 quiz questions
  ]
}

REQUIREMENTS:
- At least 3 flashcards (aim for 5-6)
- Exactly 5 quiz questions  
- Proper formatting with \\n\\n for paragraph breaks
- Age-appropriate and engaging content

Topic: ${topicData.title}
Grade: ${gradeLevel}
${topicData.admin_prompt ? `Instructions: ${topicData.admin_prompt}` : ""}
`

    // Use streaming for real-time response if requested
    if (stream) {
      const result = await streamText({
        model: google("gemini-2.5-flash-lite-preview-06-17"),
        prompt: basePrompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      const response = new Response(result.toDataStream(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Cache': 'MISS',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-DB-Health': dbHealth.status,
        },
      })

      return response
    }

    // Generate content with optimized settings
    const result = await generateText({
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      prompt: basePrompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    let parsedContent
    try {
      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({ error: "Failed to generate valid content" }, { status: 500 })
    }

    // Validate and enhance content to meet minimum requirements
    if (parsedContent) {
      // Ensure minimum flashcards (3, ideally 5-6)
      if (!parsedContent.flashcards || parsedContent.flashcards.length < 3) {
        const defaultFlashcards = [
          { id: "req_1", front: `What is ${topicData.title}?`, back: `${topicData.title} is an important concept in ${studyAreaName}.` },
          { id: "req_2", front: "Why should we learn this?", back: `Understanding ${topicData.title} helps us comprehend the world better.` },
          { id: "req_3", front: "How is this relevant?", back: `${topicData.title} connects to many aspects of daily life and science.` }
        ]
        parsedContent.flashcards = [...(parsedContent.flashcards || []), ...defaultFlashcards].slice(0, Math.max(3, parsedContent.flashcards?.length || 0))
      }

      // Ensure exactly 5 quiz questions
      if (!parsedContent.quiz || parsedContent.quiz.length < 5) {
        const defaultQuiz = [
          {
            id: "req_1",
            question: `Which subject area does ${topicData.title} belong to?`,
            options: ["Mathematics", studyAreaName, "History", "Literature"],
            correctAnswer: 1,
            explanation: `${topicData.title} is a key topic in ${studyAreaName}.`
          },
          {
            id: "req_2",
            question: "What makes scientific learning effective?",
            options: ["Memorization only", "Active engagement", "Passive listening", "Avoiding practice"],
            correctAnswer: 1,
            explanation: "Active engagement through questions, observation, and practice leads to better understanding."
          },
          {
            id: "req_3",
            question: `For which grade is this ${topicData.title} content designed?`,
            options: [`Grade ${gradeLevel - 1}`, `Grade ${gradeLevel}`, `Grade ${gradeLevel + 1}`, "All grades equally"],
            correctAnswer: 1,
            explanation: `This content is specifically tailored for Grade ${gradeLevel} learning objectives.`
          },
          {
            id: "req_4",
            question: "Why do we study science concepts?",
            options: ["For tests only", "To understand nature and our world", "Because it's mandatory", "For entertainment"],
            correctAnswer: 1,
            explanation: "Science helps us understand how the natural world works and make informed decisions."
          },
          {
            id: "req_5",
            question: "What's the best approach to learning new concepts?",
            options: ["Rush through material", "Ask questions and explore", "Memorize without understanding", "Avoid challenging topics"],
            correctAnswer: 1,
            explanation: "Asking questions, exploring concepts, and connecting to prior knowledge leads to deeper understanding."
          }
        ]
        parsedContent.quiz = [...(parsedContent.quiz || []), ...defaultQuiz].slice(0, 5)
      }
    }

    // Add metadata
    const finalContent = {
      ...parsedContent,
      generatedAt: new Date().toISOString(),
      gradeLevel,
      studyArea: studyAreaName,
      textbookReferences: relevantTextbookContent.length,
      cacheInfo: {
        cached: false,
        generationTime: Date.now() - startTime,
        dbHealth: dbHealth.status,
      }
    }

    // Cache the generated content (CDN-like persistence)
    if (!bypassCache) {
      await cacheManager.setCachedContent(topicId, userId, finalContent)
    }

    // Performance monitoring
    const processingTime = Date.now() - startTime
    console.log(`Content generated in ${processingTime}ms for topic ${topicId}`)

    // Background task: Log performance metrics
    supabase
      .from('api_performance_metrics')
      .insert({
        endpoint: 'generate-enhanced-content-optimized',
        response_time: processingTime,
        cache_hit: false,
        db_health: dbHealth.status,
        textbook_chunks: relevantTextbookContent.length,
        user_id: userId,
        topic_id: topicId,
        created_at: new Date().toISOString()
      })
      .then()

    const response = NextResponse.json(finalContent)
    
    // Add performance and caching headers
    const cacheHeaders = createCacheHeaders(1800, 86400) // 30 minutes cache
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Response-Time', `${processingTime}ms`)
    response.headers.set('X-DB-Health', dbHealth.status)
    response.headers.set('X-Textbook-Refs', relevantTextbookContent.length.toString())

    return response

  } catch (error) {
    console.error("Error generating enhanced content:", error)
    
    const errorResponse = NextResponse.json(
      { error: "Failed to generate content" }, 
      { status: 500 }
    )
    
    errorResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    errorResponse.headers.set('X-Cache', 'ERROR')
    
    return errorResponse
  }
}

// Health check endpoint for monitoring
export async function GET() {
  const startTime = Date.now()
  
  try {
    const [dbHealth, cacheStats] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(cacheManager.getStats())
    ])
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      cache: cacheStats,
      responseTime: Date.now() - startTime
    }
    
    const response = NextResponse.json(health)
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('X-Health-Check', 'true')
    
    return response
  } catch (error) {
    const errorHealth = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }
    
    return NextResponse.json(errorHealth, { status: 503 })
  }
}
