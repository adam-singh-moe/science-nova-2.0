"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScienceLoading } from "@/components/ui/science-loading"
import { Search, BookOpen, Star, Filter } from "lucide-react"
import Link from "next/link"
import { theme, getGradeColor, getAreaColor } from "@/lib/theme"

interface Topic {
  id: string
  title: string
  grade_level: number
  study_areas: {
    name: string
    vanta_effect: string
  } | null
}

interface StudyArea {
  id: string
  name: string
  vanta_effect: string
}

export function StudentDashboard() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArea, setSelectedArea] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, searchTerm, selectedArea, selectedGrade])

  const fetchData = async () => {
    try {
      // Fetch topics with study areas
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select(`
          id,
          title,
          grade_level,
          study_areas (
            name,
            vanta_effect
          )
        `)
        .order("created_at", { ascending: false })

      if (topicsError) throw topicsError

      // Fetch study areas
      const { data: areasData, error: areasError } = await supabase.from("study_areas").select("*").order("name")

      if (areasError) throw areasError

      setTopics((topicsData || []).map(topic => ({
        ...topic,
        study_areas: topic.study_areas?.[0] || null
      })))
      setStudyAreas(areasData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTopics = () => {
    let filtered = topics

    if (searchTerm) {
      filtered = filtered.filter(
        (topic) =>
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (topic.study_areas?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false),
      )
    }

    if (selectedArea !== "all") {
      filtered = filtered.filter((topic) => topic.study_areas?.name === selectedArea)
    }

    if (selectedGrade !== "all") {
      filtered = filtered.filter((topic) => topic.grade_level === Number.parseInt(selectedGrade))
    }

    setFilteredTopics(filtered)
  }

  if (loading) {
    return <ScienceLoading message="Loading your learning adventure..." type="beaker" />
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`font-heading text-5xl font-bold text-transparent bg-clip-text ${theme.gradient.header} mb-2 flex items-center gap-3`}
          >
            <Star className={`h-10 w-10 ${theme.icon.warning}`} />
            Your Science Adventure
          </h1>
          <p className={`${theme.text.secondary} text-lg`}>
            Discover amazing topics and learn with AI-powered content!
          </p>
        </div>

        {/* Filters */}
        <Card className={`mb-8 backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
          <CardHeader>
            <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
              <Filter className="h-5 w-5" />
              Find Your Perfect Topic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-4 w-4 ${theme.icon.primary}`} />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${theme.input.background} ${theme.input.border} border-2 ${theme.input.text} ${theme.input.placeholder}`}
                />
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger
                  className={`${theme.input.background} ${theme.input.border} border-2 ${theme.input.text}`}
                >
                  <SelectValue placeholder="All Study Areas" />
                </SelectTrigger>
                <SelectContent className={`${theme.background.card} ${theme.border.secondary} border-2`}>
                  <SelectItem
                    value="all"
                    className={`${theme.text.primary} ${theme.hover.background} ${theme.hover.text}`}
                  >
                    All Study Areas
                  </SelectItem>
                  {studyAreas.map((area) => (
                    <SelectItem
                      key={area.id}
                      value={area.name}
                      className={`${theme.text.primary} ${theme.hover.background} ${theme.hover.text}`}
                    >
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger
                  className={`${theme.input.background} ${theme.input.border} border-2 ${theme.input.text}`}
                >
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className={`${theme.background.card} ${theme.border.secondary} border-2`}>
                  <SelectItem
                    value="all"
                    className={`${theme.text.primary} ${theme.hover.background} ${theme.hover.text}`}
                  >
                    All Grades
                  </SelectItem>
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <SelectItem
                      key={grade}
                      value={grade.toString()}
                      className={`${theme.text.primary} ${theme.hover.background} ${theme.hover.text}`}
                    >
                      Grade {grade}
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
              <Card
                className={`h-full group backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 ${theme.hover.border} hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <BookOpen
                      className={`h-8 w-8 ${theme.icon.primary} group-hover:${theme.icon.secondary} transition-colors`}
                    />
                    <div className="flex gap-2">
                      <Badge
                        className={`${getGradeColor(topic.grade_level)} text-white font-semibold ${theme.border.primary} border`}
                      >
                        Grade {topic.grade_level}
                      </Badge>
                      <Badge
                        className={`${getAreaColor(topic.study_areas?.name || 'Science')} text-white font-semibold ${theme.border.primary} border`}
                      >
                        {topic.study_areas?.name || 'Science'}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className={`${theme.text.primary} group-hover:${theme.text.secondary} transition-colors`}>
                    {topic.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className={theme.text.secondary}>
                    Explore this {topic.study_areas?.name?.toLowerCase() || 'science'} topic with AI-generated content tailored just
                    for you!
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
            <CardContent className="text-center py-12">
              <BookOpen className={`h-16 w-16 ${theme.icon.warning} mx-auto mb-4 animate-pulse`} />
              <h3 className={`text-2xl font-semibold ${theme.text.accent} mb-2`}>🚀 No topics found yet!</h3>
              <p className={theme.text.primary}>Try adjusting your search or filters to discover amazing science topics waiting for you.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
