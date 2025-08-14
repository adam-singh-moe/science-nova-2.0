import { type NextRequest, NextResponse } from "next/server"

// Create themed gradient and Vanta effect based on prompt content
function createPlaceholderImage(prompt: string): string {
  const gradients = {
    space: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    ocean: "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)",
    forest: "linear-gradient(135deg, #00b894 0%, #00a085 50%, #2d3436 100%)",
    mountain: "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 50%, #6c5ce7 100%)",
    desert: "linear-gradient(135deg, #fdcb6e 0%, #fd79a8 50%, #e17055 100%)",
    arctic: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 50%, #fd79a8 100%)",
    volcano: "linear-gradient(135deg, #fd63a8 0%, #fc7303 50%, #2d3436 100%)",
    garden: "linear-gradient(135deg, #00b894 0%, #fd79a8 50%, #fdcb6e 100%)",
    laboratory: "linear-gradient(135deg, #a29bfe 0%, #74b9ff 50%, #0984e3 100%)",
    jungle: "linear-gradient(135deg, #00b894 0%, #55a3ff 50%, #fd79a8 100%)",
    cave: "linear-gradient(135deg, #636e72 0%, #2d3436 50%, #ddd 100%)",
    crystal: "linear-gradient(135deg, #a29bfe 0%, #fd79a8 50%, #fdcb6e 100%)",
    underwater: "linear-gradient(135deg, #0984e3 0%, #74b9ff 50%, #00b894 100%)",
    magical: "linear-gradient(135deg, #fd79a8 0%, #a29bfe 50%, #fdcb6e 100%)",
    cosmic: "linear-gradient(135deg, #2d3436 0%, #6c5ce7 50%, #fd79a8 100%)",
    fossil: "linear-gradient(135deg, #ddd 0%, #b2bec3 50%, #636e72 100%)",
    default: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  }

  const lowerPrompt = prompt.toLowerCase()
  let selectedGradient = gradients.default

  const matches = Object.entries(gradients).filter(([key]) => 
    key !== 'default' && lowerPrompt.includes(key)
  )

  if (matches.length > 0) {
    selectedGradient = matches[0][1]
  }

  return selectedGradient
}

// Get appropriate Vanta effect based on story content
function getVantaEffectForContent(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('space') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('stars')) {
    return 'globe'
  } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('underwater') || lowerPrompt.includes('sea') || lowerPrompt.includes('water')) {
    return 'waves'
  } else if (lowerPrompt.includes('laboratory') || lowerPrompt.includes('science') || lowerPrompt.includes('experiment') || lowerPrompt.includes('research')) {
    return 'net'
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('jungle') || lowerPrompt.includes('nature') || lowerPrompt.includes('garden')) {
    return 'cells'
  } else if (lowerPrompt.includes('cave') || lowerPrompt.includes('crystal') || lowerPrompt.includes('mineral') || lowerPrompt.includes('geology')) {
    return 'topology'
  } else if (lowerPrompt.includes('magical') || lowerPrompt.includes('fantasy') || lowerPrompt.includes('mystical') || lowerPrompt.includes('enchanted')) {
    return 'halo'
  } else if (lowerPrompt.includes('desert') || lowerPrompt.includes('sand') || lowerPrompt.includes('archaeology') || lowerPrompt.includes('dig')) {
    return 'rings'
  } else if (lowerPrompt.includes('arctic') || lowerPrompt.includes('ice') || lowerPrompt.includes('snow') || lowerPrompt.includes('frozen')) {
    return 'clouds2'
  } else if (lowerPrompt.includes('volcano') || lowerPrompt.includes('fire') || lowerPrompt.includes('lava') || lowerPrompt.includes('eruption')) {
    return 'birds'
  } else {
    return 'globe'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio = "16:9" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🎬 Vanta Image Generation - Processing prompt:", prompt.substring(0, 50) + "...")
    
    // Always use Vanta fallback (for testing)
    const fallbackGradient = createPlaceholderImage(prompt)
    const vantaEffect = getVantaEffectForContent(prompt)
    
    console.log("🌈 Generated gradient:", fallbackGradient.substring(0, 50) + "...")
    console.log("🌟 Generated Vanta effect:", vantaEffect)
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: fallbackGradient,
      fallbackGradient,
      vantaEffect,
      prompt: prompt.substring(0, 50) + "...",
      debug: {
        promptKeywords: prompt.toLowerCase().split(' ').slice(0, 5),
        selectedEffect: vantaEffect
      }
    })

  } catch (error) {
    console.error("Vanta image generation error:", error)
    return NextResponse.json(
      { error: `Failed to generate Vanta image: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
