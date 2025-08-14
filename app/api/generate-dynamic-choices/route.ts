import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { currentPage, storyContext, gradeLevel, inventory, choiceHistory, learningStyle } = await request.json()

    if (!currentPage || !storyContext) {
      return NextResponse.json({ error: "Current page and story context are required" }, { status: 400 })
    }

    console.log('🤖 Generating dynamic choices for page:', currentPage.id)

    // Build context for AI choice generation
    const inventoryContext = inventory && inventory.length > 0 
      ? `Student has collected: ${inventory.map((item: any) => item.name).join(', ')}`
      : 'Student has no items collected yet'

    const choiceHistoryContext = choiceHistory && choiceHistory.length > 0
      ? `Previous choices made: ${choiceHistory.map((choice: any) => `"${choice.choiceText}" on ${choice.pageId}`).join(', ')}`
      : 'No previous choices made'

    const systemPrompt = `You are an expert educational storyteller creating dynamic, contextual choices for a science adventure story.

CURRENT STORY CONTEXT:
${storyContext}

CURRENT PAGE:
Title: ${currentPage.title}
Content: ${currentPage.content}

STUDENT CONTEXT:
Grade Level: ${gradeLevel}
Learning Style: ${learningStyle}
${inventoryContext}
${choiceHistoryContext}

INSTRUCTIONS:
- Generate 2-4 meaningful choices that:
  1. Advance the story logically based on the current context
  2. Consider what items the student has collected
  3. Reference previous choices when relevant
  4. Are appropriate for Grade ${gradeLevel} students
  5. Include scientific thinking and problem-solving
  6. Each choice should have clear consequences
  7. Some choices might require specific items from inventory

CHOICE REQUIREMENTS:
- Each choice should be 1-2 sentences maximum
- Include diverse action types: investigation, experimentation, collaboration, creative thinking
- Consider the student's learning style (${learningStyle})
- Some choices should have prerequisites (requiring specific items or previous choices)
- Include both safe and slightly risky options for varied consequences

RESPONSE FORMAT (JSON ONLY):
{
  "choices": [
    {
      "text": "Choice description that feels natural to the story",
      "nextPageId": "dynamicChoice1",
      "consequences": ["Positive outcome", "Learning opportunity", "New discovery"],
      "requiresItems": ["optional item needed"],
      "probability": 1.0
    }
  ]
}

Return ONLY valid JSON without any markdown formatting or extra text.`

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: systemPrompt,
      maxTokens: 800,
      temperature: 0.8, // Higher creativity for dynamic choices
    })

    // Parse the AI response
    let cleanedResponse = result.text.trim()
    
    // Remove any markdown formatting
    cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '')
    cleanedResponse = cleanedResponse.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')

    if (!cleanedResponse || cleanedResponse.length < 10) {
      throw new Error('No valid JSON in AI response')
    }

    const dynamicChoicesData = JSON.parse(cleanedResponse)

    // Validate response structure
    if (!dynamicChoicesData.choices || !Array.isArray(dynamicChoicesData.choices)) {
      throw new Error('Invalid response structure from AI')
    }

    // Add unique IDs to choices and ensure nextPageId is properly set
    const processedChoices = dynamicChoicesData.choices.map((choice: any, index: number) => ({
      ...choice,
      nextPageId: choice.nextPageId || `dynamic_${currentPage.id}_choice_${index + 1}`,
      consequences: choice.consequences || [],
      requiresItems: choice.requiresItems || [],
      probability: choice.probability || 1.0
    }))

    console.log(`✅ Generated ${processedChoices.length} dynamic choices for page ${currentPage.id}`)

    return NextResponse.json({
      success: true,
      choices: processedChoices,
      pageId: currentPage.id,
      contextConsidered: {
        inventoryItems: inventory?.length || 0,
        previousChoices: choiceHistory?.length || 0,
        gradeLevel: gradeLevel
      }
    })

  } catch (error) {
    console.error('❌ Error generating dynamic choices:', error)
    
    // Fallback dynamic choices based on basic patterns
    const fallbackChoices = [
      {
        text: "Investigate this situation more carefully using scientific observation",
        nextPageId: `dynamic_investigate_${Date.now()}`,
        consequences: ["Gain deeper understanding", "Discover new clues"],
        requiresItems: [],
        probability: 1.0
      },
      {
        text: "Try a creative experiment to test your hypothesis",
        nextPageId: `dynamic_experiment_${Date.now()}`,
        consequences: ["Learn through trial and error", "Develop problem-solving skills"],
        requiresItems: [],
        probability: 1.0
      },
      {
        text: "Collaborate with others to find a solution",
        nextPageId: `dynamic_collaborate_${Date.now()}`,
        consequences: ["Learn from different perspectives", "Build teamwork skills"],
        requiresItems: [],
        probability: 1.0
      }
    ]

    return NextResponse.json({
      success: true,
      choices: fallbackChoices,
      pageId: request.json().then((data: any) => data.currentPage?.id || 'unknown'),
      contextConsidered: {
        inventoryItems: 0,
        previousChoices: 0,
        gradeLevel: request.json().then((data: any) => data.gradeLevel || 5)
      },
      fallback: true
    })
  }
}
