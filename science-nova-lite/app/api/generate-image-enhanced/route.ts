import { type NextRequest, NextResponse } from "next/server"
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
    const { prompt, aspectRatio = "16:9", gradeLevel, skipCache = false } = await request.json()
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 })

    const promptHash = createPromptHash(prompt, aspectRatio, gradeLevel)
    if (!skipCache) { const cached = await getCachedImage(promptHash); if (cached) return NextResponse.json(cached) }

    const fallback = { success: true, type: "gradient", imageUrl: createPlaceholderImage(), fromCache: false }
    await cacheImage(promptHash, prompt, fallback.imageUrl, "gradient", aspectRatio, gradeLevel)
    return NextResponse.json(fallback)
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 })
  }
}
