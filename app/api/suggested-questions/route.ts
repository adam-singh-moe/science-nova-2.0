import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase-server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Cache suggested questions for 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const questionsCache = new Map<string, { questions: any[], timestamp: number }>()

// Function to clear the cache
function clearQuestionsCache() {
  questionsCache.clear()
  console.log('🧹 Cleared suggested questions cache')
}

interface SuggestedQuestionsResponse {
  success: boolean
  questions?: Array<{
    category: string
    questions: string[]
  }>
  error?: string
  cached?: boolean
}

async function getTextbookTopics(gradeLevel: number, limit: number = 10) {
  try {
    console.log(`🔍 Getting textbook topics for grade ${gradeLevel}...`)
    const supabase = await createRouteHandlerClient()
    
    // Get diverse textbook content for this grade level, filtering out metadata/acknowledgements
    const { data: textbookChunks, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata')
      .eq('grade_level', gradeLevel)
      .not('content', 'ilike', '%acknowledgement%')
      .not('content', 'ilike', '%ministry of education%')
      .not('content', 'ilike', '%copyright%')
      .not('content', 'ilike', '%table of contents%')
      .limit(limit)
    
    console.log(`📊 Database query result: ${textbookChunks?.length || 0} chunks found, error: ${error?.message || 'none'}`)
    
    if (error) {
      console.error(`❌ Supabase error for grade ${gradeLevel}:`, error)
      return []
    }
    
    if (!textbookChunks || textbookChunks.length === 0) {
      console.warn(`⚠️ No textbook content found for grade ${gradeLevel}`)
      return []
    }
    
    // Filter and extract meaningful educational content
    const topics = textbookChunks
      .filter(chunk => {
        const content = chunk.content.toLowerCase()
        // Skip chunks that are likely metadata, acknowledgements, or table of contents
        return !content.includes('acknowledgement') && 
               !content.includes('ministry') && 
               !content.includes('copyright') &&
               !content.includes('table of contents') &&
               !content.includes('page number') &&
               chunk.content.length > 100 // Ensure substantial content
      })
      .map(chunk => ({
        content: chunk.content.substring(0, 800), // Longer content for better context
        source: chunk.metadata?.file_name || `Grade ${gradeLevel} Textbook`
      }))
      .slice(0, 5) // Limit to 5 best chunks
    
    console.log(`✅ Extracted ${topics.length} topics from textbook content`)
    if (topics.length > 0) {
      console.log(`📋 Sample topic: "${topics[0]?.content.substring(0, 150)}..."`)
    }
    
    return topics
  } catch (error) {
    console.error('💥 Error fetching textbook topics:', error)
    return []
  }
}

async function generateDailyQuestions(gradeLevel: number, textbookTopics: any[]) {
  // If no textbook content, fall back to grade-appropriate questions
  if (!textbookTopics || textbookTopics.length === 0) {
    console.warn(`No textbook content available for Grade ${gradeLevel}, using fallback questions`)
    return getDefaultQuestions(gradeLevel)
  }

  try {
    console.log(`🤖 Generating daily questions for Grade ${gradeLevel}...`)
    
    // Create prompt based on textbook content
    const topicsText = textbookTopics
      .map(topic => topic.content)
      .join('\n\n')
      .substring(0, 1500) // Limit context size
    
    console.log(`📚 Using textbook content: ${topicsText.length} characters`)
    if (topicsText.length === 0) {
      console.warn(`⚠️ No textbook content available for AI prompt`)
    } else {
      console.log(`📝 Textbook content preview: ${topicsText.substring(0, 100)}...`)
    }
    
    const prompt = `You are an educational content creator. Based on this Grade ${gradeLevel} science textbook content, create exactly 9 engaging questions that students would find interesting:

${topicsText}

Create questions that are:
- Directly related to the textbook content above
- Appropriate for Grade ${gradeLevel} students (ages ${gradeLevel + 5}-${gradeLevel + 6})
- Designed to spark curiosity and encourage learning
- Based on actual science concepts from the text

Return ONLY a JSON object with this exact structure:
{
  "questions": [
    "First question about the textbook content?",
    "Second question about the textbook content?",
    "Third question about the textbook content?",
    "Fourth question about the textbook content?",
    "Fifth question about the textbook content?",
    "Sixth question about the textbook content?",
    "Seventh question about the textbook content?",
    "Eighth question about the textbook content?",
    "Ninth question about the textbook content?"
  ]
}

Important: Only return valid JSON. No explanations or extra text.`

    // Try with multiple attempts and different models
    let result
    const models = ["gemini-2.5-flash-lite-preview-06-17", "gemini-1.5-flash-latest"]
    
    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelName = models[modelIndex]
      console.log(`🤖 Trying model: ${modelName}`)
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔄 Model ${modelName}, Attempt ${attempt}...`)
          
          result = await generateText({
            model: google(modelName),
            prompt: prompt,
            temperature: attempt === 1 ? 0.7 : 0.5,
            maxTokens: 1000,
          })
          
          if (result && result.text && result.text.trim().length > 50) {
            console.log(`✅ Got response from ${modelName} on attempt ${attempt}: ${result.text.length} chars`)
            break
          } else {
            console.warn(`⚠️ Model ${modelName}, attempt ${attempt} returned empty/short response: "${result?.text || 'null'}"`)
          }
        } catch (attemptError) {
          console.error(`❌ Model ${modelName}, attempt ${attempt} failed:`, attemptError)
        }
      }
      
      // If we got a good result, break out of model loop
      if (result && result.text && result.text.trim().length > 50) {
        break
      }
    }
    
    if (!result || !result.text || result.text.trim().length === 0) {
      console.error('❌ All models and attempts failed to generate AI response')
      return getDefaultQuestions(gradeLevel)
    }

    // Parse the AI response with improved error handling
    const responseText = result.text.trim()
    console.log(`📝 AI Response: ${responseText.substring(0, 200)}...`)
    
    if (responseText.length === 0) {
      console.error('❌ Empty AI response received')
      return getDefaultQuestions(gradeLevel)
    }
    
    // Multiple attempts to extract JSON from the response
    let parsedResponse
    
    try {
      // Clean the response text by removing markdown code blocks and extra text
      let cleanText = responseText
      
      // Remove markdown code blocks
      cleanText = cleanText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '')
      
      // Try to find JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*"questions"[\s\S]*\]/);
      if (jsonMatch) {
        // Find the complete JSON object
        let braceCount = 0
        let startIndex = cleanText.indexOf('{')
        let endIndex = startIndex
        
        for (let i = startIndex; i < cleanText.length; i++) {
          if (cleanText[i] === '{') braceCount++
          if (cleanText[i] === '}') braceCount--
          if (braceCount === 0) {
            endIndex = i
            break
          }
        }
        
        if (braceCount === 0 && endIndex > startIndex) {
          const jsonString = cleanText.substring(startIndex, endIndex + 1)
          const tempResponse = JSON.parse(jsonString)
          
          // Convert simple questions array to our expected format if needed
          if (tempResponse.questions && Array.isArray(tempResponse.questions)) {
            if (typeof tempResponse.questions[0] === 'string') {
              // Convert from simple array to our format
              parsedResponse = {
                questions: [
                  {
                    category: "Today's Questions",
                    questions: tempResponse.questions
                  }
                ]
              }
            } else {
              // Already in correct format
              parsedResponse = tempResponse
            }
          }
        } else {
          // Fallback: try parsing the matched portion
          const tempResponse = JSON.parse(jsonMatch[0] + '}')
          if (tempResponse.questions && Array.isArray(tempResponse.questions)) {
            if (typeof tempResponse.questions[0] === 'string') {
              parsedResponse = {
                questions: [
                  {
                    category: "Today's Questions", 
                    questions: tempResponse.questions
                  }
                ]
              }
            } else {
              parsedResponse = tempResponse
            }
          }
        }
      } else {
        // Try parsing the entire cleaned response
        const tempResponse = JSON.parse(cleanText)
        if (tempResponse.questions && Array.isArray(tempResponse.questions)) {
          if (typeof tempResponse.questions[0] === 'string') {
            parsedResponse = {
              questions: [
                {
                  category: "Today's Questions",
                  questions: tempResponse.questions
                }
              ]
            }
          } else {
            parsedResponse = tempResponse
          }
        }
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.log('Raw AI Response:', responseText)
      
      // Fallback: Try to extract questions manually using text parsing
      try {
        console.log('🔧 Attempting manual text parsing for questions...')
        const manualQuestions = parseQuestionsFromText(responseText, gradeLevel)
        if (manualQuestions.length > 0) {
          console.log('✅ Successfully extracted questions using text parsing')
          return manualQuestions
        }
      } catch (manualError) {
        console.error('❌ Manual parsing also failed:', manualError)
      }
      
      // Final fallback to default questions
      console.warn('🔄 Falling back to default questions due to parsing failure')
      return getDefaultQuestions(gradeLevel)
    }
    
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      console.error('❌ Invalid question format in AI response:', parsedResponse)
      console.warn('🔄 Falling back to default questions due to invalid format')
      return getDefaultQuestions(gradeLevel)
    }
    
    console.log('✅ Successfully parsed AI-generated questions:', parsedResponse.questions.length)
    return parsedResponse.questions
    
  } catch (error) {
    console.error('💥 Error generating questions with AI:', error)
    console.warn('🔄 Falling back to default questions due to error')
    
    // Fallback to grade-appropriate default questions if AI fails
    return getDefaultQuestions(gradeLevel)
  }
}

function getDefaultQuestions(gradeLevel: number) {
  if (gradeLevel <= 2) {
    return [
      {
        category: "Science Questions",
        questions: [
          "What do plants need to grow?",
          "What do animals eat?", 
          "How do we take care of pets?",
          "Why do I need to eat food?",
          "What makes my heart beat?",
          "Why do I have teeth?",
          "Why does it rain?",
          "What makes it sunny?",
          "Why is it cold in winter?"
        ]
      }
    ]
  } else if (gradeLevel <= 5) {
    return [
      {
        category: "Science Questions",
        questions: [
          "How do plants make their own food?",
          "How do our bodies digest food?",
          "Why do animals hibernate?",
          "Why do objects fall down?",
          "How do magnets work?",
          "What makes things float?",
          "What makes the weather change?",
          "How are rocks formed?",
          "What are the phases of the moon?"
        ]
      }
    ]
  } else {
    return [
      {
        category: "Science Questions",
        questions: [
          "How do cells divide and grow?",
          "What is photosynthesis?",
          "How does the circulatory system work?",
          "What is the difference between mass and weight?",
          "How do chemical reactions work?",
          "What are the states of matter?",
          "How are mountains formed?",
          "What causes earthquakes?",
          "How does the water cycle work?"
        ]
      }
    ]
  }
}

// Manual text parsing as fallback when JSON parsing fails
function parseQuestionsFromText(text: string, gradeLevel: number) {
  console.log('🔧 Attempting manual text parsing for questions...')
  
  try {
    // Look for patterns that might indicate questions
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const questions: string[] = []
    
    for (const line of lines) {
      // Check if line looks like a question (ends with ?, starts with number, or common question words)
      if (line.endsWith('?') || 
          line.match(/^\d+\.\s*/) ||
          line.match(/^(what|how|why|when|where|which)/i)) {
        
        const cleanQuestion = line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim()
        if (cleanQuestion.length > 10 && questions.length < 9) {
          questions.push(cleanQuestion)
        }
      }
    }
    
    // If we got questions, return them in our expected format
    if (questions.length > 0) {
      console.log(`✅ Manual parsing extracted ${questions.length} questions`)
      return [
        {
          category: "Textbook Questions",
          questions: questions.slice(0, 9) // Limit to 9 questions
        }
      ]
    }
    
    // If manual parsing failed, return empty array to trigger fallback
    console.log('❌ Manual parsing found no valid questions')
    return []
    
  } catch (error) {
    console.error('Error in manual text parsing:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  console.log(`🎯 === SUGGESTED QUESTIONS API CALLED ===`)
  try {
    const { searchParams } = new URL(request.url)
    const gradeLevel = parseInt(searchParams.get('gradeLevel') || '5')
    const userId = searchParams.get('userId')
    const clearCache = searchParams.get('clearCache') === 'true'

    console.log(`📋 Request params: Grade ${gradeLevel}, User: ${userId}, Clear cache: ${clearCache}`)

    // Handle cache clearing request
    if (clearCache) {
      clearQuestionsCache()
      console.log(`🧹 Cache cleared successfully`)
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      })
    }
    
    // Validate grade level
    if (gradeLevel < 1 || gradeLevel > 12) {
      console.error(`❌ Invalid grade level: ${gradeLevel}`)
      return NextResponse.json(
        { success: false, error: 'Invalid grade level' },
        { status: 400 }
      )
    }
    
    // Create cache key based on grade level and current date
    const today = new Date().toDateString()
    const cacheKey = `grade-${gradeLevel}-${today}`
    
    console.log(`🔑 Cache key: ${cacheKey}`)
    
    // Check if we have cached questions for today
    const cached = questionsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Using cached questions for Grade ${gradeLevel}`)
      return NextResponse.json({
        success: true,
        questions: cached.questions,
        cached: true
      })
    }
    
    // Generate new questions
    console.log(`🆕 Generating new daily questions for Grade ${gradeLevel}`)
    
    // Get textbook topics for this grade level
    const textbookTopics = await getTextbookTopics(gradeLevel, 8)
    console.log(`📚 Found ${textbookTopics.length} textbook topics for Grade ${gradeLevel}`)
    
    // Generate AI-powered questions based on textbook content
    const questions = await generateDailyQuestions(gradeLevel, textbookTopics)
    console.log(`🎯 Generated questions result:`, questions.length > 0 ? `${questions.length} categories` : 'No questions generated')
    
    // Cache the results
    questionsCache.set(cacheKey, {
      questions,
      timestamp: Date.now()
    })
    
    console.log(`✅ Generated ${questions.length} question categories for Grade ${gradeLevel}`)
    
    return NextResponse.json({
      success: true,
      questions,
      cached: false
    })
    
  } catch (error) {
    console.error('Error in suggested questions API:', error)
    
    // Return fallback questions on any error
    const gradeLevel = parseInt(new URL(request.url).searchParams.get('gradeLevel') || '5')
    const fallbackQuestions = getDefaultQuestions(gradeLevel)
    
    return NextResponse.json({
      success: true,
      questions: fallbackQuestions,
      cached: false,
      fallback: true
    })
  }
}
