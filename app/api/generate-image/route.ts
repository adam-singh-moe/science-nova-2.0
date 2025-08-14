import { type NextRequest, NextResponse } from "next/server"
import { GoogleAuth } from "google-auth-library"

// Google Cloud Project Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
const PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
const LOCATION = "us-central1"

// Check if Google Cloud is properly configured
function isGoogleCloudConfigured(): boolean {
  // More comprehensive check for placeholder values
  const hasValidProjectId = !!(PROJECT_ID && PROJECT_ID !== 'your-project-id' && PROJECT_ID !== 'science-nova-ai-123456')
  const hasValidPrivateKey = !!(PRIVATE_KEY && !PRIVATE_KEY.includes('your-private-key') && !PRIVATE_KEY.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC'))
  const hasValidEmail = !!(CLIENT_EMAIL && CLIENT_EMAIL !== 'your-service-account@your-project.iam.gserviceaccount.com' && CLIENT_EMAIL !== 'science-nova-ai-service@science-nova-ai-123456.iam.gserviceaccount.com')
  
  console.log('=== Google Cloud Credential Check ===')
  console.log('- PROJECT_ID valid:', hasValidProjectId, PROJECT_ID)
  console.log('- PRIVATE_KEY valid:', hasValidPrivateKey, PRIVATE_KEY ? `${PRIVATE_KEY.substring(0, 50)}...` : 'MISSING')
  console.log('- CLIENT_EMAIL valid:', hasValidEmail, CLIENT_EMAIL)
  
  const isConfigured = hasValidProjectId && hasValidPrivateKey && hasValidEmail
  console.log('- Overall configured:', isConfigured)
  console.log('=====================================')
  
  return isConfigured
}

// Rate limiting and request queue to prevent API abuse - OPTIMIZED
const failureCache = new Map<string, { count: number, lastFailure: number }>()
const MAX_FAILURES = 5 // Increased from 3 to allow more retries
const FAILURE_TIMEOUT = 180000 // Reduced from 5 minutes to 3 minutes for faster recovery

// Simple request queue to prevent concurrent API calls - OPTIMIZED
let requestQueue: Promise<any> = Promise.resolve()
const MAX_CONCURRENT_REQUESTS = 3 // Increased from 2
let activeRequests = 0

function checkRateLimit(prompt: string): boolean {
  const cacheKey = prompt.substring(0, 50) // Use first 50 chars as key
  const failure = failureCache.get(cacheKey)
  
  if (failure && failure.count >= MAX_FAILURES) {
    const timeSinceLastFailure = Date.now() - failure.lastFailure
    if (timeSinceLastFailure < FAILURE_TIMEOUT) {
      return false // Rate limited
    } else {
      // Reset after timeout
      failureCache.delete(cacheKey)
    }
  }
  
  return true
}

// Add request to queue with REDUCED delay for better performance
async function queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  // Wait for queue and add delay between requests
  const result = await new Promise<T>((resolve, reject) => {
    requestQueue = requestQueue
      .then(async () => {
        // Check if we're at max concurrent requests
        while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
          await new Promise(r => setTimeout(r, 500)) // Reduced from 1000ms
        }
        
        activeRequests++
        
        try {
          // REDUCED delay between requests to respect rate limits but improve performance
          await new Promise(r => setTimeout(r, 800)) // Reduced from 2000ms to 800ms
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          activeRequests--
        }
      })
      .catch(reject)
  })
  
  return result
}

function recordFailure(prompt: string) {
  const cacheKey = prompt.substring(0, 50)
  const existing = failureCache.get(cacheKey) || { count: 0, lastFailure: 0 }
  existing.count += 1
  existing.lastFailure = Date.now()
  failureCache.set(cacheKey, existing)
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio = "16:9" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check Google Cloud configuration first
    if (!isGoogleCloudConfigured()) {
      console.warn("Google Cloud credentials not properly configured, using fallback gradients")
      return NextResponse.json({ 
        success: true, 
        type: "gradient",
        imageUrl: createPlaceholderImage(prompt),
        vantaEffect: getVantaEffectForContent(prompt)
      })
    }

    // Check rate limiting for this prompt
    if (!checkRateLimit(prompt)) {
      console.warn("Rate limited: Too many failures for similar prompts, using fallback")
      return NextResponse.json({ 
        success: true, 
        type: "gradient",
        imageUrl: createPlaceholderImage(prompt),
        vantaEffect: getVantaEffectForContent(prompt)
      })
    }

    try {
      console.log(`🎨 Attempting to generate AI image with Imagen 3.0 for prompt: "${prompt.substring(0, 50)}..."`)
      // Generate image using Google's Imagen 3.0
      const imageUrl = await generateImageWithImagen(prompt, aspectRatio)
      console.log(`✅ Successfully generated AI image`)
      return NextResponse.json({ 
        success: true, 
        type: "ai-generated",
        imageUrl 
      })
    } catch (error) {
      console.error("❌ Imagen API error, falling back to gradient + Vanta:", error)
      recordFailure(prompt)
      // Fallback to gradient + Vanta if Imagen fails
      const fallbackGradient = createPlaceholderImage(prompt)
      const vantaEffect = getVantaEffectForContent(prompt)
      console.log(`🎭 Using Vanta fallback: ${vantaEffect} for prompt: "${prompt.substring(0, 50)}..."`)
      return NextResponse.json({ 
        success: true, 
        type: "gradient",
        imageUrl: fallbackGradient,
        vantaEffect
      })
    }
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}

async function generateImageWithImagen(prompt: string, aspectRatio: string): Promise<string> {
  // Use queue to manage concurrent requests and rate limiting
  return queueRequest(async () => {
    // Double-check credentials before attempting authentication
    if (!isGoogleCloudConfigured()) {
      throw new Error("Google Cloud credentials not configured")
    }

    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      credentials: {
        type: "service_account",
        project_id: PROJECT_ID,
        private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
        private_key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      }
    })
    
    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    if (!accessToken.token) {
      throw new Error("Failed to get access token")
    }

  // Enhanced prompt for better storybook-style images
  const enhancedPrompt = `${prompt}. 
    Style: High-quality digital illustration, cinematic lighting, vibrant colors, 
    storybook illustration style, wide landscape format perfect for full-screen background, 
    detailed and immersive, suitable for children's educational content, 
    atmospheric depth, professional illustration quality.
    Avoid any text, letters, or words in the image.`

  const requestBody = {
    instances: [
      {
        prompt: enhancedPrompt,
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio,
      safetyFilterLevel: "block_some",
      personGeneration: "allow_adult",
    },
  }

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-4.0-generate-preview-06-06:predict`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Imagen API error details:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    })
    
    // If rate limited, provide a more specific error message
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Please wait before generating more images.`)
    }
    
    throw new Error(`Imagen API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  
  if (!result.predictions || result.predictions.length === 0) {
    throw new Error("No image generated by Imagen API")
  }

  // Extract base64 image data
  const imageData = result.predictions[0].bytesBase64Encoded
  if (!imageData) {
    throw new Error("No image data in Imagen API response")
  }

  // Return as data URL
  return `data:image/png;base64,${imageData}`
  }) // Close queueRequest
}

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

  // Determine gradient based on prompt keywords
  let selectedGradient = gradients.default
  const lowerPrompt = prompt.toLowerCase()

  // Check for multiple keywords and choose the most specific match
  const matches = Object.entries(gradients).filter(([key]) => 
    key !== 'default' && lowerPrompt.includes(key)
  )

  if (matches.length > 0) {
    // Use the first match found
    selectedGradient = matches[0][1]
  }

  return selectedGradient
}

// Get appropriate Vanta effect based on story content
function getVantaEffectForContent(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  // Map content themes to Vanta effects
  if (lowerPrompt.includes('space') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('stars')) {
    return 'globe' // Cosmic globe effect
  } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('underwater') || lowerPrompt.includes('sea') || lowerPrompt.includes('water')) {
    return 'waves' // Ocean waves
  } else if (lowerPrompt.includes('laboratory') || lowerPrompt.includes('science') || lowerPrompt.includes('experiment') || lowerPrompt.includes('research')) {
    return 'net' // Scientific network connections
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('jungle') || lowerPrompt.includes('nature') || lowerPrompt.includes('garden')) {
    return 'cells' // Organic cell-like structures
  } else if (lowerPrompt.includes('cave') || lowerPrompt.includes('crystal') || lowerPrompt.includes('mineral') || lowerPrompt.includes('geology')) {
    return 'topology' // Geological formations
  } else if (lowerPrompt.includes('magical') || lowerPrompt.includes('fantasy') || lowerPrompt.includes('mystical') || lowerPrompt.includes('enchanted')) {
    return 'halo' // Magical halo effect
  } else if (lowerPrompt.includes('desert') || lowerPrompt.includes('sand') || lowerPrompt.includes('archaeology') || lowerPrompt.includes('dig')) {
    return 'rings' // Archaeological layers/rings
  } else if (lowerPrompt.includes('arctic') || lowerPrompt.includes('ice') || lowerPrompt.includes('snow') || lowerPrompt.includes('frozen')) {
    return 'clouds2' // Cloudy/snowy atmosphere
  } else if (lowerPrompt.includes('volcano') || lowerPrompt.includes('fire') || lowerPrompt.includes('lava') || lowerPrompt.includes('eruption')) {
    return 'birds' // Dynamic flying elements (like sparks/embers)
  } else {
    return 'globe' // Default cosmic effect
  }
}