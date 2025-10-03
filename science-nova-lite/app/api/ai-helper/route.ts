import { NextRequest, NextResponse } from "next/server"
import { getAI } from '@/lib/simple-ai'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding, cosineSimilarity } from '@/lib/openai-embeddings'

export const runtime = 'nodejs'

async function searchTextbookContent(query: string, gradeLevel: number, limit: number = 5) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log(`🔍 AI Helper: Searching textbooks for grade ${gradeLevel}, query: "${query}"`)

    // Generate embedding for the search query
    let queryEmbedding: number[] | null = null
    try {
      queryEmbedding = await generateEmbedding(query)
    } catch (embeddingError) {
      console.warn('⚠️ AI Helper: Failed to generate query embedding, using text search fallback')
    }

    // Search for textbook embeddings
    const { data: embeddings, error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, file_name, embedding')
      .eq('grade_level', gradeLevel)
      .limit(limit * 2) // Get more to allow for similarity filtering

    if (error) {
      console.error('❌ AI Helper: Error fetching textbook embeddings:', error)
      return []
    }

    let results = embeddings || []

    // If we have query embedding and textbook embeddings, calculate similarities
    if (queryEmbedding && results.length > 0) {
      const scoredResults = results
        .filter(item => item.embedding && Array.isArray(item.embedding))
        .map(item => {
          try {
            const similarity = cosineSimilarity(queryEmbedding!, item.embedding)
            return { ...item, similarity }
          } catch {
            return { ...item, similarity: 0 }
          }
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      console.log(`🎯 AI Helper: Top textbook matches with similarities: ${scoredResults.slice(0, 3).map(r => r.similarity?.toFixed(3)).join(', ')}`)
      results = scoredResults
    } else {
      // Fallback: basic text filtering
      const queryLower = query.toLowerCase()
      results = results
        .map(item => ({
          ...item,
          relevance: (item.content?.toLowerCase().includes(queryLower) ? 2 : 0) +
                    (item.metadata?.title?.toLowerCase().includes(queryLower) ? 1 : 0)
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit)
    }

    // Clean up results (remove embedding data)
    return results.map(({ embedding, ...rest }) => rest)

  } catch (error) {
    console.error('❌ AI Helper: Error in textbook search:', error)
    return []
  }
}

function analyzeExistingContent(existingContent: any[]): string {
  if (!existingContent || !Array.isArray(existingContent) || existingContent.length === 0) {
    return "No existing content to analyze."
  }

  const contentSummary: string[] = []
  const topics = new Set<string>()
  const concepts = new Set<string>()

  existingContent.forEach((item, index) => {
    let itemDescription = `Item ${index + 1}: `
    
    if (item.kind) {
      itemDescription += `${item.kind.toLowerCase()} block`
      
      // Analyze content based on type
      if (item.kind === 'TEXT' && item.data?.text) {
        const text = item.data.text.toLowerCase()
        itemDescription += ` about ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
        
        // Extract potential topics and concepts
        const words = text.split(/\s+/).filter((w: string) => w.length > 4)
        words.forEach((word: string) => {
          if (word.length > 5 && !word.includes('the') && !word.includes('and')) {
            concepts.add(word)
          }
        })
      } else if (item.kind === 'FLASHCARDS' && item.data?.cards) {
        itemDescription += ` with ${item.data.cards.length} flashcards`
        item.data.cards.forEach((card: any) => {
          if (card.q) topics.add(card.q)
        })
      } else if (item.kind === 'QUIZ' && item.data?.items) {
        itemDescription += ` with ${item.data.items.length} quiz questions`
        item.data.items.forEach((q: any) => {
          if (q.question) topics.add(q.question)
        })
      } else if (item.kind === 'CROSSWORD' && item.data?.words) {
        itemDescription += ` with ${item.data.words.length} crossword words`
        item.data.words.forEach((w: any) => {
          if (w.answer) concepts.add(w.answer.toLowerCase())
        })
      } else if (item.kind === 'IMAGE') {
        itemDescription += ` (image)`
        if (item.data?.caption) {
          concepts.add(item.data.caption.toLowerCase())
        }
      } else if (item.kind === 'VIDEO') {
        itemDescription += ` (video)`
      }
    }
    
    contentSummary.push(itemDescription)
  })

  const analysis = [
    `Existing lesson contains ${existingContent.length} content blocks:`,
    ...contentSummary,
    ''
  ]

  if (topics.size > 0) {
    analysis.push(`Key topics covered: ${Array.from(topics).slice(0, 5).join(', ')}`)
  }

  if (concepts.size > 0) {
    analysis.push(`Concepts mentioned: ${Array.from(concepts).slice(0, 8).join(', ')}`)
  }

  analysis.push(`\nIMPORTANT: Avoid duplicating the content, topics, or concepts listed above. Generate complementary content that builds upon or extends these existing elements.`)

  return analysis.join('\n')
}

function formatTextbookContextForHelper(textbookContent: any[], gradeLevel: number): string {
  if (!textbookContent?.length) {
    return `No specific textbook content found for Grade ${gradeLevel}. Use standard curriculum guidelines.`
  }

  const formatted = textbookContent.slice(0, 4).map((c: any, i: number) => {
    const source = c.file_name ? ` (${c.file_name})` : ''
    const similarity = c.similarity ? ` [${(c.similarity * 100).toFixed(1)}% match]` : ''
    
    return `[Textbook ${i+1}${source}]${similarity}:\n${c.content.substring(0, 300)}${c.content.length > 300 ? '...' : ''}`
  }).join('\n\n')

  return `TEXTBOOK REFERENCES for Grade ${gradeLevel}:
${formatted}

CRITICAL: Base your content generation on these textbook references. Ensure accuracy and curriculum alignment.`
}

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
  const { tool, grade, topic, topicId, prompt, limit, difficulty, minWords, maxWords, existingContent } = body || {}
  
  if (!tool || !grade) {
    const res = NextResponse.json({ error: 'tool and grade are required' }, { status: 400 })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Vary', 'Authorization')
    return res
  }

  const offline = () => {
    usedPath = 'offline'
    console.log(`📴 Using offline fallback for ${tool} (${textbookContent.length} textbook refs available)`)
    
    // Enhanced offline fallback that can use textbook content if available
    const hasTextbooks = textbookContent.length > 0
    const textbookInfo = hasTextbooks 
      ? `Based on uploaded textbook materials for Grade ${grade}.` 
      : `Based on standard Grade ${grade} curriculum.`
    
    switch (tool) {
      case 'TEXT':
        const fallbackText = hasTextbooks 
          ? `Grade ${grade} content about ${topic || 'the lesson'}: ${textbookInfo} ${textbookContent[0]?.content?.substring(0, 200) || ''} ${prompt || ''}`
          : `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${prompt || ''}`
        return makeRes({ text: fallbackText })
        
      case 'FLASHCARDS':
        const cards = hasTextbooks && textbookContent[0]?.content
          ? [
              { q: `What is ${topic}?`, a: `${textbookInfo} Key concept from your textbook materials.` },
              { q: `Why is ${topic} important?`, a: `Understanding ${topic} helps build foundational knowledge.` }
            ]
          : [{ q: `What is ${topic}?`, a: `${topic} is an important concept in science.` }]
        return makeRes({ cards })
        
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
            question: `${topic || 'Science'} is covered in your Grade ${grade} textbook materials.`,
            answer: hasTextbooks
          }
        ] })
        
      case 'CROSSWORD': {
        // Try to extract words from textbook content if available
        let words = ["SCIENCE","ATOM","CELL","DATA","GRAPH"]
        
        if (hasTextbooks) {
          const textbookWords = textbookContent
            .flatMap(tb => tb.content?.match(/\b[A-Z]{4,10}\b/g) || [])
            .filter((word: string, i: number, arr: string[]) => arr.indexOf(word) === i)
            .slice(0, 5)
          
          if (textbookWords.length > 0) {
            words = textbookWords
          }
        }
        
        words = words.filter((_, i) => i < Math.max(3, Math.min(10, Number(limit) || 6)))
        const topicText = String(topic || 'the lesson').toLowerCase()
        const items = words.map((w: string) => ({ 
          answer: w, 
          clue: hasTextbooks 
            ? `A key ${topicText} term from your textbook`
            : `A key ${topicText} term that students learn about`
        }))
        return makeRes({ items })
      }
      default:
        return makeRes({ text: `Grade ${grade} friendly text about ${topic || 'the lesson'}. ${textbookInfo} ${prompt || ''}` })
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

  // Search for relevant textbook content with error handling
  let textbookContent: any[] = []
  let textbookContext = ''
  let contentAnalysis = ''
  
  try {
    const searchQuery = `${topic || ''} ${prompt || ''}`.trim()
    textbookContent = await searchTextbookContent(searchQuery, grade, 4)
    textbookContext = formatTextbookContextForHelper(textbookContent, grade)
    console.log(`📚 Found ${textbookContent.length} textbook references for AI helper`)
  } catch (textbookError) {
    console.error('⚠️ Error searching textbook content:', textbookError)
    textbookContext = `No textbook content available due to search error. Using standard Grade ${grade} curriculum guidelines.`
  }
  
  try {
    contentAnalysis = analyzeExistingContent(existingContent)
    console.log(`🧠 Content analysis: ${existingContent?.length || 0} existing items`)
  } catch (analysisError) {
    console.error('⚠️ Error analyzing existing content:', analysisError)
    contentAnalysis = 'Unable to analyze existing content. Generating new content without redundancy checking.'
  }

  // Create enhanced prompt with textbook context and content awareness
  const contentFocus = prompt && prompt.trim() ? prompt.trim() : `the lesson titled "${topic || 'general science'}"`
  
  let base = `You are an assistant generating classroom content for Grade ${grade}. Keep it accurate, concise, and age-appropriate.

${textbookContext}

${contentAnalysis}

GENERATION REQUIREMENTS:
1. Base your content EXCLUSIVELY on the textbook references above
2. Do NOT duplicate or overlap with the existing content analyzed above
3. Generate complementary content that builds upon existing elements
4. Maintain Grade ${grade} appropriate language and complexity
5. Ensure all information is traceable to the provided textbook sources`
  
  // Include admin prompt if available
  const adminContext = adminPrompt ? `\n\nTEACHER GUIDANCE: ${adminPrompt}` : ''
  
  let task = base + adminContext
  
  if (tool === 'FLASHCARDS') {
    task += `\nCreate 3-5 short Q&A flashcards specifically about: ${contentFocus}. 

CRITICAL REQUIREMENTS:
- Base ALL questions and answers on the textbook references provided above
- Ensure questions complement (don't duplicate) existing content in the lesson
- Use only information directly from the textbook sources
- Make questions appropriate for Grade ${grade} students

Respond ONLY as compact JSON of the form: {"cards":[{"q":"question based on textbook","a":"answer from textbook sources"}, ...]}`
  } else if (tool === 'CROSSWORD') {
    const n = Math.max(4, Math.min(15, Number(limit) || 8))
    task += `\nSelect ${n} high-value vocabulary words specifically related to: ${contentFocus}.

CRITICAL REQUIREMENTS:
- Choose words that appear in the textbook references above
- Avoid words already covered in existing lesson content
- Use only terms that are appropriate for Grade ${grade}
- Create clues based on textbook definitions and explanations

Rules: Do NOT include the word itself or its direct forms; no letter-count or pattern hints; use only meaningful definitions from textbook content.
Respond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"definition from textbook context"}, ...]}.
Constraints: answers UPPERCASE letters A–Z only, 3–10 letters; each clue must be based on textbook references.`
  } else if (tool === 'QUIZ') {
    task += `\nCreate a short mixed quiz (Multiple Choice, True/False, Fill-in-the-blank) specifically about: ${contentFocus}.

CRITICAL REQUIREMENTS:
- Base ALL questions on the textbook references provided above
- Avoid duplicating concepts from existing lesson content
- Use textbook information for questions, options, and explanations
- Ensure questions are appropriate for Grade ${grade} students

Respond ONLY as JSON: {"items":[{"type":"MCQ","question":"based on textbook","options":["A","B","C","D"],"answer":"A","explanation":"from textbook"},{"type":"TF","question":"from textbook content","answer":true,"explanation":"textbook-based"},{"type":"FIB","question":"textbook concept with ___","answer":"textbook term","explanation":"textbook explanation"}]}.`
  } else {
    const minW = Number.isFinite(Number(minWords)) ? Number(minWords) : undefined
    const maxW = Number.isFinite(Number(maxWords)) ? Number(maxWords) : undefined
    const range = minW && maxW ? `Aim for ${minW}-${maxW} words.` : minW ? `At least ${minW} words.` : maxW ? `No more than ${maxW} words.` : ''
    task += `\nWrite a concise explanatory paragraph specifically about: ${contentFocus}.

CRITICAL REQUIREMENTS:
- Base your explanation EXCLUSIVELY on the textbook references provided above
- Complement (don't repeat) the existing lesson content analyzed above
- Use only information that can be traced to the textbook sources
- Write at a Grade ${grade} appropriate level
- Reference specific concepts from the textbook material

${range ? `Word count: ${range}` : ''}`
  }

  let resText = ''
  
  // Try AI generation with enhanced logging
  try {
    console.log(`🔄 Generating ${tool} content for Grade ${grade}, Topic: ${topic}`)
    console.log(`📚 Using ${textbookContent.length} textbook references`)
    console.log(`🧠 Analyzing ${existingContent?.length || 0} existing content items`)
    
    const aiResponse = await ai.generateText(task, {
      maxTokens: 800,
      temperature: 0.6
    })
    
    resText = aiResponse
    usedPath = 'ai'
    
    console.log(`✅ AI generation successful for ${tool}:`)
    console.log(`   - Response length: ${resText.length} characters`)
    console.log(`   - Textbook refs used: ${textbookContent.length}`)
    console.log(`   - Content analysis applied: ${existingContent?.length ? 'Yes' : 'No'}`)
    
    // Validate that the response contains expected content structure
    if (tool === 'FLASHCARDS' || tool === 'QUIZ' || tool === 'CROSSWORD') {
      try {
        const testParse = JSON.parse(resText)
        console.log(`📊 JSON structure validated for ${tool}`)
      } catch (parseError) {
        console.warn(`⚠️ Generated content may not be valid JSON for ${tool}:`, parseError)
      }
    }
    
  } catch (aiError) {
    console.error(`🚨 AI generation error for ${tool}:`, {
      error: aiError,
      tool,
      grade,
      topic,
      textbookRefsCount: textbookContent.length,
      hasExistingContent: !!existingContent?.length,
      promptLength: task.length
    })
    
    console.log(`🔄 Falling back to offline mode for ${tool}`)
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
