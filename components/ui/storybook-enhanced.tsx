"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Volume2, VolumeX, Book, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VantaBackground } from "@/components/vanta-background"
import { InteractiveMinigame, type MinigameData } from "@/components/interactive"
import { ProfessorNovaPopup } from "@/components/ui/ProfessorNovaPopup"
import { storybookSounds } from "./storybook-sounds"
import "./storybook.css"

interface StoryPage {
  id: string
  content: string
  backgroundImage?: string
  title?: string
  backgroundPrompt?: string
  vantaEffect?: string
  quizQuestion?: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }
  minigame?: MinigameData
  choices?: { text: string; nextPageId: string; consequences?: string[] }[]
  
  // Advanced Features
  dynamicChoicePrompt?: string // For AI-generated choices
  consequences?: { [choiceId: string]: string[] } // Track consequences from earlier choices
  prerequisites?: string[] // Required choices/actions to access this page
  collectibles?: { id: string; name: string; description: string }[] // Items students can collect
  progressWeight?: number // How much this page contributes to story completion (0-1)
}

interface StorybookProps {
  pages: StoryPage[]
  title: string
  onClose: () => void
  adventureId?: string
  gradeLevel?: number
  discussionPrompts?: {
    openingQuestion: string
    followUpQuestions: string[]
    encouragementPhrase: string
  }
  reflectionQuestions?: string[]
}

// New interfaces for advanced features
interface ConsequenceSystem {
  choiceHistory: { pageId: string; choiceText: string; choiceId: string }[]
  inventory: { id: string; name: string; description: string; acquiredAt: string }[]
  storyProgress: number // 0-100
  completedPages: Set<string>
  consequences: { [pageId: string]: string[] } // Track consequences by page
}

interface DynamicChoice {
  text: string
  nextPageId: string
  consequences: string[]
  requiresItems?: string[]
  probability?: number // For conditional choices
}

interface ProgressIndicator {
  currentPage: number
  totalPages: number
  completionPercentage: number
  pagesVisited: Set<string>
  choicesMade: number
  itemsCollected: number
}

// Enhanced state for the storybook
interface EnhancedStoryPage extends StoryPage {
  vantaEffect?: string
  imageType?: string
  fromCache?: boolean
}

// Interactive word definitions
const GLOSSARY: Record<string, string> = {
  paleontologist: "A scientist who studies fossils and ancient life",
  fossils: "Preserved remains or traces of ancient organisms",
  excavation: "The process of carefully digging to uncover buried artifacts",
  specimen: "A sample or example used for scientific study",
  sedimentary: "Rock formed by layers of material deposited over time",
  prehistoric: "Relating to the time before written history",
  archaeology: "The study of human history through excavation of artifacts",
  geology: "The science that studies the Earth's structure and processes"
}

// Background images for different themes
const THEME_BACKGROUNDS: Record<string, string> = {
  desert: "linear-gradient(135deg, #f4a460 0%, #daa520 50%, #cd853f 100%)",
  jungle: "linear-gradient(135deg, #228b22 0%, #32cd32 50%, #006400 100%)",
  ocean: "linear-gradient(135deg, #4682b4 0%, #87ceeb 50%, #191970 100%)",
  space: "linear-gradient(135deg, #191970 0%, #483d8b 50%, #000000 100%)",
  laboratory: "linear-gradient(135deg, #f0f8ff 0%, #e6e6fa 50%, #d3d3d3 100%)",
  default: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #f59e0b 100%)"
}

// Get appropriate theme background based on content
function getThemeBackground(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  const themeMap = Object.entries(THEME_BACKGROUNDS).find(([key]) => 
    key !== 'default' && lowerPrompt.includes(key)
  )
  
  return themeMap ? themeMap[1] : THEME_BACKGROUNDS.default
}

// Get appropriate Vanta effect based on story content
function getVantaEffectForContent(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  // Map content themes to Vanta effects - order matters, more specific first
  if (lowerPrompt.includes('underwater') || lowerPrompt.includes('ocean') || lowerPrompt.includes('sea') || lowerPrompt.includes('water')) {
    return 'waves' // Ocean waves
  } else if (lowerPrompt.includes('space') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('stars')) {
    return 'globe' // Cosmic globe effect
  } else if (lowerPrompt.includes('laboratory') || lowerPrompt.includes('science') || lowerPrompt.includes('experiment') || lowerPrompt.includes('research')) {
    return 'net' // Scientific network connections
  } else if (lowerPrompt.includes('magical') || lowerPrompt.includes('fantasy') || lowerPrompt.includes('mystical') || lowerPrompt.includes('enchanted')) {
    return 'halo' // Magical halo effect
  } else if (lowerPrompt.includes('arctic') || lowerPrompt.includes('ice') || lowerPrompt.includes('snow') || lowerPrompt.includes('frozen')) {
    return 'clouds2' // Cloudy/snowy atmosphere
  } else if (lowerPrompt.includes('volcano') || lowerPrompt.includes('fire') || lowerPrompt.includes('lava') || lowerPrompt.includes('eruption')) {
    return 'birds' // Dynamic flying elements (like sparks/embers)
  } else if (lowerPrompt.includes('cave') || lowerPrompt.includes('crystal') || lowerPrompt.includes('mineral') || lowerPrompt.includes('geology')) {
    return 'topology' // Geological formations
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('jungle') || lowerPrompt.includes('nature') || lowerPrompt.includes('garden')) {
    return 'cells' // Organic cell-like structures
  } else if (lowerPrompt.includes('desert') || lowerPrompt.includes('sand') || lowerPrompt.includes('archaeology') || lowerPrompt.includes('dig')) {
    return 'rings' // Archaeological layers/rings
  } else {
    return 'globe' // Default cosmic effect
  }
}

export function Storybook({ pages, title, onClose, adventureId, gradeLevel, discussionPrompts, reflectionQuestions }: StorybookProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward")
  const [showGlossary, setShowGlossary] = useState<{ word: string; definition: string; x: number; y: number } | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [enhancedPages, setEnhancedPages] = useState<EnhancedStoryPage[]>(pages)
  const [storyCompleted, setStoryCompleted] = useState(false)
  const [imageGenerationErrors, setImageGenerationErrors] = useState<Set<string>>(new Set())
  const [imageGenerationProgress, setImageGenerationProgress] = useState({ generated: 0, total: 0 })
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false)
  
  // Cinematic mode state
  const [isUIHidden, setIsUIHidden] = useState(false)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Advanced Feature States
  const [consequenceSystem, setConsequenceSystem] = useState<ConsequenceSystem>({
    choiceHistory: [],
    inventory: [],
    storyProgress: 0,
    completedPages: new Set(),
    consequences: {}
  })
  
  const [progressIndicator, setProgressIndicator] = useState<ProgressIndicator>({
    currentPage: 0,
    totalPages: pages.length,
    completionPercentage: 0,
    pagesVisited: new Set(['page1']), // Start with first page visited
    choicesMade: 0,
    itemsCollected: 0
  })
  
  const [dynamicChoices, setDynamicChoices] = useState<{[pageId: string]: DynamicChoice[]}>({})
  const [isGeneratingDynamicChoices, setIsGeneratingDynamicChoices] = useState(false)
  
  // Quiz-related state
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set()) // Track completed quizzes by page ID
  
  // Minigame-related state
  const [showMinigame, setShowMinigame] = useState(false)
  const [minigameCompleted, setMinigameCompleted] = useState(false)
  const [completedMinigames, setCompletedMinigames] = useState<Set<string>>(new Set()) // Track completed minigames by page ID
  
  // Text-to-speech state
  const [isReadingAloud, setIsReadingAloud] = useState(false)
  
  // Discussion mode state
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [discussionStep, setDiscussionStep] = useState(0)
  const [discussionButton, setDiscussionButton] = useState(false) // Show discussion button at the end
  
  // Story-wide Vanta background state
  const [useVantaBackground, setUseVantaBackground] = useState(false)
  const [storyVantaEffect, setStoryVantaEffect] = useState<string>("globe")
  
  // Curiosity Engine state
  const [isNovaPopupOpen, setIsNovaPopupOpen] = useState(false)
  const [isNovaLoading, setIsNovaLoading] = useState(false)
  const [novaInsight, setNovaInsight] = useState<{
    type: string
    title: string
    content: string
    buttonText: string
  } | null>(null)
  const [curiosityKeywords] = useState([
    'gravity', 'volcano', 'fossil', 'photosynthesis', 'ecosystem', 'planet',
    'molecule', 'atom', 'energy', 'force', 'motion', 'habitat', 'species',
    'evolution', 'climate', 'weather', 'earthquake', 'solar', 'magnetic',
    'chemical', 'reaction', 'crystal', 'mineral', 'bacteria', 'virus',
    'DNA', 'cell', 'organ', 'system', 'adaptation', 'predator', 'prey'
  ])
  
  const bookRef = useRef<HTMLDivElement>(null)

  const totalPages = enhancedPages.length
  const currentPageData = enhancedPages[currentPage]
  const isLastPage = currentPage === totalPages - 1

  // Function to generate background image for a page
  const generateBackgroundImage = useCallback(async (page: StoryPage) => {
    if (!page.backgroundPrompt || imageGenerationErrors.has(page.id)) {
      return null
    }

    try {
      console.log(`🎨 Generating background image for page: ${page.id}`)
      
      const response = await fetch('/api/generate-image-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: page.backgroundPrompt,
          aspectRatio: '16:9', // Landscape format for story backgrounds
          gradeLevel: 5 // You might want to pass this as a prop
        })
      })

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        console.log(`✅ Generated background image for page: ${page.id} (${data.fromCache ? 'from cache' : 'newly generated'}) - Type: ${data.type}`)
        
        // Handle Vanta effects for gradient fallbacks
        if (data.type === 'gradient' && data.vantaEffect) {
          setStoryVantaEffect(data.vantaEffect)
          setUseVantaBackground(true)
        }
        
        return {
          imageUrl: data.imageUrl,
          type: data.type,
          fromCache: data.fromCache,
          vantaEffect: data.vantaEffect
        }
      } else {
        throw new Error('No image URL returned')
      }

    } catch (error) {
      console.error(`❌ Failed to generate image for page ${page.id}:`, error)
      setImageGenerationErrors(prev => new Set([...prev, page.id]))
      
      // Return fallback gradient
      const fallbackGradient = getThemeBackground(page.backgroundPrompt || '')
      const vantaEffect = getVantaEffectForContent(page.backgroundPrompt || '')
      setStoryVantaEffect(vantaEffect)
      setUseVantaBackground(true)
      
      return {
        imageUrl: fallbackGradient,
        type: 'gradient',
        fromCache: false,
        vantaEffect: vantaEffect
      }
    }
  }, [imageGenerationErrors])

  // Pre-generate all images in parallel when story opens
  const preGenerateAllImages = useCallback(async () => {
    console.log('🚀 Pre-generating all story page images...')
    console.log('Pages received:', pages.length)
    console.log('Page details:', pages.map(p => ({ id: p.id, hasImage: !!p.backgroundImage, hasPrompt: !!p.backgroundPrompt })))
    
    const pagesToGenerate = pages.filter(page => 
      page.backgroundPrompt && 
      !page.backgroundImage && 
      !imageGenerationErrors.has(page.id)
    )

    console.log(`📊 Found ${pagesToGenerate.length} pages that need image generation`)
    console.log('Pages to generate:', pagesToGenerate.map(p => ({ id: p.id, prompt: p.backgroundPrompt?.substring(0, 50) + '...' })))

    if (pagesToGenerate.length === 0) {
      console.log('ℹ️ No images to generate - all pages already have images')
      return
    }

    setIsGeneratingImages(true)
    setImageGenerationProgress({ generated: 0, total: pagesToGenerate.length })

    // Generate all images in parallel with progress tracking
    const imagePromises = pagesToGenerate.map(async (page, index) => {
      console.log(`🎨 Starting generation for page ${page.id}...`)
      const imageUrl = await generateBackgroundImage(page)
      
      // Update progress
      setImageGenerationProgress(prev => ({ 
        generated: prev.generated + 1, 
        total: prev.total 
      }))
      
      console.log(`${imageUrl ? '✅' : '❌'} Completed generation for page ${page.id}`)
      return { pageId: page.id, imageUrl }
    })

    try {
      const results = await Promise.all(imagePromises)
      
      // Update all pages with generated images
      setEnhancedPages(prevPages => {
        const updatedPages = [...prevPages]
        results.forEach(({ pageId, imageUrl }) => {
          if (imageUrl) {
            const pageIndex = updatedPages.findIndex(p => p.id === pageId)
            if (pageIndex !== -1) {
              updatedPages[pageIndex] = { 
                ...updatedPages[pageIndex], 
                backgroundImage: imageUrl.imageUrl,
                imageType: imageUrl.type,
                fromCache: imageUrl.fromCache
              }
              console.log(`✅ Updated page ${pageId} with ${imageUrl.fromCache ? 'cached' : 'generated'} ${imageUrl.type} image`)
            }
          }
        })
        return updatedPages
      })

      const successCount = results.filter(r => r.imageUrl).length
      console.log(`✅ Pre-generated ${successCount}/${pagesToGenerate.length} background images`)
      
    } catch (error) {
      console.error('❌ Error pre-generating images:', error)
    } finally {
      setIsGeneratingImages(false)
    }
  }, [pages, generateBackgroundImage, imageGenerationErrors])

  // Trigger image generation when component mounts with pages
  useEffect(() => {
    if (pages.length > 0 && !hasTriggeredGeneration) {
      console.log('🎨 Storybook mounted with pages, checking for missing images...')
      setHasTriggeredGeneration(true)
      
      // Check if any pages are missing images
      const pagesNeedingImages = pages.filter(page => 
        page.backgroundPrompt && !page.backgroundImage && !imageGenerationErrors.has(page.id)
      )
      
      if (pagesNeedingImages.length > 0) {
        console.log(`🚀 Found ${pagesNeedingImages.length} pages missing images, starting generation...`)
        const triggerGeneration = async () => {
          await preGenerateAllImages()
        }
        triggerGeneration()
      } else {
        console.log('✅ All pages already have images - no generation needed')
      }
    }
  }, [pages.length, hasTriggeredGeneration]) // Trigger once when pages are available

  // Track adventure completion
  const trackAdventureCompletion = useCallback(async () => {
    if (adventureId && !storyCompleted) {
      try {
        await fetch('/api/adventure-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adventureId,
            adventureTitle: title
          })
        })
        setStoryCompleted(true)
      } catch (error) {
        console.error('Error tracking adventure completion:', error)
      }
    }
  }, [adventureId, title, storyCompleted])

  // Check if user reached the last page
  useEffect(() => {
    if (isLastPage && !storyCompleted) {
      trackAdventureCompletion()
    }
    
    // Show discussion button when reaching the last page
    if (isLastPage && discussionPrompts && !discussionButton) {
      setDiscussionButton(true)
    }
  }, [isLastPage, storyCompleted, trackAdventureCompletion, discussionPrompts, discussionButton])

  // Determine the overall story theme for Vanta background
  const determineStoryVantaEffect = useCallback(() => {
    const allContent = pages.map(p => `${p.content} ${p.backgroundPrompt || ''}`).join(' ').toLowerCase()
    return getVantaEffectForContent(allContent)
  }, [pages])

  // Prepare story content for AI soundscape generation
  const prepareStoryContentForAI = useCallback(() => {
    const allContent = pages.map(p => `${p.content} ${p.backgroundPrompt || ''}`).join(' ')
    // Limit content length to avoid API limits and focus on key content
    return allContent.substring(0, 1500)
  }, [pages])

  // Initialize story-wide Vanta effect on first load
  useEffect(() => {
    const storyEffect = determineStoryVantaEffect()
    setStoryVantaEffect(storyEffect)
    
    // Check if any page has a Vanta effect preference or gradient background
    const hasVantaEffect = pages.some(page => page.vantaEffect || (page.backgroundImage && page.backgroundImage.startsWith('linear-gradient')))
    if (hasVantaEffect) {
      setUseVantaBackground(true)
    }
  }, [determineStoryVantaEffect, pages])

  // Update Vanta background usage when current page changes
  useEffect(() => {
    const currentPageData = enhancedPages[currentPage]
    if (currentPageData && (currentPageData.vantaEffect || (currentPageData.backgroundImage && currentPageData.backgroundImage.startsWith('linear-gradient')))) {
      setUseVantaBackground(true)
    } else if (currentPageData && currentPageData.backgroundImage && currentPageData.backgroundImage.startsWith('data:')) {
      setUseVantaBackground(false)
    }
  }, [currentPage, enhancedPages])

  // AI-powered ambient soundscape management - DISABLED
  useEffect(() => {
    // DISABLED: Current synthesized ambient sounds are too harsh/ringy
    // TODO: Implement better approach with real audio samples or advanced synthesis
    console.log('🔇 Ambient soundscape disabled - preparing for better implementation')
    
    if (!soundEnabled || pages.length === 0) return

    // Cleanup function to stop any existing ambient loops
    return () => {
      console.log('🔇 Cleaning up any existing ambient sounds')
      storybookSounds.stopAmbientLoop()
    }
  }, [prepareStoryContentForAI, title, soundEnabled, pages.length]) // Re-run if story content or sound preference changes

  // Cinematic mode - Auto-hide UI after 3 seconds of inactivity
  useEffect(() => {
    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      
      // Show UI when user is active
      setIsUIHidden(false)
      
      // Set new timer to hide UI after 3 seconds
      inactivityTimerRef.current = setTimeout(() => {
        setIsUIHidden(true)
      }, 3000)
    }

    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    // Add event listeners for user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Initialize timer
    resetInactivityTimer()

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [])

  // Quiz handling functions
  const showQuizForCurrentPage = useCallback(() => {
    const currentPageData = enhancedPages[currentPage]
    if (currentPageData?.quizQuestion && !completedQuizzes.has(currentPageData.id)) {
      setCurrentQuizQuestion(currentPageData.quizQuestion)
      setSelectedAnswer(null)
      setShowQuizResult(false)
      setQuizAnswered(false)
    }
  }, [currentPage, enhancedPages, completedQuizzes])

  const handleQuizAnswer = useCallback((answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }, [])

  const submitQuizAnswer = useCallback(() => {
    if (selectedAnswer !== null && currentQuizQuestion) {
      setShowQuizResult(true)
      setQuizAnswered(true)
      
      // Mark this page's quiz as completed
      const currentPageData = enhancedPages[currentPage]
      if (currentPageData) {
        setCompletedQuizzes(prev => new Set([...prev, currentPageData.id]))
      }
      
      // Play sound feedback
      if (soundEnabled) {
        const isCorrect = selectedAnswer === currentQuizQuestion.correctAnswer
        storybookSounds.playFeedback(isCorrect)
      }
    }
  }, [selectedAnswer, currentQuizQuestion, soundEnabled, enhancedPages, currentPage])

  const closeQuiz = useCallback(() => {
    setCurrentQuizQuestion(null)
    setSelectedAnswer(null)
    setShowQuizResult(false)
    setQuizAnswered(false)
  }, [])

  // Handle storybook close with ambient sound cleanup
  const handleClose = useCallback(() => {
    // Stop ambient sound loop
    storybookSounds.stopAmbientLoop()
    // Call the original close function
    onClose()
  }, [onClose])

  // Discussion handling functions
  const startDiscussion = useCallback(() => {
    if (discussionPrompts && isLastPage) {
      setShowDiscussion(true)
      setDiscussionStep(0)
    }
  }, [discussionPrompts, isLastPage])

  const nextDiscussionStep = useCallback(() => {
    if (discussionPrompts && discussionStep < discussionPrompts.followUpQuestions.length) {
      setDiscussionStep(discussionStep + 1)
    } else {
      setShowDiscussion(false)
      setDiscussionStep(0)
    }
  }, [discussionPrompts, discussionStep])

  // Text-to-speech handler
  const handleReadAloud = useCallback(() => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser')
      return
    }

    if (isReadingAloud) {
      // Stop current speech
      window.speechSynthesis.cancel()
      setIsReadingAloud(false)
    } else {
      // Start reading current page content
      const currentPageData = enhancedPages[currentPage]
      if (currentPageData) {
        const textToRead = `${currentPageData.title ? currentPageData.title + '. ' : ''}${currentPageData.content}`
        
        const utterance = new SpeechSynthesisUtterance(textToRead)
        utterance.rate = 0.8 // Slightly slower for better comprehension
        utterance.pitch = 1.0
        utterance.volume = 0.8
        
        // Handle speech events
        utterance.onstart = () => {
          setIsReadingAloud(true)
        }
        
        utterance.onend = () => {
          setIsReadingAloud(false)
        }
        
        utterance.onerror = () => {
          setIsReadingAloud(false)
          console.warn('Speech synthesis error occurred')
        }
        
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [currentPage, enhancedPages, isReadingAloud])

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Enhanced page flip handler
  const handlePageFlip = useCallback((direction: "forward" | "backward") => {
    if (isFlipping) return

    // If there's a quiz question on current page and we're going forward, show the quiz first
    if (direction === "forward") {
      const currentPageData = enhancedPages[currentPage]
      if (currentPageData?.quizQuestion && !completedQuizzes.has(currentPageData.id)) {
        showQuizForCurrentPage()
        return
      }
    }

    // Reset quiz state when navigating
    if (direction === "backward" || direction === "forward") {
      closeQuiz()
    }

    // Normal page navigation logic
    if (direction === "forward" && currentPage < totalPages - 1) {
      setIsFlipping(true)
      setFlipDirection("forward")
      
      setTimeout(() => {
        setCurrentPage(prev => prev + 1)
        setIsFlipping(false)
      }, 300)
      
      if (soundEnabled) {
        storybookSounds.playPageTurn()
      }
    } else if (direction === "backward" && currentPage > 0) {
      setIsFlipping(true)
      setFlipDirection("backward")
      
      setTimeout(() => {
        setCurrentPage(prev => prev - 1)
        setIsFlipping(false)
      }, 300)
      
      if (soundEnabled) {
        storybookSounds.playPageTurn()
      }
    } else if (direction === "forward" && isLastPage) {
      // At the end of the story, show discussion button instead of auto-opening discussion
      if (discussionPrompts && !discussionButton) {
        setDiscussionButton(true)
      }
    }
  }, [currentPage, totalPages, isFlipping, soundEnabled, enhancedPages, completedQuizzes, showQuizForCurrentPage, closeQuiz, isLastPage, discussionPrompts, showDiscussion, startDiscussion])

  // Handle choice-based navigation for branching narratives
  const handleChoiceNavigation = useCallback((nextPageId: string, choiceText?: string, consequences?: string[]) => {
    if (isFlipping) return

    // Find the page index with the matching nextPageId
    const nextPageIndex = enhancedPages.findIndex(page => page.id === nextPageId)
    
    if (nextPageIndex === -1) {
      console.warn(`Page with id "${nextPageId}" not found`)
      return
    }

    // Update consequence system and progress
    setConsequenceSystem(prev => ({
      ...prev,
      choiceHistory: [
        ...prev.choiceHistory,
        {
          pageId: enhancedPages[currentPage].id,
          choiceText: choiceText || 'Unknown choice',
          choiceId: `choice_${Date.now()}`
        }
      ]
    }))

    setProgressIndicator(prev => ({
      ...prev,
      choicesMade: prev.choicesMade + 1,
      pagesVisited: new Set([...prev.pagesVisited, enhancedPages[nextPageIndex].id])
    }))

    // Handle consequences if provided
    if (consequences && consequences.length > 0) {
      handleConsequences(consequences, enhancedPages[currentPage].id)
    }

    // Reset any active quizzes/minigames when making a choice
    closeQuiz()
    setShowMinigame(false)

    // Animate the page transition
    setIsFlipping(true)
    setFlipDirection("forward")
    
    setTimeout(() => {
      setCurrentPage(nextPageIndex)
      setIsFlipping(false)
      updateProgressIndicator(nextPageIndex)
    }, 300)
    
    if (soundEnabled) {
      storybookSounds.playPageTurn()
    }
  }, [isFlipping, enhancedPages, closeQuiz, soundEnabled, currentPage])

  // Advanced Feature Functions
  
  // Generate dynamic choices based on current context
  const generateDynamicChoices = useCallback(async (pageData: StoryPage) => {
    if (!pageData.dynamicChoicePrompt) return []

    setIsGeneratingDynamicChoices(true)
    
    try {
      const response = await fetch('/api/generate-dynamic-choices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPage: pageData,
          storyContext: enhancedPages.map(p => ({ id: p.id, title: p.title, content: p.content.substring(0, 200) })),
          gradeLevel: 5, // Could be passed as prop
          inventory: consequenceSystem.inventory,
          choiceHistory: consequenceSystem.choiceHistory,
          learningStyle: 'visual' // Could be passed as prop
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate dynamic choices')
      }

      const data = await response.json()
      
      if (data.success && data.choices) {
        setDynamicChoices(prev => ({
          ...prev,
          [pageData.id]: data.choices
        }))
        
        console.log(`✅ Generated ${data.choices.length} dynamic choices for page ${pageData.id}`)
        return data.choices
      }
      
      return []
    } catch (error) {
      console.error('❌ Error generating dynamic choices:', error)
      return []
    } finally {
      setIsGeneratingDynamicChoices(false)
    }
  }, [enhancedPages, consequenceSystem])

  // Handle consequences from choices
  const handleConsequences = useCallback((consequences: string[], pageId: string) => {
    console.log(`📊 Processing consequences for page ${pageId}:`, consequences)
    
    setConsequenceSystem(prev => ({
      ...prev,
      consequences: {
        ...prev.consequences,
        [pageId]: consequences
      }
    }))

    // Process specific consequence types
    consequences.forEach(consequence => {
      if (consequence.toLowerCase().includes('collect') || consequence.toLowerCase().includes('find')) {
        // Extract item from consequence text
        const itemMatch = consequence.match(/collect|find (.+)/i)
        if (itemMatch && itemMatch[1]) {
          const itemName = itemMatch[1].trim()
          addToInventory({
            id: `item_${Date.now()}`,
            name: itemName,
            description: `Discovered through your choice: ${consequence}`,
            acquiredAt: new Date().toISOString()
          })
        }
      }
    })
  }, [])

  // Add item to inventory
  const addToInventory = useCallback((item: { id: string; name: string; description: string; acquiredAt: string }) => {
    setConsequenceSystem(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }))
    
    setProgressIndicator(prev => ({
      ...prev,
      itemsCollected: prev.itemsCollected + 1
    }))
    
    console.log(`🎒 Added to inventory: ${item.name}`)
  }, [])

  // Update progress indicator
  const updateProgressIndicator = useCallback((newPageIndex: number) => {
    const currentPageData = enhancedPages[newPageIndex]
    
    setProgressIndicator(prev => {
      const newPagesVisited = new Set([...prev.pagesVisited, currentPageData.id])
      const progressWeight = currentPageData.progressWeight || (1 / enhancedPages.length)
      
      // Calculate completion percentage based on pages visited and their weights
      const totalProgress = Array.from(newPagesVisited).reduce((sum, pageId) => {
        const page = enhancedPages.find(p => p.id === pageId)
        return sum + (page?.progressWeight || (1 / enhancedPages.length))
      }, 0)
      
      return {
        ...prev,
        currentPage: newPageIndex,
        pagesVisited: newPagesVisited,
        completionPercentage: Math.min(100, Math.round(totalProgress * 100))
      }
    })
    
    // Mark page as completed in consequence system
    setConsequenceSystem(prev => ({
      ...prev,
      completedPages: new Set([...prev.completedPages, currentPageData.id]),
      storyProgress: Math.min(100, ((newPageIndex + 1) / enhancedPages.length) * 100)
    }))
  }, [enhancedPages])

  // Check if choice requirements are met
  const isChoiceAvailable = useCallback((choice: DynamicChoice) => {
    if (!choice.requiresItems || choice.requiresItems.length === 0) return true
    
    const inventoryItems = consequenceSystem.inventory.map(item => item.name.toLowerCase())
    return choice.requiresItems.every(requiredItem => 
      inventoryItems.some(item => item.includes(requiredItem.toLowerCase()))
    )
  }, [consequenceSystem.inventory])

  // Minigame completion handler
  const handleMinigameComplete = useCallback(() => {
    const currentPageData = enhancedPages[currentPage]
    if (currentPageData) {
      // Mark this page's minigame as completed
      setCompletedMinigames(prev => new Set([...prev, currentPageData.id]))
      
      // Play celebration sound
      if (soundEnabled) {
        storybookSounds.playFeedback(true) // Always positive feedback for completing minigames
      }
      
      // Auto-advance to next page after a brief delay
      setTimeout(() => {
        handlePageFlip("forward")
      }, 2000) // 2 second delay to show celebration
    }
  }, [enhancedPages, currentPage, soundEnabled, handlePageFlip])

  // Touch and swipe handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = Math.abs(touchStart.y - touchEnd.y)

    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        handlePageFlip("forward")
      } else {
        handlePageFlip("backward")
      }
    }

    setTouchStart(null)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          handlePageFlip("backward")
          break
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault()
          // Don't navigate forward if current page has choices
          if (!currentPageData.choices) {
            handlePageFlip("forward")
          }
          break
        case "Escape":
          handleClose()
          break
        case "Home":
          setCurrentPage(0)
          break
        case "End":
          setCurrentPage(totalPages - 1)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handlePageFlip, handleClose, totalPages, currentPageData.choices])

  // Handle interactive word clicks
  const handleWordClick = useCallback((e: React.MouseEvent, word: string) => {
    const lowerWord = word.toLowerCase().replace(/[.,!?;:]/g, "")
    if (GLOSSARY[lowerWord]) {
      // Play word click sound
      if (soundEnabled) {
        storybookSounds.playWordClick()
      }

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setShowGlossary({
        word: lowerWord,
        definition: GLOSSARY[lowerWord],
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })

      // Auto-hide after 4 seconds
      setTimeout(() => setShowGlossary(null), 4000)
    }
  }, [soundEnabled])

  // Process content to make words interactive
  const processInteractiveContent = useCallback((content: string) => {
    console.log('🔍 Processing content for curiosity points:', content.substring(0, 100) + '...')
    let processedContent = content

    // Make glossary words clickable
    Object.keys(GLOSSARY).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      processedContent = processedContent.replace(
        regex, 
        `<span class="interactive-word cursor-pointer text-blue-600 underline decoration-dotted hover:text-blue-800 transition-colors" data-word="${word}">$&</span>`
      )
    })

    // Make curiosity keywords clickable (but not if they're already glossary words)
    let foundKeywords: string[] = []
    curiosityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      // Check if this keyword exists in the content
      if (regex.test(content)) {
        foundKeywords.push(keyword)
      }
      
      // Only add curiosity styling if it's not already a glossary word
      processedContent = processedContent.replace(regex, (match) => {
        // Check if this word is already wrapped in a span (i.e., it's a glossary word)
        const beforeMatch = processedContent.substring(0, processedContent.indexOf(match))
        
        // If it's already in a span, don't add curiosity styling
        if (beforeMatch.endsWith('<span class="interactive-word') || 
            beforeMatch.includes(`data-word="${keyword.toLowerCase()}"`)) {
          return match
        }
        
        return `<span class="curiosity-point" data-curiosity="${keyword.toLowerCase()}">${match}</span>`
      })
    })
    
    console.log('✨ Found curiosity keywords in content:', foundKeywords)
    console.log('📝 Processed content has spans:', processedContent.includes('curiosity-point'))

    return processedContent
  }, [curiosityKeywords])

  // Handle Curiosity Point clicks
  const handleCuriosityPointClick = useCallback(async (keyword: string) => {
    console.log('🔍 Curiosity point clicked:', keyword)
    
    // Set loading state and open popup
    setIsNovaLoading(true)
    setIsNovaPopupOpen(true)
    setNovaInsight(null)

    try {
      // Get the current page content for context
      const pageContent = currentPageData?.content || ''
      
      // Make API call to get contextual insight
      const response = await fetch('/api/get-contextual-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageContent: pageContent,
          keyword: keyword,
          gradeLevel: gradeLevel || 5 // Use provided grade level or default to 5
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.insight) {
        setNovaInsight(data.insight)
        console.log('✅ Professor Nova insight received:', data.insight.title)
        
        // Play a gentle sound effect
        if (soundEnabled) {
          storybookSounds.playPageTurn()
        }
      } else {
        throw new Error('No insight received from API')
      }
    } catch (error) {
      console.error('❌ Error getting contextual insight:', error)
      
      // Fallback insight
      setNovaInsight({
        type: "FunFact",
        title: "Professor Nova's Note",
        content: `Great question about "${keyword}"! This is an important concept in science. Keep exploring and asking questions - that's how all great scientists start their journey!`,
        buttonText: "Thanks, Professor!"
      })
    } finally {
      setIsNovaLoading(false)
    }
  }, [currentPageData, soundEnabled])

  // Determine background based on content theme
  const getBackgroundStyle = useCallback((page: StoryPage) => {
    const content = page.content.toLowerCase()
    
    if (page.backgroundImage) {
      // Check if it's a data URL (generated image)
      if (page.backgroundImage.startsWith("data:")) {
        return {
          backgroundImage: `url(${page.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }
      } 
      // Check if it's a gradient (fallback from failed image generation)
      else if (page.backgroundImage.startsWith("linear-gradient")) {
        // For gradient backgrounds, we should use Vanta instead
        if (page.vantaEffect) {
          return { background: "transparent" } // Let Vanta handle the background
        }
        return { background: page.backgroundImage }
      } 
      // Regular image URL
      else {
        return {
          backgroundImage: `url(${page.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }
      }
    }

    // If page has a backgroundPrompt but no image yet, show loading pattern
    if (page.backgroundPrompt && !imageGenerationErrors.has(page.id)) {
      return {
        background: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        animation: "loading-shimmer 2s infinite ease-in-out"
      }
    }

    // Smart background detection based on content (fallback)
    if (content.includes("desert") || content.includes("sand") || content.includes("dig")) {
      return { background: THEME_BACKGROUNDS.desert }
    } else if (content.includes("jungle") || content.includes("forest") || content.includes("tree")) {
      return { background: THEME_BACKGROUNDS.jungle }
    } else if (content.includes("ocean") || content.includes("sea") || content.includes("water")) {
      return { background: THEME_BACKGROUNDS.ocean }
    } else if (content.includes("space") || content.includes("star") || content.includes("planet")) {
      return { background: THEME_BACKGROUNDS.space }
    } else if (content.includes("laboratory") || content.includes("lab") || content.includes("scientist")) {
      return { background: THEME_BACKGROUNDS.laboratory }
    }

    return { background: THEME_BACKGROUNDS.default }
  }, [])

  // Click handlers for navigation areas
  const handleLeftAreaClick = () => {
    if (currentPage > 0) {
      handlePageFlip("backward")
    }
  }

  const handleRightAreaClick = () => {
    // Don't navigate forward if current page has choices (user must select a choice)
    if (currentPage < totalPages - 1 && !currentPageData.choices) {
      handlePageFlip("forward")
    }
  }

  // Handle clicks on processed content
  useEffect(() => {
    const handleContentClick = (e: Event) => {
      const target = e.target as HTMLElement
      
      // Handle glossary word clicks
      if (target.classList.contains('interactive-word')) {
        const word = target.getAttribute('data-word')
        if (word) {
          handleWordClick(e as any, word)
        }
      }
      
      // Handle curiosity point clicks
      if (target.classList.contains('curiosity-point')) {
        const keyword = target.getAttribute('data-curiosity')
        if (keyword) {
          e.preventDefault()
          e.stopPropagation()
          handleCuriosityPointClick(keyword)
        }
      }
    }

    document.addEventListener('click', handleContentClick)
    return () => document.removeEventListener('click', handleContentClick)
  }, [handleWordClick, handleCuriosityPointClick])

  // Advanced Features - Initialize dynamic choices when page changes
  useEffect(() => {
    const currentPageData = enhancedPages[currentPage]
    if (currentPageData?.dynamicChoicePrompt && !dynamicChoices[currentPageData.id]) {
      generateDynamicChoices(currentPageData)
    }
  }, [currentPage, enhancedPages, dynamicChoices, generateDynamicChoices])

  // Advanced Features - Update progress indicator when page changes
  useEffect(() => {
    updateProgressIndicator(currentPage)
  }, [currentPage, updateProgressIndicator])

  // Advanced Features - Collect items from current page
  useEffect(() => {
    const currentPageData = enhancedPages[currentPage]
    if (currentPageData?.collectibles && currentPageData.collectibles.length > 0) {
      // Auto-collect items on page arrival (could be made conditional based on story logic)
      currentPageData.collectibles.forEach(item => {
        const alreadyCollected = consequenceSystem.inventory.some(invItem => invItem.id === item.id)
        if (!alreadyCollected) {
          addToInventory({
            ...item,
            acquiredAt: new Date().toISOString()
          })
        }
      })
    }
  }, [currentPage, enhancedPages, consequenceSystem.inventory, addToInventory])

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={!useVantaBackground ? getBackgroundStyle(currentPageData) : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Vanta.js background when using effects */}
      {useVantaBackground && (
        <VantaBackground 
          effect={currentPageData.vantaEffect || storyVantaEffect}
          className="absolute inset-0 z-0"
        />
      )}
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/30 z-10" />
      
      {/* Ambient background animation with particles */}
      <div className="absolute inset-0 opacity-30 z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse" />
        
        {/* Floating particles */}
        <div className="background-particles">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
      </div>

      {/* Minimal exit button - top right corner */}
      <div className={`absolute top-6 right-6 z-50 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
        <Button
          onClick={handleClose}
          size="sm"
          className="bg-black/50 backdrop-blur-sm border border-white/30 text-white hover:bg-black/70 rounded-full w-12 h-12 p-0 group transition-all duration-300"
        >
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>

      {/* Image generation progress indicator */}
      {isGeneratingImages && (
        <div className={`absolute top-6 left-6 z-50 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 text-white rounded-lg px-4 py-2 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">
              Generating images... {imageGenerationProgress.generated}/{imageGenerationProgress.total}
            </span>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className={`absolute top-6 left-6 z-50 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'} ${isGeneratingImages ? 'mt-16' : ''}`}>
        <div className="bg-black/50 backdrop-blur-sm border border-white/30 text-white rounded-lg px-4 py-2">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <Book className="h-4 w-4" />
              <span>{progressIndicator.currentPage + 1}/{progressIndicator.totalPages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${progressIndicator.completionPercentage}%` }}
                />
              </div>
              <span className="text-xs">{progressIndicator.completionPercentage}%</span>
            </div>
            {progressIndicator.choicesMade > 0 && (
              <div className="flex items-center space-x-1">
                <Sparkles className="h-4 w-4" />
                <span>{progressIndicator.choicesMade}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Panel */}
      {consequenceSystem.inventory.length > 0 && (
        <div className={`absolute bottom-6 left-6 z-50 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 text-white rounded-lg px-4 py-3 max-w-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              <span className="text-sm font-semibold">Inventory ({consequenceSystem.inventory.length})</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {consequenceSystem.inventory.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-white/90">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Choice Generation Indicator */}
      {isGeneratingDynamicChoices && (
        <div className={`absolute bottom-6 right-6 z-50 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-black/50 backdrop-blur-sm border border-white/30 text-white rounded-lg px-4 py-2 flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-4 w-4 bg-gradient-to-r from-blue-400 to-purple-400"></div>
            <span className="text-sm">Generating choices...</span>
          </div>
        </div>
      )}

      {/* Audio control */}
      <div className={`absolute top-6 left-6 z-50 flex gap-2 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
        <Button
          onClick={() => {
            const newSoundState = !soundEnabled
            setSoundEnabled(newSoundState)
            storybookSounds.setSoundEnabled(newSoundState)
          }}
          size="sm"
          className="bg-black/50 backdrop-blur-sm border border-white/30 text-white hover:bg-black/70 rounded-full w-12 h-12 p-0 transition-all duration-300"
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
        
        {/* Read Aloud Button */}
        <Button
          onClick={handleReadAloud}
          size="sm"
          className={`backdrop-blur-sm border border-white/30 text-white hover:bg-black/70 rounded-full w-12 h-12 p-0 transition-all duration-300 ${
            isReadingAloud 
              ? 'bg-accent/70 hover:bg-accent/80 border-accent/50' 
              : 'bg-black/50'
          }`}
          title={isReadingAloud ? "Stop reading aloud" : "Read page aloud"}
        >
          {isReadingAloud ? <VolumeX className="h-5 w-5" /> : <Book className="h-5 w-5" />}
        </Button>
      </div>

      {/* Enhanced progress dots with animations - bottom center */}
      <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-300 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`progress-dot w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentPage
                  ? "bg-white scale-150 shadow-lg active"
                  : i < currentPage
                  ? "bg-white/60 hover:bg-white/80"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              onClick={() => {
                if (i !== currentPage && !isFlipping) {
                  setCurrentPage(i)
                  setShowGlossary(null)
                }
              }}
              title={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div 
        ref={bookRef}
        className="relative w-full h-full flex items-center justify-center p-2 md:p-4 z-20"
      >
        {/* Page container with enhanced 3D flip effect */}
        <div 
          className={`relative w-full max-w-5xl h-full transition-all duration-600 ease-in-out transform ${
            isFlipping 
              ? flipDirection === "forward" 
                ? "storybook-page-flip-forward" 
                : "storybook-page-flip-backward"
              : "scale-100"
          }`}
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Navigation areas - invisible clickable zones */}
          <div className="absolute inset-0 flex z-30">
            {/* Left navigation area */}
            <div 
              className="w-1/3 h-full cursor-pointer group flex items-center justify-start pl-4"
              onClick={handleLeftAreaClick}
            >
              {currentPage > 0 && (
                <div className="nav-arrow opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-md rounded-full p-4 text-white text-2xl font-bold shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] border-2 border-white/30">
                  ←
                </div>
              )}
            </div>

            {/* Center area - no navigation, allows text interaction */}
            <div className="w-1/3 h-full" />

            {/* Right navigation area */}
            <div 
              className="w-1/3 h-full cursor-pointer group flex items-center justify-end pr-4"
              onClick={handleRightAreaClick}
            >
              {currentPage < totalPages - 1 && !currentPageData.choices && (
                <div className="nav-arrow opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-md rounded-full p-4 text-white text-2xl font-bold shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] border-2 border-white/30">
                  →
                </div>
              )}
            </div>
          </div>

          {/* Main page content */}
          <div className="relative w-full h-full">
            {/* Content display area */}
            <div className="h-full flex flex-col justify-center items-center p-8 md:p-16">
              {/* Story title on first page */}
              {currentPage === 0 && (
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
                    <Book className="h-6 w-6 text-yellow-300" />
                    <h1 className="text-2xl md:text-3xl font-bold text-white font-fredoka">
                      {title}
                    </h1>
                    <Sparkles className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>
              )}

              {/* Page content with enhanced styling and shimmer effect */}
              <div className="max-w-4xl w-full">
                <div className="bg-gradient-to-br from-white/5 via-white/10 to-transparent backdrop-blur-sm rounded-3xl p-8 md:p-12 border-2 border-white/20 shadow-2xl storybook-shimmer">
                  
                  {/* Check if current page has a minigame */}
                  {currentPageData.minigame && !completedMinigames.has(currentPageData.id) ? (
                    <InteractiveMinigame
                      gameType={currentPageData.minigame.gameType}
                      data={currentPageData.minigame}
                      onComplete={handleMinigameComplete}
                    />
                  ) : (
                    <>
                      <div 
                        className="prose prose-lg md:prose-xl max-w-none text-white storybook-content"
                        style={{
                          fontSize: "1.25rem",
                          lineHeight: "1.8",
                          fontFamily: "system-ui, -apple-system, sans-serif"
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: processInteractiveContent(currentPageData.content) 
                        }}
                      />
                      
                      {/* Show completion message if minigame was completed */}
                      {currentPageData.minigame && completedMinigames.has(currentPageData.id) && (
                        <div className="mt-6 p-4 bg-green-500/20 border-2 border-green-400/40 rounded-xl text-center">
                          <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-semibold">Minigame Completed!</span>
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <p className="text-white/80 text-sm">Great job! You can continue reading the story.</p>
                        </div>
                      )}

                      {/* Branching narrative choices */}
                      {((currentPageData.choices && currentPageData.choices.length > 0) || (dynamicChoices[currentPageData.id] && dynamicChoices[currentPageData.id].length > 0)) && (
                        <div className="mt-8">
                          <div className="text-center mb-6">
                            <p className="text-white/90 text-lg font-semibold mb-4">What would you like to do?</p>
                            {consequenceSystem.choiceHistory.length > 0 && (
                              <p className="text-white/60 text-sm">Your previous choices have shaped this moment...</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            {/* Static choices */}
                            {currentPageData.choices?.map((choice, index) => {
                              const isAvailable = !choice.consequences || choice.consequences.length === 0 || 
                                choice.consequences.every(req => 
                                  consequenceSystem.inventory.some(item => 
                                    item.name.toLowerCase().includes(req.toLowerCase())
                                  )
                                )
                              
                              return (
                                <Button
                                  key={index}
                                  onClick={() => handleChoiceNavigation(choice.nextPageId, choice.text, choice.consequences)}
                                  disabled={!isAvailable}
                                  className={`px-6 py-4 text-base font-medium rounded-xl border-2 shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                                    isAvailable 
                                      ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/90 hover:to-purple-500/90 text-white border-white/20 hover:shadow-xl"
                                      : "bg-gray-600/50 text-gray-300 border-gray-400/20 cursor-not-allowed"
                                  }`}
                                >
                                  {choice.text}
                                  {choice.consequences && choice.consequences.length > 0 && (
                                    <div className="text-xs mt-1 opacity-75">
                                      {isAvailable ? "✨ Available" : "🔒 Requires items"}
                                    </div>
                                  )}
                                </Button>
                              )
                            })}
                            
                            {/* Dynamic choices */}
                            {dynamicChoices[currentPageData.id]?.map((choice, index) => {
                              const isAvailable = isChoiceAvailable(choice)
                              
                              return (
                                <Button
                                  key={`dynamic-${index}`}
                                  onClick={() => handleChoiceNavigation(choice.nextPageId, choice.text, choice.consequences)}
                                  disabled={!isAvailable}
                                  className={`px-6 py-4 text-base font-medium rounded-xl border-2 shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                                    isAvailable 
                                      ? "bg-gradient-to-r from-green-600/80 to-teal-600/80 hover:from-green-500/90 hover:to-teal-500/90 text-white border-white/20 hover:shadow-xl"
                                      : "bg-gray-600/50 text-gray-300 border-gray-400/20 cursor-not-allowed"
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Sparkles className="h-4 w-4" />
                                    <span>{choice.text}</span>
                                  </div>
                                  {choice.requiresItems && choice.requiresItems.length > 0 && (
                                    <div className="text-xs mt-1 opacity-75">
                                      {isAvailable ? "✨ Smart choice!" : `🔒 Needs: ${choice.requiresItems.join(", ")}`}
                                    </div>
                                  )}
                                </Button>
                              )
                            })}
                            
                            {/* Generate dynamic choices button */}
                            {currentPageData.dynamicChoicePrompt && !dynamicChoices[currentPageData.id] && !isGeneratingDynamicChoices && (
                              <Button
                                onClick={() => generateDynamicChoices(currentPageData)}
                                className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500/90 hover:to-orange-500/90 text-white px-6 py-4 text-base font-medium rounded-xl border-2 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate More Options
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Discussion button at the end of the story */}
                  {isLastPage && discussionButton && discussionPrompts && (
                    <div className="mt-8 text-center">
                      <Button
                        onClick={startDiscussion}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        💭 Let's Discuss What We Learned!
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced page curl effect - bottom right corner */}
            {currentPage < totalPages - 1 && (
              <div 
                className="page-curl absolute bottom-4 right-4"
                onClick={handleRightAreaClick}
                title="Click to turn page"
              />
            )}
          </div>
        </div>
      </div>

      {/* Interactive glossary popup */}
      {showGlossary && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: showGlossary.x,
            top: showGlossary.y,
            transform: "translate(-50%, -100%)",
            transition: 'all 0.3s ease'
          }}
        >
          <div className="bg-black/90 backdrop-blur-sm text-white rounded-2xl p-4 max-w-xs shadow-2xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
            <h4 className="font-bold text-yellow-300 mb-1 capitalize">
              {showGlossary.word}
            </h4>
            <p className="text-sm text-white/90">
              {showGlossary.definition}
            </p>
            <div className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
            </div>
          </div>
        </div>
      )}

      {/* Subtle instruction hint - appears briefly */}
      {currentPage === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 animate-pulse">
          <div className="bg-black/50 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/20">
            Tap sides to turn pages • Tap blue words for definitions
          </div>
        </div>
      )}



      {/* Quiz Question Modal */}
      {currentQuizQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/30 relative z-[10000] pointer-events-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <span>🧠</span>
                <span>Quick Quiz</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {currentQuizQuestion.question}
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuizQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuizAnswer(index)}
                  disabled={showQuizResult}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedAnswer === index
                      ? showQuizResult
                        ? index === currentQuizQuestion.correctAnswer
                          ? 'bg-green-100 border-2 border-green-500 text-green-800'
                          : 'bg-red-100 border-2 border-red-500 text-red-800'
                        : 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                      : showQuizResult && index === currentQuizQuestion.correctAnswer
                      ? 'bg-green-100 border-2 border-green-500 text-green-800'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {showQuizResult && selectedAnswer === index && (
                      <span className="ml-auto">
                        {index === currentQuizQuestion.correctAnswer ? '✅' : '❌'}
                      </span>
                    )}
                    {showQuizResult && selectedAnswer !== index && index === currentQuizQuestion.correctAnswer && (
                      <span className="ml-auto">✅</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {showQuizResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Explanation</h4>
                    <p className="text-blue-700">{currentQuizQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {!showQuizResult ? (
                <>
                  <Button
                    onClick={closeQuiz}
                    variant="outline"
                    className="px-6"
                  >
                    Skip Quiz
                  </Button>
                  <Button
                    onClick={submitQuizAnswer}
                    disabled={selectedAnswer === null}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Answer
                  </Button>
                </>
              ) : (
                <Button
                  onClick={closeQuiz}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  Continue Reading
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussion && discussionPrompts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/30 relative z-[10000] pointer-events-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <span>💭</span>
                <span>Let's Discuss</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {discussionStep === 0 
                  ? discussionPrompts.openingQuestion
                  : discussionStep <= discussionPrompts.followUpQuestions.length
                  ? discussionPrompts.followUpQuestions[discussionStep - 1]
                  : discussionPrompts.encouragementPhrase
                }
              </h3>
            </div>

            {discussionStep < discussionPrompts.followUpQuestions.length + 1 ? (
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">🤔</span>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Think About It</h4>
                      <p className="text-yellow-700">
                        Take a moment to think about this question. There's no wrong answer - 
                        this is about exploring your understanding and curiosity!
                      </p>
                    </div>
                  </div>
                </div>

                {reflectionQuestions && discussionStep === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Reflection Questions</h4>
                    <ul className="space-y-1 text-blue-700">
                      {reflectionQuestions.map((question, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🌟</span>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Great Job!</h4>
                    <p className="text-green-700">{discussionPrompts.encouragementPhrase}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDiscussion(false)}
                variant="outline"
                className="px-6"
              >
                Close Discussion
              </Button>
              {discussionStep <= discussionPrompts.followUpQuestions.length && (
                <Button
                  onClick={nextDiscussionStep}
                  className="px-6 bg-purple-600 hover:bg-purple-700"
                >
                  {discussionStep === discussionPrompts.followUpQuestions.length ? 'Finish' : 'Next Question'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Button - Shows when page has quiz question */}
      {currentPageData?.quizQuestion && !currentQuizQuestion && !completedQuizzes.has(currentPageData.id) && (
        <div className="absolute bottom-20 right-6 z-40">
          <Button
            onClick={showQuizForCurrentPage}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-lg animate-pulse"
          >
            <span className="mr-2">🧠</span>
            Quiz Time!
          </Button>
        </div>
      )}

      {/* Discussion Button - Shows on last page when discussion is available */}
      {isLastPage && discussionPrompts && !showDiscussion && (
        <div className="absolute bottom-20 left-6 z-40">
          <Button
            onClick={startDiscussion}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-3 shadow-lg animate-pulse"
          >
            <span className="mr-2">💭</span>
            Let's Discuss!
          </Button>
        </div>
      )}

      {/* Professor Nova Curiosity Engine Popup */}
      <ProfessorNovaPopup
        isOpen={isNovaPopupOpen}
        isLoading={isNovaLoading}
        insight={novaInsight}
        onClose={() => {
          setIsNovaPopupOpen(false)
          setNovaInsight(null)
        }}
      />
    </div>
  )
}

// Export both named and default for flexibility
export default Storybook
