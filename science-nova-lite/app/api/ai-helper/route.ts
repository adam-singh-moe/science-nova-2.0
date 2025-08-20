import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google, createGoogleGenerativeAI } from "@ai-sdk/google"

export const runtime = 'nodejs'

// Use a dedicated API key for AI Helper when provided; do NOT mutate global env to avoid affecting image route
const AI_HELPER_GOOGLE_KEY = process.env.AI_HELPER_GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
const aiHelperGoogle = createGoogleGenerativeAI({ apiKey: AI_HELPER_GOOGLE_KEY })
const AI_HELPER_FORCE_API_KEY = String(process.env.AI_HELPER_FORCE_API_KEY || '').toLowerCase() === 'true' || process.env.AI_HELPER_FORCE_API_KEY === '1'

export async function POST(req: NextRequest) {
  // Debug toggle (query ?debug=1 or header x-debug-ai: 1)
  const debugEnabled = (() => {
    try { return req.nextUrl.searchParams.get('debug') === '1' || req.headers.get('x-debug-ai') === '1' } catch { return false }
  })()
  let usedPath: 'vertex' | 'api-key' | 'offline' | '' = ''
  const makeRes = (obj: any) => {
    const payload = debugEnabled ? { ...obj, _debug: { path: usedPath || 'unknown' } } : obj
    const r = NextResponse.json(payload)
    r.headers.set('Cache-Control','no-store')
    r.headers.set('Vary','Authorization')
    return r
  }
  // Safe body parse
  let body: any = {}
  try { body = await req.json() } catch {}
  const { tool, grade, topic, prompt, limit, difficulty } = body || {}
  if (!tool || !grade) {
    const res = NextResponse.json({ error: 'tool and grade are required' }, { status: 400 })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Vary', 'Authorization')
    return res
  }

  const offline = () => {
    usedPath = 'offline'
    // Local fallback if key is missing or the upstream call fails
    switch (tool) {
      case 'TEXT':
        return makeRes({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}` })
      case 'FLASHCARDS':
        return makeRes({ cards: [ { q: `What is ${topic}?`, a: `${topic} is ...` } ] })
      case 'QUIZ':
        return makeRes({ multipleChoice: 2, trueFalse: 1, fillBlank: 1, items: [] })
      case 'CROSSWORD': {
        // Offline fallback: produce definition-like, topic-related hints (generic but non-letter-based)
        const words = ["SCIENCE","ATOM","CELL","DATA","GRAPH"]
          .filter((_, i) => i < Math.max(3, Math.min(10, Number(limit) || 6)))
        const topicText = String(topic || 'the lesson').toLowerCase()
        const patterns = [
          (w: string)=> `A key ${topicText} term describing a fundamental idea or thing` ,
          (w: string)=> `A concept in ${topicText} students should know` ,
          (w: string)=> `An important definition in ${topicText}` ,
          (w: string)=> `A common ${topicText} term used in class discussions` ,
          (w: string)=> `A basic ${topicText} idea explained in the lesson` ,
        ]
        const items = words.map((w, i) => ({ answer: w, clue: patterns[i % patterns.length](w) }))
  return makeRes({ items })
      }
      default:
  return makeRes({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}` })
    }
  }

  // We'll try Vertex (service account) first — same creds as image route; then Google API key; then offline

  const base = `You are an assistant generating classroom content for Grade ${grade}. Keep it accurate, concise, and age-appropriate. Topic: ${topic || 'general science'}.`
  let task = base
  if (tool === 'FLASHCARDS') {
    task += `\nProduce 3 short Q&A flashcards about the topic. Respond ONLY as compact JSON of the form: {"cards":[{"q":"...","a":"..."}, ...]}. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else if (tool === 'CROSSWORD') {
    const n = Math.max(4, Math.min(12, Number(limit) || 8))
    task += `\nSelect ${n} high-value vocabulary words for this topic and grade.
For EACH word, write ONE short, student-friendly definition that describes what the word is or means in the context of the topic.
Rules: Do NOT include the word itself or its direct forms; no letter-count or pattern hints; use only meaningful definitions tied to the lesson.
Respond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"definition-styled sentence"}, ...]}.
Constraints: answers UPPERCASE letters A–Z only, 3–10 letters; each clue must be unique and clearly related to the topic.
${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else if (tool === 'QUIZ') {
    task += `\nDraft a short mixed quiz (MCQ, True/False, Fill-in). Keep it age-appropriate. Respond ONLY as JSON: {"items":[{"type":"MCQ","question":"...","options":["A","B","C","D"],"answer":"A"},{"type":"TF","question":"...","answer":true},{"type":"FIB","question":"...","answer":"..."}]}. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else {
    task += `\nWrite a concise explanatory paragraph. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  }

  let resText = ''
  // 1) Vertex Generative via service account (preferred), unless forced to use API key
  try {
  if (!AI_HELPER_FORCE_API_KEY) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
  const privateKey = (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    if (projectId && clientEmail && privateKey) {
      const { JWT } = await import('google-auth-library')
      const jwt = new JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
      const { access_token } = await jwt.authorize()
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash-001:generateContent`
      const body = {
        contents: [{ role: 'user', parts: [{ text: task }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 800 }
      }
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` }, body: JSON.stringify(body) })
      if (resp.ok) {
        const j: any = await resp.json()
        const cand = j?.candidates?.[0]
        const parts: any[] = cand?.content?.parts || []
        const textJoined = parts.map((p:any)=> p?.text || '').join('')
        if (textJoined?.trim()) resText = textJoined.trim()
        if (resText) usedPath = 'vertex'
      }
    }
  }
  } catch {}
  // 2) Google API key path via AI SDK (using AI_HELPER_GOOGLE_API_KEY if set) if Vertex text not used
  if (!resText && AI_HELPER_GOOGLE_KEY) {
    try {
      const r = await generateText({ model: aiHelperGoogle('gemini-2.5-flash-lite-preview-06-17'), prompt: task, temperature: 0.6, maxOutputTokens: 800 })
      resText = r.text || ''
      if (resText) usedPath = 'api-key'
    } catch {}
  }
  // 3) If still empty, return offline fallback
  if (!resText) return offline()

  if (tool === 'FLASHCARDS') {
    try {
      const parsed = JSON.parse(resText)
  if (Array.isArray(parsed?.cards)) return makeRes({ cards: parsed.cards })
    } catch {}
    // naive fallback: split Q/A lines
    const lines = resText.split('\n').map(l=>l.trim()).filter(Boolean)
    const cards: Array<{q:string;a:string}> = []
    for (let i=0; i<lines.length; i+=2) {
      const q = lines[i]?.replace(/^Q[:\-]\s*/i,'') || ''
      const a = lines[i+1]?.replace(/^A[:\-]\s*/i,'') || ''
      if (q) cards.push({ q, a })
    }
  if (cards.length) return makeRes({ cards })
  return makeRes({ cards: [] })
  }
  if (tool === 'CROSSWORD') {
    // helpers for resilient JSON parsing
    const stripFences = (s: string) => s
      .replace(/```[a-zA-Z]*\n?/g, '')
      .replace(/```/g, '')
      .replace(/^json\s*\n?/i, '')
    const tryParse = (raw: string): any | null => {
      const s = stripFences(raw).trim()
      try { return JSON.parse(s) } catch {}
      const mArr = s.match(/\[[\s\S]*\]/)
      if (mArr) { try { return JSON.parse(mArr[0]) } catch {} }
      const mObj = s.match(/\{[\s\S]*\}/)
      if (mObj) { try { return JSON.parse(mObj[0]) } catch {} }
      return null
    }
    try {
  const parsed = tryParse(resText)
      if (Array.isArray(parsed?.items)) {
        // Enforce per-word definition, uniqueness, and specificity
        let items: Array<{answer:string; clue:string}> = (parsed.items as any[])
          .map((it:any)=> ({ answer: String(it.answer||'').toUpperCase().replace(/[^A-Z]/g,''), clue: String(it.clue||'').trim() }))
          .filter((it: {answer:string; clue:string})=> it.answer.length>=3 && it.answer.length<=10 && !!it.clue)

        // Deduplicate clues (case-insensitive)
        const seen = new Set<string>()
        items = items.map((it)=>{
          const key = it.clue.toLowerCase()
          if (!seen.has(key)) { seen.add(key); return it }
          return { ...it, clue: '' } // mark for regeneration
        })

        // Regenerate any empty or generic clues via a small, targeted prompt
        const genericRe = /(important .* term|concept .* lesson|topic|key .* term|definition in)/i
        const needFix = items.filter(it=> !it.clue || genericRe.test(it.clue))
        if (needFix.length) {
          // Try a batch regeneration first
          try {
            const ask = needFix.map(it=> it.answer).join(', ')
            const fixPrompt = `Topic: ${topic || 'science'}. Write one short, student-friendly definition for EACH of these words, without using the word itself. Output JSON {"items":[{"answer":"UPPERCASE","clue":"definition"}, ...]} using the same order. Words: ${ask}`
            const defs = await generateText({ model: aiHelperGoogle('gemini-2.5-flash-lite-preview-06-17'), prompt: fixPrompt, temperature: 0.5, maxOutputTokens: 400 })
            const pj = tryParse(defs.text)
            if (Array.isArray(pj?.items)) {
              let idx = 0
              items = items.map(it=>{
                if (!it.clue || genericRe.test(it.clue)) {
                  const repl = pj.items[idx++]?.clue
                  return { ...it, clue: String(repl||'').trim() || it.clue }
                }
                return it
              })
            }
          } catch {}
          // Per-word fixes for any remaining
          for (let i=0; i<items.length; i++) {
            if (!items[i].clue || genericRe.test(items[i].clue)) {
              try {
                const single = await generateText({ model: aiHelperGoogle('gemini-2.5-flash-lite-preview-06-17'), prompt: `Topic: ${topic || 'science'}. Write ONE short, student-friendly definition for the word (without using the word itself): ${items[i].answer}. 12 words max.`, temperature: 0.4, maxOutputTokens: 60 })
                const text = stripFences(single.text).trim()
                if (text) items[i] = { ...items[i], clue: text }
              } catch {}
            }
          }
        }
  return makeRes({ items })
      }
      if (Array.isArray(parsed?.words)) {
        // Secondary step: ask for definition-style clues for the given words
        const words = (parsed.words as string[]).map(w=> String(w || '').toUpperCase().replace(/[^A-Z]/g,''))
        const defPrompt = `Topic: ${topic || 'science'}; Grade: ${grade}. For each of these words, write ONE short, student-friendly definition as a clue that describes what the word is or means in this topic. Do NOT include the word itself. Respond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"definition"}, ...]} using the same order. Words: ${words.join(', ')}`
  const defs = await generateText({ model: aiHelperGoogle('gemini-2.5-flash-lite-preview-06-17'), prompt: defPrompt, temperature: 0.5, maxOutputTokens: 600 })
        try {
          const pj = tryParse(defs.text)
          if (Array.isArray(pj?.items)) {
            let items: Array<{answer:string; clue:string}> = (pj.items as any[])
              .map((it:any)=> ({ answer: String(it.answer||'').toUpperCase().replace(/[^A-Z]/g,''), clue: String(it.clue||'').trim() }))
              .filter((it: {answer:string; clue:string})=> it.answer.length>=3 && it.answer.length<=10 && !!it.clue)
            // de-dup and generic filter
            const seen = new Set<string>()
            items = items.map((it)=>{ const k=it.clue.toLowerCase(); if(seen.has(k)) return { ...it, clue: '' }; seen.add(k); return it })
            return makeRes({ items })
          }
        } catch {}
        // Fallback: emit generic definition-like clues if parsing failed
        const topicText = String(topic || 'the lesson').toLowerCase()
        const items = words.map(w => ({ answer: w, clue: `A key ${topicText} term defined in the lesson` }))
  return makeRes({ items })
      }
    } catch {}
    // Last resort: extract uppercase tokens as words and request definitions
  const words = Array.from(new Set(resText.match(/[A-Z]{3,}/g) || [])).slice(0, Math.max(4, Math.min(12, Number(limit) || 8)))
    if (words.length) {
      const defPrompt = `Topic: ${topic || 'science'}; Grade: ${grade}. For each of these words, write ONE short, student-friendly definition as a clue that describes what the word is or means in this topic. Do NOT include the word itself. Respond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"definition"}, ...]} using the same order. Words: ${words.join(', ')}`
  const defs = await generateText({ model: aiHelperGoogle('gemini-2.5-flash-lite-preview-06-17'), prompt: defPrompt, temperature: 0.5, maxOutputTokens: 600 })
      try {
        const pj = tryParse(defs.text)
        if (Array.isArray(pj?.items)) {
          let items: Array<{answer:string; clue:string}> = (pj.items as any[])
            .map((it:any)=> ({ answer: String(it.answer||'').toUpperCase().replace(/[^A-Z]/g,''), clue: String(it.clue||'').trim() }))
            .filter((it: {answer:string; clue:string})=> it.answer.length>=3 && it.answer.length<=10 && !!it.clue)
          const seen = new Set<string>()
          items = items.map((it)=>{ const k=it.clue.toLowerCase(); if(seen.has(k)) return { ...it, clue: '' }; seen.add(k); return it })
          return NextResponse.json({ items })
        }
      } catch {}
    }
    // Final fallback: generic (may repeat)
    const topicText = String(topic || 'the lesson').toLowerCase()
    const items = (words.length? words: ["SCIENCE","SYSTEM","ENERGY"]).map(w => ({ answer: w, clue: `An important ${topicText} concept or term from the lesson` }))
    return makeRes({ items })
  }
  if (tool === 'QUIZ') {
    try {
      const parsed = JSON.parse(resText)
      if (Array.isArray(parsed?.items)) return makeRes({ items: parsed.items })
    } catch {}
    return makeRes({ items: [] })
  }
  return makeRes({ text: resText })
}

export async function GET() { const r = NextResponse.json({ status: 'healthy', endpoint: 'ai-helper' }); r.headers.set('Cache-Control','no-store'); r.headers.set('Vary','Authorization'); return r }
