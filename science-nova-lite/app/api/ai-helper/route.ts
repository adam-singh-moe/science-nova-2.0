import { NextRequest, NextResponse } from "next/server"
import { getAI } from '@/lib/simple-ai'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Debug toggle (query ?debug=1 or header x-debug-ai: 1)
  const debugEnabled = (() => {
    try { return req.nextUrl.searchParams.get('debug') === '1' || req.headers.get('x-debug-ai') === '1' } catch { return false }
  })()
  
  let usedPath: 'ai' | 'offline' = 'offline'
  const makeRes = (obj: any) => {
    const payload = debugEnabled ? { ...obj, _debug: { path: usedPath } } : obj
    const r = NextResponse.json(payload)
    r.headers.set('Cache-Control','no-store')
    r.headers.set('Vary','Authorization')
    return r
  }
  
  // Safe body parse
  let body: any = {}
  try { body = await req.json() } catch {}
  const { tool, grade, topic, topicId, prompt, limit, difficulty, minWords, maxWords } = body || {}
  
  if (!tool || !grade) {
    const res = NextResponse.json({ error: 'tool and grade are required' }, { status: 400 })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Vary', 'Authorization')
    return res
  }

  const offline = () => {
    usedPath = 'offline'
    // Local fallback if AI fails
    switch (tool) {
      case 'TEXT':
        return makeRes({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}` })
      case 'FLASHCARDS':
        return makeRes({ cards: [ { q: `What is ${topic}?`, a: `${topic} is an important concept in science.` } ] })
      case 'QUIZ':
        return makeRes({ multipleChoice: 2, trueFalse: 1, fillBlank: 1, items: [
          {
            type: "MCQ",
            question: `Which of the following is related to ${topic || 'science'}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: "A"
          },
          {
            type: "TF",
            question: `${topic || 'Science'} is an important subject to learn.`,
            answer: true
          }
        ] })
      case 'CROSSWORD': {
        // Offline fallback: produce definition-like, topic-related hints
        const words = ["SCIENCE","ATOM","CELL","DATA","GRAPH"]
          .filter((_, i) => i < Math.max(3, Math.min(10, Number(limit) || 6)))
        const topicText = String(topic || 'the lesson').toLowerCase()
        const items = words.map((w, i) => ({ 
          answer: w, 
          clue: `A key ${topicText} term that students learn about`
        }))
        return makeRes({ items })
      }
      default:
        return makeRes({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}` })
    }
  }

  // Initialize AI
  const ai = getAI()
  console.log(`🤖 AI Helper - Tool: ${tool}, Grade: ${grade}, Topic: ${topic}`)
  console.log(`📊 AI Status:`, ai.getStatus())

  // Fetch admin prompt if topicId is provided
  let adminPrompt = ''
  if (topicId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: topicData, error } = await supabase
        .from('topics')
        .select('admin_prompt')
        .eq('id', topicId)
        .single()
      
      if (!error && topicData?.admin_prompt) {
        adminPrompt = topicData.admin_prompt.trim()
        console.log(`📝 Found admin prompt for topic ${topicId}: "${adminPrompt}"`)
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch admin prompt:', err)
    }
  }

  // Create base prompt with proper content prioritization
  const contentFocus = prompt && prompt.trim() ? prompt.trim() : `the lesson titled "${topic || 'general science'}"`
  const base = `You are an assistant generating classroom content for Grade ${grade}. Keep it accurate, concise, and age-appropriate.`
  
  // Include admin prompt if available
  const adminContext = adminPrompt ? `\n\nIMPORTANT GUIDANCE: ${adminPrompt}` : ''
  
  let task = base + adminContext
  
  if (tool === 'FLASHCARDS') {
    task += `\nCreate 3-5 short Q&A flashcards specifically about: ${contentFocus}. 
Focus primarily on the content described above, within the broader educational context of ${topic || 'general science'}.
Respond ONLY as compact JSON of the form: {"cards":[{"q":"...","a":"..."}, ...]}`
  } else if (tool === 'CROSSWORD') {
    const n = Math.max(4, Math.min(15, Number(limit) || 8))
    task += `\nSelect ${n} high-value vocabulary words specifically related to: ${contentFocus}.
Choose words that are most relevant to the described content, within the broader topic area of ${topic || 'general science'}.
For EACH word, write ONE short, student-friendly definition that describes what the word is or means in this specific context.
Rules: Do NOT include the word itself or its direct forms; no letter-count or pattern hints; use only meaningful definitions tied to the content.
Respond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"definition-styled sentence"}, ...]}.
Constraints: answers UPPERCASE letters A–Z only, 3–10 letters; each clue must be unique and clearly related to the described content.`
  } else if (tool === 'QUIZ') {
    task += `\nCreate a short mixed quiz (Multiple Choice, True/False, Fill-in-the-blank) specifically about: ${contentFocus}.
Focus the questions on the described content, within the educational context of ${topic || 'general science'}. Keep it age-appropriate.
Respond ONLY as JSON: {"items":[{"type":"MCQ","question":"...","options":["A","B","C","D"],"answer":"A"},{"type":"TF","question":"...","answer":true},{"type":"FIB","question":"...","answer":"..."}]}.`
  } else {
    const minW = Number.isFinite(Number(minWords)) ? Number(minWords) : undefined
    const maxW = Number.isFinite(Number(maxWords)) ? Number(maxWords) : undefined
    const range = minW && maxW ? `Aim for ${minW}-${maxW} words.` : minW ? `At least ${minW} words.` : maxW ? `No more than ${maxW} words.` : ''
    task += `\nWrite a concise explanatory paragraph specifically about: ${contentFocus}.
Focus on the described content, within the broader educational topic of ${topic || 'general science'}. ${range}`
  }

  let resText = ''
  
  // Try AI generation
  try {
    console.log(`🔄 Generating content for ${tool}...`)
    const aiResponse = await ai.generateText(task, {
      maxTokens: 800,
      temperature: 0.6
    })
    
    resText = aiResponse
    usedPath = 'ai'
    console.log(`✅ AI generation successful, response length: ${resText.length}`)
  } catch (aiError) {
    console.error("🚨 AI generation error:", aiError)
    console.log(`🔄 Using fallback for ${tool}`)
    return offline()
  }

  // If still empty, return offline fallback
  if (!resText) return offline()

  // Process responses based on tool type
  if (tool === 'FLASHCARDS') {
    try {
      const parsed = JSON.parse(resText)
      if (Array.isArray(parsed?.cards)) return makeRes({ cards: parsed.cards })
    } catch {}
    
    // Fallback parsing: split Q/A lines
    const lines = resText.split('\n').map(l=>l.trim()).filter(Boolean)
    const cards: Array<{q:string;a:string}> = []
    
    for (let i=0; i<lines.length; i+=2) {
      const q = lines[i]?.replace(/^Q[:\-\d\.\)]\s*/i,'') || ''
      const a = lines[i+1]?.replace(/^A[:\-\d\.\)]\s*/i,'') || ''
      if (q && a) cards.push({ q, a })
    }
    
    if (cards.length) return makeRes({ cards })
    return makeRes({ cards: [{ q: `What is ${topic}?`, a: `${topic} is an important concept in science.` }] })
  }
  
  if (tool === 'CROSSWORD') {
    try {
      const parsed = JSON.parse(resText)
      if (Array.isArray(parsed?.items)) {
        // Clean and validate items
        let items: Array<{answer:string; clue:string}> = (parsed.items as any[])
          .map((it:any)=> ({ 
            answer: String(it.answer||'').toUpperCase().replace(/[^A-Z]/g,''), 
            clue: String(it.clue||'').trim() 
          }))
          .filter((it: {answer:string; clue:string})=> 
            it.answer.length>=3 && it.answer.length<=10 && !!it.clue
          )

        // Remove duplicates
        const seen = new Set<string>()
        items = items.filter(it => {
          const key = it.answer + '|' + it.clue.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        return makeRes({ items: items.slice(0, Number(limit) || 8) })
      }
    } catch {}
    
    // Fallback: generate basic crossword items
    const fallbackWords = ["SCIENCE", "STUDY", "LEARN", "FACTS", "DATA"]
    const items = fallbackWords.slice(0, Number(limit) || 5).map(word => ({
      answer: word,
      clue: `Important concept related to ${topic || 'science'}`
    }))
    return makeRes({ items })
  }
  
  if (tool === 'QUIZ') {
    try {
      const parsed = JSON.parse(resText)
      if (Array.isArray(parsed?.items)) return makeRes({ items: parsed.items })
    } catch {}
    
    // Fallback: create basic quiz items
    const items = [
      {
        type: "MCQ",
        question: `Which of the following is most related to ${topic || 'science'}?`,
        options: ["Concept A", "Concept B", "Concept C", "Concept D"],
        answer: "A"
      },
      {
        type: "TF",
        question: `${topic || 'Science'} is an important subject for Grade ${grade} students.`,
        answer: true
      }
    ]
    return makeRes({ items })
  }
  
  // For TEXT tool, return the generated text
  return makeRes({ text: resText })
}

export async function GET() { 
  const r = NextResponse.json({ status: 'healthy', endpoint: 'ai-helper' })
  r.headers.set('Cache-Control','no-store')
  r.headers.set('Vary','Authorization')
  return r 
}
