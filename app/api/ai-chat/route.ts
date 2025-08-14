import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase-server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

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

// Search function that uses real textbook data when user is authenticated, mock data otherwise
async function searchRelevantTextbookContent(question: string, gradeLevel: number = 5, userId?: string) {
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
    const supabase = await createRouteHandlerClient()
    
    // Search in textbook_embeddings for content relevant to the question and grade level
    const { data: textbookChunks, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', gradeLevel)
      .textSearch('content', question.replace(/[^\w\s]/g, ''), {
        type: 'websearch',
        config: 'english'
      })
      .limit(3)

    if (error) {
      console.error('Error searching textbook embeddings:', error)
      
      // Fallback: try a simple ilike search if text search fails
      const { data: fallbackChunks, error: fallbackError } = await supabase
        .from('textbook_embeddings')
        .select('content, metadata, grade_level')
        .eq('grade_level', gradeLevel)
        .ilike('content', `%${question}%`)
        .limit(3)

      if (fallbackError || !fallbackChunks || fallbackChunks.length === 0) {
        console.error('Fallback search also failed:', fallbackError)
        // Fall back to mock data if real search fails
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

      // Use fallback results
      return fallbackChunks.map(chunk => ({
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          source: chunk.metadata?.file_name || "Science Textbook",
          grade_level: chunk.grade_level
        }
      }))
    }

    // If we found real textbook content, return it
    if (textbookChunks && textbookChunks.length > 0) {
      return textbookChunks.map(chunk => ({
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          source: chunk.metadata?.file_name || "Science Textbook",
          grade_level: chunk.grade_level
        }
      }))
    }

    // If no results found, try a broader search within the same grade level
    console.log(`No content found for grade ${gradeLevel}, trying broader search...`)
    const { data: broaderChunks, error: broaderError } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', gradeLevel)  // ✅ MAINTAIN GRADE LEVEL RESTRICTION
      .ilike('content', `%${question.split(' ').slice(0, 2).join(' ')}%`)  // Use fewer keywords for broader search
      .limit(3)

    if (broaderError || !broaderChunks || broaderChunks.length === 0) {
      // If still no results, try searching for any science content for this grade
      const { data: anyGradeContent, error: anyError } = await supabase
        .from('textbook_embeddings')
        .select('content, metadata, grade_level')
        .eq('grade_level', gradeLevel)  // ✅ STILL MAINTAIN GRADE LEVEL RESTRICTION
        .limit(3)

      if (anyError || !anyGradeContent || anyGradeContent.length === 0) {
        // If no results found for this grade level at all, return grade-appropriate message
        return [
          {
            content: `I searched our grade ${gradeLevel} textbook library but couldn't find specific content about "${question}". Let me provide you with general information appropriate for your grade level.`,
            metadata: {
              source: "Science Nova AI",
              grade_level: gradeLevel,
              subject: "General Science"
            }
          }
        ]
      }

      // Return any available content for this grade level
      return anyGradeContent.slice(0, 1).map(chunk => ({
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          source: chunk.metadata?.file_name || `Science Textbook Grade ${gradeLevel}`,
          grade_level: chunk.grade_level
        }
      }))
    }

    // Return broader results from the same grade level
    return broaderChunks.map(chunk => ({
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        source: chunk.metadata?.file_name || `Science Textbook Grade ${gradeLevel}`,
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

// Validate if a question is appropriate for the given grade level
function isQuestionAppropriateForGrade(question: string, gradeLevel: number): boolean {
  const lowerQuestion = question.toLowerCase()
  
  // Topics that are too advanced for lower grades
  const advancedTopics = [
    'quantum', 'molecular', 'atomic structure', 'chemical bonds', 'dna replication',
    'calculus', 'derivatives', 'integrals', 'electromagnetic', 'nuclear'
  ]
  
  const intermediateTopics = [
    'cell division', 'photosynthesis', 'chemical reaction', 'periodic table',
    'forces', 'energy transformation', 'ecosystem'
  ]
  
  if (gradeLevel <= 2) {
    // Very basic topics only
    return !advancedTopics.some(topic => lowerQuestion.includes(topic)) &&
           !intermediateTopics.some(topic => lowerQuestion.includes(topic))
  } else if (gradeLevel <= 5) {
    // Elementary topics
    return !advancedTopics.some(topic => lowerQuestion.includes(topic))
  } else if (gradeLevel <= 8) {
    // Middle school can handle intermediate topics
    return !advancedTopics.some(topic => lowerQuestion.includes(topic))
  }
  
  // High school can handle most topics
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, gradeLevel, learningPreference, conversationHistory } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: "Message and User ID are required" }, { status: 400 })
    }

    // Try to get real user profile if authenticated, otherwise use passed parameters or defaults
    let profile = {
      grade_level: gradeLevel || 5,
      learning_preference: learningPreference || "visual",
      full_name: "Science Explorer"
    }

    // If not a demo user, try to fetch real profile from database
    if (userId !== "demo-user-001") {
      try {
        const supabase = await createRouteHandlerClient()
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!profileError && userProfile) {
          profile = {
            grade_level: userProfile.grade_level || gradeLevel || 5,
            learning_preference: userProfile.learning_preference || learningPreference || "visual",
            full_name: userProfile.full_name || "Science Explorer"
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Continue with default/passed profile
      }
    }

    const userGradeLevel = profile.grade_level
    const userLearningStyle = profile.learning_preference || "visual"

    if (!userGradeLevel || userGradeLevel < 1 || userGradeLevel > 12) {
      return NextResponse.json({ 
        error: "Invalid grade level. Please update your profile with a valid grade level (1-12)." 
      }, { status: 400 })
    }

    // Check if the question is appropriate for the student's grade level
    if (!isQuestionAppropriateForGrade(message, userGradeLevel)) {
      const gradeAppropriateResponse = `That's a really interesting question! However, that topic is usually studied in higher grades. Let me suggest some ${userGradeLevel <= 2 ? 'simpler' : userGradeLevel <= 5 ? 'grade-appropriate' : 'foundational'} science questions you might enjoy: What do you observe in nature around you? How do things move? What makes plants grow? Feel free to ask about these topics!`
      
      return NextResponse.json({
        response: gradeAppropriateResponse,
        relevantContentFound: false,
        contentSources: 0,
        gradeLevel: userGradeLevel,
        redirected: true
      })
    }

    // Search for relevant textbook content ONLY from the user's grade level
    const relevantContent = await searchRelevantTextbookContent(message, userGradeLevel, userId)

    // Build context from grade-appropriate textbook content
    const textbookContext = relevantContent.length > 0 
      ? relevantContent.map(content => content.content).join("\n\n")
      : ""

    // Get textbook sources for logging
    const textbookSources = relevantContent.map(content => 
      content.metadata?.source || 'Demo Science Textbook'
    )

    // Define grade-level appropriate complexity and vocabulary
    const getGradeGuidelines = (grade: number) => {
      if (grade <= 2) {
        return {
          complexity: "very simple",
          vocabulary: "basic everyday words",
          concepts: "concrete, observable phenomena",
          examples: "familiar objects and experiences from home and playground"
        }
      } else if (grade <= 5) {
        return {
          complexity: "simple to moderate",
          vocabulary: "elementary science terms with explanations",
          concepts: "basic scientific principles with visual aids",
          examples: "school and community experiences"
        }
      } else if (grade <= 8) {
        return {
          complexity: "moderate",
          vocabulary: "middle school science vocabulary",
          concepts: "foundational scientific theories and processes",
          examples: "real-world applications and experiments"
        }
      } else {
        return {
          complexity: "advanced",
          vocabulary: "high school level scientific terminology",
          concepts: "complex theories and abstract principles",
          examples: "current research and advanced applications"
        }
      }
    }

    const gradeGuidelines = getGradeGuidelines(userGradeLevel)

    // Create grade-specific and curriculum-aligned system prompt
    const systemPrompt = `You are a specialized AI Science Tutor for Grade ${userGradeLevel} students. You MUST follow these strict guidelines:

GRADE LEVEL CONSTRAINTS (Grade ${userGradeLevel}):
- Use ${gradeGuidelines.complexity} explanations appropriate for ${userGradeLevel}-year-old students
- Use ${gradeGuidelines.vocabulary} only
- Focus on ${gradeGuidelines.concepts}
- Provide examples from ${gradeGuidelines.examples}

LEARNING STYLE ADAPTATION (${userLearningStyle} learner):
- Visual learners: Use descriptive language, suggest visualizations, describe colors, shapes, and movements
- Auditory learners: Include sound-based examples, rhythmic explanations, and listening activities
- Kinesthetic learners: Suggest hands-on activities, movement, and physical demonstrations

${conversationHistory && conversationHistory.length > 0 ? `CONVERSATION CONTEXT:
You are continuing a conversation with this student. Here's what was discussed recently:
${conversationHistory.map((msg: any, idx: number) => `${idx + 1}. ${msg.role === 'user' ? 'Student' : 'You'}: ${msg.content}`).join('\n')}

Use this context to:
- Reference previous topics when relevant
- Build on concepts already discussed
- Avoid repeating explanations you've already given
- Make connections between the current question and previous ones
- Remember the student's interests and learning pace

` : ''}CONTENT RESTRICTIONS:
- ONLY answer questions appropriate for Grade ${userGradeLevel} curriculum
- If asked about advanced topics beyond Grade ${userGradeLevel}, redirect to grade-appropriate aspects
- Do NOT discuss topics that are typically taught in higher grades
- Keep responses to 2-3 short paragraphs maximum

REQUIRED TEACHING APPROACH:
1. Start with what the student might already know
2. Use simple analogies from their everyday life
3. Encourage hands-on observation when safe
4. End with a simple question to check understanding
5. Be encouraging and patient
3. Encourage hands-on observation when safe
4. End with a simple question to check understanding
5. Be encouraging and patient

${textbookContext ? `CURRICULUM CONTENT (Grade ${userGradeLevel} textbooks only):
Base your response on this grade-appropriate textbook content:
${textbookContext}

IMPORTANT: Only use information that is appropriate for Grade ${userGradeLevel} understanding.
` : `IMPORTANT: No textbook content available for this topic at Grade ${userGradeLevel} level. Provide a basic, age-appropriate response and suggest asking a teacher for more detailed information.
`}

Remember: You are teaching a ${userGradeLevel}-year-old. Keep it simple, engaging, and grade-appropriate!`

    // Generate AI response using textbook content and curriculum-aligned prompts
    let text: string
    let generatedImages: string[] = []
    let isUsingFallback = false
    
    if (!userId || userId === "demo-user-001") {
      // For demo users, use mock responses but still show textbook integration
      text = getRandomResponse(userGradeLevel)
      
      if (textbookContext) {
        text += `\n\n📚 This response is based on grade-appropriate textbook content from our curriculum.`
      }
    } else {
      // For authenticated users, use real AI with textbook content
      try {
        const userPrompt = `Student Question: ${message}
        
Grade Level: ${userGradeLevel}
Learning Style: ${userLearningStyle}`

        console.log(`🤖 Attempting AI generation for user: ${userId}`)
        console.log(`📝 Prompt length: ${userPrompt.length}`)
        console.log(`📚 System prompt length: ${systemPrompt.length}`)

        // Try multiple models for better reliability
        let aiResponse: string
        let modelUsed = "unknown"
        
        try {
          // First try: gemini-2.5-flash-lite-preview-06-17
          console.log(`🧠 Trying Gemini 2.5 Flash Lite Preview...`)
          const result = await generateText({
            model: google("gemini-2.5-flash-lite-preview-06-17"),
            system: systemPrompt + `

VISUAL LEARNING ENHANCEMENT:
If the concept would benefit from a visual explanation, you may include an image request in your response. Use this format when an image would help:

[GENERATE_IMAGE: Brief description of educational illustration needed]

Examples:
- For plant parts: [GENERATE_IMAGE: Simple diagram showing labeled parts of a flower including petals, stem, leaves, and roots]
- For water cycle: [GENERATE_IMAGE: Child-friendly illustration of the water cycle showing evaporation, clouds, and rain]
- For animal habitats: [GENERATE_IMAGE: Cross-section view of different animal homes like burrows, nests, and dens]

Only use image generation when it would significantly enhance understanding of the science concept. Limit to 1-2 images maximum per response.`,
            prompt: userPrompt,
            maxTokens: 600,
            temperature: 0.7,
          })
          aiResponse = result.text
          modelUsed = "gemini-2.5-flash-lite-preview-06-17"
          console.log(`✅ Success with ${modelUsed}`)
        } catch (primaryError) {
          const errorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError)
          console.log(`❌ Primary model failed: ${errorMsg}`)
          
          try {
            // Fallback: Try gemini-2.5-flash-lite-preview-06-17 (same model for consistency)
            console.log(`🧠 Trying Gemini 2.5 Flash Lite Preview (fallback)...`)
            const result = await generateText({
              model: google("gemini-2.5-flash-lite-preview-06-17"),
              system: systemPrompt + `

VISUAL LEARNING ENHANCEMENT:
If the concept would benefit from a visual explanation, you may include an image request in your response. Use this format when an image would help:

[GENERATE_IMAGE: Brief description of educational illustration needed]

Only use image generation when it would significantly enhance understanding of the science concept. Limit to 1-2 images maximum per response.`,
              prompt: userPrompt,
              maxTokens: 600,
              temperature: 0.7,
            })
            aiResponse = result.text
            modelUsed = "gemini-2.5-flash-lite-preview-06-17"
            console.log(`✅ Success with ${modelUsed}`)
          } catch (fallbackError) {
            const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            console.log(`❌ Fallback model also failed: ${fallbackMsg}`)
            throw new Error(`Both AI models failed: ${errorMsg}; ${fallbackMsg}`)
          }
        }

        text = aiResponse
        console.log(`🎯 AI generation successful with ${modelUsed}`)
        console.log(`📝 Response length: ${text.length}`)

        // Check if we got an empty response (potential model issue)
        if (!text || text.trim().length === 0) {
          console.warn(`⚠️ ${modelUsed} returned empty response, falling back to gemini-1.5-flash-latest`)
          try {
            const fallbackResult = await generateText({
              model: google("gemini-1.5-flash-latest"),
              system: systemPrompt + `

VISUAL LEARNING ENHANCEMENT:
If the concept would benefit from a visual explanation, you may include an image request in your response. Use this format when an image would help:

[GENERATE_IMAGE: Brief description of educational illustration needed]

Only use image generation when it would significantly enhance understanding of the science concept. Limit to 1-2 images maximum per response.`,
              prompt: userPrompt,
              maxTokens: 600,
              temperature: 0.7,
            })
            text = fallbackResult.text
            modelUsed = "gemini-1.5-flash-latest (fallback)"
            console.log(`✅ Fallback successful, response length: ${text.length}`)
          } catch (fallbackError) {
            console.error(`❌ Fallback also failed:`, fallbackError)
            // Continue with empty response and let normal fallback logic handle it
          }
        }

        // Check if image generation was requested
        const imagePrompts = text.match(/\[GENERATE_IMAGE: ([^\]]+)\]/g)
        
        if (imagePrompts && imagePrompts.length > 0) {
          console.log(`🎨 Processing ${imagePrompts.length} image generation request(s)...`)
          
          // Use Google Cloud Imagen 4.0 for actual image generation
          for (let i = 0; i < Math.min(imagePrompts.length, 2); i++) { // Limit to 2 images per response
            const prompt = imagePrompts[i]
            const imageDescription = prompt.match(/\[GENERATE_IMAGE: ([^\]]+)\]/)?.[1]
            
            if (imageDescription) {
              try {
                // Enhanced educational image prompt for children
                const enhancedPrompt = `Educational illustration for grade ${userGradeLevel} students: ${imageDescription}. Style: Clean, colorful, child-friendly diagram or illustration with clear labels. Educational textbook style. Bright colors, simple design, easy to understand. No text overlay, pure illustration.`
                
                console.log(`🖼️ Generating image: ${imageDescription}`)
                
                // Generate image using the working enhanced image generation API
                const protocol = request.headers.get('x-forwarded-proto') || 'http'
                const host = request.headers.get('host') || 'localhost:3000'
                const imageUrl = `${protocol}://${host}/api/generate-image-enhanced`
                
                console.log(`🖼️ Requesting image from: ${imageUrl}`)
                
                const imageResponse = await fetch(imageUrl, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    prompt: enhancedPrompt,
                    aspectRatio: '1:1',
                    gradeLevel: userGradeLevel
                  })
                })

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  if (imageData.success && imageData.imageUrl) {
                    generatedImages.push(imageData.imageUrl)
                    console.log(`✅ Generated image ${i + 1} successfully`)
                  } else {
                    console.log(`❌ Image generation failed for prompt ${i + 1}`)
                  }
                } else {
                  console.error(`❌ Image generation failed for prompt ${i + 1}:`, await imageResponse.text())
                }
                
                // Add delay between image generations to respect rate limits
                if (i < imagePrompts.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 2000))
                }
              } catch (imageError) {
                console.error(`❌ Error generating image ${i + 1}:`, imageError)
              }
            }
          }
          
          // Remove image generation commands from text and replace with placeholders
          for (let i = 0; i < imagePrompts.length; i++) {
            if (i < generatedImages.length) {
              text = text.replace(imagePrompts[i], `[IMAGE_${i}]`)
            } else {
              // Remove failed image generation commands
              text = text.replace(imagePrompts[i], "")
            }
          }
        }

        // Add textbook source indicator if content was found
        if (textbookContext) {
          text += `\n\n📚 This response incorporates content from your grade ${userGradeLevel} science textbooks.`
        }

      } catch (aiError) {
        const errorMsg = aiError instanceof Error ? aiError.message : String(aiError)
        console.error("🚨 AI generation error:", errorMsg)
        console.error("🔍 Error details:", aiError)
        
        // Fall back to enhanced mock response if AI fails
        text = getRandomResponse(userGradeLevel)
        isUsingFallback = true
        console.log(`🔄 Using fallback response for user ${userId}`)
        
        if (textbookContext) {
          text += `\n\n📚 While our AI is temporarily unavailable, this response is based on grade-appropriate textbook content.`
        } else {
          text += `\n\n⚠️ Our AI is temporarily unavailable. This is a fallback response. Please try again in a moment.`
        }
      }
    }

    // Log the interaction for debugging
    console.log("AI Chat Interaction:", {
      user_id: userId,
      user_message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      ai_response: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      grade_level: userGradeLevel,
      learning_preference: userLearningStyle,
      relevant_content_count: relevantContent.length,
      textbook_sources: textbookSources,
      is_demo_mode: !userId || userId === "demo-user-001",
      images_generated: generatedImages.length
    })

    return NextResponse.json({ 
      response: text,
      relevantContentFound: relevantContent.length > 0,
      contentSources: relevantContent.length,
      gradeLevel: userGradeLevel,
      textbookSources: textbookSources.slice(0, 3), // Limit for response size
      images: generatedImages,
      isUsingFallback: isUsingFallback
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
