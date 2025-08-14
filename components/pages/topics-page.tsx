"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StaggerContainer, StaggerItem } from "@/components/layout/page-transition"
import { Sparkles, LogIn, BookOpen, Search, ArrowRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface Topic {
  id: string
  title: string
  grade_level: number
  study_areas: {
    name: string
    vanta_effect: string
  } | null
}

export function TopicsPage() {
  const { user, profile, loading } = useAuth()
  const [recommendedTopics, setRecommendedTopics] = useState<Topic[]>([])
  const [totalTopicsCount, setTotalTopicsCount] = useState(0)
  const [loadingData, setLoadingData] = useState(false)

  const isAuthenticated = !!user
  const userGradeLevel = profile?.grade_level || null

  // Fetch recommended topics and total count
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        // Get total topics count first (for demo mode display)
        const { count: totalCount } = await supabase
          .from('topics')
          .select('*', { count: 'exact', head: true })
        
        setTotalTopicsCount(totalCount || 0)

        // Fetch recommended topics based on authentication status
        let topicsQuery = supabase
          .from('topics')
          .select(`
            id,
            title,
            grade_level,
            study_area_id,
            study_areas!inner (
              name,
              vanta_effect
            )
          `)
          .limit(6) // Limit to 6 recommended topics
          .order('created_at', { ascending: false })

        // Filter by user's grade level if authenticated and has grade level
        if (isAuthenticated && userGradeLevel) {
          topicsQuery = topicsQuery.eq('grade_level', userGradeLevel)
        } else {
          // For demo mode, show a mix of topics from different grades
          topicsQuery = topicsQuery.in('grade_level', [1, 2, 3, 4, 5, 6])
        }

        const { data: topicsData, error: topicsError } = await topicsQuery

        if (topicsError) {
          console.error('Error fetching recommended topics:', topicsError)
        } else {
          // Transform the data to handle the array relationship
          const transformedTopics = (topicsData || []).map(topic => ({
            ...topic,
            study_areas: topic.study_areas?.[0] || null
          }))
          setRecommendedTopics(transformedTopics)
        }
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (!loading) {
      fetchData()
    }
  }, [isAuthenticated, userGradeLevel, loading])

  if (loading || loadingData) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600">Loading recommended topics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to All Topics Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/topics/all">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Browse All Topics
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
              Recommended Topics for You
            </h1>
            <p className="text-green-700 text-lg">
              Our AI has specially curated these topics for your learning level
            </p>
          </div>

          {/* Demo Mode Notice */}
          {!isAuthenticated && (
            <Card className="bg-blue-50/80 backdrop-blur-md border-blue-200 border-2 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Demo Mode - Sample Topics</h3>
                    <p className="text-blue-700 text-sm">You're viewing sample recommended topics. Sign in to get personalized recommendations for your grade level!</p>
                  </div>
                  <Button asChild>
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In for Personal Recommendations
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Welcome Card */}
          <Card className="mb-8 bg-white/80 backdrop-blur-md border-gray-300 border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-blue-700 mb-2">
                  Welcome to Your Science Adventure!
                </h2>
                <p className="text-green-700 mb-4">
                  {isAuthenticated && userGradeLevel
                    ? `These topics have been specially selected for Grade ${userGradeLevel} students based on your learning profile.`
                    : "These topics have been carefully selected to spark your curiosity about science!"
                  }
                </p>
                <Button asChild>
                  <Link href="/topics/all">
                    <Search className="h-4 w-4 mr-2" />
                    {isAuthenticated && userGradeLevel
                      ? `Explore All Grade ${userGradeLevel} Topics`
                      : "Search & Filter All Topics"
                    }
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Topics Grid */}
          {recommendedTopics.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTopics.map((topic, index) => (
                <StaggerItem key={topic.id}>
                  <Link href={`/topic/${topic.id}`}>
                    <Card className="h-full group bg-white/80 backdrop-blur-md border-gray-300 border-2 hover:border-blue-400 hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-400">
                              #{index + 1} Recommended
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400">
                              Grade {topic.grade_level}
                            </Badge>
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-400">
                              {topic.study_areas?.name || 'Science'}
                            </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-green-700">
                        <span className="font-semibold text-purple-600">✨ AI Recommended: </span>
                        This {topic.study_areas?.name?.toLowerCase() || 'science'} topic has been specially selected for grade {topic.grade_level}{" "}
                        students. Content is pre-cached for instant access!
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <Card className="bg-white/80 backdrop-blur-md border-gray-300 border-2">
              <CardContent className="text-center py-8">
                <Sparkles className="h-16 w-16 text-purple-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-semibold text-blue-700 mb-2">🔮 AI is Preparing Your Topics!</h3>
                <p className="text-green-700 mb-4">Our magical AI system is working to curate the perfect topics for your learning journey. Check back in a moment!</p>
                <Button asChild>
                  <Link href="/topics/all">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Topics Instead
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50/80 to-green-50/80 backdrop-blur-md border-blue-200 border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Want to explore more?</h3>
                <p className="text-green-700 mb-4">
                  {isAuthenticated && userGradeLevel 
                    ? `Browse all Grade ${userGradeLevel} topics available for your learning level`
                    : `Browse our complete collection of ${totalTopicsCount} science topics`
                  }
                </p>
                <Button asChild size="lg">
                  <Link href="/topics/all">
                    <Search className="h-4 w-4 mr-2" />
                    {isAuthenticated && userGradeLevel 
                      ? `Browse All Grade ${userGradeLevel} Topics`
                      : "Search & Filter All Topics"
                    }
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
