import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function searchRelevantTextbookContent(query: string, gradeLevel: number) {
  try {
    console.log(`🔍 Searching textbook content for: "${query}" (Grade ${gradeLevel})`)
    
    // Get relevant textbook embeddings for the grade level
    const { data: embeddings, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, file_name')
      .eq('grade_level', gradeLevel)
      .limit(10) // Get top 10 chunks for this grade
    
    if (error) {
      console.warn('Error fetching textbook content:', error)
      return []
    }
    
    console.log(`📚 Found ${embeddings?.length || 0} textbook chunks for Grade ${gradeLevel}`)
    return embeddings || []
    
  } catch (error) {
    console.error('Error searching textbook content:', error)
    return []
  }
}

function formatTextbookContentForPrompt(textbookContent: any[]) {
  if (!textbookContent || textbookContent.length === 0) {
    return "No specific textbook content available for this topic."
  }
  
  const formattedContent = textbookContent
    .slice(0, 5) // Use top 5 chunks
    .map((chunk, index) => {
      return `[Textbook Reference ${index + 1}]:\n${chunk.content}\n`
    })
    .join('\n')
  
  return `Use the following textbook content as reference material to create accurate, curriculum-aligned content:\n\n${formattedContent}\n\nBased on this textbook content and educational guidelines:`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { topicId } = await request.json()

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    console.log(`🎯 Generating content for topic: ${topicId}`)

    // Check cache first
    try {
      const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333' // Use default anonymous user to avoid foreign key constraint
      const { data: cachedContent, error: cacheError } = await supabase
        .from('content_cache')
        .select('*')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .single()

      if (!cacheError && cachedContent && cachedContent.content) {
        console.log(`💾 Found cached content for topic: ${topicId}`)
        const parsedCachedContent = JSON.parse(cachedContent.content)
        
        // Check if this is a prompt-only cache (new format)
        const isPromptOnlyCache = cachedContent.generation_metadata?.cached_without_images
        
        if (isPromptOnlyCache) {
          console.log(`🎨 Regenerating images from cached prompts...`)
          
          // Get image prompts from cache metadata
          const contentPrompts = cachedContent.generation_metadata?.content_prompts || []
          const flashcardPrompts = cachedContent.generation_metadata?.flashcard_prompts || []
          
          // Regenerate content images
          const contentImages: string[] = []
          if (contentPrompts.length > 0) {
            console.log(`📸 Generating ${contentPrompts.length} content images from cached prompts...`)
            for (let i = 0; i < contentPrompts.length; i++) {
              try {
                const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-image-enhanced`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: `Educational illustration for Grade ${parsedCachedContent.gradeLevel}: ${contentPrompts[i]}`,
                    seed: Math.floor(Math.random() * 1000000),
                    aspectRatio: "16:9"
                  })
                })
                
                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  if (imageData.imageUrl) {
                    contentImages.push(imageData.imageUrl)
                    console.log(`✅ Generated content image ${i + 1}/${contentPrompts.length}`)
                  }
                }
              } catch (imageError) {
                console.error(`❌ Failed to regenerate content image ${i + 1}:`, imageError)
              }
            }
          }
          
          // Regenerate flashcard images
          if (parsedCachedContent.flashcards && flashcardPrompts.length > 0) {
            console.log(`🃏 Generating ${flashcardPrompts.length} flashcard images from cached prompts...`)
            for (let i = 0; i < Math.min(parsedCachedContent.flashcards.length, flashcardPrompts.length); i++) {
              try {
                const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-image-enhanced`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: `Simple educational icon for Grade ${parsedCachedContent.gradeLevel}: ${flashcardPrompts[i]}`,
                    seed: Math.floor(Math.random() * 1000000),
                    aspectRatio: "1:1"
                  })
                })
                
                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  if (imageData.imageUrl && parsedCachedContent.flashcards[i]) {
                    parsedCachedContent.flashcards[i].coverImage = imageData.imageUrl
                    console.log(`✅ Generated flashcard image ${i + 1}/${flashcardPrompts.length}`)
                  }
                }
              } catch (imageError) {
                console.error(`❌ Failed to regenerate flashcard image ${i + 1}:`, imageError)
              }
            }
          }
          
          // Process lesson content to inject regenerated images
          let processedLessonContent = parsedCachedContent.lessonContent || ''
          const imagePromptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/g
          let imageIndex = 0
          
          processedLessonContent = processedLessonContent.replace(imagePromptRegex, (match: string, promptText: string) => {
            if (imageIndex < contentImages.length && contentImages[imageIndex]) {
              const imageUrl = contentImages[imageIndex]
              imageIndex++
              return `\n\n<div class="content-image-container">
                <img src="${imageUrl}" alt="${promptText.trim()}" class="content-image" />
                <div class="image-caption">${promptText.trim()}</div>
              </div>\n\n`
            } else {
              imageIndex++
              return `\n\n<div class="content-image-placeholder">
                <div class="placeholder-text">📖 ${promptText.trim()}</div>
              </div>\n\n`
            }
          })
          
          const finalCachedContent = {
            ...parsedCachedContent,
            lessonContent: processedLessonContent,
            contentImages,
            fromCache: true,
            imagesRegeneratedFromPrompts: true,
            cacheTimestamp: cachedContent.created_at
          }
          
          console.log(`✅ Cache hit with image regeneration completed`)
          
          const response = NextResponse.json(finalCachedContent)
          response.headers.set('X-Cache', 'HIT-WITH-REGENERATED-IMAGES')
          response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          
          return response
        } else {
          // Legacy cache with full images (shouldn't happen with new system)
          console.log(`💾 Using legacy cached content with stored images`)
          const response = NextResponse.json({
            ...parsedCachedContent,
            fromCache: true,
            cacheTimestamp: cachedContent.created_at
          })
          response.headers.set('X-Cache', 'HIT-LEGACY')
          response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          
          return response
        }
      }
    } catch (cacheError) {
      console.log('⚠️ Cache lookup failed, proceeding with generation:', cacheError)
    }

    // Get topic data
    const { data: topicData, error: topicError } = await supabase
      .from("topics")
      .select(`
        title, 
        grade_level, 
        admin_prompt, 
        study_areas (name, vanta_effect)
      `)
      .eq("id", topicId)
      .single()

    if (topicError || !topicData) {
      console.error('Topic fetch error:', topicError)
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    console.log(`📖 Topic: ${topicData.title} (Grade ${topicData.grade_level})`)

    // Search for relevant textbook content
    const studyAreaName = (topicData.study_areas as any)?.name || 'Science'
    const gradeLevel = topicData.grade_level
    
    const relevantTextbookContent = await searchRelevantTextbookContent(
      topicData.title,
      gradeLevel
    )

    // Format textbook content for the prompt
    const textbookContentPrompt = formatTextbookContentForPrompt(relevantTextbookContent)

    const basePrompt = `
${textbookContentPrompt}

You are an AI tutor creating educational content for Grade ${gradeLevel} about "${topicData.title}" in ${studyAreaName}.

Create structured content with this exact JSON format:
{
  "lessonContent": "500-800 words with ## headings, proper paragraph breaks (\\n\\n), age-appropriate language for Grade ${gradeLevel}. Include [IMAGE_PROMPT: detailed description] placeholders where relevant images would enhance understanding. Use descriptive prompts for educational illustrations.",
  "contentImagePrompts": [
    "Detailed prompt for main concept illustration",
    "Detailed prompt for diagram or chart", 
    "Detailed prompt for real-world example"
  ],
  "flashcards": [
    {"id": "1", "front": "Question appropriate for Grade ${gradeLevel}", "back": "Clear, simple answer", "imagePrompt": "Simple illustration prompt for this concept"},
    {"id": "2", "front": "Question appropriate for Grade ${gradeLevel}", "back": "Clear, simple answer", "imagePrompt": "Simple illustration prompt for this concept"},
    {"id": "3", "front": "Question appropriate for Grade ${gradeLevel}", "back": "Clear, simple answer", "imagePrompt": "Simple illustration prompt for this concept"},
    {"id": "4", "front": "Question appropriate for Grade ${gradeLevel}", "back": "Clear, simple answer", "imagePrompt": "Simple illustration prompt for this concept"},
    {"id": "5", "front": "Question appropriate for Grade ${gradeLevel}", "back": "Clear, simple answer", "imagePrompt": "Simple illustration prompt for this concept"}
  ],
  "quiz": [
    {"id": "1", "question": "Grade ${gradeLevel} appropriate question", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Simple explanation"},
    {"id": "2", "question": "Grade ${gradeLevel} appropriate question", "options": ["A", "B", "C", "D"], "correctAnswer": 1, "explanation": "Simple explanation"},
    {"id": "3", "question": "Grade ${gradeLevel} appropriate question", "options": ["A", "B", "C", "D"], "correctAnswer": 2, "explanation": "Simple explanation"},
    {"id": "4", "question": "Grade ${gradeLevel} appropriate question", "options": ["A", "B", "C", "D"], "correctAnswer": 3, "explanation": "Simple explanation"},
    {"id": "5", "question": "Grade ${gradeLevel} appropriate question", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Simple explanation"}
  ]
}

IMPORTANT REQUIREMENTS:
- Use the textbook content provided above as your primary reference for accuracy
- Make content age-appropriate for Grade ${gradeLevel} students  
- Include exactly 5 flashcards and 5 quiz questions
- Each flashcard must have an "imagePrompt" for generating a cover image
- Include 2-3 contentImagePrompts for main content illustrations
- Image prompts should be educational, child-friendly, and relevant to the concept
- Use simple language that Grade ${gradeLevel} students can understand
- Base your content on the curriculum-aligned textbook references provided
- Ensure all information is scientifically accurate and grade-appropriate

Topic: ${topicData.title}
Grade: ${gradeLevel}
Study Area: ${studyAreaName}
${topicData.admin_prompt ? `Additional Instructions: ${topicData.admin_prompt}` : ""}

Remember: Base your content on the textbook references provided above to ensure curriculum alignment and accuracy.
`

    console.log(`🤖 Generating AI content with ${relevantTextbookContent.length} textbook references...`)

    // Generate content
    const result = await generateText({
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      prompt: basePrompt,
      temperature: 0.7,
      maxTokens: 2500,
    })

    let parsedContent
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = result.text.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Extract JSON from response - look for the outermost braces
      const firstBrace = cleanedText.indexOf('{')
      const lastBrace = cleanedText.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = cleanedText.substring(firstBrace, lastBrace + 1)
        parsedContent = JSON.parse(jsonString)
        console.log(`✅ Successfully parsed AI response`)
      } else {
        throw new Error("No valid JSON structure found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw response (first 500 chars):", result.text.substring(0, 500))
      console.error("Raw response (last 500 chars):", result.text.substring(-500))
      return NextResponse.json({ error: "Failed to generate valid content" }, { status: 500 })
    }

    // Validate and enhance content
    if (parsedContent) {
      // Ensure minimum flashcards
      if (!parsedContent.flashcards || parsedContent.flashcards.length < 5) {
        const defaultFlashcards = [
          { id: "1", front: `What is ${topicData.title}?`, back: `${topicData.title} is an important concept in ${studyAreaName}.` },
          { id: "2", front: "Why should we learn this?", back: `Understanding ${topicData.title} helps us comprehend the world better.` },
          { id: "3", front: "How is this relevant?", back: `${topicData.title} connects to many aspects of daily life and science.` },
          { id: "4", front: `What makes ${topicData.title} interesting?`, back: `${topicData.title} has many fascinating aspects to explore.` },
          { id: "5", front: `How can we apply ${topicData.title}?`, back: `We can apply ${topicData.title} concepts in various real-world situations.` }
        ]
        parsedContent.flashcards = defaultFlashcards
      }

      // Ensure exactly 5 quiz questions
      if (!parsedContent.quiz || parsedContent.quiz.length < 5) {
        const defaultQuiz = [
          {
            id: "1",
            question: `Which subject area does ${topicData.title} belong to?`,
            options: ["Mathematics", studyAreaName, "History", "Literature"],
            correctAnswer: 1,
            explanation: `${topicData.title} is a key topic in ${studyAreaName}.`
          },
          {
            id: "2",
            question: "What makes scientific learning effective?",
            options: ["Memorization only", "Active engagement", "Passive listening", "Avoiding practice"],
            correctAnswer: 1,
            explanation: "Active engagement through questions, observation, and practice leads to better understanding."
          },
          {
            id: "3",
            question: `For which grade is this ${topicData.title} content designed?`,
            options: [`Grade ${gradeLevel - 1}`, `Grade ${gradeLevel}`, `Grade ${gradeLevel + 1}`, "All grades equally"],
            correctAnswer: 1,
            explanation: `This content is specifically tailored for Grade ${gradeLevel} learning objectives.`
          },
          {
            id: "4",
            question: "Why do we study science concepts?",
            options: ["For tests only", "To understand nature and our world", "Because it's mandatory", "For entertainment"],
            correctAnswer: 1,
            explanation: "Science helps us understand how the natural world works and make informed decisions."
          },
          {
            id: "5",
            question: "What's the best approach to learning new concepts?",
            options: ["Rush through material", "Ask questions and explore", "Memorize without understanding", "Avoid challenging topics"],
            correctAnswer: 1,
            explanation: "Asking questions, exploring concepts, and connecting to prior knowledge leads to deeper understanding."
          }
        ]
        parsedContent.quiz = defaultQuiz
      }
    }

    // Generate images for content and flashcards
    console.log('🎨 Starting image generation for content and flashcards...')
    const imageGenerationStartTime = Date.now()
    
    // Generate content images
    const contentImages: string[] = []
    if (parsedContent.contentImagePrompts && parsedContent.contentImagePrompts.length > 0) {
      console.log(`📸 Generating ${parsedContent.contentImagePrompts.length} content images...`)
      
      for (let i = 0; i < parsedContent.contentImagePrompts.length; i++) {
        const prompt = parsedContent.contentImagePrompts[i]
        try {
          const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-image-enhanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Educational illustration for Grade ${gradeLevel}: ${prompt}. Child-friendly, colorful, educational style suitable for ${studyAreaName} learning.`,
              aspectRatio: '16:9',
              gradeLevel: gradeLevel
            })
          })
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            if (imageData.success && imageData.imageUrl) {
              contentImages.push(imageData.imageUrl)
              console.log(`✅ Generated content image ${i + 1}/${parsedContent.contentImagePrompts.length}`)
            } else {
              console.log(`🎭 Using fallback for content image ${i + 1}`)
              contentImages.push(imageData.imageUrl || '') // Will be gradient fallback
            }
          } else {
            console.log(`❌ Failed to generate content image ${i + 1}, using fallback`)
            contentImages.push('') // Empty fallback
          }
        } catch (error) {
          console.error(`Error generating content image ${i + 1}:`, error)
          contentImages.push('') // Empty fallback
        }
        
        // Add delay between requests
        if (i < parsedContent.contentImagePrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // Generate flashcard cover images
    console.log(`🃏 Generating cover images for ${parsedContent.flashcards?.length || 0} flashcards...`)
    if (parsedContent.flashcards) {
      for (let i = 0; i < parsedContent.flashcards.length; i++) {
        const flashcard = parsedContent.flashcards[i]
        if (flashcard.imagePrompt) {
          try {
            const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-image-enhanced`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `Simple educational icon for Grade ${gradeLevel}: ${flashcard.imagePrompt}. Clean, colorful, child-friendly illustration suitable for flashcard cover.`,
                aspectRatio: '1:1',
                gradeLevel: gradeLevel
              })
            })
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json()
              if (imageData.success && imageData.imageUrl) {
                parsedContent.flashcards[i].coverImage = imageData.imageUrl
                console.log(`✅ Generated flashcard image ${i + 1}/${parsedContent.flashcards.length}`)
              } else {
                console.log(`🎭 Using themed fallback for flashcard ${i + 1}`)
                parsedContent.flashcards[i].coverImage = imageData.imageUrl || ''
              }
            } else {
              console.log(`❌ Failed to generate flashcard image ${i + 1}, using themed fallback`)
              parsedContent.flashcards[i].coverImage = ''
            }
          } catch (error) {
            console.error(`Error generating flashcard image ${i + 1}:`, error)
            parsedContent.flashcards[i].coverImage = ''
          }
          
          // Add delay between requests
          if (i < parsedContent.flashcards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    }

    // Replace [IMAGE_PROMPT: ...] placeholders in content with actual images
    let processedLessonContent = parsedContent.lessonContent
    const imagePromptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/g
    let imageIndex = 0
    
    processedLessonContent = processedLessonContent.replace(imagePromptRegex, (match: string, promptText: string) => {
      if (imageIndex < contentImages.length && contentImages[imageIndex]) {
        const imageUrl = contentImages[imageIndex]
        imageIndex++
        // Return HTML div with image that will be processed by the frontend
        return `\n\n<div class="content-image-container">
          <img src="${imageUrl}" alt="${promptText.trim()}" class="content-image" />
          <div class="image-caption">${promptText.trim()}</div>
        </div>\n\n`
      } else {
        imageIndex++
        // Return a placeholder div for fallback
        return `\n\n<div class="content-image-placeholder">
          <div class="placeholder-text">📖 ${promptText.trim()}</div>
        </div>\n\n`
      }
    })

    parsedContent.lessonContent = processedLessonContent
    parsedContent.contentImages = contentImages
    
    const imageGenerationTime = Date.now() - imageGenerationStartTime
    console.log(`🎨 Image generation completed in ${imageGenerationTime}ms`)
    console.log(`📊 Generated: ${contentImages.length} content images, ${parsedContent.flashcards?.filter((f: any) => f.coverImage)?.length || 0} flashcard images`)

    // Add metadata
    const finalContent = {
      ...parsedContent,
      generatedAt: new Date().toISOString(),
      gradeLevel,
      studyArea: studyAreaName,
      textbookReferences: relevantTextbookContent.length,
      topicId: topicId,
      processingTime: Date.now() - startTime,
      imageGenerationTime,
      contentImagesGenerated: contentImages.length,
      flashcardImagesGenerated: parsedContent.flashcards?.filter((f: any) => f.coverImage)?.length || 0
    }

    console.log(`🎉 Content generated successfully in ${Date.now() - startTime}ms`)
    console.log(`📊 Generated: ${finalContent.flashcards?.length || 0} flashcards, ${finalContent.quiz?.length || 0} quiz questions`)

    // Cache the enhanced content WITHOUT images (only text content and image prompts)
    try {
      console.log('💾 Caching enhanced content (text + prompts only)...')
      
      // Create a lightweight version without actual images for caching
      const cacheableContent = {
        ...finalContent,
        // Remove large image data, keep only placeholders with prompts
        contentImages: [], // Will be regenerated from prompts
        flashcards: parsedContent.flashcards?.map((f: any) => ({
          ...f,
          coverImage: null // Remove image data, keep imagePrompt
        })) || []
      }
      
      // Get user ID from request (you might need to implement auth middleware)
      // For now, we'll use a default anonymous user ID to avoid foreign key constraint issues
      const userId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333' // Default anonymous user
      
      const { data, error } = await supabase
        .from('content_cache')
        .upsert({
          topic_id: topicId,
          user_id: userId,
          content: JSON.stringify(cacheableContent),
          content_images: [], // Store empty array - images will be regenerated
          flashcard_images: [], // Store empty array - images will be regenerated
          generation_metadata: {
            textbook_references: relevantTextbookContent.length,
            ai_model: 'gemini-2.5-flash-lite-preview-06-17',
            generation_time: Date.now() - startTime,
            image_generation_time: imageGenerationTime,
            content_prompts: parsedContent.contentImagePrompts || [],
            flashcard_prompts: parsedContent.flashcards?.map((f: any) => f.imagePrompt).filter(Boolean) || [],
            cached_without_images: true // Flag to indicate this is a prompt-only cache
          },
          image_generation_time: imageGenerationTime,
          content_images_generated: contentImages.length,
          flashcard_images_generated: parsedContent.flashcards?.filter((f: any) => f.coverImage)?.length || 0,
          textbook_references: relevantTextbookContent.length,
          learning_preference: 'VISUAL' // TODO: Get from user profile
        }, {
          onConflict: 'topic_id,user_id'
        })
      
      if (error) {
        throw error
      }
      
      console.log('✅ Enhanced content cached successfully (without images)')
      console.log('💾 Cache contains:', {
        contentPrompts: parsedContent.contentImagePrompts?.length || 0,
        flashcardPrompts: parsedContent.flashcards?.map((f: any) => f.imagePrompt).filter(Boolean).length || 0,
        textContent: 'included'
      })
    } catch (cacheError) {
      console.error('⚠️ Failed to cache enhanced content:', cacheError)
      console.error('⚠️ Cache error details:', {
        message: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        code: (cacheError as any)?.code,
        details: (cacheError as any)?.details
      })
      // Don't fail the request if caching fails
    }

    const response = NextResponse.json(finalContent)
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('X-Textbook-Refs', relevantTextbookContent.length.toString())

    return response

  } catch (error) {
    console.error("Error generating enhanced content:", error)
    
    const errorResponse = NextResponse.json(
      { error: "Failed to generate content", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
    
    errorResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    
    return errorResponse
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: 'generate-enhanced-content',
    timestamp: new Date().toISOString()
  })
}
