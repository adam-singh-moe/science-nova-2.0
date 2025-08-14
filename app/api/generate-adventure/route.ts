import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to search for relevant textbook content
async function searchRelevantTextbookContent(topic: string, gradeLevel: number) {
  try {
    // First try specific topic search
    let { data: embeddings, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', gradeLevel)
      .ilike('content', `%${topic}%`)
      .not('content', 'ilike', '%acknowledgement%')
      .not('content', 'ilike', '%ministry of education%') 
      .not('content', 'ilike', '%sample extracted text%')
      .not('content', 'ilike', '%placeholder text%')
      .limit(5)

    // If no specific content found, get general grade-appropriate content
    if (!embeddings || embeddings.length === 0) {
      console.log(`🔍 No specific content found for "${topic}", searching for general Grade ${gradeLevel} content...`)
      const { data: generalContent, error: generalError } = await supabase
        .from('textbook_embeddings')
        .select('content, metadata, grade_level')
        .eq('grade_level', gradeLevel)
        .not('content', 'ilike', '%acknowledgement%')
        .not('content', 'ilike', '%ministry of education%')
        .not('content', 'ilike', '%sample extracted text%')
        .not('content', 'ilike', '%placeholder text%')
        .limit(8)

      if (generalError) {
        console.warn('Error fetching general textbook content:', generalError)
        return []
      }

      embeddings = generalContent || []
    }

    if (error && embeddings.length === 0) {
      console.warn('Error fetching textbook content for adventure:', error)
      return []
    }

    // Filter out low-quality content
    const filteredContent = embeddings.filter(chunk => {
      const content = chunk.content.toLowerCase()
      const hasGoodContent = content.length > 100 && 
        !content.includes('acknowledgement') &&
        !content.includes('ministry of education') &&
        !content.includes('sample extracted text') &&
        !content.includes('placeholder text') &&
        (content.includes('science') || content.includes('experiment') || 
         content.includes('observe') || content.includes('discover') ||
         content.includes('learn') || content.includes('study') ||
         content.includes('animals') || content.includes('plants') ||
         content.includes('water') || content.includes('air') ||
         content.includes('light') || content.includes('sound') ||
         content.includes('matter') || content.includes('energy') ||
         content.includes('earth') || content.includes('body') ||
         content.includes('living') || content.includes('non-living'))
      
      return hasGoodContent
    })

    console.log(`📚 Found ${filteredContent.length} relevant textbook chunks for "${topic}" (Grade ${gradeLevel})`)
    if (filteredContent.length > 0) {
      console.log(`📝 Sample content: "${filteredContent[0].content.substring(0, 100)}..."`)
    }

    return filteredContent
  } catch (error) {
    console.error('Error searching textbook content:', error)
    return []
  }
}

// Helper function to get user profile
async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Return default profile
      return {
        grade_level: 5,
        learning_preference: 'visual',
        full_name: 'Student'
      }
    }

    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return {
      grade_level: 5,
      learning_preference: 'visual',
      full_name: 'Student'
    }
  }
}

// Helper function to extract key concepts from textbook content
function extractConceptsFromTextbook(textbookContent: any[], topic: string): string[] {
  const concepts = [topic]
  const allText = textbookContent.map(chunk => chunk.content.toLowerCase()).join(' ')
  
  // Extract science concepts commonly found in textbooks
  const conceptKeywords = [
    'observe', 'experiment', 'hypothesis', 'prediction', 'conclusion',
    'living', 'non-living', 'habitat', 'ecosystem', 'food chain',
    'solid', 'liquid', 'gas', 'matter', 'energy', 'force', 'motion',
    'light', 'sound', 'heat', 'temperature', 'weather', 'climate',
    'plants', 'animals', 'growth', 'life cycle', 'adaptation',
    'earth', 'water', 'air', 'soil', 'rocks', 'minerals'
  ]
  
  conceptKeywords.forEach(keyword => {
    if (allText.includes(keyword) && !concepts.includes(keyword)) {
      concepts.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  })
  
  // Return top 3-4 most relevant concepts
  return concepts.slice(0, 4)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log('🎮 Generating daily adventures for user:', userId)

    // Check if adventures already exist for today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAdventures, error: fetchError } = await supabase
      .from('daily_adventures')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (!fetchError && existingAdventures) {
      console.log('📚 Returning existing adventures for today')
      return NextResponse.json({ 
        adventures: existingAdventures.adventures,
        message: "Adventures already generated for today" 
      })
    }

    // Get user profile for grade level and learning style
    const userProfile = await getUserProfile(userId)
    const gradeLevel = userProfile.grade_level || 5
    const learningStyle = userProfile.learning_preference || 'visual'

    console.log(`🎓 Generating adventures for Grade ${gradeLevel} ${learningStyle} learner`)

    // Define grade-appropriate science topics
    const getGradeTopics = (grade: number) => {
      if (grade <= 2) {
        return ["Animals and Their Homes", "Plants Around Us", "Weather and Seasons", "Our Body", "Simple Machines"]
      } else if (grade <= 5) {
        return ["Solar System", "Life Cycles", "States of Matter", "Simple Ecosystems", "Forces and Motion", "Light and Sound"]
      } else if (grade <= 8) {
        return ["Cell Structure", "Chemical Reactions", "Earth's Layers", "Genetics Basics", "Energy Forms", "Climate Change"]
      } else {
        return ["DNA and Genetics", "Periodic Table", "Physics Laws", "Organic Chemistry", "Environmental Science", "Biotechnology"]
      }
    }

    const possibleTopics = getGradeTopics(gradeLevel)
    
    // Generate 3 unique adventures
    const adventures = []
    
    for (let i = 0; i < 3; i++) {
      const topic = possibleTopics[Math.floor(Math.random() * possibleTopics.length)]
      
      // Search for relevant textbook content
      const textbookContent = await searchRelevantTextbookContent(topic, gradeLevel)
      const contentContext = textbookContent.length > 0 
        ? textbookContent.map(chunk => chunk.content).join('\n\n')
        : ''

      // Generate adventure using AI
      const systemPrompt = `You are an expert educational content creator specializing in science adventures for Grade ${gradeLevel} students.

Create an engaging, age-appropriate science adventure about "${topic}" with these requirements:

GRADE LEVEL: ${gradeLevel}
LEARNING STYLE: ${learningStyle}
CONTENT REQUIREMENTS:
- Use simple, clear language appropriate for Grade ${gradeLevel} students
- Include hands-on activities and observations
- Make it exciting and story-driven
- Focus on real science concepts from the curriculum
- Duration should be 20-30 minutes
- MUST reference specific concepts from the textbook content provided

${contentContext ? `CURRICULUM TEXTBOOK CONTENT - YOU MUST USE THIS:
${contentContext}

IMPORTANT: Base the adventure directly on the concepts, facts, and information from this textbook content. Reference specific details, examples, or concepts mentioned in the textbook to ensure curriculum alignment and authenticity.
` : `IMPORTANT: Even without specific textbook content, create an adventure that follows standard Grade ${gradeLevel} science curriculum topics like: ${topic}, observation skills, scientific method, and age-appropriate science concepts.`}

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
Return ONLY valid JSON without any markdown formatting, code blocks, or extra text:
{
  "title": "Adventure title (exciting and kid-friendly)",
  "description": "One sentence description of what students will explore",
  "subject": "Main science subject area",
  "concepts": ["concept1", "concept2", "concept3"],
  "difficulty": "beginner|intermediate|advanced",
  "duration": "20-30 minutes",
  "objectives": ["learning objective 1", "learning objective 2", "learning objective 3"]
}

IMPORTANT: 
1. Return ONLY the JSON object, no markdown code blocks, no explanations
2. Make concepts and objectives specific to the textbook content provided
3. Use terminology and examples that match the curriculum level
4. Make it sound like an exciting adventure, not a boring lesson!`

      try {
        const { text } = await generateText({
          model: google("gemini-1.5-flash-latest"), // Use the working model
          system: systemPrompt,
          prompt: `Generate a unique science adventure about "${topic}" for a Grade ${gradeLevel} ${learningStyle} learner.`,
          maxTokens: 500,
          temperature: 0.8,
        })

        // Check if we got a valid response
        if (!text || text.trim().length < 20) {
          console.warn(`⚠️ Empty/short AI response for adventure ${i}: "${text || 'null'}"`)
          throw new Error('Empty AI response')
        }

        // Parse the AI response with better error handling
        let cleanedText = text.trim()
        
        // Remove markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        // Additional cleaning for common AI response issues
        cleanedText = cleanedText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1') // Extract JSON object
        
        if (!cleanedText || cleanedText.length < 10) {
          console.warn(`⚠️ No valid JSON found in AI response for adventure ${i}`)
          throw new Error('No valid JSON in AI response')
        }

        const adventureData = JSON.parse(cleanedText)
        
        adventures.push({
          id: `adventure_${Date.now()}_${i}`,
          ...adventureData,
          hasTextbookContent: textbookContent.length > 0,
          textbookSources: textbookContent.map(chunk => chunk.metadata?.file_name || 'Science Textbook').slice(0, 3)
        })

      } catch (aiError) {
        console.error('AI generation error for adventure', i, ':', aiError)
        
        // Fallback to a template-based adventure that still uses textbook content
        const fallbackConcepts = textbookContent.length > 0 ? 
          extractConceptsFromTextbook(textbookContent, topic) : 
          [topic, "Scientific Method", "Observation"]
          
        const fallbackObjectives = textbookContent.length > 0 ?
          [
            `Learn about ${topic} as described in the Grade ${gradeLevel} textbook`,
            "Practice scientific observation and discovery",
            "Apply textbook knowledge to real-world examples"
          ] :
          [
            `Learn about ${topic}`,
            "Practice scientific observation",
            "Apply knowledge to real-world examples"
          ]

        adventures.push({
          id: `adventure_${Date.now()}_${i}`,
          title: `Exploring ${topic}: A Science Adventure`,
          description: `Discover the fascinating world of ${topic} through interactive exploration based on your Grade ${gradeLevel} science curriculum`,
          subject: topic.includes('System') ? 'Astronomy' : topic.includes('Cell') ? 'Biology' : topic.includes('Matter') ? 'Physical Science' : 'General Science',
          concepts: fallbackConcepts,
          difficulty: gradeLevel <= 2 ? 'beginner' : gradeLevel <= 5 ? 'intermediate' : 'advanced',
          duration: "25 minutes",
          objectives: fallbackObjectives,
          hasTextbookContent: textbookContent.length > 0,
          textbookSources: textbookContent.map(chunk => chunk.metadata?.file_name || 'Science Textbook').slice(0, 3)
        })
      }
    }

    // Store adventures in database with proper conflict resolution
    const { error: insertError } = await supabase
      .from('daily_adventures')
      .upsert(
        {
          user_id: userId,
          date: today,
          adventures: adventures
        },
        { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        }
      )

    if (insertError) {
      console.error('Error storing adventures:', insertError)
      // Continue anyway - return the generated adventures
    }

    console.log(`✅ Generated ${adventures.length} adventures for Grade ${gradeLevel}`)

    return NextResponse.json({ 
      adventures: adventures,
      message: "Adventures generated successfully",
      gradeLevel: gradeLevel,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Generate Adventure API error:', error)
    return NextResponse.json(
      { error: "Failed to generate adventures", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
