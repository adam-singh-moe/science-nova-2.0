"use client"

import { useState, useEffect } from "react"
import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Sparkles, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import Storybook from "@/components/ui/storybook-enhanced"

// Function to create topic-based Vanta fallback backgrounds
const createTopicBasedVantaFallback = (prompt: string): { gradient: string, vantaEffect: string } => {
  const lowerPrompt = prompt.toLowerCase()
  
  // Map content themes to Vanta effects and gradient backgrounds
  // Order matters - more specific keywords first, check for exact word boundaries
  if (lowerPrompt.includes('laboratory') || lowerPrompt.includes('research laboratory')) {
    return {
      gradient: "linear-gradient(135deg, #f0f8ff 0%, #e6e6fa 50%, #d3d3d3 100%)",
      vantaEffect: 'net'
    }
  } else if (lowerPrompt.includes('underwater') || lowerPrompt.includes('ocean')) {
    return {
      gradient: "linear-gradient(135deg, #4682b4 0%, #87ceeb 50%, #191970 100%)",
      vantaEffect: 'waves'
    }
  } else if (lowerPrompt.includes('sea') || lowerPrompt.includes(' water ') || lowerPrompt.includes('aquatic')) {
    return {
      gradient: "linear-gradient(135deg, #4682b4 0%, #87ceeb 50%, #191970 100%)",
      vantaEffect: 'waves'
    }
  } else if (lowerPrompt.includes('space') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('stars')) {
    return {
      gradient: "linear-gradient(135deg, #191970 0%, #483d8b 50%, #000000 100%)",
      vantaEffect: 'globe'
    }
  } else if (lowerPrompt.includes('science') || lowerPrompt.includes('experiment') || lowerPrompt.includes('research')) {
    return {
      gradient: "linear-gradient(135deg, #f0f8ff 0%, #e6e6fa 50%, #d3d3d3 100%)",
      vantaEffect: 'net'
    }
  } else if (lowerPrompt.includes('magical') || lowerPrompt.includes('fantasy') || lowerPrompt.includes('mystical') || lowerPrompt.includes('enchanted')) {
    return {
      gradient: "linear-gradient(135deg, #9932cc 0%, #ba55d3 50%, #4b0082 100%)",
      vantaEffect: 'halo'
    }
  } else if (lowerPrompt.includes('arctic') || lowerPrompt.includes('ice') || lowerPrompt.includes('snow') || lowerPrompt.includes('frozen')) {
    return {
      gradient: "linear-gradient(135deg, #b0e0e6 0%, #add8e6 50%, #4682b4 100%)",
      vantaEffect: 'clouds2'
    }
  } else if (lowerPrompt.includes('volcano') || lowerPrompt.includes('fire') || lowerPrompt.includes('lava') || lowerPrompt.includes('eruption')) {
    return {
      gradient: "linear-gradient(135deg, #ff4500 0%, #ff6347 50%, #8b0000 100%)",
      vantaEffect: 'birds'
    }
  } else if (lowerPrompt.includes('cave') || lowerPrompt.includes('crystal') || lowerPrompt.includes('mineral') || lowerPrompt.includes('geology')) {
    return {
      gradient: "linear-gradient(135deg, #708090 0%, #a0a0a0 50%, #2f4f4f 100%)",
      vantaEffect: 'topology'
    }
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('jungle') || lowerPrompt.includes('nature') || lowerPrompt.includes('garden')) {
    return {
      gradient: "linear-gradient(135deg, #228b22 0%, #32cd32 50%, #006400 100%)",
      vantaEffect: 'cells'
    }
  } else if (lowerPrompt.includes('desert') || lowerPrompt.includes('sand') || lowerPrompt.includes('archaeology') || lowerPrompt.includes('dig')) {
    return {
      gradient: "linear-gradient(135deg, #f4a460 0%, #daa520 50%, #cd853f 100%)",
      vantaEffect: 'rings'
    }
  } else {
    // Default cosmic theme
    return {
      gradient: "linear-gradient(135deg, #191970 0%, #483d8b 50%, #000000 100%)",
      vantaEffect: 'globe'
    }
  }
}

interface Adventure {
  id: string
  title: string
  description: string
  backgroundImage?: string
  subject: string
  concepts: string[]
  difficulty: string
  duration: string
  objectives: string[]
  hasTextbookContent?: boolean
  textbookSources?: string[]
}

interface StoryPage {
  id: string
  title: string
  content: string
  backgroundImage?: string
  backgroundPrompt: string
  vantaEffect?: string
  quizQuestion?: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }
  choices?: { text: string; nextPageId: string; consequences?: string[] }[]
  dynamicChoicePrompt?: string
  consequences?: { [choiceId: string]: string[] }
  prerequisites?: string[]
  collectibles?: { id: string; name: string; description: string }[]
  progressWeight?: number
}

interface Story {
  title: string
  pages: StoryPage[]
  reflectionQuestions: string[]
  discussionPrompts?: {
    openingQuestion: string
    followUpQuestions: string[]
    encouragementPhrase: string
  }
  gradeLevel?: number
  learningStyle?: string
  hasTextbookContent?: boolean
  textbookSources?: string[]
}

export default function LearningAdventure() {
  const { toast } = useToast()
  const { user, profile, loading: authLoading } = useAuth()
  const [adventures, setAdventures] = useState<Adventure[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [loadingAdventures, setLoadingAdventures] = useState(false)
  const [loadingStory, setLoadingStory] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    if (!authLoading && user) {
      loadAdventures()
    }
  }, [authLoading, user])

  const loadAdventures = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate personalized adventures.",
        variant: "destructive",
      })
      return
    }

    setLoadingAdventures(true)
    try {
      console.log('🎮 Loading adventures for user:', user.id)
      
      const response = await fetch('/api/generate-adventure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load adventures: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setAdventures(data.adventures || [])
      
      toast({
        title: "Adventures Ready!",
        description: `Generated ${data.adventures?.length || 0} personalized science adventures for Grade ${data.gradeLevel || profile?.grade_level || 'your level'}.`,
      })

    } catch (error) {
      console.error('Error loading adventures:', error)
      toast({
        title: "Error",
        description: "Failed to load adventures. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAdventures(false)
    }
  }

  // Function to pre-generate all images for a story
  const preGenerateAllImages = async (storyPages: StoryPage[]): Promise<StoryPage[]> => {
    console.log('🚀 Starting pre-generation of all story images...')
    setGeneratingImages(true)
    
    const pagesToGenerate = storyPages.filter(page => page.backgroundPrompt && !page.backgroundImage)
    setImageProgress({ current: 0, total: pagesToGenerate.length })
    
    if (pagesToGenerate.length === 0) {
      console.log('ℹ️ No images to generate - all pages already have images')
      setGeneratingImages(false)
      return storyPages
    }
    
    console.log(`📊 Found ${pagesToGenerate.length} pages that need image generation`)
    
    const updatedPages = [...storyPages]
    let successCount = 0
    const maxGenerationTime = 60000 // 60 seconds maximum
    const startTime = Date.now()
    
    // Generate images sequentially to avoid overwhelming the API
    for (let i = 0; i < pagesToGenerate.length; i++) {
      const page = pagesToGenerate[i]
      setImageProgress({ current: i + 1, total: pagesToGenerate.length })
      
      // Check if we've exceeded maximum time
      if (Date.now() - startTime > maxGenerationTime) {
        console.log(`⏰ Maximum generation time reached (${maxGenerationTime/1000}s), stopping early`)
        break
      }
      
      try {
        console.log(`🎨 Generating image ${i + 1}/${pagesToGenerate.length} for page: ${page.id}`)
        
        // Add timeout to individual requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout per image
        
        const response = await fetch('/api/generate-image-enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: page.backgroundPrompt,
            aspectRatio: '16:9',
            gradeLevel: 5 // Could be passed from user profile
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.imageUrl) {
            // Find the page in the updated array and set the image
            const pageIndex = updatedPages.findIndex(p => p.id === page.id)
            if (pageIndex !== -1) {
              updatedPages[pageIndex] = { 
                ...updatedPages[pageIndex], 
                backgroundImage: data.imageUrl 
              }
              successCount++
              console.log(`✅ Generated image for page ${page.id} (${data.fromCache ? 'cached' : 'new'}) - Type: ${data.type}`)
            }
          } else {
            console.warn(`⚠️ No image URL returned for page: ${page.id}`)
            // Set fallback background based on topic
            const fallbackBackground = createTopicBasedVantaFallback(page.backgroundPrompt)
            const pageIndex = updatedPages.findIndex(p => p.id === page.id)
            if (pageIndex !== -1) {
              updatedPages[pageIndex] = { 
                ...updatedPages[pageIndex], 
                backgroundImage: fallbackBackground.gradient,
                vantaEffect: fallbackBackground.vantaEffect
              }
              successCount++
              console.log(`🎭 Applied topic-based Vanta fallback for page ${page.id} - Effect: ${fallbackBackground.vantaEffect}`)
            }
          }
        } else {
          console.error(`❌ Failed to generate image for page: ${page.id} - ${response.statusText}`)
          // Set fallback background based on topic
          const fallbackBackground = createTopicBasedVantaFallback(page.backgroundPrompt)
          const pageIndex = updatedPages.findIndex(p => p.id === page.id)
          if (pageIndex !== -1) {
            updatedPages[pageIndex] = { 
              ...updatedPages[pageIndex], 
              backgroundImage: fallbackBackground.gradient,
              vantaEffect: fallbackBackground.vantaEffect
            }
            successCount++
            console.log(`🎭 Applied topic-based Vanta fallback for page ${page.id} - Effect: ${fallbackBackground.vantaEffect}`)
          }
        }
        
        // Add delay between requests to respect rate limits
        if (i < pagesToGenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Reduced to 0.5 seconds
        }
        
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`⏰ Timeout generating image for page ${page.id}`)
        } else {
          console.error(`❌ Error generating image for page ${page.id}:`, error)
        }
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Pre-generation complete: ${successCount}/${pagesToGenerate.length} images generated in ${Math.round(totalTime/1000)}s`)
    setGeneratingImages(false)
    
    return updatedPages
  }

  const generateStory = async (adventure: Adventure) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start adventures.",
        variant: "destructive",
      })
      return
    }

    setLoadingStory(true)
    try {
      console.log('📚 Generating story for adventure:', adventure.title)
      
      const response = await fetch('/api/generate-adventure-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adventure: adventure,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate story: ${response.statusText}`)
      }

      const storyData = await response.json()
      
      if (storyData.error) {
        throw new Error(storyData.error)
      }

      console.log('📚 Story generated, now pre-generating all images...')
      
      // Pre-generate all images before showing the storybook
      const storyWithImages = await preGenerateAllImages(storyData.pages)
      
      // Update the story data with pre-generated images
      const finalStoryData = {
        ...storyData,
        pages: storyWithImages
      }
      
      setSelectedStory(finalStoryData)
      
      // Debug: Log the story data being set
      console.log('📚 Final story data with images:', finalStoryData)
      console.log('📚 Story pages with images:', finalStoryData.pages?.map((p: any) => ({ 
        id: p.id, 
        title: p.title, 
        hasBackgroundPrompt: !!p.backgroundPrompt,
        hasBackgroundImage: !!p.backgroundImage,
        imageType: p.backgroundImage?.startsWith('data:') ? 'AI-generated' : 'gradient'
      })))

      // Show success message
      const totalImages = storyData.pages.filter((p: any) => p.backgroundPrompt).length
      const generatedImages = storyWithImages.filter(p => p.backgroundImage?.startsWith('data:')).length
      
      toast({
        title: "Adventure Ready!",
        description: `Story generated with ${generatedImages}/${totalImages} AI images. ${storyData.hasTextbookContent ? `Based on ${storyData.textbookSources?.length || 0} textbook sources.` : ''}`,
      })

    } catch (error) {
      console.error('Error generating story:', error)
      toast({
        title: "Error", 
        description: "Failed to generate adventure story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStory(false)
    }
  }

  const handleBackToAdventures = () => {
    setSelectedStory(null)
  }

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen">
        <VantaBackground />
        <Navbar />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <VantaBackground />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className={`${theme.background.card} ${theme.border.primary} border-2 backdrop-blur-md`}>
              <CardHeader>
                <CardTitle className={`${theme.text.primary} text-2xl flex items-center justify-center gap-2`}>
                  <Rocket className={`h-6 w-6 ${theme.icon.primary}`} />
                  Learning Adventures
                </CardTitle>
                <CardDescription className={theme.text.secondary}>
                  Personalized science adventures await you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={theme.text.secondary}>
                  To access personalized learning adventures based on your grade level and learning style, please log in.
                </p>
                <Link href="/login">
                  <Button className={`${theme.button.primary} w-full`}>
                    Log In to Start Adventures
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Storybook View
  if (selectedStory) {
    console.log('🎨 Rendering Storybook with selectedStory:', selectedStory)
    console.log('🎨 Storybook pages prop:', selectedStory.pages?.map((p: any) => ({ 
      id: p.id, 
      hasBackgroundPrompt: !!p.backgroundPrompt 
    })))
    
    return <Storybook 
      pages={selectedStory.pages} 
      title={selectedStory.title} 
      onClose={handleBackToAdventures}
      gradeLevel={profile?.grade_level || 5}
      discussionPrompts={selectedStory.discussionPrompts}
      reflectionQuestions={selectedStory.reflectionQuestions}
    />
  }

  return (
    <>
      <VantaBackground />
      <Navbar />
      <PageTransition variant="scientific" className="min-h-screen pt-20 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Rocket className={`h-16 w-16 ${theme.icon.primary}`} />
            </div>
            <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${theme.gradient.header} mb-4`}>
              AI Learning Adventures
            </h1>
            <p className={`${theme.text.secondary} text-lg max-w-2xl mx-auto`}>
              Embark on personalized learning journeys powered by AI. Each adventure is crafted to match your interests and learning style.
            </p>
          </div>

          {/* Loading State */}
          {loadingAdventures ? (
            <div className="text-center py-12">
              <Loader2 className={`h-8 w-8 animate-spin ${theme.icon.primary} mx-auto mb-4`} />
              <p className={`${theme.text.secondary}`}>Loading adventures...</p>
            </div>
          ) : (
            <>
              {/* Adventures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {adventures.map((adventure) => (
                  <Card key={adventure.id} className="bg-white/95 border-gray-300 border-2 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className={`h-5 w-5 ${theme.icon.secondary}`} />
                          <Badge variant="secondary" className="text-xs">
                            {adventure.subject}
                          </Badge>
                          {adventure.difficulty && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                adventure.difficulty === 'beginner' ? 'border-green-500 text-green-700' :
                                adventure.difficulty === 'intermediate' ? 'border-yellow-500 text-yellow-700' :
                                'border-red-500 text-red-700'
                              }`}
                            >
                              {adventure.difficulty}
                            </Badge>
                          )}
                        </div>
                        {adventure.hasTextbookContent && (
                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                            📚 Textbook Content
                          </Badge>
                        )}
                      </div>
                      <CardTitle className={`${theme.text.primary} text-lg`}>
                        {adventure.title}
                      </CardTitle>
                      <CardDescription className={theme.text.secondary}>
                        {adventure.description}
                      </CardDescription>
                      {adventure.duration && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className={`${theme.text.muted} text-xs`}>⏱️ {adventure.duration}</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {adventure.objectives && adventure.objectives.length > 0 && (
                          <div>
                            <p className={`${theme.text.primary} text-sm font-medium mb-2`}>Learning Objectives:</p>
                            <ul className="text-xs space-y-1">
                              {adventure.objectives.slice(0, 3).map((objective, index) => (
                                <li key={index} className={`${theme.text.secondary} flex items-start gap-1`}>
                                  <span className="text-green-500 mt-0.5">•</span>
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div>
                          <p className={`${theme.text.primary} text-sm font-medium mb-2`}>Key Concepts:</p>
                          <div className="flex flex-wrap gap-1">
                            {adventure.concepts.map((concept, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {adventure.textbookSources && adventure.textbookSources.length > 0 && (
                          <div>
                            <p className={`${theme.text.primary} text-sm font-medium mb-1`}>Based on:</p>
                            <p className={`${theme.text.muted} text-xs`}>
                              {adventure.textbookSources.slice(0, 2).join(', ')}
                              {adventure.textbookSources.length > 2 && ' & more'}
                            </p>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => generateStory(adventure)}
                          disabled={loadingStory || generatingImages}
                          className={`w-full ${theme.button.primary}`}
                        >
                          {loadingStory ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Story...
                            </>
                          ) : generatingImages ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Images ({imageProgress.current}/{imageProgress.total})
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Start Adventure
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Refresh Adventures and Info */}
              <Card className="bg-white/95 border-gray-300 border-2 text-center">
                <CardContent className="py-8">
                  <Sparkles className={`h-12 w-12 ${theme.icon.primary} mx-auto mb-4`} />
                  <h3 className={`${theme.text.primary} text-xl font-semibold mb-2`}>
                    Fresh Adventures Daily!
                  </h3>
                  <p className={`${theme.text.secondary} mb-4`}>
                    New personalized adventures are generated daily based on your learning progress and interests. 
                    Each adventure uses content from your curriculum textbooks!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button 
                      onClick={loadAdventures}
                      disabled={loadingAdventures}
                      className={theme.button.primary}
                    >
                      {loadingAdventures ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate New Adventures
                        </>
                      )}
                    </Button>
                    <Link href="/">
                      <Button variant="outline" className={theme.border.primary}>
                        Explore Other Features
                      </Button>
                    </Link>
                  </div>
                  {profile?.grade_level && (
                    <p className={`${theme.text.muted} text-sm mt-4`}>
                      Adventures are personalized for Grade {profile.grade_level} • {profile.learning_preference || 'Visual'} Learning Style
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageTransition>
    </>
  )
}
