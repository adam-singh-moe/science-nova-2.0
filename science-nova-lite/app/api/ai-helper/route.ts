import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: NextRequest) {
  const { tool, grade, topic, prompt } = await req.json()
  if (!tool || !grade) return NextResponse.json({ error: 'tool and grade are required' }, { status: 400 })

  // Local fallback if no key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    switch (tool) {
      case 'TEXT':
        return NextResponse.json({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}` })
      case 'FLASHCARDS':
        return NextResponse.json({ cards: [ { q: `What is ${topic}?`, a: `${topic} is ...` } ] })
      case 'QUIZ':
        return NextResponse.json({ multipleChoice: 2, trueFalse: 1, fillBlank: 1, items: [] })
      case 'CROSSWORD':
        return NextResponse.json({ words: ["SCIENCE","ATOM","CELL"] })
    }
  }

  const base = `You are an assistant generating classroom content for Grade ${grade}. Keep it accurate, concise, and age-appropriate. Topic: ${topic || 'general science'}.`
  let task = base
  if (tool === 'FLASHCARDS') {
    task += `\nProduce 3 short Q&A flashcards about the topic. Respond ONLY as compact JSON of the form: {"cards":[{"q":"...","a":"..."}, ...]}. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else if (tool === 'CROSSWORD') {
    task += `\nPick up to 10 key vocabulary words for a simple crossword. Respond ONLY as JSON: {"words":["WORD1","WORD2",...]}. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else if (tool === 'QUIZ') {
    task += `\nDraft a short mixed quiz (MCQ, True/False, Fill-in). Keep it age-appropriate. Respond ONLY as JSON: {"items":[{"type":"MCQ","question":"...","options":["A","B","C","D"],"answer":"A"},{"type":"TF","question":"...","answer":true},{"type":"FIB","question":"...","answer":"..."}]}. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  } else {
    task += `\nWrite a concise explanatory paragraph. ${prompt ? `Extra guidance: ${prompt}` : ''}`
  }

  const res = await generateText({ model: google('gemini-2.5-flash-lite-preview-06-17'), prompt: task, temperature: 0.6, maxOutputTokens: 800 })

  if (tool === 'FLASHCARDS') {
    try {
      const parsed = JSON.parse(res.text)
      if (Array.isArray(parsed?.cards)) return NextResponse.json({ cards: parsed.cards })
    } catch {}
    // naive fallback: split Q/A lines
    const lines = res.text.split('\n').map(l=>l.trim()).filter(Boolean)
    const cards: Array<{q:string;a:string}> = []
    for (let i=0; i<lines.length; i+=2) {
      const q = lines[i]?.replace(/^Q[:\-]\s*/i,'') || ''
      const a = lines[i+1]?.replace(/^A[:\-]\s*/i,'') || ''
      if (q) cards.push({ q, a })
    }
    if (cards.length) return NextResponse.json({ cards })
    return NextResponse.json({ cards: [] })
  }
  if (tool === 'CROSSWORD') {
    try {
      const parsed = JSON.parse(res.text)
      if (Array.isArray(parsed?.words)) return NextResponse.json({ words: parsed.words })
    } catch {}
    const words = res.text.match(/[A-Z]{3,}/g) || []
    return NextResponse.json({ words: Array.from(new Set(words)).slice(0,10) })
  }
  if (tool === 'QUIZ') {
    try {
      const parsed = JSON.parse(res.text)
      if (Array.isArray(parsed?.items)) return NextResponse.json({ items: parsed.items })
    } catch {}
    return NextResponse.json({ items: [] })
  }
  return NextResponse.json({ text: res.text })
}

export async function GET() { return NextResponse.json({ status: 'healthy', endpoint: 'ai-helper' }) }
