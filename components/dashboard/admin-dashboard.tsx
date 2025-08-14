"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, BookOpen, Database, Upload, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { getGradeColor, getAreaColor } from "@/lib/theme"
import { supabase } from "@/lib/supabase"
import { TextbookUploader } from "@/components/textbook-uploader"

interface Topic {
  id: string
  title: string
  grade_level: number
  admin_prompt: string | null
  study_areas: {
    name: string
    vanta_effect: string
  }[]
  created_at: string
}

interface StudyArea {
  id: string
  name: string
  vanta_effect: string
}

interface TextbookStats {
  totalChunks: number
  gradeStats: Array<{
    grade: number
    files: string[]
    chunks: number
    lastProcessed: string | null
  }>
  hasContent: boolean
}

export function AdminDashboard() {
  const { toast } = useToast()
  const [topics, setTopics] = useState<Topic[]>([])
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([])
  const [textbookStats, setTextbookStats] = useState<TextbookStats>({
    totalChunks: 0,
    gradeStats: [],
    hasContent: false
  })
  const [loading, setLoading] = useState(true)
  const [showTextbookUploader, setShowTextbookUploader] = useState(false)

  // Fetch all admin data
  const fetchAdminData = async () => {
    console.log('🔍 AdminDashboard: Starting fetchAdminData...')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 AdminDashboard: Session check:', session ? 'Found' : 'Not found')
      
      if (!session) {
        console.log('❌ AdminDashboard: No session, showing auth error')
        toast({
          title: "Authentication required",
          description: "Please log in to access admin features",
          variant: "destructive"
        })
        return
      }

      console.log('👤 AdminDashboard: User:', session.user.email)

      // Fetch topics
      console.log('📚 AdminDashboard: Fetching topics...')
      const topicsResponse = await fetch('/api/admin/topics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('📚 AdminDashboard: Topics response status:', topicsResponse.status)
      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json()
        console.log('📚 AdminDashboard: Topics data:', topicsData)
        setTopics(topicsData.topics || [])
      } else {
        const errorData = await topicsResponse.json()
        console.error('❌ AdminDashboard: Topics error:', errorData)
      }

      // Fetch study areas
      console.log('🔬 AdminDashboard: Fetching study areas...')
      const { data: studyAreasData, error: studyAreasError } = await supabase
        .from('study_areas')
        .select('*')
        .order('name')
      
      if (studyAreasError) {
        console.error('❌ AdminDashboard: Study areas error:', studyAreasError)
      } else {
        console.log('🔬 AdminDashboard: Study areas:', studyAreasData)
        setStudyAreas(studyAreasData || [])
      }

      // Fetch textbook stats
      console.log('📖 AdminDashboard: Fetching textbooks...')
      const textbookResponse = await fetch('/api/upload-textbook', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('📖 AdminDashboard: Textbook response status:', textbookResponse.status)
      if (textbookResponse.ok) {
        const textbookData = await textbookResponse.json()
        console.log('📖 AdminDashboard: Textbook data:', textbookData)
        const uploads = textbookData.uploads || []
        
        // Also fetch actual chunk data from textbook_embeddings table
        console.log('📝 AdminDashboard: Fetching embeddings data...')
        const { data: embeddingsData, error: embeddingsError } = await supabase
          .from('textbook_embeddings')
          .select('grade_level, file_name')
        
        if (embeddingsError) {
          console.error('❌ AdminDashboard: Embeddings error:', embeddingsError)
        } else {
          console.log('📝 AdminDashboard: Embeddings data:', embeddingsData?.length, 'chunks')
        }
        
        // Calculate stats from embeddings data (more accurate)
        const totalChunks = embeddingsData?.length || uploads.reduce((sum: number, upload: any) => sum + (upload.chunks_created || 0), 0)
        
        // Group embeddings by grade level for more accurate stats
        let gradeStats: any[] = []
        if (embeddingsData && embeddingsData.length > 0) {
          gradeStats = embeddingsData.reduce((acc: any[], embedding: any) => {
            const existing = acc.find(stat => stat.grade === embedding.grade_level)
            if (existing) {
              existing.chunks += 1
              if (!existing.files.includes(embedding.file_name)) {
                existing.files.push(embedding.file_name)
              }
            } else {
              acc.push({
                grade: embedding.grade_level,
                files: [embedding.file_name],
                chunks: 1,
                lastProcessed: new Date().toISOString() // Since embeddings exist, they were processed
              })
            }
            return acc
          }, [])
        } else {
          // Fallback to uploads data if no embeddings found
          gradeStats = uploads.reduce((acc: any[], upload: any) => {
            const existing = acc.find(stat => stat.grade === upload.grade_level)
            if (existing) {
              existing.files.push(upload.file_name)
              existing.chunks += upload.chunks_created || 0
              if (!existing.lastProcessed || (upload.processing_completed_at && upload.processing_completed_at > existing.lastProcessed)) {
                existing.lastProcessed = upload.processing_completed_at
              }
            } else {
              acc.push({
                grade: upload.grade_level,
                files: [upload.file_name],
                chunks: upload.chunks_created || 0,
                lastProcessed: upload.processing_completed_at
              })
            }
            return acc
          }, [])
        }

        setTextbookStats({
          totalChunks,
          gradeStats,
          hasContent: totalChunks > 0
        })
        console.log('📊 AdminDashboard: Final textbook stats:', { totalChunks, gradeStats, hasContent: totalChunks > 0 })
      } else {
        const errorData = await textbookResponse.json()
        console.error('❌ AdminDashboard: Textbook error:', errorData)
      }

      console.log('✅ AdminDashboard: Fetch complete - Topics:', topics.length, 'Study Areas:', studyAreas.length)

    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching admin data:', error)
      toast({
        title: "Error loading admin data",
        description: "Please refresh the page to try again",
        variant: "destructive"
      })
    } finally {
      console.log('🏁 AdminDashboard: Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 AdminDashboard: Component mounted, calling fetchAdminData')
    fetchAdminData()
  }, [])

  const handleTopicCreated = () => {
    fetchAdminData() // Refresh data when a new topic is created
  }

  const handleTextbookUploaded = () => {
    fetchAdminData() // Refresh data when textbooks are uploaded
  }

  const handleProcessTextbooks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/process-selected-textbooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectAll: true })
      })

      if (response.ok) {
        toast({
          title: "Processing started",
          description: "Textbook processing has been initiated",
        })
        // Refresh data after a delay
        setTimeout(fetchAdminData, 2000)
      } else {
        throw new Error('Failed to start processing')
      }
    } catch (error) {
      toast({
        title: "Error processing textbooks",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const handleEditTopic = async (topicId: string) => {
    // Placeholder for edit functionality
    toast({
      title: "Edit Topic",
      description: "Topic editing feature coming soon",
    })
  }

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/topics`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: topicId })
      })

      if (response.ok) {
        toast({
          title: "Topic deleted",
          description: "The topic has been removed successfully",
        })
        fetchAdminData() // Refresh data
      } else {
        throw new Error('Failed to delete topic')
      }
    } catch (error) {
      toast({
        title: "Error deleting topic",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-green-700 text-lg">
            Manage science topics, textbooks, and system settings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-heading text-sm font-medium text-blue-700">Total Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {loading ? "..." : topics.length}
              </div>
              <p className="text-xs text-green-700">Across all grade levels</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-heading text-sm font-medium text-blue-700">Study Areas</CardTitle>
              <Database className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {loading ? "..." : studyAreas.length}
              </div>
              <p className="text-xs text-green-700">Active categories</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-heading text-sm font-medium text-blue-700">Textbook Content</CardTitle>
              <Upload className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {loading ? "..." : textbookStats.totalChunks}
              </div>
              <p className="text-xs text-green-700">Content chunks</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => {
              toast({
                title: "Create Topic",
                description: "Topic creation dialog will be added here",
              })
            }}
            className="flex items-center gap-2 h-12 rounded-full"
          >
            <Plus className="h-4 w-4" />
            Create Topic
          </Button>
          
          <Button 
            onClick={() => setShowTextbookUploader(true)}
            variant="outline" 
            className="flex items-center gap-2 h-12 rounded-full"
          >
            <Upload className="h-4 w-4" />
            Upload Textbook
          </Button>
          
          <Button 
            onClick={handleProcessTextbooks}
            variant="outline" 
            className="flex items-center gap-2 h-12 rounded-full"
          >
            <Settings className="h-4 w-4" />
            Process Textbooks
          </Button>
          
          <Button 
            onClick={() => fetchAdminData()}
            variant="outline" 
            className="flex items-center gap-2 h-12 rounded-full"
          >
            <TestTube className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Textbook Uploader Modal */}
        {showTextbookUploader && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Upload Textbooks</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTextbookUploader(false)}
                  className="rounded-full"
                >
                  Close
                </Button>
              </div>
              <div className="p-4">
                <TextbookUploader onUploadComplete={handleTextbookUploaded} />
              </div>
            </div>
          </div>
        )}

        {/* Topics List */}
        <Card className="mb-8 bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-blue-700">Topics</CardTitle>
            <CardDescription className="text-green-700">
              Manage and organize science topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-4">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No topics found. Create your first topic above!
              </p>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-blue-700">{topic.title}</h3>
                        <Badge 
                          className={`${getGradeColor(topic.grade_level)} text-white`}
                        >
                          Grade {topic.grade_level}
                        </Badge>
                        {topic.study_areas.map((area) => (
                          <Badge 
                            key={area.name}
                            className={`${getAreaColor(area.name)} text-white`}
                          >
                            {area.name}
                          </Badge>
                        ))}
                      </div>
                      {topic.admin_prompt && (
                        <p className="text-sm text-green-700 italic">
                          {topic.admin_prompt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/topic/${topic.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full">
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTopic(topic.id)}
                        className="rounded-full"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="rounded-full"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Textbook Stats */}
        <Card className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-blue-700">Textbook Content Status</CardTitle>
            <CardDescription className="text-green-700">
              Overview of uploaded textbook content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-4">Loading textbook stats...</p>
            ) : textbookStats.gradeStats.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No textbooks uploaded yet. Upload your first textbook above!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {textbookStats.gradeStats.map((stat) => (
                  <div
                    key={stat.grade}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-700">Grade {stat.grade}</h4>
                      <Badge className="bg-green-500/80 text-white">{stat.chunks} chunks</Badge>
                    </div>
                    <div className="space-y-1">
                      {stat.files.map((file) => (
                        <p key={file} className="text-sm text-green-700">{file}</p>
                      ))}
                    </div>
                    {stat.lastProcessed && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(stat.lastProcessed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}