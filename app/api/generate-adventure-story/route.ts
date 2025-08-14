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
    const { data: embeddings, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', gradeLevel)
      .ilike('content', `%${topic}%`)
      .limit(8) // Get more content for story generation

    if (error) {
      console.warn('Error fetching textbook content for story:', error)
      return []
    }

    return embeddings || []
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

export async function POST(request: NextRequest) {
  try {
    const { adventure, userId } = await request.json()
    
    if (!adventure || !userId) {
      return NextResponse.json({ error: "Adventure data and User ID are required" }, { status: 400 })
    }

    console.log('📚 Generating adventure story for:', adventure.title)

    // Get user profile for personalization
    const userProfile = await getUserProfile(userId)
    const gradeLevel = userProfile.grade_level || 5
    const learningStyle = userProfile.learning_preference || 'visual'
    const studentName = userProfile.full_name?.split(' ')[0] || 'Explorer'

    // Extract topic from adventure for textbook search
    const topic = adventure.subject || adventure.title
    const textbookContent = await searchRelevantTextbookContent(topic, gradeLevel)
    const contentContext = textbookContent.length > 0 
      ? textbookContent.map(chunk => chunk.content).join('\n\n')
      : ''

    // Generate story using AI
    const systemPrompt = `You are a master storyteller creating immersive educational adventures for Grade ${gradeLevel} students.

Create an engaging science adventure story with these specifications:

ADVENTURE: ${adventure.title}
DESCRIPTION: ${adventure.description}
STUDENT: ${studentName} (Grade ${gradeLevel}, ${learningStyle} learner)
LEARNING OBJECTIVES: ${adventure.objectives?.join(', ') || 'Explore science concepts'}

STORY REQUIREMENTS:
- Create 5-6 detailed story pages that build progressively (each page should have 3-4 paragraphs of rich content)
- Use age-appropriate language for Grade ${gradeLevel}
- Include ${studentName} as the main character
- Make it interactive and engaging with detailed scientific explanations
- Include scientific concepts naturally woven throughout the narrative
- Each page should have a vivid, detailed scene for image generation
- Include interactive quiz questions at strategic points throughout the story
- Include reflection questions at the end
- Add a discussion section at the end to engage with the student
- Make each page substantive with educational content, not just brief transitions
- ADVANCED FEATURES:
  * Include branching narrative choices that let students shape their adventure
  * Add collectible items that students can discover (tools, specimens, discoveries)
  * Create consequences system where choices affect later story options
  * Include dynamic choice prompts for AI-generated context-sensitive options
  * Weight each page's contribution to overall story progress (0.0-1.0)
  * Ensure choices lead to meaningful learning outcomes and exploration

${contentContext ? `CURRICULUM CONTENT:
Use this grade-appropriate content to ensure scientific accuracy. STRICTLY FORBIDDEN: Do NOT mention textbook names, publishers, subject labels, book titles, or reference any educational sources in the story content or image descriptions:

${contentContext}

CRITICAL RULES FOR CONTENT INTEGRATION:
- Never write phrases like "Life Cycles (Biology)", "from the textbook", "according to the book", etc.
- Never mention subject names in parentheses like "(Biology)", "(Physics)", "(Chemistry)"
- Never reference publishers, authors, or educational companies
- Present ALL information as natural discoveries made by ${studentName} during the adventure
- Make scientific facts seem like exciting discoveries, not textbook lessons
- Remove any academic language or educational terminology from story content
- Transform textbook information into adventure elements (discoveries, experiments, observations)
` : ''}

ANTI-TEXTBOOK CHECKLIST - The story must NEVER include:
❌ Textbook names or titles
❌ Publisher names (McGraw-Hill, Pearson, etc.)
❌ Subject labels in parentheses like "(Biology)" or "(Chemistry)"
❌ Academic phrases like "according to science" or "textbooks tell us"
❌ Educational source references
❌ Curriculum standard mentions
✅ Instead: Present everything as natural adventure discoveries and observations

LEARNING STYLE ADAPTATION (${learningStyle}):
${learningStyle === 'visual' ? '- Use vivid descriptions, colors, and visual imagery\n- Describe what characters see and observe' : ''}
${learningStyle === 'auditory' ? '- Include sounds, music, and spoken dialogue\n- Use rhythm and repetition in the narrative' : ''}
${learningStyle === 'kinesthetic' ? '- Include movement, hands-on activities, and physical interactions\n- Describe actions and physical sensations' : ''}

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
Return ONLY valid JSON without any markdown formatting, code blocks, or extra text:
{
  "title": "Adventure title with student name",
  "pages": [
    {
      "id": "page1",
      "title": "Chapter title",
      "content": "Story content (2-3 paragraphs, engaging and educational)",
      "backgroundPrompt": "Detailed image prompt for Imagen 3.0 generation (describe the scene, mood, style)",
      "quizQuestion": {
        "question": "Age-appropriate question about the science concept just introduced",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": 0,
        "explanation": "Simple explanation suitable for grade level"
      },
      "choices": [
        {
          "text": "Choice description that advances the story",
          "nextPageId": "page2",
          "consequences": ["Positive outcome", "Learning opportunity"]
        }
      ],
      "dynamicChoicePrompt": "Context for AI to generate additional choices based on student progress",
      "collectibles": [
        {
          "id": "item1",
          "name": "Scientific Tool",
          "description": "Description of how this tool helps the adventure"
        }
      ],
      "progressWeight": 0.2
    }
  ],
  "reflectionQuestions": [
    "Question 1 about the science concepts learned",
    "Question 2 about real-world applications", 
    "Question 3 encouraging further exploration"
  ],
  "discussionPrompts": {
    "openingQuestion": "Grade-appropriate opening question to start discussion",
    "followUpQuestions": [
      "Follow-up question 1",
      "Follow-up question 2", 
      "Follow-up question 3"
    ],
    "encouragementPhrase": "Encouraging phrase to motivate continued learning"
  }
}

QUIZ QUESTION GUIDELINES:
- Include quiz questions on pages 2, 4, and any additional even-numbered pages (more questions for longer stories)
- Questions should test understanding of the science concept just introduced in that page
- Use vocabulary and complexity appropriate for Grade ${gradeLevel}
- Provide clear, encouraging explanations for correct answers
- Make incorrect options plausible but clearly wrong to promote learning

DISCUSSION GUIDELINES:
- Create discussion prompts that match Grade ${gradeLevel} comprehension and interest level
- For Grades K-2: Use simple words, relate to everyday experiences, ask about feelings and observations
- For Grades 3-5: Include "what if" scenarios, connections to real world, encourage predictions
- For Grades 6-8: Ask for analysis, comparisons, and deeper connections between concepts
- For Grades 9-12: Include critical thinking, evaluation of evidence, and synthesis of complex ideas
- Always end with encouragement and curiosity-building phrases

IMPORTANT JSON FORMATTING RULES:
- Return ONLY the JSON object, no markdown code blocks, no explanations, no extra text
- Use proper JSON escaping for quotes (\") and newlines (\n)
- Ensure all strings are properly terminated with closing quotes
- Do not include any text before or after the JSON object
- Make sure ALL brackets and braces are properly matched
- End arrays with ] and objects with }
- NEVER include trailing commas after the last array element
- Double-check that every opening brace { has a matching closing brace }
- Double-check that every opening bracket [ has a matching closing bracket ]
- Validate that every property name is in quotes
- Ensure the final closing brace } ends the entire JSON object

JSON STRUCTURE REQUIREMENTS:
- The story MUST have exactly 5-6 pages in the "pages" array
- Each page MUST have all required properties: id, title, content, backgroundPrompt
- Each backgroundPrompt MUST avoid any textbook references or subject labels
- The JSON must be complete and valid - incomplete JSON will cause errors

CRITICAL: If you're unsure about JSON syntax, it's better to generate fewer pages than to create invalid JSON!

Make the story feel like a real adventure, not a textbook lesson!`

    try {
      const { text } = await generateText({
        model: google("gemini-2.5-flash-lite-preview-06-17"),
        system: systemPrompt,
        prompt: `Generate an immersive science adventure story for "${adventure.title}" featuring ${studentName} as the main character.`,
        maxTokens: 2500, // Increased for longer, more detailed stories
        temperature: 0.7, // Slightly reduced for more consistent formatting
      })

      // Parse the AI response
      let storyData
      try {
        let cleanedText = text.trim()
        
        // Log the raw response for debugging
        console.log('🔍 Raw AI response length:', text.length)
        console.log('🔍 First 200 chars:', text.substring(0, 200))
        console.log('🔍 Last 200 chars:', text.substring(text.length - 200))
        
        // Remove markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        // Additional cleaning for common JSON issues
        // Remove any trailing text after the closing brace
        const lastBraceIndex = cleanedText.lastIndexOf('}')
        if (lastBraceIndex !== -1) {
          cleanedText = cleanedText.substring(0, lastBraceIndex + 1)
        }
        
        // Fix common JSON issues
        cleanedText = cleanedText
          .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
          .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        
        console.log('🔍 Cleaned text length:', cleanedText.length)
        console.log('🔍 Attempting JSON parse...')
        
        storyData = JSON.parse(cleanedText)
        console.log('✅ JSON parsed successfully')
      } catch (parseError) {
        console.error('Failed to parse AI story response:', parseError)
        console.error('Error details:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown error',
          position: parseError instanceof SyntaxError ? (parseError as any).position : 'Unknown'
        })
        
        // Try to recover from JSON parsing errors
        console.warn('🔄 Attempting to recover from JSON parsing error...')
        
        try {
          let recoveryText = text.trim()
          
          // More aggressive cleaning
          recoveryText = recoveryText.replace(/^```json\s*|\s*```$/g, '')
          recoveryText = recoveryText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
          
          // Fix incomplete JSON by finding the last complete object
          const openBraces = (recoveryText.match(/{/g) || []).length
          const closeBraces = (recoveryText.match(/}/g) || []).length
          
          if (openBraces > closeBraces) {
            // Add missing closing braces
            const missingBraces = openBraces - closeBraces
            recoveryText += '}'.repeat(missingBraces)
            console.log(`� Added ${missingBraces} missing closing braces`)
          }
          
          // Fix trailing commas and incomplete arrays
          recoveryText = recoveryText
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/,\s*$/, '')
            .replace(/{\s*$/, '{}')
            .replace(/\[\s*$/, '[]')
          
          console.log('🔧 Attempting recovery JSON parse...')
          storyData = JSON.parse(recoveryText)
          console.log('✅ Recovery successful!')
          
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError)
          throw new Error('Invalid story format generated - JSON parsing failed even after recovery attempts')
        }
      }

      // Clean and enhance background prompts for better image generation
      storyData.pages = storyData.pages.map((page: any, index: number) => {
        let cleanPrompt = page.backgroundPrompt || ''
        
        // Remove any textbook references that might have slipped through
        cleanPrompt = cleanPrompt
          .replace(/\([^)]*\)/g, '') // Remove anything in parentheses like "(Biology)"
          .replace(/\b(textbook|curriculum|educational|academic)\b/gi, '') // Remove educational terms
          .replace(/\b(McGraw-Hill|Pearson|Houghton|Oxford|Cambridge)\b/gi, '') // Remove publisher names
          .replace(/\b(Life Cycles|Earth Science|Physical Science|Biology|Chemistry|Physics)\b/gi, (match: string) => {
            // Convert subject names to more natural descriptions
            const replacements: { [key: string]: string } = {
              'Life Cycles': 'natural growth and change',
              'Earth Science': 'our planet and nature',
              'Physical Science': 'forces and materials',
              'Biology': 'living things and nature',
              'Chemistry': 'materials and substances',
              'Physics': 'motion and energy'
            }
            return replacements[match] || 'natural world'
          })
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim()
        
        return {
          ...page,
          backgroundPrompt: `${cleanPrompt}. Educational illustration style, child-friendly, bright colors, safe environment, suitable for Grade ${gradeLevel} science education. High quality, detailed, engaging for young learners.`
        }
      })

      // Add metadata
      const enhancedStory = {
        ...storyData,
        gradeLevel,
        learningStyle,
        hasTextbookContent: textbookContent.length > 0,
        textbookSources: [],
        generatedAt: new Date().toISOString()
      }

      console.log(`✅ Generated ${enhancedStory.pages.length} story pages with textbook integration`)

      // Trigger background image generation (don't await - let it run async)
      if (enhancedStory.pages && enhancedStory.pages.length > 0) {
        try {
          console.log('🔄 Triggering background image generation...')
          fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/generate-images-background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adventureId: adventure.id,
              storyPages: enhancedStory.pages,
              gradeLevel: gradeLevel
            })
          }).catch(error => {
            console.warn('Background image generation trigger failed:', error)
          })
        } catch (error) {
          console.warn('Failed to trigger background image generation:', error)
        }
      }

      return NextResponse.json(enhancedStory)

    } catch (aiError) {
      console.error('AI generation error for story:', aiError)
      
      // Enhanced fallback story with textbook content integration
      console.log('🔄 Generating enhanced fallback story with textbook content...')
      
      // Use textbook content to create better fallback
      const conceptSummary = textbookContent.length > 0 
        ? textbookContent.slice(0, 3).map(chunk => chunk.content).join(' ').substring(0, 500)
        : `${topic} is a fascinating area of science that helps us understand the world around us.`

      const fallbackStory = {
        title: `${studentName}'s ${adventure.title}`,
        pages: [
          {
            id: "page1",
            title: "The Journey Begins",
            content: `${studentName} was always curious about science, but today would be different. As they stepped into their classroom, something magical was about to happen. Their teacher had prepared a special adventure into the fascinating world of ${topic}.

"Welcome, young scientists!" announced their teacher. "Today we're going to explore how gravity affects everything around us, how energy flows through ecosystems, and how molecules interact in amazing chemical reactions. ${studentName}, are you ready to discover the secrets that scientists have been studying for centuries?"

The room suddenly filled with excitement as ${studentName} realized this wasn't going to be ordinary. They would learn about fossils from prehistoric times, see how photosynthesis helps plants create oxygen, and understand how forces and motion shape our planet. This was going to be an adventure that would change how they saw the world forever.`,
            backgroundPrompt: `A bright, modern classroom with ${topic} displays and equipment, ${studentName} looking excited and curious, educational posters on walls, warm lighting, welcoming learning environment, Grade ${gradeLevel} appropriate.`
          },
          {
            id: "page2", 
            title: "Discovering the Science",
            content: `As ${studentName} began their exploration, they discovered how incredible science really is! ${conceptSummary}

They learned that every ecosystem contains countless species that have evolved through adaptation over millions of years. From tiny bacteria to massive volcanic eruptions, from the mineral crystals deep underground to the solar energy powering life on our planet - everything is connected!

"This is incredible!" ${studentName} exclaimed. "I can see how DNA carries the genetic information in every cell, how magnetic fields protect Earth from harmful radiation, and how pressure and temperature create the rocks beneath our feet. Science explains everything!"

Their eyes widened as they realized how chemical reactions happen in their own body, how prehistoric creatures left behind fossil evidence, and how the force of gravity keeps everything in place while our planet orbits through space.`,
            backgroundPrompt: `${studentName} examining ${topic} related materials and equipment, making observations with scientific tools, bright and engaging laboratory setting, discovery and excitement, educational environment.`,
            quizQuestion: {
              question: `What did ${studentName} discover about science?`,
              options: [`It connects everything in nature`, `It's only in textbooks`, `It's too hard to understand`, `It's not important`],
              correctAnswer: 0,
              explanation: `Exactly! ${studentName} discovered that science connects everything in nature, from tiny atoms to entire ecosystems!`
            }
          },
          {
            id: "page3",
            title: "Understanding How It Works", 
            content: `Now ${studentName} was really getting excited! They learned about the fundamental principles that make our universe work. ${textbookContent.length > 0 ? textbookContent[0].content.substring(0, 200) : `From the smallest particle to the largest galaxy, scientific principles govern everything.`}

Through hands-on experiments, ${studentName} observed how photosynthesis converts sunlight into energy, how gravity pulls objects downward, and how different species adapt to their habitat over time. They watched chemical reactions create new substances, studied how erosion shapes geological formations, and marveled at how organs work together as a system in living creatures.

"I can see how scientists use the scientific method to understand weather patterns, predict volcanic activity, and discover new species," ${studentName} said with growing confidence. "Every molecule tells a story, every fossil reveals prehistoric secrets, and every organism shows us how evolution works!"

Each new discovery led to more questions about DNA, bacteria, minerals, solar radiation, magnetic forces, and the incredible biodiversity of our planet.`,
            backgroundPrompt: `${studentName} conducting scientific experiments related to ${topic}, using proper safety equipment, bright laboratory with charts and diagrams, successful learning experience, Grade ${gradeLevel} appropriate.`,
            quizQuestion: {
              question: `What makes a good scientist like ${studentName}?`,
              options: [`Being curious and asking questions`, `Memorizing facts only`, `Working alone always`, `Avoiding difficult concepts`],
              correctAnswer: 0,
              explanation: `Perfect! Good scientists like ${studentName} are curious, ask questions, and love to explore and understand the world around them!`
            }
          },
          {
            id: "page4",
            title: "Becoming a Science Expert",
            content: `By the end of their adventure, ${studentName} had transformed from a curious student into a confident young scientist! They now understood how atoms combine to form molecules, how ecosystems support diverse species, and how energy flows through all living systems.

"I can't wait to share what I've learned about gravity, photosynthesis, and evolution with my family and friends!" ${studentName} declared. "Now I understand how volcanic activity shapes our planet, how fossil records tell us about prehistoric life, and how DNA carries the genetic blueprint for every organism!"

${studentName} marveled at how chemical reactions power our bodies, how magnetic fields protect Earth from solar radiation, and how adaptation helps species survive in different habitats. They realized that from tiny bacteria to massive geological formations, from weather patterns to mineral crystals - everything follows scientific principles.

"Science is everywhere!" ${studentName} exclaimed. "In every cell, every reaction, every force that shapes our world. I want to keep exploring more about how pressure creates diamonds, how motion generates energy, and how our amazing planet supports such incredible biodiversity!"`,
            backgroundPrompt: `${studentName} confidently presenting their ${topic} knowledge to others, sharing discoveries with enthusiasm, bright educational setting with science displays, celebration of learning achievement.`,
            quizQuestion: {
              question: `What did ${studentName} realize about science?`,
              options: [`Science is everywhere around us`, `Science is only in laboratories`, `Science is too complicated`, `Science isn't important`],
              correctAnswer: 0,
              explanation: `That's right! ${studentName} realized that science is everywhere - from atoms to ecosystems, from DNA to galaxies!`
            }
          }
        ],
        reflectionQuestions: [
          `What was the most interesting thing ${studentName} learned about ${topic}?`,
          `How can you use this knowledge in your daily life?`,
          `What other questions do you have about ${topic}?`
        ],
        discussionPrompts: {
          openingQuestion: gradeLevel <= 2 
            ? `${studentName}, what was your favorite part of learning about ${topic}?`
            : gradeLevel <= 5
            ? `What surprised you most about ${topic} in this adventure?`
            : gradeLevel <= 8
            ? `How do you think understanding ${topic} could help solve real-world problems?`
            : `What connections can you make between ${topic} and other scientific concepts you've learned?`,
          followUpQuestions: gradeLevel <= 2
            ? [`How did it make you feel to learn about ${topic}?`, `What would you like to explore next?`, `Can you think of ${topic} in your everyday life?`]
            : gradeLevel <= 5
            ? [`What questions do you still have about ${topic}?`, `How might this knowledge be useful to you?`, `What would you want to investigate further?`]
            : gradeLevel <= 8
            ? [`What evidence supports the concepts you learned?`, `How might this knowledge change your perspective?`, `What experiments could you design to test these ideas?`]
            : [`How does this knowledge challenge your previous understanding?`, `What ethical considerations might be involved?`, `How could you apply this in future scientific studies?`],
          encouragementPhrase: gradeLevel <= 2
            ? `You're such a curious scientist, ${studentName}! Keep asking questions and exploring!`
            : gradeLevel <= 5
            ? `Your curiosity about ${topic} shows you're thinking like a real scientist!`
            : gradeLevel <= 8
            ? `Your thoughtful questions and observations demonstrate excellent scientific thinking!`
            : `Your analytical approach and deep questions show sophisticated scientific reasoning!`
        },
        gradeLevel,
        learningStyle,
        hasTextbookContent: textbookContent.length > 0,
        textbookSources: [],
        generatedAt: new Date().toISOString()
      }

      return NextResponse.json(fallbackStory)
    }

  } catch (error) {
    console.error('❌ Generate Adventure Story API error:', error)
    return NextResponse.json(
      { error: "Failed to generate adventure story", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
