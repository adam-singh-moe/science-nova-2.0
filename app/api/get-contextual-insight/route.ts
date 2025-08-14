import { NextRequest, NextResponse } from 'next/server'

// Simple fallback insights for common science terms when AI fails
const FALLBACK_INSIGHTS: Record<string, {
  type: string
  title: string
  content: string
  buttonText: string
}> = {
  gravity: {
    type: "FunFact",
    title: "Amazing Gravity Facts!",
    content: "Did you know gravity isn't the same everywhere on Earth? At the top of Mount Everest, you'd weigh slightly less than at sea level! That's because you're farther from Earth's center.",
    buttonText: "Fascinating!"
  },
  volcano: {
    type: "Question",
    title: "Volcanic Wonder!",
    content: "Volcanoes are like Earth's pressure release valves! What do you think would happen if Earth had no volcanoes at all? Would our planet be safer or more dangerous?",
    buttonText: "Got it!"
  },
  photosynthesis: {
    type: "FunFact",
    title: "Plant Superpowers!",
    content: "Plants are like tiny solar panels! They capture sunlight and turn it into food. In just one hour, plants on Earth capture enough solar energy to power the entire world for a year!",
    buttonText: "Amazing!"
  },
  fossil: {
    type: "Discussion",
    title: "Time Travelers!",
    content: "Fossils are like nature's time machines! Some fossils are millions of years old. If you could travel back to when this fossil was alive, what questions would you ask that ancient creature?",
    buttonText: "Cool!"
  },
  ecosystem: {
    type: "Challenge",
    title: "Nature's Balance!",
    content: "Every ecosystem is like a giant puzzle where each piece depends on the others! Can you think of three different animals that might depend on each other in a forest ecosystem?",
    buttonText: "I'll think about it!"
  },
  planet: {
    type: "FunFact",
    title: "Planetary Wonders!",
    content: "If you could drive a car to the Moon at highway speed (60 mph), it would take you about 6 months! And that's our closest neighbor in space. Space is REALLY big!",
    buttonText: "Mind-blowing!"
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pageContent, keyword, gradeLevel } = await request.json()
    
    // Validate required fields
    if (!pageContent || !keyword) {
      return NextResponse.json(
        { success: false, error: "Page content and keyword are required" },
        { status: 400 }
      )
    }

    // Determine appropriate grade level (default to 5 if not provided)
    const grade = gradeLevel || 5
    
    console.log(`🤖 Professor Nova analyzing "${keyword}" for Grade ${grade}...`)

    try {
      // Try to generate AI-powered contextual insight
      const aiInsight = await generateAIInsight(pageContent, keyword, grade)
      
      if (aiInsight) {
        console.log('✅ AI insight generated successfully')
        return NextResponse.json({
          success: true,
          insight: aiInsight
        })
      }
    } catch (aiError) {
      console.warn('⚠️ AI insight generation failed, using fallback:', aiError)
    }

    // Fallback to predefined insights
    const lowerKeyword = keyword.toLowerCase()
    const fallbackInsight = FALLBACK_INSIGHTS[lowerKeyword]
    
    if (fallbackInsight) {
      console.log('📚 Using fallback insight for:', keyword)
      return NextResponse.json({
        success: true,
        insight: {
          ...fallbackInsight,
          title: `Professor Nova says: ${fallbackInsight.title}`
        }
      })
    }

    // Generic fallback if no specific insight exists
    console.log('🔄 Using generic fallback for:', keyword)
    return NextResponse.json({
      success: true,
      insight: {
        type: "FunFact",
        title: `Professor Nova's Science Note`,
        content: `Great question about "${keyword}"! This is an important concept in science. Keep exploring and asking questions - that's how all great scientists start their journey!`,
        buttonText: "Thanks, Professor!"
      }
    })

  } catch (error) {
    console.error('❌ Error in contextual insight API:', error)
    return NextResponse.json(
      { success: false, error: "Failed to generate insight" },
      { status: 500 }
    )
  }
}

async function generateAIInsight(pageContent: string, keyword: string, gradeLevel: number) {
  // Check if AI service is available
  const aiApiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY
  
  if (!aiApiKey) {
    console.log('⚠️ No AI API key available, skipping AI generation')
    return null
  }

  try {
    // Use Google AI API if available
    if (process.env.GOOGLE_AI_API_KEY) {
      return await generateGoogleAIInsight(pageContent, keyword, gradeLevel)
    }
    
    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      return await generateOpenAIInsight(pageContent, keyword, gradeLevel)
    }
    
    return null
  } catch (error) {
    console.error('AI insight generation error:', error)
    return null
  }
}

async function generateGoogleAIInsight(pageContent: string, keyword: string, gradeLevel: number) {
  const prompt = `You are Professor Nova, a friendly AI science tutor. A Grade ${gradeLevel} student clicked on the word "${keyword}" while reading this story:

"${pageContent.substring(0, 500)}..."

Generate a short, engaging response that:
- Is appropriate for Grade ${gradeLevel} (ages ${getAgeRange(gradeLevel)})
- Relates directly to "${keyword}" in the context of the story
- Is educational but fun and conversational
- Encourages curiosity and further exploration
- Is 1-2 sentences maximum

Choose the best type: "FunFact", "Question", "Discussion", or "Challenge"

Respond in this exact JSON format:
{
  "type": "FunFact",
  "title": "Fun title here",
  "content": "Your educational content here",
  "buttonText": "Appropriate response button text"
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content generated by AI')
  }

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response')
  }

  return JSON.parse(jsonMatch[0])
}

async function generateOpenAIInsight(pageContent: string, keyword: string, gradeLevel: number) {
  const prompt = `You are Professor Nova, a friendly AI science tutor. A Grade ${gradeLevel} student clicked on the word "${keyword}" while reading this story:

"${pageContent.substring(0, 500)}..."

Generate a short, engaging response appropriate for Grade ${gradeLevel} (ages ${getAgeRange(gradeLevel)}) that relates to "${keyword}" in the story context.

Respond in JSON format:
{
  "type": "FunFact|Question|Discussion|Challenge",
  "title": "Short title",
  "content": "1-2 educational sentences",
  "buttonText": "Response button text"
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content generated by OpenAI')
  }

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response')
  }

  return JSON.parse(jsonMatch[0])
}

function getAgeRange(gradeLevel: number): string {
  const ageMap: Record<number, string> = {
    1: "6-7",
    2: "7-8", 
    3: "8-9",
    4: "9-10",
    5: "10-11",
    6: "11-12",
    7: "12-13",
    8: "13-14",
    9: "14-15",
    10: "15-16",
    11: "16-17",
    12: "17-18"
  }
  
  return ageMap[gradeLevel] || "10-11"
}
