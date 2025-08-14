import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { storyTitle, storyContent } = await req.json()

    if (!storyTitle || !storyContent) {
      return NextResponse.json(
        { error: 'Story title and content are required' },
        { status: 400 }
      )
    }

    // AI prompt for soundscape generation
    const systemPrompt = `You are an expert audio designer and nature sound specialist. Your task is to analyze story content and create a brief, poetic description of an appropriate ambient soundscape that would enhance the reading experience.

Guidelines:
- Create atmospheric, natural soundscapes that complement the story mood
- Focus on gentle, non-intrusive background ambiences
- Use nature-based sounds (wind, water, birds, etc.) when possible
- Avoid harsh or distracting elements
- Keep descriptions concise (1-2 sentences)
- Consider the emotional tone and setting of the story

Examples:
- "gentle ocean waves with distant seagulls and soft coastal breeze"
- "peaceful forest with rustling leaves and distant bird songs"
- "soft mountain wind with echoing natural acoustics"
- "gentle rain with soft thunder in the distance"
- "ethereal cosmic ambience with subtle stellar harmonics"`

    const userPrompt = `Story Title: "${storyTitle}"

Story Content: "${storyContent.substring(0, 800)}"

Based on this story, create an appropriate ambient soundscape description that would enhance the reading experience. Focus on natural, gentle sounds that complement the story's mood and setting.`

    // For now, let's use a simple content analysis approach
    // In a real implementation, you would call an AI API like OpenAI here
    const soundscape = generateSoundscapeFromContent(storyTitle, storyContent)

    return NextResponse.json({
      success: true,
      soundscape: soundscape,
      method: 'content_analysis' // Indicates this was generated locally
    })

  } catch (error) {
    console.error('Error generating soundscape:', error)
    return NextResponse.json(
      { error: 'Failed to generate soundscape' },
      { status: 500 }
    )
  }
}

// Local content analysis for soundscape generation
function generateSoundscapeFromContent(storyTitle: string, storyContent: string): string {
  const content = `${storyTitle} ${storyContent}`.toLowerCase()
  
  // Advanced pattern matching for more nuanced soundscapes
  const patterns = [
    {
      keywords: ['ocean', 'sea', 'wave', 'beach', 'shore', 'tide', 'coastal', 'maritime'],
      soundscape: 'gentle ocean waves with soft seagull calls and distant coastal breeze'
    },
    {
      keywords: ['forest', 'tree', 'wood', 'jungle', 'canopy', 'leaf', 'branch'],
      soundscape: 'peaceful forest ambience with rustling leaves and distant songbird melodies'
    },
    {
      keywords: ['space', 'star', 'planet', 'cosmic', 'galaxy', 'universe', 'astronaut', 'rocket'],
      soundscape: 'ethereal cosmic atmosphere with subtle stellar harmonics and gentle celestial tones'
    },
    {
      keywords: ['mountain', 'peak', 'cliff', 'altitude', 'highland', 'summit'],
      soundscape: 'crisp mountain air with gentle wind and echoing natural acoustics'
    },
    {
      keywords: ['cave', 'underground', 'cavern', 'deep', 'tunnel', 'crystal'],
      soundscape: 'mysterious cave ambience with gentle water drops and subtle echo'
    },
    {
      keywords: ['rain', 'storm', 'thunder', 'cloud', 'weather', 'precipitation'],
      soundscape: 'gentle rainfall with soft distant thunder and atmospheric moisture'
    },
    {
      keywords: ['garden', 'flower', 'bloom', 'meadow', 'field', 'grass'],
      soundscape: 'serene garden ambience with soft breeze and gentle insect hum'
    },
    {
      keywords: ['river', 'stream', 'water', 'flow', 'creek', 'babbling'],
      soundscape: 'gentle flowing water with soft ripples and peaceful nature sounds'
    },
    {
      keywords: ['desert', 'sand', 'dune', 'arid', 'dry', 'wasteland'],
      soundscape: 'subtle desert wind with distant atmospheric tones'
    },
    {
      keywords: ['adventure', 'journey', 'explore', 'quest', 'discovery'],
      soundscape: 'inspiring ambient tones with gentle wind and sense of wonder'
    },
    {
      keywords: ['mystery', 'secret', 'hidden', 'unknown', 'enigma'],
      soundscape: 'mysterious ambient atmosphere with subtle harmonic undertones'
    },
    {
      keywords: ['peaceful', 'calm', 'serene', 'tranquil', 'quiet'],
      soundscape: 'gentle nature ambience with soft wind and peaceful atmospheric tones'
    },
    {
      keywords: ['magic', 'magical', 'enchanted', 'fairy', 'wizard', 'spell'],
      soundscape: 'enchanted forest ambience with soft mystical tones and gentle sparkles'
    },
    {
      keywords: ['laboratory', 'science', 'experiment', 'research', 'study'],
      soundscape: 'clean ambient atmosphere with subtle harmonic resonance'
    },
    {
      keywords: ['city', 'urban', 'street', 'building', 'metropolitan'],
      soundscape: 'distant urban ambience with soft atmospheric hum'
    }
  ]

  // Find the best matching pattern
  let bestMatch = { score: 0, soundscape: 'peaceful nature ambience with soft wind and gentle harmonic tones' }

  for (const pattern of patterns) {
    let score = 0
    for (const keyword of pattern.keywords) {
      if (content.includes(keyword)) {
        score++
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { score, soundscape: pattern.soundscape }
    }
  }

  return bestMatch.soundscape
}
