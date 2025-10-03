"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { TopicSelect } from "@/components/admin/TopicSelect"
// Vanta background is not shown in the builder; only in Preview/Student
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Boxes, Cog, FileText, Grid3X3, HelpCircle, Layers, Plus, Shuffle, Type, MonitorSmartphone, ZoomIn, ZoomOut, ArrowLeft, Play } from "lucide-react"
import { Image as ImageIcon } from "lucide-react"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import { QuizViewer } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useConfirm } from "@/hooks/use-confirm"
import { StudentToolCard } from "@/components/student-tool-card"
import { Panel } from "@/components/ui/panel"
import ImageViewer from "@/components/image-viewer"
import YouTubeViewer from "@/components/youtube-viewer"
import dynamic from "next/dynamic"

// Import BlockNote CSS
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import { VantaBackground } from "@/components/vanta-background"

export type ToolKind = "TEXT" | "FLASHCARDS" | "QUIZ" | "CROSSWORD" | "IMAGE" | "VIDEO"

interface PlacedTool {
  id: string
  kind: ToolKind
  x: number
  y: number
  w: number
  h: number
  data: any
  z?: number
}

const defaultSize: Record<ToolKind, { w: number; h: number }> = {
  TEXT: { w: 600, h: 240 },
  FLASHCARDS: { w: 600, h: 260 },
  QUIZ: { w: 600, h: 220 },
  CROSSWORD: { w: 600, h: 220 },
  IMAGE: { w: 480, h: 320 },
  VIDEO: { w: 640, h: 360 },
}

// Modern Rich Text Editor using BlockNote - clean, reliable, and user-friendly
function RichTextEditor({ 
  initialHtml, 
  onChange 
}: { 
  initialHtml: string
  onChange: (html: string, text: string) => void 
}) {
  const [isClient, setIsClient] = useState(false)
  const [EditorComponent, setEditorComponent] = useState<any>(null)
  const onChangeRef = useRef(onChange)
  
  // Keep the onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  
  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize BlockNote editor component
  useEffect(() => {
    if (!isClient) return
    
    const initializeEditor = async () => {
      try {
        const { BlockNoteView } = await import('@blocknote/mantine')
        const { useCreateBlockNote } = await import('@blocknote/react')
        
        // Create a wrapper component
        const EditorWrapper = () => {
          // Parse initial content
          let initialContent = undefined
          if (initialHtml && initialHtml.trim()) {
            try {
              // Try to parse as BlockNote JSON first
              initialContent = JSON.parse(initialHtml)
            } catch {
              // If not JSON, convert to basic paragraph block
              const textContent = initialHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
              if (textContent) {
                initialContent = [
                  {
                    id: crypto.randomUUID(),
                    type: "paragraph",
                    content: [{ type: "text", text: textContent, styles: {} }]
                  }
                ]
              }
            }
          }
          
          const editor = useCreateBlockNote({
            initialContent,
            uploadFile: async (file) => {
              // Basic file upload handler
              const reader = new FileReader()
              return new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
              })
            }
          })

          // Handle content changes
          const handleChange = () => {
            try {
              // Get the current document as JSON
              const jsonContent = JSON.stringify(editor.document)
              
              // Extract plain text content
              const textContent = editor.document
                .map((block: any) => {
                  if (block.content && Array.isArray(block.content)) {
                    return block.content.map((item: any) => item.text || '').join('')
                  } else if (block.content) {
                    return String(block.content)
                  }
                  return ''
                })
                .filter(Boolean)
                .join('\n')
              
              onChangeRef.current(jsonContent, textContent)
            } catch (error) {
              console.warn('Error handling editor change:', error)
            }
          }

          return (
            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="min-h-[400px]">
                <BlockNoteView
                  editor={editor}
                  onChange={handleChange}
                  theme="light"
                />
              </div>
            </div>
          )
        }
        
        setEditorComponent(() => EditorWrapper)
      } catch (error) {
        console.warn('Failed to initialize BlockNote editor:', error)
        // Fallback to a simple textarea
        const FallbackEditor = () => (
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
            <textarea
              className="w-full min-h-[400px] p-4 border-none outline-none resize-none"
              placeholder="Start typing your content here..."
              defaultValue={initialHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
              onChange={(e) => onChangeRef.current(e.target.value, e.target.value)}
            />
          </div>
        )
        setEditorComponent(() => FallbackEditor)
      }
    }
    
    initializeEditor()
  }, [isClient])

  if (!isClient || !EditorComponent) {
    return (
      <div className="w-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-gray-200 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-500">Loading rich text editor...</div>
        </div>
      </div>
    )
  }

  return <EditorComponent />
}

function LeftPalette({ onAdd, onOpenSettings }: { onAdd: (k: ToolKind) => void; onOpenSettings: () => void }) {
  const iconBtn = "group w-14 h-14 grid place-items-center rounded-2xl bg-white/80 backdrop-blur shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-200 border border-white/50"
  const iconWrap = "flex flex-col items-center gap-3"
  return (
    <aside className="w-20 shrink-0 p-4 bg-gradient-to-b from-white/70 to-white/50 backdrop-blur-xl border-r border-white/30 shadow-lg">
      <div className="flex flex-col items-center gap-3 mb-6">
        <Link href="/admin" className="w-10 h-10 grid place-items-center rounded-xl bg-white/80 backdrop-blur shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-200 border border-white/50" title="Back to Admin">
          <ArrowLeft className="h-5 w-5 text-gray-700 group-hover:text-gray-900" />
        </Link>
        <button aria-label="Lesson settings" title="Lesson settings" onClick={onOpenSettings} className="w-10 h-10 grid place-items-center rounded-xl bg-white/80 backdrop-blur shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-200 border border-white/50">
          <Cog className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
        </button>
      </div>
      <div className={iconWrap}>
        <button className={iconBtn} title="Text" onClick={() => onAdd("TEXT")}>
          <Type className="h-6 w-6 text-sky-600 group-hover:text-sky-700 transition-colors" />
        </button>
        <button className={iconBtn} title="Flashcards" onClick={() => onAdd("FLASHCARDS")}>
          <Boxes className="h-6 w-6 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
        </button>
        <button className={iconBtn} title="Quiz" onClick={() => onAdd("QUIZ")}>
          <HelpCircle className="h-6 w-6 text-violet-600 group-hover:text-violet-700 transition-colors" />
        </button>
        <button className={iconBtn} title="Crossword" onClick={() => onAdd("CROSSWORD")}>
          <Grid3X3 className="h-6 w-6 text-amber-600 group-hover:text-amber-700 transition-colors" />
        </button>
        <button className={iconBtn} title="Image" onClick={() => onAdd("IMAGE")}>
          <ImageIcon className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </button>
        <button className={iconBtn} title="Video" onClick={() => onAdd("VIDEO")}>
          <Play className="h-6 w-6 text-red-600 group-hover:text-red-700 transition-colors" />
        </button>
      </div>
    </aside>
  )
}

function AiHelperPanel({ sel, meta, onUpdateSelected, allItems }: { sel: PlacedTool; meta: { title: string; topic: string; topicId: string; grade: number; vanta: string; difficulty?: 1|2|3 }; onUpdateSelected: (patch: any) => void; allItems: PlacedTool[] }) {
  const { session } = useAuth()
  const [systemPrompt, setSystemPrompt] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  
  // State for textbook integration indicators
  const [textbookStatus, setTextbookStatus] = useState<{
    isSearching: boolean
    foundReferences: number
    sources: Array<{ title: string; similarity: number; grade: number }>
    contentAnalysis: { existingWords: number; redundancyRisk: 'low' | 'medium' | 'high' } | null
  }>({
    isSearching: false,
    foundReferences: 0,
    sources: [],
    contentAnalysis: null
  })

  // Function to collect all existing lesson content for context
  const collectExistingContent = (): { textContent: string; flashcards: number; quizQuestions: number; crosswordWords: number; images: number } => {    
    let textContent = ''
    let flashcards = 0
    let quizQuestions = 0
    let crosswordWords = 0
    let images = 0
    
    allItems.forEach((item: PlacedTool) => {
      switch (item.kind) {
        case 'TEXT':
          if (item.data?.text) {
            textContent += item.data.text + '\n\n'
          }
          break
        case 'FLASHCARDS':
          if (Array.isArray(item.data?.cards)) {
            flashcards += item.data.cards.length
            item.data.cards.forEach((card: any) => {
              if (card.q) textContent += `Q: ${card.q}\n`
              if (card.a) textContent += `A: ${card.a}\n\n`
            })
          }
          break
        case 'QUIZ':
          if (Array.isArray(item.data?.items)) {
            quizQuestions += item.data.items.length
            item.data.items.forEach((q: any) => {
              if (q.question) textContent += `Quiz: ${q.question}\n`
            })
          }
          break
        case 'CROSSWORD':
          if (Array.isArray(item.data?.words)) {
            crosswordWords += item.data.words.length
            item.data.words.forEach((word: any) => {
              if (word.answer) textContent += `Word: ${word.answer}\n`
            })
          }
          break
        case 'IMAGE':
          images++
          if (item.data?.alt) textContent += `Image: ${item.data.alt}\n`
          break
      }
    })
    
    return {
      textContent: textContent.trim(),
      flashcards,
      quizQuestions,
      crosswordWords,
      images
    }
  }

  // --- helpers: sanitize and parse LLM responses ---
  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '')
  const stripFences = (s: string) => s
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/^json\s*\n?/i, '')
  const stripMarkdown = (s: string) => {
    return s
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
  const tidy = (v: any): string => {
    const s = String(v ?? '')
    return stripMarkdown(stripHtml(stripFences(s))).replace(/[\r\n]+/g, '\n').replace(/\u00a0/g, ' ').trim()
  }
  const tryParseJSON = (raw: string): any | null => {
    const s = stripFences(raw).trim()
    // Try direct parse
    try { return JSON.parse(s) } catch {}
    // Try to extract first {...} or [...] block
    const mArr = s.match(/\[[\s\S]*\]/)
    if (mArr) { try { return JSON.parse(mArr[0]) } catch {} }
    const mObj = s.match(/\{[\s\S]*\}/)
    if (mObj) { try { return JSON.parse(mObj[0]) } catch {} }
    return null
  }
  const parseFlashcardsFromText = (text: string): Array<{q:string;a:string}> => {
    const clean = tidy(text)
    const parsed = tryParseJSON(clean)
    let out: Array<{q:string;a:string}> = []
    if (parsed) {
      if (Array.isArray(parsed)) out = parsed as any
      else if (Array.isArray((parsed as any).cards)) out = (parsed as any).cards
      else if (Array.isArray((parsed as any).items)) out = (parsed as any).items
    }
    // If still empty, parse Q:/A: pairs from text
    if (!out.length) {
      const lines = clean.split(/\n+/)
      let q: string | null = null
      for (const line of lines) {
        const mQ = line.match(/^\s*(Q|Question)\s*[:\-]\s*(.+)$/i)
        const mA = line.match(/^\s*(A|Answer)\s*[:\-]\s*(.+)$/i)
        if (mQ) { q = mQ[2].trim() }
        else if (mA && q) { out.push({ q: q.trim(), a: mA[2].trim() }); q = null }
      }
    }
    return out
      .map((x: any) => ({ q: tidy(x.q ?? x.question ?? ''), a: tidy(x.a ?? x.answer ?? '') }))
      .filter(x => x.q && x.a && x.q.toLowerCase() !== x.a.toLowerCase())
  }

  // Crossword placement util: build an intersecting layout for complexity
  type CWDir = 'across' | 'down'
  type CWWord = { answer: string; clue?: string }
  type Placed = { id: string; row: number; col: number; dir: CWDir; answer: string; clue?: string }
  const placeCrossword = (rows: number, cols: number, words: CWWord[]): Placed[] => {
    const grid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    const placed: Placed[] = []
    
    // Helper functions
    const isValidPosition = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols
    
    const canPlaceWord = (startRow: number, startCol: number, direction: CWDir, word: string): boolean => {
      const length = word.length
      
      // Check if word fits within bounds
      if (direction === 'across') {
        if (startCol + length > cols) return false
      } else {
        if (startRow + length > rows) return false
      }
      
      // Check each position of the word
      for (let i = 0; i < length; i++) {
        const r = direction === 'across' ? startRow : startRow + i
        const c = direction === 'across' ? startCol + i : startCol
        
        const currentCell = grid[r][c]
        const wordLetter = word[i]
        
        // If cell is occupied, it must match the word letter (intersection)
        if (currentCell !== null && currentCell !== wordLetter) {
          return false
        }
      }
      
      // Check that the word doesn't touch other words inappropriately
      // (before start and after end should be empty)
      const beforeR = direction === 'across' ? startRow : startRow - 1
      const beforeC = direction === 'across' ? startCol - 1 : startCol
      const afterR = direction === 'across' ? startRow : startRow + length
      const afterC = direction === 'across' ? startCol + length : startCol
      
      if (isValidPosition(beforeR, beforeC) && grid[beforeR][beforeC] !== null) return false
      if (isValidPosition(afterR, afterC) && grid[afterR][afterC] !== null) return false
      
      // Check parallel adjacency (words shouldn't run parallel next to each other)
      for (let i = 0; i < length; i++) {
        const r = direction === 'across' ? startRow : startRow + i
        const c = direction === 'across' ? startCol + i : startCol
        
        // Check cells above and below (for across words) or left and right (for down words)
        const adj1R = direction === 'across' ? r - 1 : r
        const adj1C = direction === 'across' ? c : c - 1
        const adj2R = direction === 'across' ? r + 1 : r
        const adj2C = direction === 'across' ? c : c + 1
        
        // Only fail if adjacent cell is occupied AND this position isn't an intersection
        if (grid[r][c] === null) { // This will be a new letter, not an intersection
          if (isValidPosition(adj1R, adj1C) && grid[adj1R][adj1C] !== null) return false
          if (isValidPosition(adj2R, adj2C) && grid[adj2R][adj2C] !== null) return false
        }
      }
      
      return true
    }
    
    const findIntersections = (word: string): Array<{ row: number; col: number; dir: CWDir; intersectionCount: number }> => {
      const intersections: Array<{ row: number; col: number; dir: CWDir; intersectionCount: number }> = []
      
      // Try both directions
      for (const direction of ['across', 'down'] as CWDir[]) {
        // Try all possible starting positions
        const maxRow = direction === 'across' ? rows : rows - word.length + 1
        const maxCol = direction === 'across' ? cols - word.length + 1 : cols
        
        for (let startRow = 0; startRow < maxRow; startRow++) {
          for (let startCol = 0; startCol < maxCol; startCol++) {
            if (canPlaceWord(startRow, startCol, direction, word)) {
              // Count intersections
              let intersectionCount = 0
              for (let i = 0; i < word.length; i++) {
                const r = direction === 'across' ? startRow : startRow + i
                const c = direction === 'across' ? startCol + i : startCol
                if (grid[r][c] === word[i]) {
                  intersectionCount++
                }
              }
              
              // For the first word, allow placement with 0 intersections
              // For subsequent words, require at least 1 intersection
              if (placed.length === 0 || intersectionCount > 0) {
                intersections.push({ row: startRow, col: startCol, dir: direction, intersectionCount })
              }
            }
          }
        }
      }
      
      // Sort by intersection count (descending), then by centrality
      const centerRow = rows / 2
      const centerCol = cols / 2
      
      return intersections.sort((a, b) => {
        if (b.intersectionCount !== a.intersectionCount) {
          return b.intersectionCount - a.intersectionCount
        }
        
        // Calculate centrality (lower distance is better)
        const distA = Math.abs(a.row - centerRow) + Math.abs(a.col - centerCol)
        const distB = Math.abs(b.row - centerRow) + Math.abs(b.col - centerCol)
        return distA - distB
      })
    }
    
    const placeWord = (row: number, col: number, direction: CWDir, word: string, clue?: string) => {
      // Place letters on grid
      for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i
        const c = direction === 'across' ? col + i : col
        grid[r][c] = word[i]
      }
      
      // Add to placed words
      placed.push({
        id: crypto.randomUUID(),
        row,
        col,
        dir: direction,
        answer: word,
        clue: clue || ''
      })
    }
    
    // Main algorithm
    
    // 1. Sort words by length (descending)
    const sortedWords = words
      .map(w => ({ ...w, answer: w.answer.toUpperCase().replace(/[^A-Z]/g, '') }))
      .filter(w => w.answer.length > 0)
      .sort((a, b) => b.answer.length - a.answer.length)
    
    if (!sortedWords.length) return []
    
    // 2. Place each word
    for (const word of sortedWords) {
      // 3. Find all possible intersections
      const possiblePlacements = findIntersections(word.answer)
      
      if (possiblePlacements.length > 0) {
        // 4. Take the best placement (highest intersection count, most central)
        const bestPlacement = possiblePlacements[0]
        placeWord(bestPlacement.row, bestPlacement.col, bestPlacement.dir, word.answer, word.clue)
      }
    }
    
    return placed
  }

  const obfuscateClue = (answer: string, clue?: string) => {
    if (!clue) return ''
    const re = new RegExp(answer.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig')
    return clue.replace(re, '_'.repeat(Math.min(6, answer.length)))
  }

  // Build headers with Authorization when available
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`
    return h
  }, [session])

  // Read response safely as JSON; if it fails, return raw text as fallback
  const readSafe = async (res: Response) => {
    let raw = ''
    try { raw = await res.text() } catch {}
    let json: any = null
    if (raw && raw.trim().length) {
      try { json = JSON.parse(raw) } catch {}
    }
    return { ok: res.ok, status: res.status, json, raw }
  }

  const [minWords, setMinWords] = useState<number | ''>('')
  const [maxWords, setMaxWords] = useState<number | ''>('')
  const doText = async () => {
    setLoading(true)
    setTextbookStatus(prev => ({ ...prev, isSearching: true, foundReferences: 0, sources: [] }))
    
    try {
      // Collect existing content for context analysis
      const existingContent = collectExistingContent()
      
      // Combine system prompt with description and lesson context for better AI guidance
      const lessonContext = `Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}${desc ? `\n\nAdditional context: ${desc}` : ''}\n\n${lessonContext}`
        : desc 
        ? `${desc}\n\n${lessonContext}`
        : lessonContext
        
      console.log('🚀 Starting AI text generation...', { fullPrompt, meta, existingContent })
      
      // Set content analysis in textbook status immediately
      setTextbookStatus(prev => ({
        ...prev,
        contentAnalysis: {
          existingWords: existingContent.textContent.split(/\s+/).filter(w => w.length > 0).length,
          redundancyRisk: existingContent.textContent.length > 500 ? 'medium' : 'low'
        }
      }))
      
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          tool: 'TEXT', 
          prompt: fullPrompt, 
          topic: meta.topic, 
          topicId: meta.topicId,
          grade: meta.grade, 
          difficulty: meta.difficulty, 
          minWords: typeof minWords==='number'? minWords : undefined, 
          maxWords: typeof maxWords==='number'? maxWords : undefined,
          existingContent: existingContent.textContent, // Pass existing content for analysis
          contentStats: {
            flashcards: existingContent.flashcards,
            quizQuestions: existingContent.quizQuestions,
            crosswordWords: existingContent.crosswordWords,
            images: existingContent.images
          }
        })
      })
      
      console.log('📡 AI Helper response status:', res.status)
      
      const { ok, status, json: j, raw } = await readSafe(res)
      console.log('📊 AI Helper response data:', { ok, status, json: j, raw })
      
      // Extract textbook information from the response if available
      if (j && typeof j === 'object') {
        const textbookData = j.textbookData || j.textbook_sources || []
        const analysisData = j.contentAnalysis || j.analysis
        
        setTextbookStatus(prev => ({
          ...prev,
          isSearching: false,
          foundReferences: Array.isArray(textbookData) ? textbookData.length : 0,
          sources: Array.isArray(textbookData) ? textbookData.map((src: any) => ({
            title: src.title || src.source || 'Textbook Reference',
            similarity: src.similarity || src.score || 0,
            grade: src.grade || meta.grade
          })) : [],
          contentAnalysis: analysisData ? {
            existingWords: analysisData.existingWords || 0,
            redundancyRisk: analysisData.redundancyRisk || 'low'
          } : null
        }))
      } else {
        setTextbookStatus(prev => ({ ...prev, isSearching: false }))
      }
      
      if (!ok) {
        toast({ title: 'AI text error', description: `Status ${status}. Using fallback if available.`, variant: 'warning' })
      }
      let text = (j && typeof j.text === 'string') ? j.text : (typeof j === 'string' ? j : (raw || ''))
      
      // Apply additional markdown stripping to ensure clean text output
      text = tidy(text)
      
      console.log('✅ Final text output:', text)
      
      if (text) {
        onUpdateSelected({ 
          data: { 
            ...(sel.data || {}), 
            html: `<p>${text.replace(/\n/g, '<br/>')}</p>`, 
            text 
          } 
        })
        console.log('📝 Text content updated successfully')
      } else {
        console.warn('⚠️ No text content generated')
      }
    } catch (error) {
      console.error('❌ AI text generation failed:', error)
      toast({ title: 'AI text error', description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' })
    } finally { 
      setLoading(false) 
      console.log('🔄 AI text generation completed, loading set to false')
    }
  }

  const doFlash = async () => {
    setLoading(true)
    setTextbookStatus(prev => ({ ...prev, isSearching: true, foundReferences: 0, sources: [] }))
    try {
      // Collect existing content for context analysis
      const existingContent = collectExistingContent()
      
      const lessonContext = `Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const fullPrompt = desc 
        ? `${desc}\n\n${lessonContext}`
        : `Create ${flashCount} concise flashcards about ${meta.topic} for Grade ${meta.grade} (difficulty ${meta.difficulty}).\nReturn JSON with a 'cards' array like [{"q":"question","a":"answer"}].\nDo NOT include markdown fences or code blocks.\n\n${lessonContext}`
      
      // Set content analysis in textbook status immediately
      setTextbookStatus(prev => ({
        ...prev,
        contentAnalysis: {
          existingWords: existingContent.textContent.split(/\s+/).filter(w => w.length > 0).length,
          redundancyRisk: existingContent.flashcards > 5 ? 'medium' : 'low'
        }
      }))
      
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tool: 'FLASHCARDS',
          // Encourage structured, fence-free output; still parse defensively
          prompt: fullPrompt,
          topic: meta.topic,
          topicId: meta.topicId,
          grade: meta.grade,
          difficulty: meta.difficulty,
          limit: flashCount,
          existingContent: existingContent.textContent, // Pass existing content for analysis
          contentStats: {
            flashcards: existingContent.flashcards,
            quizQuestions: existingContent.quizQuestions,
            crosswordWords: existingContent.crosswordWords,
            images: existingContent.images
          }
        })
      })
      const { ok, status, json: j, raw } = await readSafe(res)
      if (!ok) {
        toast({ title: 'AI flashcards error', description: `Status ${status}. Attempting to parse fallback text.`, variant: 'warning' })
      }
      let cardsArr: any[] = []
      if (Array.isArray(j?.cards)) cardsArr = j.cards
      else if (Array.isArray(j?.items)) cardsArr = j.items
      else if (typeof j?.text === 'string') cardsArr = parseFlashcardsFromText(j.text)
      else if (typeof j === 'string') cardsArr = parseFlashcardsFromText(j)
      else if (raw) cardsArr = parseFlashcardsFromText(raw)
      if (cardsArr.length) {
        onUpdateSelected({
          data: {
            ...(sel.data || {}),
            cards: cardsArr
              .map((x: any) => ({ id: crypto.randomUUID(), q: tidy(x.q || x.question || ''), a: tidy(x.a || x.answer || '') }))
              .filter((x: any) => x.q && x.a)
          }
        })
      }
      
      // Extract textbook information from the response if available
      if (j && typeof j === 'object') {
        const textbookData = j.textbookData || j.textbook_sources || []
        const analysisData = j.contentAnalysis || j.analysis
        
        setTextbookStatus(prev => ({
          ...prev,
          isSearching: false,
          foundReferences: Array.isArray(textbookData) ? textbookData.length : 0,
          sources: Array.isArray(textbookData) ? textbookData.map((src: any) => ({
            title: src.title || src.source || 'Textbook Reference',
            similarity: src.similarity || src.score || 0,
            grade: src.grade || meta.grade
          })) : [],
          contentAnalysis: analysisData ? {
            existingWords: analysisData.existingWords || 0,
            redundancyRisk: analysisData.redundancyRisk || 'low'
          } : null
        }))
      } else {
        setTextbookStatus(prev => ({ ...prev, isSearching: false }))
      }
    } finally { setLoading(false) }
  }

  const [flashCount, setFlashCount] = useState(6)
  const [mcq, setMcq] = useState(2); const [tf, setTf] = useState(2); const [fib, setFib] = useState(1)
  const doQuiz = async () => {
    setLoading(true)
    setTextbookStatus(prev => ({ ...prev, isSearching: true, foundReferences: 0, sources: [] }))
    try {
      // Collect existing content for context analysis
      const existingContent = collectExistingContent()
      
      const lessonContext = `Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const fullPrompt = desc 
        ? `${desc}\n\n${lessonContext}`
        : lessonContext
        
      // Set content analysis in textbook status immediately
      setTextbookStatus(prev => ({
        ...prev,
        contentAnalysis: {
          existingWords: existingContent.textContent.split(/\s+/).filter(w => w.length > 0).length,
          redundancyRisk: existingContent.quizQuestions > 10 ? 'high' : existingContent.quizQuestions > 5 ? 'medium' : 'low'
        }
      }))
        
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          tool: 'QUIZ', 
          prompt: fullPrompt, 
          topic: meta.topic, 
          topicId: meta.topicId, 
          grade: meta.grade, 
          difficulty: meta.difficulty, 
          counts: { MCQ: mcq, TF: tf, FIB: fib },
          existingContent: existingContent.textContent, // Pass existing content for analysis
          contentStats: {
            flashcards: existingContent.flashcards,
            quizQuestions: existingContent.quizQuestions,
            crosswordWords: existingContent.crosswordWords,
            images: existingContent.images
          }
        })
      })
      const { ok, status, json: j } = await readSafe(res)
      if (!ok) {
        toast({ title: 'AI quiz error', description: `Status ${status}. Using simple fallback questions.`, variant: 'warning' })
      }
      let items = Array.isArray(j?.items) ? j.items : []
      // Fallback: if no items provided (e.g., no API key), synthesize simple questions
      if (!items.length) {
        const topic = meta.topic || 'the topic'
        const makeMCQ = (q: string, opts: string[], ans: string) => ({ type: 'MCQ', question: q, options: opts, answer: ans })
        const makeTF = (q: string, ans: boolean) => ({ type: 'TF', question: q, answer: ans })
        const makeFIB = (q: string, ans: string) => ({ type: 'FIB', question: q, answer: ans })
        const mcqs = Array.from({ length: Math.max(0, mcq) }).map((_, i) =>
          makeMCQ(`Which is true about ${topic}? (${i + 1})`, [
            `${topic} relates to science concepts`,
            `It is unrelated to learning`,
            `It's a random idea`,
            `None of the above`
          ], `${topic} relates to science concepts`)
        )
        const tfs = Array.from({ length: Math.max(0, tf) }).map((_, i) => makeTF(`${topic} can be studied with experiments. (${i + 1})`, true))
        const fibs = Array.from({ length: Math.max(0, fib) }).map((_, i) => makeFIB(`${topic} is studied in the subject of _____. (${i + 1})`, 'science'))
        items = [...mcqs, ...tfs, ...fibs]
      }
      if (items.length) onUpdateSelected({ data: { ...(sel.data || {}), items: [...(Array.isArray(sel.data?.items) ? sel.data.items : []), ...items] } })
      
      // Extract textbook information from the response if available
      if (j && typeof j === 'object') {
        const textbookData = j.textbookData || j.textbook_sources || []
        const analysisData = j.contentAnalysis || j.analysis
        
        setTextbookStatus(prev => ({
          ...prev,
          isSearching: false,
          foundReferences: Array.isArray(textbookData) ? textbookData.length : 0,
          sources: Array.isArray(textbookData) ? textbookData.map((src: any) => ({
            title: src.title || src.source || 'Textbook Reference',
            similarity: src.similarity || src.score || 0,
            grade: src.grade || meta.grade
          })) : [],
          contentAnalysis: analysisData ? {
            existingWords: analysisData.existingWords || 0,
            redundancyRisk: analysisData.redundancyRisk || 'low'
          } : null
        }))
      } else {
        setTextbookStatus(prev => ({ ...prev, isSearching: false }))
      }
    } finally { setLoading(false) }
  }

  const [cwCount, setCwCount] = useState(6)
  const doCross = async () => {
    setLoading(true)
    try {
      const lessonContext = `Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const fullPrompt = desc 
        ? `${desc}\n\n${lessonContext}`
        : `Generate ${Math.min(30, Math.max(4, cwCount))} crossword entries about ${meta.topic} for Grade ${meta.grade} (difficulty ${meta.difficulty}).\nFor EACH word, provide a UNIQUE, definition-style clue that describes what the word is or means in this topic. Do NOT include the word.\nRespond ONLY as JSON: {"items":[{"answer":"UPPERCASE","clue":"short definition"}, ...]}. Mix word lengths (3–10).\n\n${lessonContext}`
      
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tool: 'CROSSWORD',
          prompt: fullPrompt,
          topic: meta.topic,
          topicId: meta.topicId,
          grade: meta.grade,
          difficulty: meta.difficulty,
          limit: Math.min(30, Math.max(1, cwCount))
        })
      })
      const { ok, status, json: j } = await readSafe(res)
      if (!ok) {
        toast({ title: 'AI crossword error', description: `Status ${status}.`, variant: 'warning' })
      }
  // Auto-determine grid size based on word count
  const isLarge = Array.isArray(j?.items) && j.items.length > 15
  const baseRows = isLarge ? 24 : 15
  const baseCols = isLarge ? 24 : 15
      let placedOut: Array<{ id: string; row: number; col: number; dir: 'across'|'down'; answer: string; clue?: string }> = []
      let bestRows = baseRows
      let bestCols = baseCols

      if (Array.isArray(j?.items) && j.items.length) {
        // Normalize and obfuscate clues if they reveal the answer
        const normalized: CWWord[] = j.items
          .map((w: any) => ({ answer: tidy(w.answer || w.word || '' ).toUpperCase(), clue: tidy(w.clue || '') }))
          .filter((w: CWWord) => w.answer && /^[A-Z]+$/.test(w.answer))
          .map((w: CWWord) => ({ answer: w.answer, clue: obfuscateClue(w.answer, w.clue) }))

        // If positions provided, keep them; else auto-place
        const hasPos = j.items.every((w: any) => w && (typeof w.row === 'number') && (typeof w.col === 'number') && (w.dir === 'across' || w.dir === 'down'))
        if (hasPos) {
          placedOut = j.items.map((w: any) => ({ id: crypto.randomUUID(), row: Number(w.row) || 0, col: Number(w.col) || 0, dir: (w.dir === 'down' ? 'down' : 'across'), answer: String(w.answer || w.word || '').toUpperCase(), clue: obfuscateClue(String(w.answer || w.word || '').toUpperCase(), w.clue || '') }))
        } else {
          // Try to place with adaptive grid growth to fit as many words as possible
          const target = Math.min(Math.max(1, cwCount), 30)
          let best: typeof placedOut = []
          let bestR = baseRows
          let bestC = baseCols
          const maxDim = Math.min(30, Math.max(24, Math.max(baseRows, baseCols) + 12)) // larger cap to fit all with intersections
          for (let r = baseRows; r <= maxDim; r += 1) {
            for (let c = baseCols; c <= maxDim; c += 1) {
              const attempt = placeCrossword(r, c, normalized)
              if (attempt.length > best.length) { best = attempt; bestR = r; bestC = c }
              if (attempt.length >= Math.min(target, normalized.length)) { best = attempt; bestR = r; bestC = c; break }
            }
            if (best.length >= Math.min(target, normalized.length)) break
          }
          placedOut = best
          bestRows = bestR
          bestCols = bestC
          if (placedOut.length < Math.min(target, normalized.length)) {
            toast({ title: 'Placed as many words as possible', description: `Fitted ${placedOut.length} of ${Math.min(target, normalized.length)}. You can increase rows/cols to fit more.`, variant: 'info' })
          }
        }
      } else if (Array.isArray(j?.words) && j.words.length) {
        // Create indirect clues and auto-place with intersections
        const normalized: CWWord[] = j.words
          .map((w: any) => String(w || '').toUpperCase())
          .filter((w: string) => w && /^[A-Z]+$/.test(w))
          .map((w: string) => ({ answer: w, clue: `Related to ${meta.topic.toLowerCase()}: ${'_'.repeat(Math.min(6, w.length))}` }))
        // Adaptive placement here as well
        let best: typeof placedOut = []
        let bestR = baseRows
        let bestC = baseCols
        const maxDim = Math.min(30, Math.max(24, Math.max(baseRows, baseCols) + 12))
        for (let r = baseRows; r <= maxDim; r += 1) {
          for (let c = baseCols; c <= maxDim; c += 1) {
            const attempt = placeCrossword(r, c, normalized)
            if (attempt.length > best.length) { best = attempt; bestR = r; bestC = c }
            if (attempt.length >= Math.min(Math.max(1, cwCount), normalized.length)) { best = attempt; bestR = r; bestC = c; break }
          }
          if (best.length >= Math.min(Math.max(1, cwCount), normalized.length)) break
        }
        placedOut = best
        bestRows = bestR
        bestCols = bestC
      }

      if (placedOut.length) {
        onUpdateSelected({ data: { ...(sel.data || {}), rows: bestRows, cols: bestCols, words: placedOut } })
      }
    } finally { setLoading(false) }
  }

  const doImage = async () => {
    setLoading(true)
    try {
      const prompt = `${desc || ''} — Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const res = await fetch('/api/generate-image-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: '16:9',
          gradeLevel: meta.grade,
          // Force a fresh attempt and request debug info to help diagnose fallbacks
          skipCache: true,
          includeDebug: true,
        })
      })
      const j = await res.json()
      if (j?.success) {
        if (j.type === 'gradient') {
          onUpdateSelected({ data: { ...(sel.data || {}), gradient: j.imageUrl, url: '', alt: (sel.data?.alt || ''), caption: (sel.data?.caption || ''), fit: 'cover' } })
          // Surface fallback reason if available
          const reason = j?.debugInfo?.reason || j?.debug?.reason || j?.reason || (j?.errors ? String(j.errors) : '')
          if (reason) {
            toast({ title: 'Used placeholder image', description: String(reason).slice(0, 300), variant: 'warning' })
          }
        } else if (j.imageUrl) {
          onUpdateSelected({ data: { ...(sel.data || {}), url: j.imageUrl, gradient: '', fit: 'cover' } })
        }
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      {sel.kind === 'TEXT' && (
        <div className="space-y-2">
          <textarea 
            className="w-full border rounded p-2 text-xs" 
            placeholder="System prompt (guides AI behavior and style)" 
            value={systemPrompt} 
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
          />
          <textarea 
            className="w-full border rounded p-2 text-xs" 
            placeholder="Description (specific content guidance)" 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label>Min words<input className="w-full border rounded p-1" type="number" min={10} max={500} value={minWords} onChange={(e)=> setMinWords(e.target.value === '' ? '' : Number(e.target.value))} /></label>
            <label>Max words<input className="w-full border rounded p-1" type="number" min={10} max={1000} value={maxWords} onChange={(e)=> setMaxWords(e.target.value === '' ? '' : Number(e.target.value))} /></label>
          </div>
          <Button size="sm" disabled={loading} onClick={doText}>Generate Text</Button>
        </div>
      )}
      {sel.kind !== 'TEXT' && (
        <>
          <textarea className="w-full border rounded p-2 text-xs" placeholder="Optional description to guide AI" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </>
      )}
      {sel.kind === 'FLASHCARDS' && (
        <div className="space-y-2">
          <label className="text-xs">Flashcards count <input className="w-full border rounded p-1" type="number" min={1} max={20} value={flashCount} onChange={(e) => setFlashCount(Number(e.target.value))} /></label>
          <Button size="sm" disabled={loading} onClick={doFlash}>Generate Flashcards</Button>
        </div>
      )}
      {sel.kind === 'QUIZ' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <label>MCQ <input className="w-full border rounded p-1" type="number" min={0} max={10} value={mcq} onChange={e => setMcq(Number(e.target.value))} /></label>
            <label>TF <input className="w-full border rounded p-1" type="number" min={0} max={10} value={tf} onChange={e => setTf(Number(e.target.value))} /></label>
            <label>FIB <input className="w-full border rounded p-1" type="number" min={0} max={10} value={fib} onChange={e => setFib(Number(e.target.value))} /></label>
          </div>
          <Button size="sm" disabled={loading} onClick={doQuiz}>Generate Quiz</Button>
        </div>
      )}
    {sel.kind === 'CROSSWORD' && (
        <div className="space-y-2">
      <label className="text-xs">Words <input className="w-full border rounded p-1" type="number" min={1} max={30} value={cwCount} onChange={(e) => setCwCount(Number(e.target.value))} /></label>
          <Button size="sm" disabled={loading} onClick={doCross}>Generate Words</Button>
        </div>
      )}
      {sel.kind === 'IMAGE' && <Button size="sm" disabled={loading} onClick={doImage}>Generate Image</Button>}
      
      {/* Textbook Integration Status */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
          <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Textbook Integration
        </div>
        
        {textbookStatus.isSearching && (
          <div className="flex items-center justify-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-xs text-blue-700">Searching textbooks...</span>
          </div>
        )}
        
        {!textbookStatus.isSearching && textbookStatus.foundReferences > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-green-700 font-medium">
                  {textbookStatus.foundReferences} textbook reference{textbookStatus.foundReferences !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
            
            {textbookStatus.sources.length > 0 && (
              <div className="space-y-1">
                {textbookStatus.sources.slice(0, 3).map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 bg-white/80 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600 truncate flex-1">{source.title}</div>
                      <div className="text-xs text-blue-600 font-medium">Grade {source.grade}</div>
                    </div>
                    <div className="text-xs text-gray-500">{Math.round(source.similarity * 100)}%</div>
                  </div>
                ))}
                {textbookStatus.sources.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{textbookStatus.sources.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {!textbookStatus.isSearching && textbookStatus.foundReferences === 0 && (
          <div className="py-2 px-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs text-amber-700">No textbook matches - using general knowledge</span>
            </div>
          </div>
        )}
        
        {textbookStatus.contentAnalysis && (
          <div className={`mt-2 py-2 px-3 rounded-lg border ${
            textbookStatus.contentAnalysis.redundancyRisk === 'high' 
              ? 'bg-red-50 border-red-200' 
              : textbookStatus.contentAnalysis.redundancyRisk === 'medium'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className={`text-xs font-medium ${
                textbookStatus.contentAnalysis.redundancyRisk === 'high' 
                  ? 'text-red-700' 
                  : textbookStatus.contentAnalysis.redundancyRisk === 'medium'
                  ? 'text-yellow-700'
                  : 'text-green-700'
              }`}>
                Content Analysis: {textbookStatus.contentAnalysis.redundancyRisk} redundancy risk
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Existing content: {textbookStatus.contentAnalysis.existingWords} words
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RightInspector({ items, selectedId, onSelect, onSave, onPreview, onPublish, onUpdateSelected, meta, onReorder }: { items: PlacedTool[]; selectedId: string | null; onSelect: (id: string) => void; onSave: () => void; onPreview: () => void; onPublish: () => void; onUpdateSelected: (patch: any) => void; meta: { title: string; topic: string; topicId: string; grade: number; vanta: string }; onReorder: (id: string, action: 'up'|'down'|'front'|'back') => void }) {
  const iconFor = (k: ToolKind) => k==='TEXT'? <Type className="h-4 w-4 text-sky-600"/> : k==='FLASHCARDS'? <Boxes className="h-4 w-4 text-emerald-600"/> : k==='QUIZ'? <HelpCircle className="h-4 w-4 text-violet-600"/> : k==='CROSSWORD'? <Grid3X3 className="h-4 w-4 text-amber-600"/> : k==='IMAGE'? <ImageIcon className="h-4 w-4 text-pink-600"/> : <Play className="h-4 w-4 text-red-600"/>
  const sel = selectedId ? items.find(i=>i.id===selectedId) : null
  return (
    <aside className="w-80 shrink-0 p-4 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl border-l border-white/30 shadow-xl">
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant="outline" className="bg-white/80 backdrop-blur border-white/50 hover:bg-white/90 shadow-md" onClick={onSave}>Save</Button>
        <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg" onClick={onPreview}>Preview</Button>
        <Button size="sm" variant="ghost" className="ml-auto hover:bg-white/50" onClick={onPublish}>Publish</Button>
      </div>
      
      {/* Layers Section */}
      <div className="bg-white/60 backdrop-blur rounded-2xl p-3 mb-4 shadow-lg border border-white/40">
        <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          Layers
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {items
            .slice()
            .sort((a,b)=> (b.z ?? 0) - (a.z ?? 0))
            .map(it => (
            <div key={it.id} className={`w-full p-3 rounded-xl border transition-all duration-200 ${selectedId===it.id? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md' : 'bg-white/70 backdrop-blur hover:bg-white/80 border-white/50 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-1.5 rounded-lg bg-white/80 shadow-sm">{iconFor(it.kind)}</div>
                <button onClick={() => onSelect(it.id)} className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800">{it.kind}</div>
                  <div className="text-xs text-gray-500">{Math.round(it.x)},{Math.round(it.y)} • z {it.z ?? 0}</div>
                </button>
                <div className="flex items-center gap-1">
                  <button title="Forward" className="p-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all" onClick={()=>onReorder(it.id,'up')}>
                    <span className="text-xs">▲</span>
                  </button>
                  <button title="Backward" className="p-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all" onClick={()=>onReorder(it.id,'down')}>
                    <span className="text-xs">▼</span>
                  </button>
                </div>
              </div>
              {selectedId===it.id && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="px-3 py-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all text-xs font-medium" onClick={()=>onReorder(it.id,'front')}>Front</button>
                  <button className="px-3 py-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all text-xs font-medium" onClick={()=>onReorder(it.id,'back')}>Back</button>
                </div>
              )}
            </div>
          ))}
          {items.length===0 && <div className="text-sm text-gray-500 text-center py-4">No tools yet.</div>}
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white/60 backdrop-blur rounded-2xl p-3 mb-4 shadow-lg border border-white/40">
        <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Cog className="h-4 w-4 text-indigo-600" />
          Properties
        </div>
        {!sel && <div className="text-sm text-gray-500 text-center py-4">Select a layer to edit its properties.</div>}
        {sel && (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 p-2 bg-white/50 rounded-lg">Most settings are edited directly on the tool on the canvas. Use AI Helper below to generate content.</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Card color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="flex-1 h-10 border border-white/50 rounded-lg bg-white/80 backdrop-blur shadow-sm"
                    value={(typeof sel.data?.bgColor === 'string' && /^#([0-9a-fA-F]{6})$/.test(sel.data.bgColor)) ? (sel.data.bgColor as string) : '#0ea5e9'}
                    onChange={(e)=> onUpdateSelected({ data: { ...(sel.data || {}), bgColor: e.target.value } })}
                    title="Pick a background color used behind this tool's content"
                  />
                  <button className="px-3 py-2 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all text-xs font-medium" onClick={()=> onUpdateSelected({ data: { ...(sel.data || {}), bgColor: '' } })}>Clear</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Accent intensity</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.6}
                    max={1.6}
                    step={0.1}
                    className="flex-1"
                    value={Number(sel.data?.accentIntensity ?? 1)}
                    onChange={(e)=> onUpdateSelected({ data: { ...(sel.data || {}), accentIntensity: Number(e.target.value) } })}
                  />
                  <div className="text-sm font-medium text-gray-600 min-w-[3rem]">{Number(sel.data?.accentIntensity ?? 1).toFixed(1)}×</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Helper Section */}
      <div className="bg-white/60 backdrop-blur rounded-2xl p-3 shadow-lg border border-white/40">
        <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Helper
        </div>
        {!sel ? (
          <div className="text-sm text-gray-500 text-center py-4">Select a layer to use AI.</div>
        ) : (
          <AiHelperPanel sel={sel} meta={{ ...meta, topicId: meta.topicId, difficulty: (meta as any).difficulty }} onUpdateSelected={onUpdateSelected} allItems={items} />
        )}
      </div>
    </aside>
  )
}

// Separate component for Quiz editor to avoid hook issues
const QuizEditor = React.memo(function QuizEditor({ item, onChange }: { item: PlacedTool; onChange: (p: Partial<PlacedTool>) => void }) {
  type Q = any
  const list: Q[] = Array.isArray(item.data?.items) ? item.data.items : []
  
  const add = (type: 'MCQ' | 'TF' | 'FIB') => {
    const base: any = { id: crypto.randomUUID(), type, question: '' }
    if (type === 'MCQ') { base.options = ['', '']; base.answer = 0 }
    if (type === 'TF') base.answer = true
    if (type === 'FIB') base.answer = ''
    onChange({ data: { ...item.data, items: [...list, base] } })
  }
  
  const set = (idx: number, patch: any) => { 
    const arr = [...list]; 
    arr[idx] = { ...arr[idx], ...patch }; 
    onChange({ data: { ...item.data, items: arr } }) 
  }
  
  const del = (idx: number) => { 
    const arr = [...list]; 
    arr.splice(idx, 1); 
    onChange({ data: { ...item.data, items: arr } }) 
  }
  
  const move = (idx: number, dir: number) => { 
    const arr = [...list]; 
    const t = arr[idx + dir]; 
    arr[idx + dir] = arr[idx]; 
    arr[idx] = t; 
    onChange({ data: { ...item.data, items: arr } }) 
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Quiz ({list.length})</div>
        <div className="flex items-center gap-2">
          <select className="border rounded p-1 text-xs" onChange={(e) => { const t = e.target.value as any; if (t) { add(t); e.currentTarget.selectedIndex = 0 } }}>
            <option value="">+ Add</option>
            <option value="MCQ">Multiple choice</option>
            <option value="TF">True/False</option>
            <option value="FIB">Fill in blank</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        {list.map((q: any, idx: number) => (
          <div key={q.id || idx} className="border rounded-lg p-2 bg-white/70">
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>#{idx + 1} [{q.type}]</span>
              <div className="flex gap-1">
                <button className="px-1 py-0.5 border rounded" disabled={idx === 0} onClick={() => move(idx, -1)}>Up</button>
                <button className="px-1 py-0.5 border rounded" disabled={idx === list.length - 1} onClick={() => move(idx, 1)}>Down</button>
                <button className="px-1 py-0.5 border rounded text-red-600" onClick={() => del(idx)}>Delete</button>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              <div>
                <div className="text-xs mb-1">Question</div>
                <input className="w-full border rounded p-2" value={q.question || ''} onChange={(e) => set(idx, { question: e.target.value })} />
              </div>
              {q.type === 'MCQ' && (
                <div className="space-y-2">
                  <div className="text-xs">Options</div>
                  <div className="grid gap-1">
                    {(Array.isArray(q.options) ? q.options : ['','']).map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`ans-${q.id || idx}`} checked={q.answer === oi} onChange={() => set(idx, { answer: oi })} />
                        <input className="flex-1 border rounded p-1 text-sm" value={opt} onChange={(e) => { const opts = [...(q.options || [])]; opts[oi] = e.target.value; set(idx, { options: opts }) }} />
                        <button className="px-2 py-1 border rounded text-xs" onClick={() => { const opts = [...(q.options || [])]; opts.splice(oi,1); set(idx, { options: opts, answer: 0 }) }}>Del</button>
                      </div>
                    ))}
                  </div>
                  <button className="px-2 py-1 border rounded text-xs" onClick={() => set(idx, { options: [...(q.options || []), ''] })}>+ Option</button>
                </div>
              )}
              {q.type === 'TF' && (
                <div className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-1"><input type="radio" checked={q.answer === true} onChange={() => set(idx, { answer: true })} /> True</label>
                  <label className="flex items-center gap-1"><input type="radio" checked={q.answer === false} onChange={() => set(idx, { answer: false })} /> False</label>
                </div>
              )}
              {q.type === 'FIB' && (
                <div className="grid gap-1">
                  <div className="text-xs">Answer</div>
                  <input className="w-full border rounded p-1 text-sm" value={q.answer || ''} onChange={(e) => set(idx, { answer: e.target.value })} />
                </div>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-gray-500">No questions yet. Use + Add or AI.</div>}
      </div>
      <div className="border-t pt-2">
        <div className="text-xs text-gray-500 mb-1">Live preview</div>
        <div className="max-h-64 overflow-auto">
          {list.length > 0 ? (
            <QuizViewer key={`quiz-preview-${item.id}-${list.length}`} items={list} />
          ) : (
            <div className="p-8 text-center text-gray-500">No quiz questions available.</div>
          )}
        </div>
      </div>
    </div>
  )
})

type GuideLines = { v: number[]; h: number[] }
function Draggable({ item, onChange, selected, onSelect, onConfigure, onDuplicate, onDelete, onDragState, snap, gridSize, allItems, onGuideChange, onActivate, canvasH, onCanvasNeed }: { item: PlacedTool; onChange: (p: Partial<PlacedTool>) => void; selected: boolean; onSelect: () => void; onConfigure: () => void; onDuplicate: () => void; onDelete: () => void; onDragState: (dragging: boolean) => void; snap: boolean; gridSize: number; allItems: PlacedTool[]; onGuideChange: (g: GuideLines) => void; onActivate: () => void; canvasH: number; onCanvasNeed: (needW: number, needH: number) => void }) {
  const start = useRef<{x:number;y:number;w:number;h:number;mx:number;my:number;resizing:boolean; dir?: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'} | null>(null)
  const [flipMap, setFlipMap] = useState<Record<string, boolean>>({})
  const threshold = 6

  // Start drag only from header bar or resize handles
  const beginDrag = (e: React.MouseEvent) => {
    onSelect();
    const dir = (e.target as HTMLElement).dataset.handle as any
    start.current = { x: item.x, y: item.y, w: item.w, h: item.h, mx: e.clientX, my: e.clientY, resizing: !!dir, dir }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    onDragState(true)
  }
  const onMove = (e: MouseEvent) => {
    if (!start.current) return
    // account for canvas scale (stored on document for simplicity)
    const scale = (document.documentElement.getAttribute('data-canvas-scale') ? Number(document.documentElement.getAttribute('data-canvas-scale')) : 1) || 1
    const dx = (e.clientX - start.current.mx) / scale
    const dy = (e.clientY - start.current.my) / scale
  const designW = 1280, designH = canvasH
    const guides: GuideLines = { v: [], h: [] }
    const others = allItems.filter(i=>i.id!==item.id)
    if (start.current.resizing) {
  const minW = 240, minH = 140
      const dir = start.current.dir || 'se'
      // Keep opposite edges anchored when dragging N or W handles
      let L = start.current.x
      let T = start.current.y
      let R = start.current.x + start.current.w
      let B = start.current.y + start.current.h

  if (dir.includes('e')) { R = L + Math.max(minW, start.current.w + dx); R = Math.min(designW, R) }
  if (dir.includes('s')) { B = T + Math.max(minH, start.current.h + dy); B = Math.min(designH, B) }
      if (dir.includes('w')) { L = Math.min(R - minW, start.current.x + dx); L = Math.max(0, L) }
      if (dir.includes('n')) { T = Math.min(B - minH, start.current.y + dy); T = Math.max(0, T) }

      // Snap
      if (snap) {
        if (dir.includes('w')) { const sx = Math.round(L / gridSize) * gridSize; L = Math.min(R - minW, Math.max(0, sx)) }
        if (dir.includes('n')) { const sy = Math.round(T / gridSize) * gridSize; T = Math.min(B - minH, Math.max(0, sy)) }
        if (dir.includes('e')) { const sw = Math.round((R - L) / gridSize) * gridSize; R = L + Math.max(minW, sw) }
        if (dir.includes('s')) { const sh = Math.round((B - T) / gridSize) * gridSize; B = T + Math.max(minH, sh) }
      }

      // Simple alignment guides for moved edges
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (dir.includes('e')) {
          if (Math.abs(R - l) <= threshold) { R = l; guides.v.push(l) }
          if (Math.abs(R - r) <= threshold) { R = r; guides.v.push(r) }
          if (Math.abs(R - cx) <= threshold) { R = cx; guides.v.push(cx) }
        }
        if (dir.includes('w')) {
          if (Math.abs(L - l) <= threshold) { L = l; guides.v.push(l) }
          if (Math.abs(L - r) <= threshold) { L = r; guides.v.push(r) }
          if (Math.abs(L - cx) <= threshold) { L = cx; guides.v.push(cx) }
        }
        if (dir.includes('s')) {
          if (Math.abs(B - t) <= threshold) { B = t; guides.h.push(t) }
          if (Math.abs(B - b) <= threshold) { B = b; guides.h.push(b) }
          if (Math.abs(B - cy) <= threshold) { B = cy; guides.h.push(cy) }
        }
        if (dir.includes('n')) {
          if (Math.abs(T - t) <= threshold) { T = t; guides.h.push(t) }
          if (Math.abs(T - b) <= threshold) { T = b; guides.h.push(b) }
          if (Math.abs(T - cy) <= threshold) { T = cy; guides.h.push(cy) }
        }
      }

  const nw = Math.min(Math.max(minW, R - L), designW - L)
  const nh = Math.min(Math.max(minH, B - T), designH - T)
      onGuideChange(guides)
      onChange({ x: L, y: T, w: nw, h: nh })
      // request canvas growth if needed
      onCanvasNeed(L + nw, T + nh)
    } else {
  const nx0 = Math.max(0, start.current.x + dx)
  const ny0 = Math.max(0, start.current.y + dy)
      // Alignment to neighbors (left/right/centerX and top/bottom/centerY)
  let ax = nx0, ay = ny0
      const L = ax, T = ay, R = L + item.w, B = T + item.h
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (Math.abs(L - l) <= threshold) { ax = l; guides.v.push(l) }
  if (Math.abs(L - r) <= threshold) { ax = r; guides.v.push(r) }
        if (Math.abs(R - l) <= threshold) { ax = l - item.w; guides.v.push(l) }
        if (Math.abs(L + item.w/2 - cx) <= threshold) { ax = cx - item.w/2; guides.v.push(cx) }

        if (Math.abs(T - t) <= threshold) { ay = t; guides.h.push(t) }
        if (Math.abs(T - b) <= threshold) { ay = b; guides.h.push(b) }
        if (Math.abs(B - b) <= threshold) { ay = b - item.h; guides.h.push(b) }
        if (Math.abs(B - t) <= threshold) { ay = t - item.h; guides.h.push(t) }
        if (Math.abs(T + item.h/2 - cy) <= threshold) { ay = cy - item.h/2; guides.h.push(cy) }
      }
  // After alignment, clamp within artboard
  ax = Math.min(Math.max(0, ax), designW - item.w)
  ay = Math.max(0, ay)
  const cx = snap ? Math.round(ax / gridSize) * gridSize : ax
  const cy = snap ? Math.round(ay / gridSize) * gridSize : ay
  const nx = Math.min(Math.max(0, cx), designW - item.w)
  const ny = Math.max(0, cy)
  onChange({ x: nx, y: ny })
      // request canvas growth if needed
      onCanvasNeed(nx + item.w, ny + item.h)
      onGuideChange(guides)
    }
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    onDragState(false)
    onGuideChange({ v: [], h: [] })
  }

  return (
    <div
      data-item-root
      className={`absolute shadow-sm ${selected? 'ring-2 ring-blue-400': ''}`}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z ?? 0 }}
    >
      <div className="h-full w-full bg-white/80 backdrop-blur border rounded-xl overflow-hidden">
        <div className="h-8 px-3 flex items-center justify-between text-xs text-gray-600 border-b bg-white/70 cursor-move select-none" onMouseDown={beginDrag}>
          <div className="flex items-center gap-2">
            <span>{item.kind}</span>
            <span className="text-gray-300">•</span>
            {item.kind==='CROSSWORD' && (
              <button onClick={(e)=>{e.stopPropagation();onConfigure();}} className="px-2 py-0.5 rounded border hover:bg-white">Configure</button>
            )}
            <button onClick={(e)=>{e.stopPropagation();onDuplicate();}} className="px-2 py-0.5 rounded border hover:bg-white">Duplicate</button>
            <button onClick={(e)=>{e.stopPropagation();onDelete();}} className="px-2 py-0.5 rounded border hover:bg-white text-red-600">Delete</button>
          </div>
          {/* drag-only header; resize handles are shown on selection below */}
        </div>
        {/* Resize handles (8 directions) */}
        {selected && (
          <>
            {/* corners */}
            <button data-handle="nw" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nwse-resize"
              style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="ne" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nesw-resize"
              style={{ top: 0, right: 0, transform: 'translate(50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="sw" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nesw-resize"
              style={{ bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }} onMouseDown={beginDrag} />
            <button data-handle="se" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nwse-resize"
              style={{ bottom: 0, right: 0, transform: 'translate(50%, 50%)' }} onMouseDown={beginDrag} />
            {/* edges */}
            <button data-handle="n" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-n-resize"
              style={{ top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="s" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-s-resize"
              style={{ bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} onMouseDown={beginDrag} />
            <button data-handle="w" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-w-resize"
              style={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="e" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-e-resize"
              style={{ right: 0, top: '50%', transform: 'translate(50%, -50%)' }} onMouseDown={beginDrag} />
          </>
        )}
  <div className="p-3 text-sm text-gray-700 h-[calc(100%-2rem)] overflow-auto sn-tool-content rounded-lg" style={{ background: (item.data?.bgColor as string) || 'transparent' }} onMouseDown={(e)=>{ 
    // For text tools, only trigger selection if clicking outside the editor
    if (item.kind === "TEXT") {
      const target = e.target as HTMLElement;
      // Check if the click is inside the BlockNote editor or textarea
      const isInsideEditor = target.closest('[contenteditable="true"]') || 
                            target.closest('textarea') || 
                            target.closest('.bn-editor') ||
                            target.closest('.bn-block-content') ||
                            target.tagName.toLowerCase() === 'textarea';
      if (!isInsideEditor) {
        e.stopPropagation(); 
        onSelect(); 
        onActivate(); 
      }
    } else {
      e.stopPropagation(); 
      onSelect(); 
      onActivate(); 
    }
  }}>
  {item.kind === "TEXT" && (
            <div className="h-full">
              <RichTextEditor 
                key={`${item.id}-${item.data?.html ? item.data.html.length : 0}`}
                initialHtml={item.data?.html || ''}
                onChange={(html, text) => {
                  onChange({ data: { ...item.data, html, text } })
                }}
              />
            </div>
          )}
          {item.kind === "IMAGE" && (()=>{
            const url: string = item.data?.url || ''
            const fit: 'contain'|'cover'|'fill' = item.data?.fit || 'contain'
            const alt: string = item.data?.alt || ''
            const caption: string = item.data?.caption || ''
            const gradient: string = item.data?.gradient || ''
            const set = (patch:any)=> onChange({ data: { ...item.data, ...patch } })
            return (
              <div className="h-full flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <input className="flex-1 border rounded px-2 py-1" placeholder="Image URL (https://...)" value={url} onChange={(e)=>set({ url: e.target.value, gradient: '' })} />
                  <select className="border rounded px-2 py-1" value={fit} onChange={(e)=>set({ fit: e.target.value })}>
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>
                <input className="border rounded px-2 py-1 text-xs" placeholder="Alt text" value={alt} onChange={(e)=>set({ alt: e.target.value })} />
                <input className="border rounded px-2 py-1 text-xs" placeholder="Caption (optional)" value={caption} onChange={(e)=>set({ caption: e.target.value })} />
                <div className="flex-1 min-h-40 bg-white/60 rounded p-2 grid place-items-center overflow-hidden">
                  {gradient ? (
                    <div className="w-full h-full rounded border border-gray-200" style={{ backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : url ? (
                    <img src={url} alt={alt || 'image'} className="w-full h-full rounded border border-gray-200" style={{ objectFit: fit }} />
                  ) : (
                    <div className="text-gray-500 text-sm">Paste an image URL to preview</div>
                  )}
                </div>
              </div>
            )
          })()}
          {item.kind === "FLASHCARDS" && (() => {
            const cards: Array<{id?:string;q:string;a:string}> = Array.isArray(item.data?.cards) ? item.data.cards : []
            const addCard = () => onChange({ data: { ...item.data, cards: [...cards, { id: crypto.randomUUID(), q: '', a: '' }] }})
            const setCard = (idx:number, patch: Partial<{q:string;a:string}>) => { const arr=[...cards]; arr[idx] = { ...arr[idx], ...patch } as any; onChange({ data: { ...item.data, cards: arr }}) }
            const delCard = (idx:number) => { const arr=[...cards]; arr.splice(idx,1); onChange({ data: { ...item.data, cards: arr }}) }
            const move = (idx:number, dir:number) => { const arr=[...cards]; const t=arr[idx+dir]; arr[idx+dir]=arr[idx]; arr[idx]=t; onChange({ data: { ...item.data, cards: arr }}) }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Flashcards ({cards.length})</div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={addCard}>+ Add</button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {cards.map((c, idx)=> (
                    <div key={c.id || idx} className="border rounded-lg p-2 bg-white/70">
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>#{idx+1}</span>
                        <div className="flex gap-1">
                          <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>move(idx,-1)}>Up</button>
                          <button className="px-1 py-0.5 border rounded" disabled={idx===cards.length-1} onClick={()=>move(idx,1)}>Down</button>
                          <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>delCard(idx)}>Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs mb-1">Question</div>
                          <input className="w-full border rounded p-2" value={c.q || ''} onChange={(e)=>setCard(idx,{ q: e.target.value })} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs mb-1">Answer</div>
                          <input className="w-full border rounded p-2" value={c.a || ''} onChange={(e)=>setCard(idx,{ a: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length===0 && <div className="text-gray-500">No cards yet. Add or use AI to suggest.</div>}
                </div>
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 mb-1">Live preview</div>
                  <div className="max-h-64 overflow-auto">
                    <FlashcardsViewer cards={cards.map(c=>({q:c.q||'', a:c.a||''}))} />
                  </div>
                </div>
              </div>
            )
          })()}
          {item.kind === "QUIZ" && <QuizEditor item={item} onChange={onChange} />}

          {item.kind === "CROSSWORD" && (() => {
            const rows = Number(item.data?.rows || 10)
            const cols = Number(item.data?.cols || 10)
            const words: any[] = Array.isArray(item.data?.words) ? item.data.words : []
            const setData = (patch: any) => onChange({ data: { ...item.data, ...patch } })
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label>Size 
                    <select className="w-full border rounded p-1" value={words.length > 15 ? 'large' : 'small'} onChange={(e) => {
                      // Size is now automatically determined by word count
                      // This selector is for reference only
                    }} disabled>
                      <option value="small">Small (15x15) - ≤15 words</option>
                      <option value="large">Large (24x24) - &gt;15 words</option>
                    </select>
                  </label>
                  <div className="flex items-end"><button className="px-2 py-1 border rounded w-full" onClick={() => setData({ words: [...words, { id: crypto.randomUUID(), row: 0, col: 0, dir: 'across', answer: '', clue: '' }] })}>+ Add word</button></div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {words.map((w: any, i: number) => (
                    <div key={w.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-1 items-center text-xs">
                      <input className="border rounded p-1" placeholder="Answer" value={w.answer || ''} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, answer: e.target.value.toUpperCase() }; setData({ words: arr }) }} />
                      <input className="border rounded p-1" placeholder="Clue" value={w.clue || ''} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, clue: e.target.value }; setData({ words: arr }) }} />
                      <select className="border rounded p-1" value={w.dir || 'across'} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, dir: e.target.value }; setData({ words: arr }) }}>
                        <option value="across">Across</option>
                        <option value="down">Down</option>
                      </select>
                      <input className="border rounded p-1 w-16" type="number" min={0} max={rows - 1} value={w.row || 0} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, row: Number(e.target.value) }; setData({ words: arr }) }} />
                      <input className="border rounded p-1 w-16" type="number" min={0} max={cols - 1} value={w.col || 0} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, col: Number(e.target.value) }; setData({ words: arr }) }} />
                    </div>
                  ))}
                  {words.length === 0 && <div className="text-xs text-gray-500">No words yet. Use + Add above or the AI Helper in the inspector.</div>}
                </div>
                <div className="border-t pt-2">
                  <CrosswordViewer words={words} />
                </div>
              </div>
            )
          })()}

          {item.kind === "VIDEO" && (() => {
            const url: string = item.data?.url || ''
            const autoplay: boolean = item.data?.autoplay || false
            const showControls: boolean = item.data?.showControls !== false
            const set = (patch: any) => onChange({ data: { ...item.data, ...patch } })
            return (
              <div className="h-full flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <input 
                    className="flex-1 border rounded px-2 py-1" 
                    placeholder="YouTube URL (https://youtube.com/watch?v=...)" 
                    value={url} 
                    onChange={(e) => set({ url: e.target.value })} 
                  />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={autoplay} 
                      onChange={(e) => set({ autoplay: e.target.checked })} 
                    />
                    Autoplay
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={showControls} 
                      onChange={(e) => set({ showControls: e.target.checked })} 
                    />
                    Show controls
                  </label>
                </div>
                <div className="flex-1 min-h-48 bg-white/60 rounded p-2 overflow-hidden">
                  <YouTubeViewer 
                    url={url} 
                    autoplay={autoplay} 
                    showControls={showControls} 
                  />
                </div>
              </div>
            )
          })()}
          
        </div>
      </div>
    </div>
  )
}

export default function LessonBuilder() {
  const { session } = useAuth()
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<PlacedTool[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Predefined lesson template for new lessons
  const createLessonTemplate = (): PlacedTool[] => [
    {
      id: crypto.randomUUID(),
      kind: 'TEXT',
      x: 40,
      y: 40,
      w: 600,
      h: 240,
      z: 1,
      data: {
        html: '<h2>Lesson Introduction</h2><p>Welcome to your new lesson! Edit this text to introduce the topic and learning objectives.</p>',
        text: 'Lesson Introduction\nWelcome to your new lesson! Edit this text to introduce the topic and learning objectives.'
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'IMAGE',
      x: 680,
      y: 40,
      w: 480,
      h: 320,
      z: 1,
      data: {
        url: '',
        alt: 'Add an image to support your lesson content',
        caption: 'Supporting Image'
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'TEXT',
      x: 40,
      y: 320,
      w: 600,
      h: 240,
      z: 1,
      data: {
        html: '<h3>Main Content</h3><p>Add your primary lesson content here. Explain key concepts, provide examples, and guide students through the learning material.</p>',
        text: 'Main Content\nAdd your primary lesson content here. Explain key concepts, provide examples, and guide students through the learning material.'
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'FLASHCARDS',
      x: 40,
      y: 600,
      w: 600,
      h: 260,
      z: 1,
      data: {
        cards: [
          { front: 'Key Term 1', back: 'Definition or explanation of the first important concept' },
          { front: 'Key Term 2', back: 'Definition or explanation of the second important concept' },
          { front: 'Key Term 3', back: 'Definition or explanation of the third important concept' }
        ]
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'VIDEO',
      x: 680,
      y: 400,
      w: 640,
      h: 360,
      z: 1,
      data: {
        url: '',
        title: 'Educational Video',
        description: 'Add a video URL to enhance your lesson with multimedia content'
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'QUIZ',
      x: 40,
      y: 900,
      w: 600,
      h: 220,
      z: 1,
      data: {
        questions: [
          {
            question: 'What is the main topic of this lesson?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0,
            explanation: 'This question helps assess understanding of the lesson topic.'
          },
          {
            question: 'Which concept is most important to remember?',
            options: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'],
            correct: 1,
            explanation: 'This reinforces key learning objectives.'
          }
        ]
      }
    },
    {
      id: crypto.randomUUID(),
      kind: 'TEXT',
      x: 680,
      y: 800,
      w: 600,
      h: 240,
      z: 1,
      data: {
        html: '<h3>Lesson Summary</h3><p>Summarize the key takeaways from this lesson. What should students remember? How does this connect to future learning?</p>',
        text: 'Lesson Summary\nSummarize the key takeaways from this lesson. What should students remember? How does this connect to future learning?'
      }
    }
  ]
  const [activeId, setActiveId] = useState<string | null>(null)
  const [meta, setMeta] = useState({ title: "", topicId: "", topic: "", grade: 3, vanta: "globe", difficulty: 2 as 1|2|3 })
  const [topics, setTopics] = useState<Array<{id: string; title: string; grade_level: string | null}>>([])
  const [lessonId, setLessonId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [guides, setGuides] = useState<GuideLines>({ v: [], h: [] })
  const [zoom, setZoom] = useState(1)
  const [device, setDevice] = useState<'desktop'|'mobile'>('desktop')
  // Dynamic canvas that can grow as content expands
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 800 })
  // Canvas panning when zoomed
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{x:number;y:number;mx:number;my:number;lastMx:number;lastMy:number;lastT:number}|null>(null)
  const inertiaRef = useRef<number | null>(null)
  // Viewport size (visible area) for proper pan clamping
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const userZoomedRef = useRef(false)
  const clampPan = (z:number, p:{x:number;y:number}) => {
    const scaledW = 1280 * z
    const scaledH = canvasSize.h * z
    const minX = Math.min(0, viewportSize.w - scaledW)
    const minY = Math.min(0, viewportSize.h - scaledH)
    return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) }
  }
  useEffect(()=>{
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      try {
        const r = el.getBoundingClientRect()
        setViewportSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
      } catch {}
    }
    update()
    let ro: ResizeObserver | null = null
    try {
      if ('ResizeObserver' in window) {
        ro = new ResizeObserver(() => update())
        if (el instanceof Element) ro.observe(el)
      }
    } catch {}
    window.addEventListener('resize', update)
    return () => { try { ro?.disconnect() } catch {}; window.removeEventListener('resize', update) }
  }, [])
  // Clamp pan if zoom changes
  // Auto-fit zoom on first layout; then preserve user overrides. Always clamp pan on changes.
  useEffect(()=>{
    if (!viewportSize.w || !viewportSize.h) return
    if (!userZoomedRef.current) {
      // Fit width only; min zoom is width-fit, max 100%
      const fitW = viewportSize.w / 1280
      const clampedFit = Math.max(Math.min(fitW, 1), 0.3)
      setZoom(clampedFit)
      setPan({ x: 0, y: 0 })
    } else {
      setPan(prev => clampPan(zoom, prev))
    }
  }, [viewportSize.w, viewportSize.h, canvasSize.h])
  useEffect(()=>{ setPan(prev => clampPan(zoom, prev)) }, [zoom])
  useEffect(() => {
    try { document.documentElement.setAttribute('data-canvas-scale', String(zoom)) } catch {}
    return () => { try { document.documentElement.removeAttribute('data-canvas-scale') } catch {} }
  }, [zoom])
  // Non-passive wheel handler for zooming to avoid passive event error
  useEffect(()=>{
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      // zoom with wheel; keep point under cursor stable
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const z0 = zoom
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const z1 = Math.max(0.5, Math.min(1.5, Number((z0 * factor).toFixed(2))))
      if (z1 === z0) return
      userZoomedRef.current = true
      const cx = (mouseX - pan.x) / z0
      const cy = (mouseY - pan.y) / z0
      const newPan = { x: mouseX - cx * z1, y: mouseY - cy * z1 }
      setZoom(z1)
      setPan(prev => clampPan(z1, newPan))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel as any) }
  }, [zoom, pan.x, pan.y])
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const firstLoadRef = useRef(true)
  const [showMetaDialog, setShowMetaDialog] = useState(true)

  const addTool = (k: ToolKind) => {
    const size = defaultSize[k]
  const y = items.length ? Math.max(...items.map(i => i.y + i.h)) + 40 : 40
  const id = crypto.randomUUID()
  const next = [...items, { id, kind: k, x: 40, y, w: size.w, h: size.h, data: {} }]
  setItems(next)
  // Grow canvas if needed
  const needW = 40 + size.w + 40
  const needH = y + size.h + 40
  setCanvasSize(prev => ({ w: Math.max(prev.w, needW), h: Math.max(prev.h, needH) }))
  }

  const updateItem = (id: string, patch: Partial<PlacedTool>) => setItems(prev => prev.map(it => it.id===id? { ...it, ...patch }: it))

  const vGridLines = useMemo(() => Array.from({ length: Math.ceil((1280+400) / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize])
  const hGridLines = useMemo(() => Array.from({ length: Math.ceil((canvasSize.h+800) / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize, canvasSize.h])

  // Helper to request canvas growth from children
  const requestCanvasSize = useCallback((_needW:number, needH:number)=>{
    setCanvasSize(prev => {
      const h = needH > prev.h ? Math.ceil((needH + 80) / gridSize) * gridSize : prev.h
      return h === prev.h ? prev : { w: 1280, h }
    })
  }, [gridSize])

  // Load by id if in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id || !session) return
    ;(async () => {
      try {
        const token = session.access_token
        const res = await fetch(`/api/lessons?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (json?.lesson) {
          setLessonId(json.lesson.id)
          const l = json.lesson
          setMeta({ title: l.title || '', topicId: '', topic: l.topic || '', grade: l.grade_level || 3, vanta: l.vanta_effect || 'globe', difficulty: (l.layout_json?.meta?.difficulty ?? 2) as 1|2|3 })
          setItems(Array.isArray(l.layout_json?.items) ? l.layout_json.items : [])
          // Initialize dynamic canvas height (width fixed to 1280)
          const savedH = Number(l.layout_json?.meta?.canvasHeight) || 0
          if (savedH > 0) {
            setCanvasSize({ w: 1280, h: Math.max(800, savedH) })
          } else {
            const maxH = Math.max(800, ...((l.layout_json?.items||[]).map((it:any)=> (Number(it.y)||0) + (Number(it.h)||0)) as number[]), 0)
            setCanvasSize({ w: 1280, h: Math.ceil((maxH + 40)/gridSize)*gridSize })
          }
        }
      } catch (e) {
        console.error('Failed to load lesson', e)
      }
    })()
  }, [session])

  // Load topics for the selector
  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const res = await fetch('/api/topics?limit=200')
        if (res.ok) {
          const data = await res.json()
          setTopics(data.items || [])
        }
      } catch (error) {
        console.error('Failed to load topics:', error)
      }
    })()
  }, [session])

  // Update topic title when topicId changes
  useEffect(() => {
    if (meta.topicId && topics.length > 0) {
      const selectedTopic = topics.find(t => t.id === meta.topicId)
      if (selectedTopic && selectedTopic.title !== meta.topic) {
        setMeta(prev => ({ ...prev, topic: selectedTopic.title }))
      }
    }
  }, [meta.topicId, topics])

  // Load template for new lessons (when no ID in URL and items are empty)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    
    // Only initialize template for completely new lessons (no ID and no existing items)
    if (!id && items.length === 0 && session) {
      const template = createLessonTemplate()
      setItems(template)
      
      // Calculate canvas height to accommodate all template items
      const maxY = Math.max(...template.map(item => item.y + item.h))
      const templateHeight = Math.ceil((maxY + 80) / gridSize) * gridSize
      setCanvasSize(prev => ({ 
        w: 1280, 
        h: Math.max(800, templateHeight)
      }))
    }
  }, [session, items.length, gridSize])

  const saveDraft = async (opts?: { silent?: boolean }): Promise<string | null> => {
  if (!session) { toast({ title: 'Sign in required', description: 'Please sign in to save your work.', variant: 'warning' }); return null }
    try {
      // Enforce required meta fields only for explicit actions (not autosave)
      if (!meta.title.trim() || !meta.topicId.trim() || !meta.grade || !meta.vanta) {
  if (!opts?.silent) { setShowMetaDialog(true); toast({ title: 'Lesson settings needed', description: 'Fill in title, topic, grade, and background before saving.', variant: 'info' }) }
        return null
      }
      const token = session.access_token
      const payload = {
        id: lessonId || undefined,
        title: meta.title,
        topic: meta.topic,
        topic_id: meta.topicId,
        grade_level: meta.grade,
        vanta_effect: meta.vanta,
  layout_json: { items, meta: { difficulty: meta.difficulty, designWidth: 1280, designHeight: 800, canvasWidth: 1280, canvasHeight: canvasSize.h } },
        status: 'draft',
      }
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Save failed')
      setLessonId(json.lesson.id)
  if (!opts?.silent) toast({ title: 'Draft saved', description: 'Your lesson was saved as a draft.', variant: 'success' })
      return json.lesson.id as string
    } catch (e:any) {
  toast({ title: 'Save failed', description: String(e.message || e), variant: 'destructive' })
      return null
    }
  }
  // Autosave when items/meta change (skip while settings dialog is open)
  useEffect(() => {
    if (firstLoadRef.current) { firstLoadRef.current = false; return }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => { if (!showMetaDialog) saveDraft({ silent: true }) }, 1500)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [items, meta.title, meta.topic, meta.grade, meta.vanta, showMetaDialog])
  const [showPreview, setShowPreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop'|'tablet'|'phone'>('desktop')
  const previewWidth = previewDevice==='desktop' ? 1280 : previewDevice==='tablet' ? 834 : 390
  const previewScale = previewDevice==='desktop' ? 1 : previewDevice==='tablet' ? 1 : 1
  const preview = () => {
    // Open in-app non-navigable preview overlay (avoids storage quota and new tab)
    setShowPreview(true)
  }
  const publish = async () => {
    if (!session) { toast({ title: 'Sign in required', description: 'Please sign in to publish your lesson.', variant: 'warning' }); return }
    try {
      // Ensure save first
  const savedId = await saveDraft({ silent: false })
  const idToPublish = savedId || lessonId
  if (!idToPublish) throw new Error('No lesson id to publish')
      const token = session.access_token
  const res = await fetch('/api/lessons/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: idToPublish }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Publish failed')
      toast({ title: 'Lesson published', description: 'Your lesson is now live for students.', variant: 'success' })
    } catch (e:any) { toast({ title: 'Publish failed', description: String(e.message || e), variant: 'destructive' }) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <div className="h-screen w-full grid" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <LeftPalette onAdd={addTool} onOpenSettings={()=>setShowMetaDialog(true)} />
          <div className="relative overflow-y-auto" tabIndex={0} onKeyDown={(e)=>{
            if (!selectedId || activeId) return
            const delta = e.shiftKey ? 10 : 1
            const sel = items.find(i=>i.id===selectedId)
            if (!sel) return
            // Global shortcuts
            if (e.ctrlKey && (e.key==='0' || e.code==='Digit0')) {
              e.preventDefault()
              userZoomedRef.current = true
              setZoom(1)
              setPan(prev=> clampPan(1, { x: 0, y: 0 }))
              return
            }
            if (e.ctrlKey && (e.key==='1' || e.code==='Digit1')) {
              e.preventDefault()
              userZoomedRef.current = true
              const fit = Math.min(viewportSize.w / canvasSize.w, viewportSize.h / canvasSize.h)
              const z = Math.max(0.5, Math.min(1.5, Number(fit.toFixed(2))))
              setZoom(z)
              setPan(prev=> clampPan(z, { x: 0, y: 0 }))
              return
            }
            if (e.key==='ArrowLeft') { e.preventDefault(); const nx = Math.max(0, sel.x - delta); updateItem(sel.id, { x: nx }); setCanvasSize(prev=> ({ w: prev.w, h: Math.max(prev.h, sel.y + sel.h + 40) })) }
            if (e.key==='ArrowRight') { e.preventDefault(); const nx = sel.x + delta; updateItem(sel.id, { x: nx }); setCanvasSize(prev=> ({ w: Math.max(prev.w, nx + sel.w + 40), h: Math.max(prev.h, sel.y + sel.h + 40) })) }
            if (e.key==='ArrowUp') { e.preventDefault(); const ny = Math.max(0, sel.y - delta); updateItem(sel.id, { y: ny }); setCanvasSize(prev=> ({ w: Math.max(prev.w, sel.x + sel.w + 40), h: prev.h })) }
            if (e.key==='ArrowDown') { e.preventDefault(); const ny = sel.y + delta; updateItem(sel.id, { y: ny }); setCanvasSize(prev=> ({ w: Math.max(prev.w, sel.x + sel.w + 40), h: Math.max(prev.h, ny + sel.h + 40) })) }
            if (e.key==='Delete') {
              e.preventDefault()
              confirmDialog({ 
                title: 'Delete selected block?', 
                description: 'This will permanently remove the selected block from your lesson.',
                actionText: 'Delete', 
                cancelText: 'Cancel', 
                variant: 'destructive' 
              })
                .then(ok => {
                  if (ok) {
                    const prevItems = items
                    setItems(prev=>prev.filter(i=>i.id!==selectedId))
                    const t = toast({
                      title: 'Block deleted',
                      variant: 'success',
                      action: (
                        <ToastAction altText="Undo" onClick={() => {
                          setItems(prevItems)
                          t.dismiss()
                          toast({ title: 'Block restored', variant: 'success' })
                        }}>Undo</ToastAction>
                      ),
                    })
                  }
                })
            }
      }} onMouseDown={(e)=>{
            // clicking empty canvas clears active tool
            if (!(e.target as HTMLElement).closest('.sn-tool-content')) setActiveId(null)
      }}>
            {/* Overlay toolbar: outside canvas, always on top */}
  <div className="pointer-events-none absolute top-6 right-6 z-[40]">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-xl px-4 py-2 text-sm shadow-xl border border-white/50">
                <label className="flex items-center gap-2 font-medium text-gray-700">
                  <input type="checkbox" checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-white/80 border-gray-300 rounded focus:ring-indigo-500" /> 
                  Grid
                </label>
                <div className="w-px h-4 bg-gray-300"></div>
                <label className="flex items-center gap-2 font-medium text-gray-700">
                  <input type="checkbox" checked={snapToGrid} onChange={(e)=>setSnapToGrid(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-white/80 border-gray-300 rounded focus:ring-indigo-500" /> 
                  Snap
                </label>
                <div className="w-px h-4 bg-gray-300"></div>
                <select className="bg-white/80 backdrop-blur border border-white/50 rounded-lg px-2 py-1 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={gridSize} onChange={(e)=>setGridSize(Number(e.target.value))}>
                  {[10,20,40].map(gs => <option key={gs} value={gs}>{gs}px</option>)}
                </select>

        {/* Preview Overlay (non-navigable, scrollable, tools interactive) */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] p-0 overflow-hidden">
            {/* Accessibility title/description for Radix Dialog */}
            <DialogHeader className="sr-only">
              <DialogTitle>Lesson Preview</DialogTitle>
              <DialogDescription>Non-navigable preview of the lesson layout</DialogDescription>
            </DialogHeader>
            <div className="h-[85vh] w-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/30 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{meta.title || 'Lesson Preview'}</h2>
                <p className="text-sm text-gray-600 mt-1">Topic: {meta.topic || 'N/A'} • Grade {meta.grade || 'N/A'} • Preview is non-navigable</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur border border-white/50 px-4 py-2 shadow-lg">
                  <span className="text-gray-700 font-medium text-sm">Device:</span>
                  <button className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${previewDevice==='desktop'?'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md':'bg-white/70 hover:bg-white/90 text-gray-700'}`} onClick={()=>setPreviewDevice('desktop')}>Desktop</button>
                  <button className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${previewDevice==='tablet'?'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md':'bg-white/70 hover:bg-white/90 text-gray-700'}`} onClick={()=>setPreviewDevice('tablet')}>Tablet</button>
                  <button className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${previewDevice==='phone'?'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md':'bg-white/70 hover:bg-white/90 text-gray-700'}`} onClick={()=>setPreviewDevice('phone')}>Phone</button>
                </div>
              </div>
              {/* Scrollable body */}
              <div className="flex-1 overflow-auto">
                <VantaBackground effect={(meta.vanta || 'globe') as any} lessonBuilder={true}>
                  <div className="px-4 py-5">
                    <div className="relative mb-4 mx-auto rounded-3xl backdrop-blur-[2px] p-6" style={{ width: previewWidth }}>
                      <h3 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent mb-1">{meta.title || 'Lesson Preview'}</h3>
                      <p className="text-slate-200/90">Topic: {meta.topic || 'N/A'} • Grade {meta.grade || 'N/A'}</p>
                    </div>
                    <div className="mx-auto rounded-2xl backdrop-blur-[2px]" style={{ width: previewWidth }}>
                      <div className="relative overflow-hidden" style={{ width: previewWidth, minHeight: canvasSize.h, transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                          {items.map((it)=> (
                        <div key={it.id} className="absolute p-2" style={{ left: it.x||0, top: it.y||0, width: Math.max(240, it.w||600), height: Math.max(160, it.h||220), overflow: 'auto', zIndex: it.z ?? 0 }}>
                          {it.kind === 'TEXT' && (
                            <StudentToolCard variant="text" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                              <div className="richtext">
                                {it.data?.html ? (
                                  <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                                ) : (
                                  <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                                )}
                              </div>
                            </StudentToolCard>
                          )}
                          {it.kind === 'FLASHCARDS' && (()=>{
                            const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards)
                              ? it.data.cards
                              : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                            const storageKey = `sn-preview-flash:${it.id}`
                            return (
                              <StudentToolCard variant="flashcards" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                                <FlashcardsViewer cards={cards} storageKey={storageKey} />
                              </StudentToolCard>
                            )
                          })()}
                          {it.kind === 'QUIZ' && (()=>{
                            const qItems = Array.isArray(it.data?.items) ? it.data.items : []
                            if (!qItems.length) return <div className="text-gray-600">Quiz not available</div>
                            const storageKey = `sn-preview-quiz:${it.id}`
                            return (
                              <StudentToolCard variant="quiz" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                                <QuizViewer items={qItems} storageKey={storageKey} />
                              </StudentToolCard>
                            )
                          })()}
                          {it.kind === 'IMAGE' && (()=>{
                            const url = it.data?.url as string | undefined
                            const gradient = it.data?.gradient as string | undefined
                            const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                            const alt = (it.data?.alt as string) || 'image'
                            const caption = it.data?.caption as string | undefined
                            return (
                              <StudentToolCard variant="image" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                                {/* Use ImageViewer in canvas mode; external navigation disabled by absence of Navbar */}
                                <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="canvas" />
                              </StudentToolCard>
                            )
                          })()}
                          {it.kind === 'CROSSWORD' && (()=>{
                            const rows = Number(it.data?.rows || 10)
                            const cols = Number(it.data?.cols || 10)
                            const words = Array.isArray(it.data?.words) ? it.data.words : []
                            if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                            const storageKey = `sn-preview-crossword:${it.id}`
                            return (
                              <StudentToolCard variant="crossword" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                                <CrosswordViewer words={words} storageKey={storageKey} />
                              </StudentToolCard>
                            )
                          })()}
                          {it.kind === 'VIDEO' && (()=>{
                            const url = it.data?.url as string | undefined
                            const autoplay = it.data?.autoplay as boolean | undefined
                            const showControls = it.data?.showControls !== false
                            return (
                              <StudentToolCard variant="video" bodyBgColor={it.data?.bgColor as string | undefined} accentIntensity={it.data?.accentIntensity}>
                                <YouTubeViewer url={url} autoplay={autoplay} showControls={showControls} />
                              </StudentToolCard>
                            )
                          })()}
                        </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </VantaBackground>
              </div>
            </div>
          </DialogContent>
        </Dialog>
                <div className="w-px h-4 bg-gray-300"></div>
                <button title="Zoom out" className="p-2 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all" onClick={()=>{ userZoomedRef.current = true; setZoom(z=>Math.max(0.5, Math.round((z-0.1)*10)/10)) }}><ZoomOut className="h-4 w-4 text-gray-700"/></button>
                <span className="px-2 py-1 font-semibold text-gray-700 min-w-[3rem] text-center">{Math.round(zoom*100)}%</span>
    <button title="Zoom in" className="p-2 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all" onClick={()=>{ userZoomedRef.current = true; setZoom(z=>Math.min(1.5, Math.round((z+0.1)*10)/10)) }}><ZoomIn className="h-4 w-4 text-gray-700"/></button>
        <button title="100%" className="px-3 py-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all font-medium text-gray-700" onClick={()=>{ userZoomedRef.current = true; setZoom(1); setPan(prev=>clampPan(1,{x:0,y:0})) }}>100%</button>
  <button title="Fit" className="px-3 py-1.5 bg-white/80 backdrop-blur border border-white/50 rounded-lg hover:bg-white/90 shadow-sm transition-all font-medium text-gray-700" onClick={()=>{ userZoomedRef.current = true; const fit = Math.min(viewportSize.w/canvasSize.w, viewportSize.h/canvasSize.h); const z = Math.max(0.5, Math.min(1.5, Number(fit.toFixed(2)))); setZoom(z); setPan(prev=>clampPan(z,{x:0,y:0})) }}>Fit</button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button title="Toggle device" className={`px-3 py-1.5 border rounded-lg shadow-sm transition-all font-medium ${device==='mobile'?'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500':'bg-white/80 backdrop-blur border-white/50 hover:bg-white/90 text-gray-700'}`} onClick={()=>setDevice(d=> d==='desktop'?'mobile':'desktop')}><MonitorSmartphone className="h-4 w-4"/></button>
              </div>
            </div>
            {/* Editor viewport */}
            <div className="relative mx-4 my-6 rounded-xl border overflow-hidden">
        {/* Visible area that we auto-fit into; wheel-zoom centers on cursor */}
        <div
          ref={viewportRef}
          className="relative flex items-center justify-center p-4 bg-transparent"
          data-canvas-scale={zoom}
        >
                  {/* Unscaled wrapper matching design size for alignment box */}
                  <div
                    className="relative shadow-inner rounded-xl overflow-hidden bg-white/0"
                    style={{ width: 1280, height: canvasSize.h, cursor: zoom>1 ? (isPanning? 'grabbing':'grab') : 'default' }}
                    onMouseDown={(e)=>{
                      // Start panning only when clicking the wrapper itself (empty space) with primary button,
                      // or with middle button anywhere
                      const el = e.target as HTMLElement
                      const isWrapper = el === e.currentTarget
                      const overItem = !!el.closest('[data-item-root]')
                      if (e.button === 1 || (e.button === 0 && isWrapper && !overItem)) {
                        e.preventDefault()
                        // cancel any running inertia
                        if (inertiaRef.current) { cancelAnimationFrame(inertiaRef.current); inertiaRef.current = null }
                        panStartRef.current = { x: pan.x, y: pan.y, mx: e.clientX, my: e.clientY, lastMx: e.clientX, lastMy: e.clientY, lastT: performance.now() }
                        setIsPanning(true)
                        const onMove = (ev: MouseEvent) => {
                          if (!panStartRef.current) return
                          // If user moved over an item root during drag, stop panning to allow item drag
                          const target = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null
                          if (target && target.closest('[data-item-root]')) return
                          const dx = ev.clientX - panStartRef.current.mx
                          const dy = ev.clientY - panStartRef.current.my
                          // compute velocity samples
                          const now = performance.now()
                          const dt = Math.max(1, now - panStartRef.current.lastT)
                          const vx = (ev.clientX - panStartRef.current.lastMx) / dt
                          const vy = (ev.clientY - panStartRef.current.lastMy) / dt
                          panStartRef.current.lastMx = ev.clientX
                          panStartRef.current.lastMy = ev.clientY
                          panStartRef.current.lastT = now
                          // translate canvas; clamp within zoomed bounds
                          const nx = panStartRef.current.x + dx
                          const ny = panStartRef.current.y + dy
                          const scaledW = canvasSize.w * zoom
                          const scaledH = canvasSize.h * zoom
                          const minX = Math.min(0, viewportSize.w - scaledW)
                          const minY = Math.min(0, viewportSize.h - scaledH)
                          setPan({ x: Math.min(0, Math.max(minX, nx)), y: Math.min(0, Math.max(minY, ny)) })
                        }
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                          // inertia using last recorded deltas
                          const start = panStartRef.current
                          panStartRef.current = null
                          setIsPanning(false)
                          if (!start || zoom <= 1) return
                          // use last sample velocity in px/ms
                          let vx = 0, vy = 0
                          // initialize with zero; we'll compute deltas from last two samples captured in move handler
                          vx = 0; vy = 0
                          const friction = 0.92
                          const step = () => {
                            // apply velocities
                            setPan(prev => {
                              const nx = prev.x + vx * 16
                              const ny = prev.y + vy * 16
                              const scaledW = canvasSize.w * zoom
                              const scaledH = canvasSize.h * zoom
                              const minX = Math.min(0, viewportSize.w - scaledW)
                              const minY = Math.min(0, viewportSize.h - scaledH)
                              return { x: Math.min(0, Math.max(minX, nx)), y: Math.min(0, Math.max(minY, ny)) }
                            })
                            // decay
                            vx *= friction
                            vy *= friction
                            if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) { inertiaRef.current = null; return }
                            inertiaRef.current = requestAnimationFrame(step)
                          }
                          // seed velocity from last mousemove delta if available using a micro history via event listeners (not stored);
                          // to keep it simple we won't seed; inertia will be minimal unless we enhance with a velocity buffer later.
                          // Start only if zoomed and user was actually dragging
                          if (zoom > 1) inertiaRef.current = requestAnimationFrame(step)
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }
                    }}
                  >
                    {/* Scaled canvas content (includes Vanta and grid) */}
          <div
                      ref={canvasRef}
                      className="relative"
                      style={{
            width: canvasSize.w,
            height: canvasSize.h,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'top left',
                        backgroundColor: 'transparent'
                      }}
                    >
                      {/* No Vanta in builder */}
            {/* Grid overlay (allows clicks through) */}
                      {showGrid && (
                        <div
                          aria-hidden
              className="pointer-events-none absolute inset-0"
                          style={{
                            backgroundImage:
                              `repeating-linear-gradient(0deg, rgba(60,64,67,0.15) 0, rgba(60,64,67,0.15) 1px, transparent 1px, transparent ${gridSize}px),` +
                              `repeating-linear-gradient(90deg, rgba(60,64,67,0.15) 0, rgba(60,64,67,0.15) 1px, transparent 1px, transparent ${gridSize}px)`
                          }}
                        />
                      )}
                      {/* alignment guides */}
                      {guides.v.map((x,i)=>(<div key={`gv-${i}`} className="absolute top-0 bottom-0 w-px bg-rose-400/70" style={{left:x}}/>))}
                      {guides.h.map((y,i)=>(<div key={`gh-${i}`} className="absolute left-0 right-0 h-px bg-rose-400/70" style={{top:y}}/>))}
                      {/* Student viewport frame at 100% (1280×800) */}
                      <div className="pointer-events-none absolute border-2 border-indigo-300/60 rounded" style={{ width: 1280, height: 800, left: 0, top: 0 }} />
                      {/* items */}
                      {items.map(it => (
                      <Draggable
                        key={it.id}
                        item={it}
                        selected={selectedId === it.id}
                        onSelect={()=>setSelectedId(it.id)}
                        onActivate={()=>setActiveId(it.id)}
                        onChange={(p)=>updateItem(it.id,p)}
                        onConfigure={()=>setShowMetaDialog(true)}
                        onDuplicate={()=>setItems(prev=>{ const copy={...it,id:crypto.randomUUID(),y:it.y+20,x:it.x+20}; return [...prev, copy] })}
                        onDelete={async ()=>{
                          const ok = await confirmDialog({ 
                            title: 'Delete this block?', 
                            description: 'This will permanently remove this block from your lesson.',
                            actionText: 'Delete', 
                            cancelText: 'Cancel', 
                            variant: 'destructive' 
                          })
                          if (ok) {
                            const prevItems = items
                            setItems(prev=>prev.filter(x=>x.id!==it.id))
                            const t = toast({
                              title: 'Block deleted',
                              variant: 'success',
                              action: (
                                <ToastAction altText="Undo" onClick={() => {
                                  setItems(prevItems)
                                  t.dismiss()
                                  toast({ title: 'Block restored', variant: 'success' })
                                }}>Undo</ToastAction>
                              ),
                            })
                          }
                        }}
                        onDragState={setDragging}
                        snap={snapToGrid}
                        gridSize={gridSize}
                        allItems={items}
                        onGuideChange={setGuides}
                        canvasH={canvasSize.h}
                        onCanvasNeed={requestCanvasSize}
                      />
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          <RightInspector items={items} selectedId={selectedId} onSelect={setSelectedId} onSave={saveDraft as any} onPreview={preview} onPublish={publish as any} meta={meta} onReorder={(id, action)=>{
            setItems(prev=>{
              const arr = prev.slice()
              const idx = arr.findIndex(i=>i.id===id)
              if (idx<0) return prev
              const maxZ = Math.max(0, ...arr.map(i=>i.z ?? 0))
              const minZ = Math.min(0, ...arr.map(i=>i.z ?? 0))
              const currentZ = arr[idx].z ?? 0
              if (action==='up') arr[idx].z = currentZ + 1
              if (action==='down') arr[idx].z = currentZ - 1
              if (action==='front') arr[idx].z = maxZ + 1
              if (action==='back') arr[idx].z = minZ - 1
              return arr
            })
          }} onUpdateSelected={(patch)=>{
            if (!selectedId) return; setItems(prev=>prev.map(i=> i.id===selectedId? { ...i, ...patch }: i))
          }} />
        </div>
      </RoleGuard>

      {/* Lesson settings modal */}
      <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Lesson Settings</DialogTitle>
            <DialogDescription className="text-gray-600">These details are required to save your lesson. You can adjust them anytime.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lesson Title</label>
              <input 
                className="w-full bg-white/80 backdrop-blur border border-white/50 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                placeholder="Enter lesson title" 
                value={meta.title} 
                onChange={(e)=>setMeta({...meta,title:e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Topic</label>
              <TopicSelect 
                value={meta.topicId} 
                onChange={(topicId: string) => setMeta({...meta, topicId})} 
                className="w-full bg-white/80 backdrop-blur border border-white/50 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                gradeFilter={meta.grade}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Grade</label>
                <select 
                  className="w-full bg-white/80 backdrop-blur border border-white/50 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  value={meta.grade} 
                  onChange={(e) => {
                    const newGrade = Number(e.target.value);
                    setMeta({...meta, grade: newGrade, topicId: ''}); // Clear topic when grade changes
                  }}
                >
                  {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{`Grade ${g}`}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Effect</label>
                <select 
                  className="w-full bg-white/80 backdrop-blur border border-white/50 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  value={meta.vanta} 
                  onChange={(e)=>setMeta({...meta,vanta:e.target.value})}
                >
                  {['globe','birds','halo','net','topology','clouds2','rings','cells','waves','fog'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                <select 
                  className="w-full bg-white/80 backdrop-blur border border-white/50 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  value={meta.difficulty} 
                  onChange={(e)=>setMeta({...meta,difficulty: Number(e.target.value) as 1|2|3})}
                >
                  <option value={1}>Easy</option>
                  <option value={2}>Moderate</option>
                  <option value={3}>Challenging</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" className="bg-white/80 backdrop-blur border-white/50 hover:bg-white/90 shadow-sm" onClick={()=>setShowMetaDialog(false)}>Close</Button>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg" onClick={()=>setShowMetaDialog(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
