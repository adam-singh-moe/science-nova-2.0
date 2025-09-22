import { NextRequest, NextResponse } from "next/server"
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'
import { getAI } from '@/lib/simple-ai'

// Mock AI responses for demo mode
const mockAIResponses = [
  "That's a fantastic question! Let me help you explore that. Science is all about discovering how the world around us works. What specific part interests you the most?",
  "Great curiosity! Science helps us understand everything from tiny atoms to huge galaxies. Let's start with something you can observe right now - what do you notice in your environment?",
  "Wonderful! I love helping students learn about science. Think of science like being a detective - we ask questions, make observations, and look for patterns. What would you like to investigate?",
  "That's exactly the kind of thinking that makes great scientists! Science is everywhere - in the plants growing outside, the weather changing, and even in how our bodies work. What catches your attention most?",
  "Excellent question! Science is like having superpowers to understand our world. We can learn why things happen, how they work, and even predict what might happen next. What scientific superpower would you want to have?"
]

// Grade-appropriate topic suggestions
const gradeTopicSuggestions = {
  1: ["colors in nature", "animal sounds", "floating and sinking", "weather changes"],
  2: ["plant growth", "animal homes", "day and night", "hot and cold"],
  3: ["simple machines", "life cycles", "rocks and soil", "magnetism"],
  4: ["states of matter", "food chains", "light and shadows", "simple circuits"],
  5: ["ecosystems", "water cycle", "force and motion", "solar system"],
  6: ["energy types", "cell parts", "chemical vs physical changes", "weather patterns"],
  7: ["genetics basics", "periodic table", "forces and machines", "earth layers"],
  8: ["chemical reactions", "body systems", "electricity", "space exploration"]
}

function getRandomResponse(gradeLevel: number = 5): string {
  const topics = gradeTopicSuggestions[gradeLevel as keyof typeof gradeTopicSuggestions] || gradeTopicSuggestions[5]
  const randomTopic = topics[Math.floor(Math.random() * topics.length)]
  
  const responses = [
    `${mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)]} For grade ${gradeLevel}, you might enjoy learning about ${randomTopic}!`,
    `That's a great question for a grade ${gradeLevel} student! Have you ever wondered about ${randomTopic}? It's one of my favorite topics to explore!`,
    `I can see you're curious about science! At your grade level, ${randomTopic} is really fascinating. What do you already know about it?`,
    `Science is amazing, isn't it? For grade ${gradeLevel} students like you, ${randomTopic} is a perfect topic to explore. Would you like to learn more about it?`
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

// Search function for textbook content
async function searchRelevantTextbookContent(question: string, gradeLevel: number = 5, userId?: string, isPrivileged: boolean = false) {
  // If no userId provided, return mock data for demo mode
  if (!userId || userId === "demo-user-001") {
    return [
      {
        content: `Science textbook content related to "${question}". This is educational content appropriate for grade ${gradeLevel} students.`,
        metadata: {
          source: "Demo Science Textbook",
          grade_level: gradeLevel,
          subject: "General Science"
        }
      }
    ]
  }

  // For authenticated users, try to fetch real textbook data
  try {
    const supabase = getServiceClient()
    if (!supabase) return []
    
    // Search in textbook_embeddings for content relevant to the question
    let query = supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
    
    if (!isPrivileged) {
      query = query.eq('grade_level', gradeLevel)
    }
    
    const { data: textbookChunks, error } = await query
      .ilike('content', `%${question}%`)
      .limit(3)

    if (error || !textbookChunks || textbookChunks.length === 0) {
      // Fallback to mock data if real search fails
      return [
        {
          content: `Science textbook content related to "${question}". This is educational content appropriate for grade ${gradeLevel} students.`,
          metadata: {
            source: "Science Textbook",
            grade_level: gradeLevel,
            subject: "General Science"
          }
        }
      ]
    }

    return textbookChunks.map(chunk => ({
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        source: chunk.metadata?.file_name || "Science Textbook",
        grade_level: chunk.grade_level
      }
    }))

  } catch (error) {
    console.error('Error in textbook search:', error)
    // Fall back to mock data on any error
    return [
      {
        content: `Science textbook content related to "${question}". This is educational content appropriate for grade ${gradeLevel} students.`,
        metadata: {
          source: "Demo Science Textbook",
          grade_level: gradeLevel,
          subject: "General Science"
        }
      }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, gradeLevel, learningPreference } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: "Message and User ID are required" }, { status: 400 })
    }

    // Try to get real user profile if authenticated
    let profile = {
      grade_level: gradeLevel || 5,
      learning_preference: learningPreference || "visual",
      full_name: "Science Explorer",
      role: "STUDENT" as string
    }

    // If not a demo user, try to fetch real profile from database
    if (userId !== "demo-user-001") {
      try {
        const supabase = getServiceClient()
        if (supabase) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (!profileError && userProfile) {
            profile = {
              grade_level: userProfile.grade_level || gradeLevel || 5,
              learning_preference: userProfile.learning_preference || learningPreference || "visual",
              full_name: userProfile.full_name || "Science Explorer",
              role: userProfile.role || "STUDENT"
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Continue with default/passed profile
      }
    }

    const userGradeLevel = profile.grade_level
    const userLearningStyle = profile.learning_preference || "visual"
    const userRole = profile.role

    // Admin, Teacher, and Developer accounts don't need grade level validation
    const isPrivileged = userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'DEVELOPER'
    
    if (!isPrivileged && (!userGradeLevel || userGradeLevel < 1 || userGradeLevel > 12)) {
      return NextResponse.json({ 
        error: "Invalid grade level. Please update your profile with a valid grade level (1-12)." 
      }, { status: 400 })
    }

    // Use effective grade level
    const effectiveGradeLevel = userGradeLevel || 5

    // Search for relevant textbook content
    const relevantContent = await searchRelevantTextbookContent(message, effectiveGradeLevel, userId, isPrivileged)
    const textbookContext = relevantContent.length > 0 
      ? relevantContent.map(content => content.content).join("\\n\\n")
      : ""

    // Get textbook sources for logging
    const textbookSources = relevantContent.map(content => 
      content.metadata?.source || 'Demo Science Textbook'
    )

    // Create system prompt
    const systemPrompt = isPrivileged 
      ? `You are a specialized AI Science Assistant for educators and administrators. Provide comprehensive, accurate scientific information appropriate for educational contexts.

${textbookContext ? `TEXTBOOK CONTEXT:\\n${textbookContext}` : 'No specific textbook content found. Provide accurate scientific information based on your knowledge.'}`
      : `You are a specialized AI Science Tutor for Grade ${effectiveGradeLevel} students. 

- Use age-appropriate explanations for ${effectiveGradeLevel}-year-old students
- Adapt to ${userLearningStyle} learning style
- Keep responses engaging and educational
- Use simple, clear language

${textbookContext ? `TEXTBOOK CONTEXT:\\n${textbookContext}` : 'No specific textbook content found. Provide accurate scientific information based on your knowledge.'}`

    // Generate AI response
    const ai = getAI()
    let text: string
    let isUsingFallback = false
    
    if (!userId || userId === "demo-user-001") {
      // For demo users, use mock responses
      text = getRandomResponse(effectiveGradeLevel)
      if (textbookContext) {
        text += `\\n\\n📚 This response is based on grade-appropriate textbook content from our curriculum.`
      }
    } else {
      // For authenticated users, use AI
      try {
        console.log(`🤖 Generating AI response for user: ${userId}`)
        console.log(`📊 AI Status:`, ai.getStatus())

        const userPrompt = `Student Question: ${message}
        
Grade Level: ${userGradeLevel}
Learning Style: ${userLearningStyle}

Please provide a helpful, educational response appropriate for this student.`

        const aiResponse = await ai.generateText(systemPrompt + "\\n\\n" + userPrompt, {
          maxTokens: 600,
          temperature: 0.7
        })

        text = aiResponse
        console.log(`✅ AI generation successful, response length: ${text.length}`)

        // Add textbook source indicator if content was found
        if (textbookContext) {
          text += `\\n\\n📚 This response incorporates content from your grade ${userGradeLevel} science textbooks.`
        }

      } catch (aiError) {
        console.error("🚨 AI generation error:", aiError)
        
        // Fall back to enhanced mock response if AI fails
        text = getRandomResponse(userGradeLevel)
        isUsingFallback = true
        console.log(`🔄 Using fallback response for user ${userId}`)
        
        if (textbookContext) {
          text += `\\n\\n📚 While our AI is temporarily unavailable, this response is based on grade-appropriate textbook content.`
        } else {
          text += `\\n\\n⚠️ Our AI is temporarily unavailable. This is a fallback response. Please try again in a moment.`
        }
      }
    }

    // Log the interaction
    console.log("AI Chat Interaction:", {
      user_id: userId,
      user_message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      ai_response: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      grade_level: userGradeLevel,
      learning_preference: userLearningStyle,
      relevant_content_count: relevantContent.length,
      textbook_sources: textbookSources,
      is_demo_mode: !userId || userId === "demo-user-001",
      ai_status: ai.getStatus()
    })

    return NextResponse.json({ 
      response: text,
      relevantContentFound: relevantContent.length > 0,
      contentSources: relevantContent.length,
      gradeLevel: effectiveGradeLevel,
      textbookSources: textbookSources.slice(0, 3),
      isUsingFallback: isUsingFallback,
      aiStatus: ai.getStatus()
    })

  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate AI response",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}