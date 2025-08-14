"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, BookOpen, LogIn, ArrowRight, Sparkles, Loader2, Eye } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { theme } from "@/lib/theme"

interface Topic {
  id: string
  title: string
  grade_level: number
  study_areas: {
    name: string
    vanta_effect: string
  }
}

interface StudyArea {
  id: string
  name: string
  vanta_effect: string
}

export function AllTopicsPage() {
  const { user, profile, loading } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArea, setSelectedArea] = useState<string>("all")
  const [loadingData, setLoadingData] = useState(false)

  const isAuthenticated = !!user
  const userGradeLevel = profile?.grade_level || null

  // Fetch topics and study areas
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        // Fetch study areas
        const { data: studyAreasData, error: studyAreasError } = await supabase
          .from('study_areas')
          .select('*')
          .order('name')

        if (studyAreasError) {
          console.error('Error fetching study areas:', studyAreasError)
        } else {
          setStudyAreas(studyAreasData || [])
        }

        // Fetch ALL topics for the user's grade level (or all if not authenticated)
        let topicsQuery = supabase
          .from('topics')
          .select(`
            id,
            title,
            grade_level,
            study_areas!inner (
              name,
              vanta_effect
            )
          `)
          .order('title')

        // Filter by user's grade level if authenticated and has grade level
        if (isAuthenticated && userGradeLevel) {
          topicsQuery = topicsQuery.eq('grade_level', userGradeLevel)
        }

        const { data: topicsData, error: topicsError } = await topicsQuery

        if (topicsError) {
          console.error('Error fetching topics:', topicsError)
        } else {
          // Format the data to handle the join structure
          const formattedTopics = (topicsData || []).map(topic => ({
            ...topic,
            study_areas: Array.isArray(topic.study_areas) ? topic.study_areas[0] : topic.study_areas
          }))
          setTopics(formattedTopics)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, searchTerm, selectedArea])

  const filterTopics = () => {
    let filtered = topics

    if (searchTerm) {
      filtered = filtered.filter(
        (topic) =>
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.study_areas.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedArea !== "all") {
      filtered = filtered.filter((topic) => topic.study_areas.name === selectedArea)
    }

    setFilteredTopics(filtered)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading all topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Back */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/topics">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Recommended Topics
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
            {isAuthenticated && userGradeLevel 
              ? `All Grade ${userGradeLevel} Topics`
              : "All Science Topics"
            }
          </h1>
          <p className="text-green-700 text-lg">
            {isAuthenticated && userGradeLevel 
              ? `Browse all available Grade ${userGradeLevel} science topics for your learning level`
              : "Explore our complete collection of science topics!"
            }
          </p>
        </div>

        {/* Demo Mode Notice */}
        {!isAuthenticated && (
          <Card className="bg-blue-50/80 backdrop-blur-md border-blue-200 border-2 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                  <p className="text-blue-700 text-sm">You're viewing sample topics from all grade levels. Sign in to see topics specifically for your grade level.</p>
                </div>
                <Button asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card className="mb-8 bg-white/80 backdrop-blur-md border-gray-300 border-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{topics.length}</div>
                <div className="text-sm text-gray-600">
                  {isAuthenticated && userGradeLevel ? `Grade ${userGradeLevel} Topics` : 'Total Topics'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{studyAreas.length}</div>
                <div className="text-sm text-gray-600">Study Areas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{filteredTopics.length}</div>
                <div className="text-sm text-gray-600">Filtered Results</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-md border-gray-300 border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
              <Filter className="h-6 w-6" />
              Filter Topics
            </CardTitle>
            <CardDescription className="text-green-700">
              {isAuthenticated && userGradeLevel 
                ? `Search and filter through all Grade ${userGradeLevel} topics available for your learning level`
                : "Search and filter through our complete topic collection"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-blue-500" />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select study area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {studyAreas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <Link key={topic.id} href={`/topic/${topic.id}`}>
              <Card className="h-full group bg-white/80 backdrop-blur-md border-gray-300 border-2 hover:border-blue-400 hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">{topic.title}</CardTitle>
                    <div className="flex flex-col gap-2">
                      <Badge 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400"
                      >
                        Grade {topic.grade_level}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-400">{topic.study_areas.name}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-green-700">
                    Explore this {topic.study_areas.name.toLowerCase()} topic designed for grade {topic.grade_level}{" "}
                    students. Click to start your learning journey!
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-md border-gray-300 border-2">
            <CardContent className="text-center py-8">
              <BookOpen className="h-16 w-16 text-purple-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-semibold text-blue-700 mb-2">🔍 No matching topics found</h3>
              <p className="text-green-700">Try adjusting your search criteria or check back later for new exciting content!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
