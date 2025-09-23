"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import Link from 'next/link'
import { 
  Search, 
  BookOpen, 
  Lightbulb, 
  RefreshCw,
  Filter,
  Eye,
  Calendar,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { VantaBackground } from '@/components/vanta-background'
import { PageTransition } from '@/components/layout/page-transition'

interface SearchResult {
  id: string
  content: string
  metadata: any
  similarity: number
}

interface DiscoveryEntry {
  id: string
  topic_id: string
  subtype: 'FACT' | 'DOCUMENT' | 'INTERACTIVE'
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
}

interface FactViewer {
  title: string
  content: string
  imageUrl?: string
  funFact?: string
  moreInfo?: string
}

export default function DiscoveryPage() {
  const [discoveryContent, setDiscoveryContent] = useState<DiscoveryEntry[]>([])
  const [filteredContent, setFilteredContent] = useState<DiscoveryEntry[]>([])
  const [selectedContent, setSelectedContent] = useState<DiscoveryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [gradeFilter, setGradeFilter] = useState<number | null>(null)
  const [subtypeFilter, setSubtypeFilter] = useState<string | null>(null)
  const [semanticSearchResults, setSemanticSearchResults] = useState<SearchResult[]>([])
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)
  
  const itemsPerPage = 9
  const { session } = useAuth()

  const fetchDiscoveryContent = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Get today's date for deterministic content selection
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('topic_content_entries')
        .select(`
          id,
          topic_id,
          subtype,
          title,
          payload,
          difficulty,
          topics (
            title,
            grade_level,
            study_areas (
              name
            )
          )
        `)
        .eq('category', 'DISCOVERY')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50) // Get recent content for variety

      if (error) {
        console.error('Error fetching discovery content:', error)
        return
      }

      setDiscoveryContent((data as DiscoveryEntry[]) || [])
      setFilteredContent((data as DiscoveryEntry[]) || [])
    } catch (error) {
      console.error('Error fetching discovery content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter content based on search and filters
  useEffect(() => {
    let filtered = discoveryContent

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(content => 
        content.title?.toLowerCase().includes(query) ||
        content.topics?.[0]?.title?.toLowerCase().includes(query) ||
        content.topics?.[0]?.study_areas?.[0]?.name?.toLowerCase().includes(query) ||
        content.payload?.content?.toLowerCase().includes(query)
      )
    }

    // Grade level filter
    if (gradeFilter !== null) {
      filtered = filtered.filter(content => 
        content.topics?.[0]?.grade_level === gradeFilter
      )
    }

    // Subtype filter
    if (subtypeFilter) {
      filtered = filtered.filter(content => 
        content.subtype === subtypeFilter
      )
    }

    setFilteredContent(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchQuery, gradeFilter, subtypeFilter, discoveryContent])

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        threshold: '0.7',
        limit: '5'
      })

      if (gradeFilter) {
        params.append('grade', gradeFilter.toString())
      }

      const response = await fetch(`/api/embeddings?${params}`)
      const result = await response.json()

      if (response.ok) {
        setSemanticSearchResults(result.results || [])
        setShowSemanticSearch(true)
      }
    } catch (error) {
      console.error('Semantic search error:', error)
    }
  }

  const trackEngagement = async (entryId: string, action: string) => {
    try {
      // Log engagement for analytics
      console.log(`Discovery engagement: ${action} on ${entryId}`)
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  const handleViewContent = (content: DiscoveryEntry) => {
    setSelectedContent(content)
    trackEngagement(content.id, 'open')
  }

  const handleCloseContent = () => {
    if (selectedContent) {
      trackEngagement(selectedContent.id, 'close')
    }
    setSelectedContent(null)
  }

  useEffect(() => {
    fetchDiscoveryContent()
  }, [])

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getSubtypeIcon = (subtype: string) => {
    switch (subtype) {
      case 'FACT': return <Lightbulb className="h-5 w-5" />
      case 'DOCUMENT': return <BookOpen className="h-5 w-5" />
      case 'INTERACTIVE': return <Star className="h-5 w-5" />
      default: return <Eye className="h-5 w-5" />
    }
  }

  const getSubtypeColor = (subtype: string) => {
    switch (subtype) {
      case 'FACT': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'DOCUMENT': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'INTERACTIVE': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  // Helper function to create engaging fact previews
  const getFactPreview = (content: DiscoveryEntry) => {
    const payload = content.payload
    if (content.subtype === 'FACT' && payload?.content) {
      // Extract first sentence or first 120 characters
      const fullText = payload.content
      const firstSentence = fullText.split('.')[0] + '.'
      const preview = firstSentence.length <= 120 ? firstSentence : fullText.substring(0, 120) + '...'
      
      // Add engaging elements
      const hasImage = payload.imageUrl
      const hasFunFact = payload.funFact
      
      return {
        preview,
        hasImage,
        hasFunFact,
        engaging: hasImage || hasFunFact,
        imageUrl: payload.imageUrl
      }
    }
    return {
      preview: 'Discover something fascinating...',
      hasImage: false,
      hasFunFact: false,
      engaging: false
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContent = filteredContent.slice(startIndex, endIndex)

  const renderFactModal = (content: DiscoveryEntry) => {
    // Handle different payload structures more defensively
    const fact = content.payload as FactViewer
    const factContent = fact?.content || (content.payload as any)?.text || 'No content available'
    const factTitle = content.title || fact?.title || 'Untitled Fact'
    const factImage = fact?.imageUrl || (content.payload as any)?.image_url
    const factFunFact = fact?.funFact || (content.payload as any)?.fun_fact
    const factMoreInfo = fact?.moreInfo || (content.payload as any)?.more_info
    
    return (
      <div className="relative overflow-hidden">
        {/* Subtly Enhanced Header with Better Structure */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-b border-white/15">
          {/* Background decoration with subtle enhancement */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-cyan-500/12 to-blue-500/8"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 rounded-full blur-3xl"></div>
          
          <div className="relative p-8">
            {/* Topic and Grade Info - Enhanced Colors */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 border border-emerald-400/40 backdrop-blur-sm shadow-lg">
                  <span className="text-emerald-200 font-bold text-lg">
                    {content.topics?.[0]?.title || 'Science'}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 backdrop-blur-sm shadow-lg">
                  <span className="text-white/90 font-semibold">
                    Grade {content.topics?.[0]?.grade_level || 'K-12'}
                  </span>
                </div>
              </div>
              
              {/* Content Type and Difficulty */}
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-500/35 to-indigo-500/35 border-blue-400/50 text-blue-100 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="text-lg">{getSubtypeIcon(content.subtype)}</div>
                    <span className="font-semibold">{content.subtype}</span>
                  </div>
                </Badge>
                {content.difficulty && (
                  <Badge className={`backdrop-blur-sm shadow-lg ${getDifficultyColor(content.difficulty)}`}>
                    {content.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            {/* Title Section - Enhanced Prominence */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-tight tracking-wide drop-shadow-lg">
                {factTitle}
              </h2>
              <div className="w-28 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Subtly Enhanced Content Area */}
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/60 to-slate-800/40">
          {/* Image Section - Subtle Enhancement */}
          {factImage && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 to-purple-500/25 rounded-2xl blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>
              <div className="relative overflow-hidden rounded-2xl border border-white/25 shadow-2xl bg-white/8 backdrop-blur-sm">
                <img 
                  src={factImage} 
                  alt={factTitle}
                  className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            </div>
          )}
          
          {/* Main Content - Enhanced Typography */}
          <div className="relative">
            <div className="bg-gradient-to-r from-white/8 to-white/12 rounded-2xl p-8 border border-white/15 backdrop-blur-sm shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white/95 leading-relaxed text-xl font-light tracking-wide">
                    {factContent}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Information Sections */}
          <div className="grid gap-6">
            {/* Fun Fact - Redesigned */}
            {factFunFact && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative p-6 bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/15 border border-yellow-400/30 rounded-2xl backdrop-blur-sm shadow-xl">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-lg opacity-40"></div>
                        <div className="relative bg-gradient-to-r from-yellow-400 to-amber-400 p-4 rounded-2xl shadow-lg">
                          <Lightbulb className="h-8 w-8 text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="font-bold text-2xl bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
                        Fun Fact
                      </h3>
                      <p className="text-yellow-100/90 leading-relaxed text-lg font-light">
                        {factFunFact}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* More Information - Redesigned */}
            {factMoreInfo && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-indigo-500/15 border border-blue-400/30 rounded-2xl backdrop-blur-sm shadow-xl">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-40"></div>
                        <div className="relative bg-gradient-to-r from-blue-400 to-cyan-400 p-4 rounded-2xl shadow-lg">
                          <Info className="h-8 w-8 text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="font-bold text-2xl bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                        Learn More
                      </h3>
                      <p className="text-blue-100/90 leading-relaxed text-lg font-light">
                        {factMoreInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Get title for the modal
  const getModalTitle = (content: DiscoveryEntry) => {
    const fact = content.payload as FactViewer
    return content.title || fact?.title || 'Untitled Fact'
  }

  return (
    <VantaBackground>
      <main className="container mx-auto px-4 py-8">
        <PageTransition>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="rounded-full bg-gradient-to-r from-green-500/80 to-blue-500/80 p-3 backdrop-blur-sm border border-green-400/30 shadow-lg">
                <BookOpen className="h-8 w-8 text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">
                Discovery Zone
              </h1>
            </div>
            <p className="text-lg text-white/80 max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Explore fascinating facts, documents, and interactive content to expand your knowledge!
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 drop-shadow-sm" />
                <Input
                  type="text"
                  placeholder="Search discoveries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-green-400 drop-shadow-sm" />
                <span className="text-sm font-medium text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">Filters:</span>
              </div>
              
              <select
                value={gradeFilter || ''}
                onChange={(e) => setGradeFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1.5 rounded-full border border-green-400/40 bg-green-400/20 text-green-200 backdrop-blur-sm hover:bg-green-400/30 hover:border-green-300/60 transition-all duration-300 text-sm"
              >
                <option value="" className="bg-gray-800 text-white">All Grades</option>
                {[3, 4, 5, 6, 7, 8].map(grade => (
                  <option key={grade} value={grade} className="bg-gray-800 text-white">Grade {grade}</option>
                ))}
              </select>

              <select
                value={subtypeFilter || ''}
                onChange={(e) => setSubtypeFilter(e.target.value || null)}
                className="px-3 py-1.5 rounded-full border border-blue-400/40 bg-blue-400/20 text-blue-200 backdrop-blur-sm hover:bg-blue-400/30 hover:border-blue-300/60 transition-all duration-300 text-sm"
              >
                <option value="" className="bg-gray-800 text-white">All Types</option>
                <option value="FACT" className="bg-gray-800 text-white">Facts</option>
                <option value="DOCUMENT" className="bg-gray-800 text-white">Documents</option>
                <option value="INTERACTIVE" className="bg-gray-800 text-white">Interactive</option>
              </select>

              {(searchQuery || gradeFilter || subtypeFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setGradeFilter(null)
                    setSubtypeFilter(null)
                  }}
                  className="text-gray-300 border-gray-400 hover:bg-white/10"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-300">
              Showing {filteredContent.length} discoveries
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6 animate-pulse rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded mb-4"></div>
                  <div className="h-10 bg-white/20 rounded"></div>
                </Card>
              ))}
            </div>
          ) : currentContent.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
              <BookOpen className="h-16 w-16 mx-auto text-green-400/60 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">
                {searchQuery || gradeFilter || subtypeFilter ? 'No Results Found' : 'No Discovery Content Available'}
              </h3>
              <p className="text-white/80 mb-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {searchQuery || gradeFilter || subtypeFilter 
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new discoveries!'
                }
              </p>
              <div className="flex gap-4 justify-center">
                {(searchQuery || gradeFilter || subtypeFilter) && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setGradeFilter(null)
                      setSubtypeFilter(null)
                    }}
                    className="px-4 py-2 rounded-full border border-blue-400/40 bg-blue-400/20 text-blue-200 backdrop-blur-sm hover:bg-blue-400/30 hover:border-blue-300/60 transition-all duration-300"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button 
                  onClick={() => fetchDiscoveryContent(true)}
                  className="bg-gradient-to-r from-green-600/80 to-blue-600/80 hover:from-green-600 hover:to-blue-600 text-white rounded-lg border border-green-400/30 backdrop-blur-sm transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentContent.map((content) => {
                  const factPreview = getFactPreview(content)
                  return (
                    <Card 
                      key={content.id} 
                      className="group relative overflow-hidden rounded-2xl border border-white/25 bg-black/20 backdrop-blur-lg shadow-lg transition-all duration-500 hover:shadow-[0_20px_40px_rgba(34,197,94,0.4)] hover:-translate-y-2 hover:scale-105 transform-gpu hover:bg-black/30 cursor-pointer"
                    >
                    {/* Image background for facts with images */}
                    {factPreview.hasImage && (
                      <div className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity duration-500">
                        <img 
                          src={factPreview.imageUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      </div>
                    )}
                    
                    {/* Subtle energy ripples on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                      <div className="absolute inset-0 rounded-2xl border-2 border-green-400/20 animate-ping"></div>
                      <div className="absolute inset-2 rounded-2xl border border-blue-400/30 animate-ping delay-200"></div>
                    </div>
                    
                    {/* Engaging visual indicator */}
                    {factPreview.engaging && (
                      <div className="absolute top-3 right-3 z-20">
                        <div className="bg-yellow-500/30 backdrop-blur-sm border border-yellow-400/50 rounded-full p-1.5 shadow-lg">
                          <Star className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" fill="currentColor" />
                        </div>
                      </div>
                    )}
                    
                    <div className="relative p-6 z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-sm transition-all duration-300 ${getSubtypeColor(content.subtype)}`}>
                              <div className="flex items-center gap-1">
                                <div className="drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                                  {getSubtypeIcon(content.subtype)}
                                </div>
                                <span className="font-medium">
                                  {content.subtype}
                                </span>
                              </div>
                            </Badge>
                            {content.difficulty && (
                              <Badge className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-sm transition-all duration-300 ${getDifficultyColor(content.difficulty)}`}>
                                {content.difficulty}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-green-200 transition-colors duration-300 mb-3 leading-tight line-clamp-2">
                            {content.title}
                          </h3>
                        </div>
                      </div>

                      {/* Enhanced Content Preview */}
                      <div className="mb-4">
                        <p className="text-white/80 text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-white/90 transition-colors duration-300">
                          {factPreview.preview}
                        </p>
                        
                        {/* Preview indicators */}
                        <div className="flex items-center gap-2 mt-3">
                          {factPreview.hasImage && (
                            <span className="text-xs px-2 py-1 rounded-full border border-blue-400/40 bg-blue-400/20 text-blue-200 backdrop-blur-sm">
                              📸 Visual
                            </span>
                          )}
                          {factPreview.hasFunFact && (
                            <span className="text-xs px-2 py-1 rounded-full border border-yellow-400/40 bg-yellow-400/20 text-yellow-200 backdrop-blur-sm">
                              💡 Fun Fact
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-white/80 mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-white/90 transition-colors duration-300">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{content.topics?.[0]?.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Grade {content.topics?.[0]?.grade_level}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleViewContent(content)}
                          className="px-4 py-2 bg-green-600/60 hover:bg-green-600/80 transition-all duration-300 text-white text-sm rounded-full border border-green-400/40 backdrop-blur-sm shadow-md hover:shadow-green-500/30"
                          size="sm"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Explore
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="p-6 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full border border-blue-400/40 bg-blue-400/20 text-blue-200 backdrop-blur-sm hover:bg-blue-400/30 hover:border-blue-300/60 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-blue-400/20"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1
                      const isActive = page === currentPage
                      return (
                        <Button
                          key={page}
                          variant={isActive ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={
                            isActive
                              ? "w-10 h-10 rounded-full bg-gradient-to-r from-green-600/80 to-blue-600/80 text-white border border-green-400/30 backdrop-blur-sm shadow-lg drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                              : "w-10 h-10 rounded-full border border-white/30 bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                          }
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full border border-blue-400/40 bg-blue-400/20 text-blue-200 backdrop-blur-sm hover:bg-blue-400/30 hover:border-blue-300/60 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-blue-400/20"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link href="/arcade">
            <Button 
              variant="outline" 
              className="mx-2 px-6 py-3 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200 backdrop-blur-sm hover:bg-purple-400/30 hover:border-purple-300/60 transition-all duration-300"
            >
              Try Knowledge Arcade
            </Button>
          </Link>
        </div>
        </PageTransition>
      </main>

      {/* Fact Modal */}
      <Modal
        isOpen={!!selectedContent}
        onClose={handleCloseContent}
        title={selectedContent ? getModalTitle(selectedContent) : ''}
        size="lg"
      >
        {selectedContent && renderFactModal(selectedContent)}
      </Modal>
    </VantaBackground>
  )
}