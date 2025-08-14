// Enhanced image generation API with caching and background processing
import { type NextRequest, NextResponse } from "next/server"
import { GoogleAuth } from "google-auth-library"
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Supabase client (will be initialized when needed)
let supabase: any = null

function getSupabaseClient() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    } catch (error) {
      console.warn('Supabase initialization failed:', error)
      return null
    }
  }
  return supabase
}

// Google Cloud Project Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
const PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
const LOCATION = "us-central1"

// Check if Google Cloud is properly configured
function isGoogleCloudConfigured(): boolean {
  const hasValidProjectId = !!(PROJECT_ID && PROJECT_ID !== 'your-project-id' && PROJECT_ID !== 'science-nova-ai-123456')
  const hasValidPrivateKey = !!(PRIVATE_KEY && !PRIVATE_KEY.includes('your-private-key') && !PRIVATE_KEY.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC'))
  const hasValidEmail = !!(CLIENT_EMAIL && CLIENT_EMAIL !== 'your-service-account@your-project.iam.gserviceaccount.com' && CLIENT_EMAIL !== 'science-nova-ai-service@science-nova-ai-123456.iam.gserviceaccount.com')
  
  return hasValidProjectId && hasValidPrivateKey && hasValidEmail
}

// Create a hash of the prompt for caching
function createPromptHash(prompt: string, aspectRatio: string, gradeLevel?: number): string {
  return crypto.createHash('sha256')
    .update(`${prompt}|${aspectRatio}|${gradeLevel || 'any'}`)
    .digest('hex')
}

// Check cache for existing image
async function getCachedImage(promptHash: string) {
  try {
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await client
      .from('story_image_cache')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single()

    if (error || !data) return null

    // Update usage stats
    await client
      .from('story_image_cache')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: data.usage_count + 1 
      })
      .eq('id', data.id)

    console.log(`🎯 Cache hit for prompt hash: ${promptHash.substring(0, 8)}...`)
    return {
      success: true,
      type: data.image_type,
      imageUrl: data.image_data,
      fromCache: true,
      vantaEffect: data.image_type === 'gradient' ? getVantaEffectForContent(data.original_prompt) : undefined
    }
  } catch (error) {
    console.warn('Cache lookup error:', error)
    return null
  }
}

// Save image to cache
async function cacheImage(
  promptHash: string, 
  originalPrompt: string, 
  enhancedPrompt: string, 
  imageData: string, 
  imageType: string, 
  generationTime: number,
  aspectRatio: string,
  gradeLevel?: number
) {
  try {
    const client = getSupabaseClient()
    if (!client) return

    await client
      .from('story_image_cache')
      .upsert({
        prompt_hash: promptHash,
        original_prompt: originalPrompt,
        enhanced_prompt: enhancedPrompt,
        image_data: imageData,
        image_type: imageType,
        generation_time_ms: generationTime,
        aspect_ratio: aspectRatio,
        grade_level: gradeLevel,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        usage_count: 1
      })

    console.log(`💾 Cached image for prompt hash: ${promptHash.substring(0, 8)}...`)
  } catch (error) {
    console.warn('Cache save error:', error)
  }
}

// Enhanced quota management system
const failureCache = new Map<string, { count: number, lastFailure: number }>()
const MAX_FAILURES = 3 // Reset to conservative value
const FAILURE_TIMEOUT = 900000 // 15 minutes for quota exhaustion

// Global quota exhaustion tracking
let quotaExhausted = false
let quotaExhaustedUntil = 0
const QUOTA_COOLDOWN = 3600000 // 1 hour cooldown when quota is exhausted

// Reduced concurrent requests to be more conservative
let requestQueue: Promise<any> = Promise.resolve()
const MAX_CONCURRENT_REQUESTS = 1 // Very conservative to avoid quota issues
let activeRequests = 0

function checkRateLimit(prompt: string): boolean {
  // Check global quota exhaustion first
  if (quotaExhausted && Date.now() < quotaExhaustedUntil) {
    console.log(`🚫 Global quota exhausted until ${new Date(quotaExhaustedUntil).toLocaleTimeString()}`)
    return false
  } else if (quotaExhausted && Date.now() >= quotaExhaustedUntil) {
    // Reset quota exhaustion flag
    quotaExhausted = false
    quotaExhaustedUntil = 0
    console.log(`✅ Quota cooldown period ended, resuming AI generation`)
  }

  const cacheKey = prompt.substring(0, 50)
  const failure = failureCache.get(cacheKey)
  
  if (failure && failure.count >= MAX_FAILURES) {
    const timeSinceLastFailure = Date.now() - failure.lastFailure
    if (timeSinceLastFailure < FAILURE_TIMEOUT) {
      return false
    } else {
      failureCache.delete(cacheKey)
    }
  }
  
  return true
}

// Enhanced request queuing with quota awareness
async function queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const result = await new Promise<T>((resolve, reject) => {
    requestQueue = requestQueue
      .then(async () => {
        while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
          await new Promise(r => setTimeout(r, 1000)) // Reduced wait
        }
        
        activeRequests++
        
        try {
          // More reasonable delay between requests
          await new Promise(r => setTimeout(r, 1500)) // Reduced to 1.5 seconds
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

function recordFailure(prompt: string, isQuotaError: boolean = false) {
  const cacheKey = prompt.substring(0, 50)
  const existing = failureCache.get(cacheKey) || { count: 0, lastFailure: 0 }
  existing.count += 1
  existing.lastFailure = Date.now()
  failureCache.set(cacheKey, existing)
  
  // If this is a quota error, set global quota exhaustion
  if (isQuotaError) {
    quotaExhausted = true
    quotaExhaustedUntil = Date.now() + QUOTA_COOLDOWN
    console.log(`🚫 Quota exhausted globally until ${new Date(quotaExhaustedUntil).toLocaleTimeString()}`)
    
    // Clear all pending requests to avoid further quota consumption
    activeRequests = 0
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { prompt, aspectRatio = "16:9", gradeLevel, skipCache = false } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create hash for caching
    const promptHash = createPromptHash(prompt, aspectRatio, gradeLevel)

    // Check cache first (unless explicitly skipped)
    if (!skipCache) {
      const cachedResult = await getCachedImage(promptHash)
      if (cachedResult) {
        return NextResponse.json(cachedResult)
      }
    }

    // Check Google Cloud configuration
    if (!isGoogleCloudConfigured()) {
      console.warn("Google Cloud credentials not properly configured, using fallback gradients")
      const fallbackResult = {
        success: true, 
        type: "gradient",
        imageUrl: createPlaceholderImage(prompt),
        vantaEffect: getVantaEffectForContent(prompt),
        fromCache: false
      }
      
      // Cache the fallback
      await cacheImage(promptHash, prompt, prompt, fallbackResult.imageUrl, "gradient", Date.now() - startTime, aspectRatio, gradeLevel)
      
      return NextResponse.json(fallbackResult)
    }

    // Check rate limiting and quota exhaustion
    if (!checkRateLimit(prompt)) {
      const reason = quotaExhausted ? 'quota exhausted' : 'rate limited'
      console.log(`🎭 Using intelligent fallback (${reason}) for prompt: "${prompt.substring(0, 50)}..."`)
      const fallbackResult = {
        success: true, 
        type: "gradient",
        imageUrl: createPlaceholderImage(prompt),
        vantaEffect: getVantaEffectForContent(prompt),
        rateLimited: !quotaExhausted,
        quotaExhausted: quotaExhausted,
        fromCache: false,
        reason: reason
      }
      
      // Cache the fallback
      await cacheImage(promptHash, prompt, prompt, fallbackResult.imageUrl, "gradient", Date.now() - startTime, aspectRatio, gradeLevel)
      
      return NextResponse.json(fallbackResult)
    }

    try {
      console.log(`🎨 Attempting to generate AI image with Imagen 4.0 for prompt: "${prompt.substring(0, 50)}..."`)
      const imageUrl = await generateImageWithImagen(prompt, aspectRatio)
      const generationTime = Date.now() - startTime
      
      console.log(`✅ Successfully generated AI image in ${generationTime}ms`)
      
      const result = {
        success: true, 
        type: "ai-generated",
        imageUrl,
        generationTime,
        fromCache: false
      }
      
      // Cache the successful generation
      await cacheImage(promptHash, prompt, `${prompt}. Style: High-quality digital illustration...`, imageUrl, "ai-generated", generationTime, aspectRatio, gradeLevel)
      
      return NextResponse.json(result)
    } catch (error) {
      // Check if this is a quota error (expected) vs actual error (unexpected)
      const isQuotaError = error instanceof Error && 
        (error.message.includes('Quota exceeded') || 
         error.message.includes('RESOURCE_EXHAUSTED') ||
         error.message === 'QUOTA_EXHAUSTED')
      
      if (isQuotaError) {
        console.log("🎭 Quota exhausted - using intelligent themed fallback")
      } else {
        console.error("❌ Imagen API error - using fallback:", error)
      }
      
      recordFailure(prompt, isQuotaError)
      
      const fallbackResult = {
        success: true, 
        type: "gradient",
        imageUrl: createPlaceholderImage(prompt),
        vantaEffect: getVantaEffectForContent(prompt),
        error: isQuotaError ? "quota_exhausted" : (error instanceof Error ? error.message : "Unknown error"),
        quotaExhausted: isQuotaError,
        fromCache: false
      }
      
      // Cache the fallback
      await cacheImage(promptHash, prompt, prompt, fallbackResult.imageUrl, "gradient", Date.now() - startTime, aspectRatio, gradeLevel)
      
      return NextResponse.json(fallbackResult)
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
  return queueRequest(async () => {
    // Early quota check - return null to trigger fallback
    if (quotaExhausted) {
      console.log(`🎭 Quota exhausted - skipping API call for quota-aware fallback`)
      throw new Error('QUOTA_EXHAUSTED') // Special error code for quota
    }

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

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-4.0-fast-generate-preview-06-06:predict`

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
      
      if (response.status === 429) {
        const isQuotaExhausted = errorText.includes('Quota exceeded')
        if (isQuotaExhausted) {
          console.log("🎭 Quota exceeded - switching to themed fallback")
          throw new Error(`Quota exceeded for Imagen API. Will resume after cooldown period.`)
        } else {
          console.warn("⏰ Rate limit hit - using fallback")
          throw new Error(`Rate limit exceeded. Please wait before generating more images.`)
        }
      }
      
      console.warn(`⚠️ Imagen API error (${response.status}):`, response.statusText)
      throw new Error(`Imagen API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error("No image generated by Imagen API")
    }

    const imageData = result.predictions[0].bytesBase64Encoded
    if (!imageData) {
      throw new Error("No image data in Imagen API response")
    }

    return `data:image/png;base64,${imageData}`
  })
}

// Create themed gradient based on prompt content
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

  const matches = Object.entries(gradients).filter(([key]) => 
    key !== 'default' && lowerPrompt.includes(key)
  )

  if (matches.length > 0) {
    return matches[0][1]
  }

  return gradients.default
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
