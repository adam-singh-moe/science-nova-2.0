import { type NextRequest, NextResponse } from "next/server"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

let supabase: any = null
function getSupabaseClient() { if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) { supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) } return supabase }

function createPromptHash(prompt: string, aspectRatio: string, gradeLevel?: number) { return crypto.createHash('sha256').update(`${prompt}|${aspectRatio}|${gradeLevel || 'any'}`).digest('hex') }

async function getCachedImage(promptHash: string) {
  try {
    const client = getSupabaseClient(); if (!client) return null
    const { data } = await client.from('story_image_cache').select('*').eq('prompt_hash', promptHash).single()
    if (!data) return null
    await client.from('story_image_cache').update({ last_used_at: new Date().toISOString(), usage_count: data.usage_count + 1 }).eq('id', data.id)
    return { success: true, type: data.image_type, imageUrl: data.image_data, fromCache: true }
  } catch { return null }
}

async function cacheImage(promptHash: string, originalPrompt: string, imageData: string, imageType: string, aspectRatio: string, gradeLevel?: number) {
  try {
    const client = getSupabaseClient(); if (!client) return
    await client.from('story_image_cache').upsert({ prompt_hash: promptHash, original_prompt: originalPrompt, enhanced_prompt: originalPrompt, image_data: imageData, image_type: imageType, aspect_ratio: aspectRatio, grade_level: gradeLevel, created_at: new Date().toISOString(), last_used_at: new Date().toISOString(), usage_count: 1 })
  } catch {}
}

function createPlaceholderImage(): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)",
    "linear-gradient(135deg, #00b894 0%, #00a085 50%, #2d3436 100%)",
    "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 50%, #6c5ce7 100%)",
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

export async function POST(request: NextRequest) {
  try {
  const { prompt, aspectRatio = "16:9", gradeLevel, skipCache = false, includeDebug = false } = await request.json()
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 })

    const promptHash = createPromptHash(prompt, aspectRatio, gradeLevel)
    // Optionally serve from cache unless it's a gradient placeholder and we can try to regenerate
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
    // Hoist lastError so fallback debug can reference it without scope errors
    let lastError: any = null
    if (!skipCache) {
      const cached = await getCachedImage(promptHash)
      if (cached) {
        const isPlaceholder = cached.type === "gradient"
        // If we have a model key and the cache is only a placeholder, attempt regeneration instead of returning it.
        if (!(isPlaceholder && apiKey)) {
          return NextResponse.json(cached)
        }
      }
    }

    // 3) Vertex AI service account path (billed; recommended)
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
      const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
      const privateKey = (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n')
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
      if (projectId && clientEmail && privateKey) {
        const { JWT } = await import('google-auth-library')
        const jwt = new JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
        const { access_token } = await jwt.authorize()
        const finalPrompt = `Create an educational, age-appropriate illustration for Grade ${gradeLevel ?? 'N/A'}. Topic: ${prompt}. Requirements: clear and on-topic; no text labels; no people, injuries, or damage; focus on a neutral, classroom-safe depiction of the concept.`
        const instances = [{ prompt: finalPrompt, ...(aspectRatio ? { aspectRatio } : {}) }]
        const parameters = { sampleCount: 1 }
        const versions = ['v1', 'v1beta1']
        const models = ['imagegeneration@006', 'imagegeneration@005']
        let json: any = null
        for (const ver of versions) {
          for (const model of models) {
            try {
              const url = `https://${location}-aiplatform.googleapis.com/${ver}/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`
              const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
                body: JSON.stringify({ instances, parameters }),
              })
              if (!resp.ok) {
                try { lastError = await resp.text() } catch { lastError = { status: resp.status } }
                continue
              }
              json = await resp.json()
              let b64: string | undefined = json?.predictions?.[0]?.bytesBase64Encoded || json?.predictions?.[0]?.image
              if (!b64) {
                const cand = json?.response?.candidates?.[0]
                const parts: any[] = cand?.content?.parts || []
                const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData
                if (inline?.data) b64 = inline.data
              }
              if (b64) {
                const dataUrl = `data:image/png;base64,${b64}`
                await cacheImage(promptHash, prompt, dataUrl, 'image/png', aspectRatio, gradeLevel)
                return NextResponse.json({ success: true, type: 'image/png', imageUrl: dataUrl, fromCache: false })
              }
            } catch (e) { lastError = e }
          }
        }
      }
    } catch (e) { lastError = e }

    // Try Google Imagen 4.0 if API key is available
  if (apiKey) {
      // Build a student-friendly prompt; avoid any safety triggers (no people/harm/violence)
      const finalPrompt = `Create an educational, age-appropriate illustration for Grade ${gradeLevel ?? 'N/A'}. Topic: ${prompt}. Requirements: clear and on-topic; no text labels; no people, injuries, or damage; focus on a neutral, classroom-safe depiction of the concept.`

  // 1) Primary path: official REST endpoint (most stable across SDK versions)
      try {
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              prompt: finalPrompt,
              // Pass-through of aspect ratio when supported
              // Known allowed ratios: "1:1","3:4","4:3","9:16","16:9"
              ...(aspectRatio ? { aspectRatio } : {}),
              // Conservative safety setting
              personGeneration: "dont_allow",
            }),
          }
        )

        if (resp.ok) {
          // Response can be one of several shapes; try them in order
          const json: any = await resp.json()
          let b64: string | undefined

          // v1beta candidates shape
          const cand = json?.response?.candidates?.[0]
          const parts: any[] = cand?.content?.parts || []
          const inline = parts.find(p => p?.inlineData?.data)?.inlineData
          if (inline?.data) b64 = inline.data

          // batch shapes
          if (!b64 && Array.isArray(json?.data) && json.data[0]?.b64Json) b64 = json.data[0].b64Json
          if (!b64 && Array.isArray(json?.images) && (json.images[0]?.b64Json || json.images[0]?.data)) b64 = json.images[0].b64Json || json.images[0].data

          if (b64) {
            const dataUrl = `data:image/png;base64,${b64}`
            await cacheImage(promptHash, prompt, dataUrl, "image/png", aspectRatio, gradeLevel)
            return NextResponse.json({ success: true, type: "image/png", imageUrl: dataUrl, fromCache: false })
          }
        } else {
          try { lastError = await resp.json() } catch { lastError = { status: resp.status } }
        }
      } catch (e) { lastError = e }

      // 1b) REST fallback to Imagen 3.0
      try {
        const resp3 = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({ prompt: finalPrompt, ...(aspectRatio ? { aspectRatio } : {}), personGeneration: "dont_allow" }),
          }
        )
        if (resp3.ok) {
          const json: any = await resp3.json()
          let b64: string | undefined
          const cand = json?.response?.candidates?.[0]
          const parts: any[] = cand?.content?.parts || []
          const inline = parts.find(p => p?.inlineData?.data)?.inlineData
          if (inline?.data) b64 = inline.data
          if (!b64 && Array.isArray(json?.data) && json.data[0]?.b64Json) b64 = json.data[0].b64Json
          if (!b64 && Array.isArray(json?.images) && (json.images[0]?.b64Json || json.images[0]?.data)) b64 = json.images[0].b64Json || json.images[0].data
          if (b64) {
            const dataUrl = `data:image/png;base64,${b64}`
            await cacheImage(promptHash, prompt, dataUrl, "image/png", aspectRatio, gradeLevel)
            return NextResponse.json({ success: true, type: "image/png", imageUrl: dataUrl, fromCache: false })
          }
        }
      } catch (e) { lastError = e }

      // 2) Fallback path: SDK call (if available in the runtime)
  try {
        const mod: any = await import("@google/generative-ai")
        const genAI = new mod.GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "imagen-4.0-generate-001" })
        const result: any = await (model as any).generateImages({ prompt: finalPrompt, aspectRatio })

        let b64: string | undefined
        const cand = result?.response?.candidates?.[0]
        const parts: any[] = cand?.content?.parts || []
        const inline = parts.find(p => p?.inlineData?.data)?.inlineData
        if (inline?.data) b64 = inline.data
        if (!b64 && Array.isArray(result?.data) && result.data[0]?.b64Json) b64 = result.data[0].b64Json
        if (!b64 && Array.isArray(result?.images) && (result.images[0]?.b64Json || result.images[0]?.data)) b64 = result.images[0].b64Json || result.images[0].data

        if (b64) {
          const dataUrl = `data:image/png;base64,${b64}`
          await cacheImage(promptHash, prompt, dataUrl, "image/png", aspectRatio, gradeLevel)
          return NextResponse.json({ success: true, type: "image/png", imageUrl: dataUrl, fromCache: false })
        }
  } catch { /* continue */ }

      // 2b) SDK fallback to Imagen 3.0
      try {
        const mod: any = await import("@google/generative-ai")
        const genAI = new mod.GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" })
        const result: any = await (model as any).generateImages({ prompt: finalPrompt, aspectRatio })

        let b64: string | undefined
        const cand = result?.response?.candidates?.[0]
        const parts: any[] = cand?.content?.parts || []
        const inline = parts.find(p => p?.inlineData?.data)?.inlineData
        if (inline?.data) b64 = inline.data
        if (!b64 && Array.isArray(result?.data) && result.data[0]?.b64Json) b64 = result.data[0].b64Json
        if (!b64 && Array.isArray(result?.images) && (result.images[0]?.b64Json || result.images[0]?.data)) b64 = result.images[0].b64Json || result.images[0].data

        if (b64) {
          const dataUrl = `data:image/png;base64,${b64}`
          await cacheImage(promptHash, prompt, dataUrl, "image/png", aspectRatio, gradeLevel)
          return NextResponse.json({ success: true, type: "image/png", imageUrl: dataUrl, fromCache: false })
        }
      } catch { /* continue */ }
    }

  // 4) Hugging Face fallback (black-forest-labs/FLUX.1-dev)
    try {
      const hfToken = process.env.HF_TOKEN || process.env.HUGGING_FACE_TOKEN
      if (hfToken) {
        const { InferenceClient }: any = await import('@huggingface/inference')
        const client = new InferenceClient(hfToken)

        // Map aspect ratio to common 64-multiple sizes
        const ar = (aspectRatio || '1:1').trim()
        const sizes: Record<string, { width: number; height: number }> = {
          '16:9': { width: 1024, height: 576 },
          '9:16': { width: 576, height: 1024 },
          '4:3': { width: 1024, height: 768 },
          '3:4': { width: 768, height: 1024 },
          '1:1': { width: 1024, height: 1024 },
        }
        const size = sizes[ar] || sizes['16:9']

        const finalPrompt = `Create an educational, age-appropriate illustration for Grade ${gradeLevel ?? 'N/A'}. Topic: ${prompt}. Requirements: clear and on-topic; no text labels; no people, injuries, or damage; focus on a neutral, classroom-safe depiction of the concept.`
        const blob: Blob = await client.textToImage({
          provider: 'auto',
          model: 'black-forest-labs/FLUX.1-dev',
          inputs: finalPrompt,
          parameters: {
            num_inference_steps: 24,
            width: size.width,
            height: size.height,
          },
        }) as any

        if (blob) {
          const buf = Buffer.from(await (blob as any).arrayBuffer())
          const mime = (blob as any).type || 'image/png'
          const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
          await cacheImage(promptHash, prompt, dataUrl, 'image/png', aspectRatio, gradeLevel)
          return NextResponse.json({ success: true, type: 'image/png', imageUrl: dataUrl, fromCache: false })
        }
      }
    } catch (e) { lastError = e }

    const fallback: any = { success: true, type: "gradient", imageUrl: createPlaceholderImage(), fromCache: false, note: "placeholder: model returned no image; using gradient" }
    if (includeDebug) fallback.debug = { reason: "no_image_b64", lastError: (typeof lastError === 'object' ? lastError : String(lastError || 'unknown')) }
    await cacheImage(promptHash, prompt, fallback.imageUrl, "gradient", aspectRatio, gradeLevel)
    return NextResponse.json(fallback)
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 })
  }
}
