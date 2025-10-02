"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Search, 
  BookOpen, 
  Lightbulb, 
  RefreshCw,
  Filter,
  Eye,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { VantaBackground } from '@/components/vanta-background'
import { PageTransition } from '@/components/layout/page-transition'

interface DiscoveryEntry {
  id: string
  topic_id: string
  subtype: 'FACT' | 'DOCUMENT' | 'INFO'
  title: string
  payload: any
  difficulty?: string
  topics: {
    title: string
    grade_level: number
    study_areas: {
      name: string
    }[]
  }[]
  connections?: string[]
}

interface CardPosition {
  x: number
  y: number
  id: string
}

interface LayoutPattern {
  name: string
  positions: (cards: DiscoveryEntry[]) => CardPosition[]
}

// Mock data for discovery content
const mockDiscoveryContent: DiscoveryEntry[] = [
  {
    id: 'fact-1',
    topic_id: 'physics-1',
    subtype: 'FACT',
    title: 'Gravity Facts',
    payload: {
      content: 'Did you know that if you could dig a tunnel through the center of the Earth and jump in, it would take about 42 minutes to fall to the other side?',
      funFact: 'You would be weightless at the center!',
      sources: 'Physics Classroom, NASA Earth Science Division'
    },
    difficulty: 'easy',
    topics: [{
      title: 'Forces and Motion',
      grade_level: 4,
      study_areas: [{ name: 'Physics' }]
    }],
    connections: ['info-1', 'fact-2']
  },
  {
    id: 'info-1',
    topic_id: 'physics-2',
    subtype: 'INFO',
    title: 'Solar System Scale',
    payload: {
      content: 'If Earth were the size of a marble, the Sun would be about 3 feet wide and located about 300 feet away. This incredible scale helps us understand just how vast our solar system really is. The nearest star would be over 15,000 miles away!',
      sources: 'NASA Solar System Exploration, Astronomical Society'
    },
    difficulty: 'medium',
    topics: [{
      title: 'Space Science',
      grade_level: 5,
      study_areas: [{ name: 'Astronomy' }]
    }],
    connections: ['fact-3']
  },
  {
    id: 'fact-2',
    topic_id: 'chemistry-1',
    subtype: 'FACT',
    title: 'Water Molecule',
    payload: {
      content: 'A single drop of water contains approximately 1.7 sextillion molecules. That\'s 1,700,000,000,000,000,000,000 molecules!',
      funFact: 'If you could count one molecule per second, it would take 54 billion years!',
      sources: 'Chemistry Textbook Association, Molecular Science Institute'
    },
    difficulty: 'medium',
    topics: [{
      title: 'Matter and Molecules',
      grade_level: 6,
      study_areas: [{ name: 'Chemistry' }]
    }],
    connections: ['info-2']
  },
  {
    id: 'info-2',
    topic_id: 'biology-1',
    subtype: 'INFO',
    title: 'Ocean Depths',
    payload: {
      content: 'The deepest part of the ocean, the Mariana Trench, is so deep that if Mount Everest were placed at the bottom, its peak would still be over a mile underwater. The pressure there is over 1,000 times greater than at sea level, crushing anything that isn\'t specially adapted.',
      sources: 'NOAA Ocean Exploration, National Geographic Society'
    },
    difficulty: 'hard',
    topics: [{
      title: 'Marine Biology',
      grade_level: 7,
      study_areas: [{ name: 'Biology' }]
    }],
    connections: ['fact-4']
  },
  {
    id: 'fact-3',
    topic_id: 'biology-2',
    subtype: 'FACT',
    title: 'Heart Beats',
    payload: {
      content: 'Your heart beats about 100,000 times per day, pumping roughly 2,000 gallons of blood through your body.',
      funFact: 'In a lifetime, your heart will beat over 2.5 billion times!',
      sources: 'American Heart Association, Mayo Clinic'
    },
    difficulty: 'easy',
    topics: [{
      title: 'Human Body',
      grade_level: 4,
      study_areas: [{ name: 'Biology' }]
    }],
    connections: ['info-3']
  },
  {
    id: 'info-3',
    topic_id: 'chemistry-2',
    subtype: 'INFO',
    title: 'States of Matter',
    payload: {
      content: 'Matter exists in many more states than just solid, liquid, and gas. Scientists have identified at least 15 different states of matter, including plasma (found in stars), Bose-Einstein condensates (created in ultra-cold laboratories), and superfluids that can flow without friction.',
      sources: 'American Physical Society, MIT Physics Department'
    },
    difficulty: 'medium',
    topics: [{
      title: 'Physical Science',
      grade_level: 5,
      study_areas: [{ name: 'Chemistry' }]
    }],
    connections: ['fact-5']
  },
  {
    id: 'fact-4',
    topic_id: 'biology-3',
    subtype: 'FACT',
    title: 'Tree Age',
    payload: {
      content: 'The oldest living tree is over 4,800 years old! It\'s a Great Basin bristlecone pine named Methuselah.',
      funFact: 'This tree was already ancient when the pyramids were built!',
      sources: 'U.S. Forest Service, Botanical Research Institute'
    },
    difficulty: 'easy',
    topics: [{
      title: 'Plant Biology',
      grade_level: 3,
      study_areas: [{ name: 'Biology' }]
    }],
    connections: ['info-4']
  },
  {
    id: 'info-4',
    topic_id: 'physics-3',
    subtype: 'INFO',
    title: 'Light Speed',
    payload: {
      content: 'Light travels so fast that it could circle the Earth\'s equator 7.5 times in just one second! This incredible speed means that when you look at the stars, you\'re actually seeing them as they were years ago because the light takes time to reach us.',
      sources: 'International Bureau of Weights and Measures, ESA'
    },
    difficulty: 'hard',
    topics: [{
      title: 'Light and Energy',
      grade_level: 6,
      study_areas: [{ name: 'Physics' }]
    }],
    connections: ['fact-1']
  },
  {
    id: 'fact-5',
    topic_id: 'chemistry-3',
    subtype: 'FACT',
    title: 'Diamond Formation',
    payload: {
      content: 'Diamonds form deep in Earth\'s mantle under extreme pressure and temperature, then are brought to the surface by volcanic eruptions.',
      funFact: 'Most diamonds are over 1 billion years old!',
      sources: 'Geological Society of America, Smithsonian Gem Collection'
    },
    difficulty: 'medium',
    topics: [{
      title: 'Earth Science',
      grade_level: 5,
      study_areas: [{ name: 'Geology' }]
    }],
    connections: ['info-1']
  }
]

export default function DiscoveryPage() {
  const [discoveryContent, setDiscoveryContent] = useState<DiscoveryEntry[]>(mockDiscoveryContent)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<DiscoveryEntry | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [layoutPattern, setLayoutPattern] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  // New collision-free positioning state
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<{[key: string]: HTMLDivElement | null}>({})
  const [cardPositions, setCardPositions] = useState<{[key: string]: {x: number, y: number}}>({})
  const [layoutReady, setLayoutReady] = useState(false)
  
  // Custom scrollbar styles as an object to apply to scrollable areas
  const scrollbarStyle = {
    scrollbarWidth: 'thin' as 'thin', // for Firefox
    scrollbarColor: 'rgba(255,255,255,0.3) rgba(0,0,0,0)', // for Firefox
    msOverflowStyle: '-ms-autohiding-scrollbar' as '-ms-autohiding-scrollbar', // for IE/Edge
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255,255,255,0.3)',
      borderRadius: '3px',
      '&:hover': {
        background: 'rgba(255,255,255,0.5)',
      }
    }
  }
  
  const { user, profile } = useAuth()

  // STRUCTURED PREDEFINED LAYOUTS - Web-friendly with guaranteed no overlaps
  // Based on actual card dimensions: INFO(22x18%), FACT(18x15%)
  const PREDEFINED_LAYOUTS = [
    // Layout 1: Clean two-column layout
    [
      { type: 'INFO', x: 5, y: 8 },     // Left top
      { type: 'FACT', x: 5, y: 35 },           // Left middle
      { type: 'INTERACTIVE', x: 5, y: 65 },    // Left bottom
      { type: 'FACT', x: 55, y: 8 },           // Right top
      { type: 'INTERACTIVE', x: 55, y: 35 },   // Right middle
      { type: 'FACT', x: 55, y: 65 }           // Right bottom
    ],
    // Layout 2: Three-row layout with alternating sides
    [
      { type: 'INTERACTIVE', x: 8, y: 5 },     // Top left
      { type: 'FACT', x: 70, y: 5 },           // Top right
      { type: 'INTERACTIVE', x: 65, y: 35 },   // Middle right
      { type: 'FACT', x: 10, y: 35 },          // Middle left
      { type: 'INTERACTIVE', x: 8, y: 70 },    // Bottom left
      { type: 'FACT', x: 65, y: 70 }           // Bottom right
    ],
    // Layout 3: Wide spread horizontal
    [
      { type: 'INTERACTIVE', x: 2, y: 15 },    // Far left
      { type: 'FACT', x: 28, y: 8 },           // Left center
      { type: 'INTERACTIVE', x: 50, y: 20 },   // Center
      { type: 'FACT', x: 76, y: 12 },          // Right center
      { type: 'INTERACTIVE', x: 25, y: 55 },   // Lower left
      { type: 'FACT', x: 65, y: 65 }           // Lower right
    ],
    // Layout 4: Diagonal cascade
    [
      { type: 'INTERACTIVE', x: 5, y: 10 },    // Top left
      { type: 'FACT', x: 25, y: 25 },          // Step right/down
      { type: 'INTERACTIVE', x: 45, y: 40 },   // Step right/down
      { type: 'FACT', x: 70, y: 15 },          // Top right
      { type: 'INTERACTIVE', x: 15, y: 70 },   // Bottom left
      { type: 'FACT', x: 60, y: 75 }           // Bottom right
    ],
    // Layout 5: Corner positions with center
    [
      { type: 'INTERACTIVE', x: 3, y: 5 },     // Top left corner
      { type: 'FACT', x: 75, y: 8 },           // Top right corner
      { type: 'INTERACTIVE', x: 40, y: 35 },   // Center
      { type: 'FACT', x: 8, y: 75 },           // Bottom left corner
      { type: 'INTERACTIVE', x: 70, y: 70 },   // Bottom right corner
      { type: 'FACT', x: 45, y: 15 }           // Top center
    ],
    // Layout 6: Asymmetric organic
    [
      { type: 'INTERACTIVE', x: 12, y: 12 },   // Upper left
      { type: 'FACT', x: 65, y: 20 },          // Upper right
      { type: 'INTERACTIVE', x: 35, y: 45 },   // Center
      { type: 'FACT', x: 8, y: 55 },           // Mid left
      { type: 'INTERACTIVE', x: 75, y: 55 },   // Mid right
      { type: 'FACT', x: 40, y: 78 }           // Bottom center
    ]
  ]

  // Helper function to calculate dynamic card dimensions
  const getCardDimensions = (card: DiscoveryEntry, isExpanded = false) => {
    const isFact = card.subtype === 'FACT'
    
    if (isFact) {
      // FACT cards: adaptive sizing like INFO cards
      const contentLength = card.payload?.content?.length || 0
      const sourcesLength = card.payload?.sources?.length || 50 // Account for sources text
      const minWidth = 220
      const minHeight = 160
      const maxWidth = 400 // Increased max width
      const maxHeight = 350 // Significantly increased to accommodate sources
      
      // More generous sizing for fact content with sources
      const dynamicWidth = Math.max(minWidth, Math.min(minWidth + Math.floor(contentLength / 70) * 25, maxWidth))
      // Account for sources section height (approximately 70px) and icon/padding
      const dynamicHeight = Math.max(minHeight, Math.min(minHeight + Math.floor(contentLength / 100) * 25 + 70, maxHeight))
      
      return {
        width: isExpanded ? Math.min(dynamicWidth * 1.2, maxWidth * 1.2) : dynamicWidth,
        height: isExpanded ? Math.min(dynamicHeight * 1.2, maxHeight * 1.2) : dynamicHeight
      }
    } else {
      // INTERACTIVE cards: more dynamic sizing for longer content
      const contentLength = card.payload?.content?.length || 0
      const sourcesLength = card.payload?.sources?.length || 50 // Account for sources text
      const minWidth = 256
      const minHeight = 160
      const maxWidth = 450
      const maxHeight = 380 // Increased to accommodate sources
      
      // More generous sizing for interactive content
      const dynamicWidth = Math.max(minWidth, Math.min(minWidth + Math.floor(contentLength / 60) * 25, maxWidth))
      // Account for sources section height (approximately 60px)
      const dynamicHeight = Math.max(minHeight, Math.min(minHeight + Math.floor(contentLength / 100) * 20 + 60, maxHeight))
      
      return {
        width: isExpanded ? Math.min(dynamicWidth * 1.2, maxWidth * 1.2) : dynamicWidth,
        height: isExpanded ? Math.min(dynamicHeight * 1.3, maxHeight * 1.3) : dynamicHeight
      }
    }
  }

  // Collision-free positioning algorithm - matches original implementation
  const calculatePositions = () => {
    if (!containerRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const positions: {[key: string]: {x: number, y: number}} = {}
    const placedCards: {left: number, top: number, right: number, bottom: number}[] = []
    
    // Safety margins
    const MARGIN = 20
    const MIN_DISTANCE = 30

    filteredContent.forEach((card, index) => {
      let attempts = 0
      let position = null
      
      // Get ACTUAL card dimensions from DOM - prefer real measurements
      const cardElement = cardRefs.current[card.id]
      let cardWidth, cardHeight
      
      if (cardElement && cardElement.offsetWidth > 0) {
        // Use actual DOM dimensions if available
        cardWidth = cardElement.offsetWidth
        cardHeight = cardElement.offsetHeight
      } else {
        // Fallback to calculated dimensions
        const isExpanded = expandedCard === card.id
        const dimensions = getCardDimensions(card, isExpanded)
        cardWidth = dimensions.width
        cardHeight = dimensions.height
      }
      
      // Try random positions until we find one without overlap
      while (attempts < 50 && !position) {
        const x = MARGIN + Math.random() * (container.width - cardWidth - MARGIN * 2)
        const y = MARGIN + Math.random() * (container.height - cardHeight - MARGIN * 2)
        
        const candidateRect = {
          left: x,
          top: y,
          right: x + cardWidth,
          bottom: y + cardHeight
        }
        
        // Check if this position overlaps with any existing card
        const hasOverlap = placedCards.some(placedRect => 
          !(candidateRect.right + MIN_DISTANCE < placedRect.left ||
            candidateRect.left > placedRect.right + MIN_DISTANCE ||
            candidateRect.bottom + MIN_DISTANCE < placedRect.top ||
            candidateRect.top > placedRect.bottom + MIN_DISTANCE)
        )
        
        if (!hasOverlap) {
          position = { x, y }
          placedCards.push(candidateRect)
        }
        
        attempts++
      }
      
      // Fallback to safe grid position if random placement fails
      if (!position) {
        const gridCols = Math.floor(container.width / (cardWidth + MIN_DISTANCE))
        const gridRow = Math.floor(index / gridCols)
        const gridCol = index % gridCols
        
        position = {
          x: gridCol * (cardWidth + MIN_DISTANCE) + MARGIN,
          y: gridRow * (cardHeight + MIN_DISTANCE) + MARGIN
        }
      }
      
      positions[card.id] = position
    })
    
    setCardPositions(positions)
    setLayoutReady(true)
  }



  const fetchDiscoveryContent = async () => {
    try {
      setLoading(true)
      
      // Call API to fetch real discovery content

      // Fetch real discovery content from API
      let response = await fetch(`/api/discovery?userId=${user?.id || 'default'}&grade=${profile?.grade_level || 4}`)
      let result: any = {}

      if (response.ok) {
        result = await response.json()
      }

      // If no daily content, try random content
      if (!result.data || result.data.length === 0) {
        response = await fetch('/api/discovery', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user?.id || 'default', 
            gradeLevel: profile?.grade_level || 4 
          })
        })
        
        if (response.ok) {
          const randomResult = await response.json()
          if (randomResult.data) {
            result.data = [randomResult.data] // Wrap single result in array
          }
        }
      }
      
      // Transform data to match expected interface
      const transformedContent: DiscoveryEntry[] = (result.data || []).map((item: any) => {
        // Map content appropriately for fact vs info cards
        
        return {
          id: item.id,
          topic_id: item.topic_id,
          subtype: item.content_type === 'fact' ? 'FACT' : 'INFO',
          title: item.title,
          payload: {
            // For FACT cards: use fact_text for flipping content
            // For INTERACTIVE cards: use detail_explanation as full content
            content: item.content_type === 'fact' 
              ? (item.fact_text || 'No fact content available')
              : (item.detail_explanation || 'No detail content available'),
            // For INTERACTIVE cards: use fact_text as preview (shorter content)
            preview: item.content_type === 'info' 
              ? (item.fact_text || item.detail_explanation || 'No preview available')
              : null,
            funFact: item.fun_fact_points?.[0] || null,
            sources: item.source_citation || 'Educational Research Publications'
          },
          difficulty: 'medium',
          topics: item.topics ? [item.topics] : [{
            title: 'Science Discovery',
            grade_level: profile?.grade_level || 4,
            study_areas: [{ name: 'Science' }]
          }],
          connections: []
        }
      })
      
      setDiscoveryContent(transformedContent)
    } catch (error) {
      console.error('Error fetching discovery content:', error)
      // Fallback to empty array if API fails
      setDiscoveryContent([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchDiscoveryContent()
    }
  }, [user?.id, profile?.grade_level])

  const filteredContent = useMemo(() => {
    // Apply search filter first
    let content = discoveryContent
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      content = discoveryContent.filter(content => 
        content.title?.toLowerCase().includes(query) ||
        content.topics?.[0]?.title?.toLowerCase().includes(query) ||
        content.payload?.content?.toLowerCase().includes(query)
      )
    }
    
    // Limit to exactly 3 INFO and 3 FACT cards
    const factCards = content.filter(card => card.subtype === 'FACT').slice(0, 3)
    const infoCards = content.filter(card => card.subtype === 'INFO').slice(0, 3)
    
    // Shuffle for variety each time
    const shuffledFacts = [...factCards].sort(() => Math.random() - 0.5)
    const shuffledInfos = [...infoCards].sort(() => Math.random() - 0.5)
    
    return [...shuffledInfos, ...shuffledFacts]
  }, [discoveryContent, searchQuery])

  // useEffect for collision-free positioning - matches original implementation
  useEffect(() => {
    // Wait for DOM to settle, then calculate positions
    const timer = setTimeout(calculatePositions, 100)
    
    const handleResize = () => {
      setLayoutReady(false)
      setTimeout(calculatePositions, 100)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [filteredContent])
  
  // Note: Removed automatic repositioning on card expansion to prevent unwanted reshuffling
  // Cards now maintain their positions when expanded/collapsed
  // Only reshuffle on initial load, content changes, or manual shuffle button



  const handleCardClick = (card: DiscoveryEntry) => {
    if (card.subtype === 'FACT') {
      // Flip the card
      setFlippedCards(prev => {
        const newSet = new Set(prev)
        if (newSet.has(card.id)) {
          newSet.delete(card.id)
        } else {
          newSet.add(card.id)
        }
        return newSet
      })
    } else {
      // Expand the card
      setExpandedCard(expandedCard === card.id ? null : card.id)
    }
  }

  const renderCard = (card: DiscoveryEntry) => {
    const isFlipped = flippedCards.has(card.id)
    const isExpanded = expandedCard === card.id
    const isFact = card.subtype === 'FACT'

    // Use the helper function to get dynamic dimensions
    const { width: expandedWidth, height: expandedHeight } = getCardDimensions(card, isExpanded)

    const position = cardPositions[card.id]
    if (!position) return null

    return (
      <div
        key={card.id}
        ref={el => { cardRefs.current[card.id] = el; }}
        className={`discovery-card ${card.subtype.toLowerCase()}`}
        style={{
          position: 'absolute',
          left: `${position.x}px`, // Use pixels, not percentages - matches original
          top: `${position.y}px`,   // Use pixels, not percentages - matches original
          width: `${expandedWidth}px`,
          height: `${expandedHeight}px`,
          opacity: layoutReady ? 1 : 0,
          transition: 'all 0.5s ease-in-out', // Matches original transition
          transform: `${isExpanded ? 'scale(1.05)' : 'scale(1)'}`,
          zIndex: isExpanded ? 100 : (hoveredCard === card.id ? 50 : 20),
          isolation: 'isolate'
        }}
      >
        <Card
          className={`w-full cursor-pointer transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
            isFact
              ? 'bg-gradient-to-br from-purple-600/80 to-purple-800/80 border-purple-400/50 text-white'
              : 'bg-gradient-to-br from-cyan-600/80 to-cyan-800/80 border-cyan-400/50 text-white'
          } backdrop-blur-lg shadow-lg hover:shadow-xl`}
          style={{ minHeight: '100%', height: 'auto' }}
          onClick={() => handleCardClick(card)}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
          role="button"
          tabIndex={0}
          aria-label={`${card.subtype} card: ${card.title}. Click to ${isFact ? 'flip' : 'expand'}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCardClick(card)
            }
          }}
        >
          <div className={`w-full p-4 flex flex-col justify-between ${
            isFlipped && isFact ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          style={{ minHeight: `${expandedHeight}px` }}>
            {/* Front side */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {isFact ? (
                  <Lightbulb className="h-4 w-4 text-yellow-300" />
                ) : (
                  <Info className="h-4 w-4 text-cyan-300" />
                )}
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20">
                  {card.subtype}
                </span>
              </div>
              {card.difficulty && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  card.difficulty === 'easy' ? 'bg-green-500/30 text-green-200' :
                  card.difficulty === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                  'bg-red-500/30 text-red-200'
                }`}>
                  {card.difficulty}
                </span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <h3 className={`font-bold leading-tight mb-2 ${
                isFact ? 'text-base' : 'text-lg'
              }`}>
                {card.title}
              </h3>
              {!isFact && (card.payload?.preview || card.payload?.content) && (
                <div className="flex-1 flex flex-col">
                  <div className={`flex-1 ${!isExpanded ? 'overflow-hidden' : 'overflow-y-auto'}`}
                       style={isExpanded ? {
                         maxHeight: `${expandedHeight - 100}px`,
                         ...scrollbarStyle
                       } : {}}>
                    <p className={`text-white/90 leading-relaxed ${
                      isExpanded ? 'text-base' : 'text-sm'
                    } break-words`}
                    style={!isExpanded ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    } : {}}>
                      {isExpanded 
                        ? (card.payload.content || card.payload.preview)
                        : (card.payload.preview || card.payload.content)
                      }
                    </p>
                  </div>
                  
                  {/* Sources section for interactive cards */}
                  <div className="mt-4 pt-3 border-t border-white/20 flex-shrink-0">
                    <p className="text-xs text-white/60 mb-1 font-medium">Sources:</p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {card.payload?.sources || 'Scientific American, Nature, Educational Research Publications'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isFact && (
              <div className="text-center">
                <Sparkles className="h-4 w-4 mx-auto text-yellow-300" />
                <p className="text-xs text-white/80 mt-1">Click to reveal</p>
              </div>
            )}
          </div>

          {/* Back side for FACT cards */}
          {isFact && (
            <div className={`absolute inset-0 w-full p-4 flex flex-col ${
              isFlipped ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}
            style={{
              minHeight: `${expandedHeight}px`
            }}>
              <div className="text-center h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col py-2" 
                     style={{
                       maxHeight: `${expandedHeight - 80}px`, 
                       overflowY: 'auto',
                       ...scrollbarStyle
                     }}>
                  <Lightbulb className="h-6 w-6 mx-auto text-yellow-300 mb-3" />
                  <p className="text-sm text-white leading-relaxed break-words mb-2">
                    {card.payload?.content || 'Fascinating science fact!'}
                  </p>
                  {card.payload?.funFact && (
                    <p className="text-sm text-yellow-200 mt-2 font-medium break-words">
                      💡 {card.payload.funFact}
                    </p>
                  )}
                </div>
                
                {/* Sources section for fact cards */}
                <div className="mt-3 pt-2 border-t border-white/20 flex-shrink-0">
                  <p className="text-xs text-white/60 mb-1 font-medium">Sources:</p>
                  <p className="text-xs text-white/50 break-words leading-relaxed">
                    {card.payload?.sources || 'NASA, National Geographic, Smithsonian Institute'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    )
  }

  const renderConnections = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {filteredContent.map(card => {
          const cardPos = cardPositions[card.id]
          if (!cardPos || !card.connections) return null

          return card.connections.map(connectionId => {
            const targetPos = cardPositions[connectionId]
            if (!targetPos) return null

            return (
              <line
                key={`${card.id}-${connectionId}`}
                x1={`${cardPos.x}`}
                y1={`${cardPos.y}`}
                x2={`${targetPos.x}`}
                y2={`${targetPos.y}`}
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )
          })
        })}
      </svg>
    )
  }

  return (
    <VantaBackground>
      <div className="min-h-screen relative">

        <PageTransition>
          {/* Header */}
          <div className="relative z-20 p-6 pt-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white/80 border border-white/30 bg-white/10 hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-cyan-500/80 to-purple-500/80 p-3 backdrop-blur-sm border border-cyan-400/30 shadow-lg">
                    <Eye className="h-6 w-6 text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                  </div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    Discovery Zone
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search discoveries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 min-w-[250px]"
                  />
                </div>
                <Button
                  onClick={() => {
                    setLayoutReady(false)
                    setTimeout(calculatePositions, 100)
                  }}
                  variant="outline"
                  size="sm"
                  className="text-white/80 border border-white/30 bg-white/10 hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Shuffle Layout
                </Button>
              </div>
            </div>

            {/* Legend */}
            <Card className="mb-6 p-4 bg-white/12 backdrop-blur-lg border border-white/25 rounded-xl shadow-lg">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gradient-to-r from-purple-600 to-purple-800 rounded border border-purple-400/50"></div>
                  <span className="text-white/80">Purple FACT cards flip to reveal details</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded border border-cyan-400/50"></div>
                  <span className="text-white/80">Cyan INFO cards expand for more content</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="20" height="8">
                    <line x1="0" y1="4" x2="20" y2="4" stroke="url(#legendGradient)" strokeWidth="2" strokeDasharray="3,2" />
                    <defs>
                      <linearGradient id="legendGradient">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-white/80">Lines show connections</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Discovery Area */}
          <div className="relative min-h-[calc(100vh-200px)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-white/80">Discovering amazing content...</p>
                </div>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-xl shadow-lg text-center">
                  <Eye className="h-16 w-16 mx-auto text-cyan-400/60 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No discoveries found</h3>
                  <p className="text-white/80 mb-4">Try adjusting your search or explore different topics</p>
                  <Button 
                    onClick={fetchDiscoveryContent}
                    className="bg-gradient-to-r from-cyan-600/80 to-purple-600/80 hover:from-cyan-600 hover:to-purple-600 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Content
                  </Button>
                </Card>
              </div>
            ) : (
              <div 
                ref={containerRef}
                className="constellation-container" 
                style={{ 
                  position: 'relative',
                  width: '100%',
                  height: '800px',
                  overflow: 'hidden',
                  minHeight: '800px'
                }}
              >
                {renderConnections()}
                {filteredContent.map((card) => renderCard(card))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="relative z-20 text-center py-6">
            <Link href="/arcade">
              <Button 
                variant="outline" 
                className="px-6 py-3 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200 backdrop-blur-sm hover:bg-purple-400/30 hover:border-purple-300/60 transition-all duration-300"
              >
                Try Knowledge Arcade
              </Button>
            </Link>
          </div>
        </PageTransition>
      </div>
    </VantaBackground>
  )
}