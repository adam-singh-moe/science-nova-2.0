"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Volume2, VolumeX, Book, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { storybookSounds } from "./storybook-sounds"
import "./storybook.css"

interface StoryPage {
  id: string
  content: string
  backgroundImage?: string
  title?: string
  backgroundPrompt?: string
}

interface StorybookProps {
  pages: StoryPage[]
  title: string
  onClose: () => void
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

// Background images for different themes (you would replace these with actual image URLs)
const THEME_BACKGROUNDS: Record<string, string> = {
  desert: "linear-gradient(135deg, #f4a460 0%, #daa520 50%, #cd853f 100%)",
  jungle: "linear-gradient(135deg, #228b22 0%, #32cd32 50%, #006400 100%)",
  ocean: "linear-gradient(135deg, #4682b4 0%, #87ceeb 50%, #191970 100%)",
  space: "linear-gradient(135deg, #191970 0%, #483d8b 50%, #000000 100%)",
  laboratory: "linear-gradient(135deg, #f0f8ff 0%, #e6e6fa 50%, #d3d3d3 100%)",
  default: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #f59e0b 100%)"
}

export function Storybook({ pages, title, onClose }: StorybookProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward")
  const [showGlossary, setShowGlossary] = useState<{ word: string; definition: string; x: number; y: number } | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [enhancedPages, setEnhancedPages] = useState<StoryPage[]>(pages)
  const [imageGenerationQueue, setImageGenerationQueue] = useState<Set<number>>(new Set())
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  
  const bookRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const totalPages = enhancedPages.length
  const currentPageData = enhancedPages[currentPage]

  // Function to generate background image for a specific page
  const generateBackgroundImage = useCallback(async (pageIndex: number) => {
    const page = enhancedPages[pageIndex]
    if (!page.backgroundPrompt || imageGenerationQueue.has(pageIndex) || page.backgroundImage?.startsWith('data:')) {
      return // Already generated or in queue
    }

    setImageGenerationQueue(prev => new Set(prev).add(pageIndex))
    setIsGeneratingImage(true)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: page.backgroundPrompt,
          aspectRatio: "16:9"
        }),
      })

      if (response.ok) {
        const { imageUrl } = await response.json()
        
        setEnhancedPages(prevPages => 
          prevPages.map((p, i) => 
            i === pageIndex 
              ? { ...p, backgroundImage: imageUrl }
              : p
          )
        )
      }
    } catch (error) {
      console.error('Error generating background image:', error)
    } finally {
      setImageGenerationQueue(prev => {
        const newSet = new Set(prev)
        newSet.delete(pageIndex)
        return newSet
      })
      setIsGeneratingImage(false)
    }
  }, [enhancedPages, imageGenerationQueue])

  // Generate images for current and nearby pages
  useEffect(() => {
    // Generate image for current page
    generateBackgroundImage(currentPage)
    
    // Pre-generate images for next and previous pages for smooth transitions
    if (currentPage > 0) {
      generateBackgroundImage(currentPage - 1)
    }
    if (currentPage < totalPages - 1) {
      generateBackgroundImage(currentPage + 1)
    }
  }, [currentPage, generateBackgroundImage, totalPages])

  // Enhanced page flip with 3D animation
  const handlePageFlip = useCallback((direction: "forward" | "backward") => {
    if (isFlipping) return

    const newPage = direction === "forward" ? currentPage + 1 : currentPage - 1
    if (newPage < 0 || newPage >= totalPages) return

    setFlipDirection(direction)
    setIsFlipping(true)
    
    // Play page turn sound effect
    if (soundEnabled) {
      storybookSounds.playPageTurn()
    }

    setTimeout(() => {
      setCurrentPage(newPage)
      setIsFlipping(false)
      setShowGlossary(null) // Clear any open glossary
    }, 600)
  }, [currentPage, isFlipping, totalPages, soundEnabled])

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
          handlePageFlip("forward")
          break
        case "Escape":
          onClose()
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
  }, [handlePageFlip, onClose, totalPages])

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
    let processedContent = content

    // Make glossary words clickable
    Object.keys(GLOSSARY).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      processedContent = processedContent.replace(
        regex, 
        `<span class="interactive-word cursor-pointer text-blue-600 underline decoration-dotted hover:text-blue-800 transition-colors" data-word="${word}">$&</span>`
      )
    })

    return processedContent
  }, [])

  // Determine background based on content theme
  const getBackgroundStyle = useCallback((page: StoryPage) => {
    const content = page.content.toLowerCase()
    
    if (page.backgroundImage) {
      // Check if it's a data URL (generated image) or gradient
      if (page.backgroundImage.startsWith("data:")) {
        return {
          backgroundImage: `url(${page.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }
      } else if (page.backgroundImage.startsWith("linear-gradient")) {
        return { background: page.backgroundImage }
      } else {
        return {
          backgroundImage: `url(${page.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }
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
    if (currentPage < totalPages - 1) {
      handlePageFlip("forward")
    }
  }

  // Handle clicks on processed content
  useEffect(() => {
    const handleContentClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('interactive-word')) {
        const word = target.getAttribute('data-word')
        if (word) {
          handleWordClick(e as any, word)
        }
      }
    }

    document.addEventListener('click', handleContentClick)
    return () => document.removeEventListener('click', handleContentClick)
  }, [handleWordClick])

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={getBackgroundStyle(currentPageData)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Ambient background animation with particles */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse" />
        
        {/* Floating particles */}
        <div className="background-particles">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
      </div>

      {/* Minimal exit button - top right corner */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          onClick={onClose}
          size="sm"
          className="bg-black/50 backdrop-blur-sm border border-white/30 text-white hover:bg-black/70 rounded-full w-12 h-12 p-0 group transition-all duration-300"
        >
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>

      {/* Image generation indicator */}
      {isGeneratingImage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/70 backdrop-blur-sm text-white rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl border border-white/20">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Generating magical background...</span>
          </div>
        </div>
      )}

      {/* Audio control */}
      <div className="absolute top-6 left-6 z-50">
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
      </div>

      {/* Enhanced progress dots with animations - bottom center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
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
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
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
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 backdrop-blur-sm rounded-full p-3 text-white">
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
              {currentPage < totalPages - 1 && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 backdrop-blur-sm rounded-full p-3 text-white">
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

              {/* Page content with dynamic styling and shimmer effect */}
              <div className="max-w-4xl w-full">
                <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl storybook-shimmer">
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
                </div>
              </div>
            </div>

            {/* Enhanced page curl effect - bottom right corner */}
            {currentPage < totalPages - 1 && (
              <div 
                className="page-curl"
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
            transform: "translate(-50%, -100%)"
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
    </div>
  )
}

// Export both named and default for flexibility
export default Storybook
