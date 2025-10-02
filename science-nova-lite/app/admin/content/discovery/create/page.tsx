"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { RoleGuard } from "@/components/layout/role-guard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Save, Eye, Wand2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

// Import discovery creation components
import { FunFactCreator } from "@/components/discovery/fun-fact-creator"
import { InfoCreator } from "@/components/discovery/info-creator"

// Types
interface DiscoveryData {
  title: string
  description: string
  topic_id: string
  category: string
  tags: string[]
  payload: any
}

const discoveryTypeConfig = {
  'fun-fact': {
    title: 'Fun Fact',
    description: 'Create interesting and engaging facts',
    icon: '💡',
    color: 'from-blue-500 to-cyan-500'
  },
  'info': {
    title: 'Info Content',
    description: 'Create educational information content',
    icon: 'ℹ️',
    color: 'from-green-500 to-emerald-500'
  }
}

export default function CreateDiscoveryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { session } = useAuth()
  
  const discoveryType = searchParams.get('type') as keyof typeof discoveryTypeConfig || 'fun-fact'
  const editId = searchParams.get('edit') // For editing existing content
  
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    title: '',
    description: '',
    topic_id: '',
    category: '',
    tags: [],
    payload: {}
  })
  
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [isEditing, setIsEditing] = useState(!!editId)
  const [loading, setLoading] = useState(!!editId)
  const [actualContentType, setActualContentType] = useState<string | null>(null)
  
  // Use actual content type if available (when editing), otherwise use URL parameter
  const effectiveType = (actualContentType && (actualContentType === 'fun-fact' || actualContentType === 'info')) 
    ? actualContentType 
    : discoveryType
  const config = discoveryTypeConfig[effectiveType as keyof typeof discoveryTypeConfig] || discoveryTypeConfig['fun-fact']
  
  // Load existing data when editing
  useEffect(() => {
    const loadExistingContent = async () => {
      if (!editId || !session) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/content?category=DISCOVERY&limit=100`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch content')
        
        const data = await response.json()
        const content = data.data?.find((item: any) => item.id === editId)
        
        if (content) {
          // Store the actual content type from the database
          const actualType = (content.content_type || '').toLowerCase().replace('_', '-')
          setActualContentType(actualType)
          
          setDiscoveryData({
            title: content.title || '',
            description: content.description || '',
            topic_id: content.topic_id || '',
            category: content.topics?.title || '',
            tags: content.tags || [],
            payload: content.content_data || {}
          })
        }
      } catch (error) {
        console.error('Error loading existing content:', error)
        toast({
          title: "Error Loading Content",
          description: "Failed to load existing content data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadExistingContent()
  }, [editId, session])
  
  const handleSave = async (publish: boolean = false) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save content",
        variant: "destructive"
      })
      return
    }

    if (!discoveryData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your content",
        variant: "destructive"
      })
      return
    }

    if (!discoveryData.topic_id) {
      toast({
        title: "Missing Topic",
        description: "Please select a topic for your content",
        variant: "destructive"
      })
      return
    }

    // Validate payload based on type
    const isValidPayload = validatePayload(discoveryType, discoveryData.payload)
    if (!isValidPayload) {
      toast({
        title: "Incomplete Content",
        description: "Please complete all required fields",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const apiUrl = isEditing ? '/api/admin/content' : '/api/admin/discovery'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Map discovery types to API content types
      const getContentType = (type: string) => {
        switch (type) {
          case 'fun-fact': return 'FACT'
          case 'info': return 'INFO'
          default: return 'FACT'
        }
      }

      // Map payload data to API fields based on content type
      const getPreviewText = () => {
        if (discoveryType === 'fun-fact') {
          return discoveryData.payload?.fact || ''
        } else if (discoveryType === 'info') {
          // For info content, use the first section title as preview
          const firstSection = discoveryData.payload?.sections?.[0]
          return firstSection ? firstSection.title : ''
        }
        return discoveryData.payload?.preview_text || ''
      }

      const getFullText = () => {
        if (discoveryType === 'fun-fact') {
          return discoveryData.payload?.explanation || ''
        } else if (discoveryType === 'info') {
          // For info content, combine all sections into full text
          const sections = discoveryData.payload?.sections || []
          return sections.map((section: any) => `${section.title}\n${section.content}`).join('\n\n')
        }
        return discoveryData.payload?.full_text || ''
      }

      const contentData = isEditing ? {
        id: editId,
        category: 'DISCOVERY',
        topic_id: discoveryData.topic_id,
        content_type: getContentType(discoveryType),
        title: discoveryData.title,
        preview_text: getPreviewText(),
        full_text: getFullText(),
        source: discoveryData.payload?.source || '',
        status: publish ? 'published' : 'draft'
      } : {
        topic_id: discoveryData.topic_id,
        content_type: getContentType(discoveryType),
        title: discoveryData.title,
        preview_text: getPreviewText(),
        full_text: getFullText(),
        source: discoveryData.payload?.source || '',
        status: publish ? 'published' : 'draft',
        created_by: session?.user?.id
      }

      console.log('Saving discovery content:', contentData)
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(contentData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save discovery content')
      }
      
      toast({
        title: publish ? "Content Published!" : "Draft Saved!",
        description: publish 
          ? `Your ${config.title.toLowerCase()} has been published successfully`
          : `Your ${config.title.toLowerCase()} draft has been saved`,
      })

      // Redirect to discovery manager
      router.push('/admin/content/discovery')
      
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Save Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const validatePayload = (type: string, payload: any): boolean => {
    switch (type) {
      case 'fun-fact':
        return payload.fact?.trim() && payload.explanation?.trim()
      case 'info':
        return payload.sections?.length > 0 && payload.sections.some((s: any) => s.content?.trim())
      default:
        return false
    }
  }

  const handlePreview = () => {
    if (!validatePayload(discoveryType, discoveryData.payload)) {
      toast({
        title: "Cannot Preview",
        description: "Please complete the content before previewing",
        variant: "destructive"
      })
      return
    }
    setPreviewMode(true)
  }

  const renderCreator = () => {
    const props = {
      contentData: discoveryData,
      onUpdate: setDiscoveryData,
      onPreview: handlePreview
    }

    switch (discoveryType) {
      case 'fun-fact':
        return <FunFactCreator {...props} />
      case 'info':
        return <InfoCreator {...props} />
      default:
        return <FunFactCreator {...props} />
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50"
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
      }}
    >
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
          {/* Header */}
          <div className="mb-6 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/content/discovery"
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className={`rounded-2xl bg-gradient-to-r ${config.color} p-3`}>
                  <span className="text-2xl">{config.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? `Edit ${config.title}` : `Create ${config.title}`}
                  </h1>
                  <p className="text-gray-600">{config.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  disabled={!discoveryData.title || !discoveryData.topic_id}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={() => handleSave(false)}
                  variant="outline"
                  disabled={saving || !discoveryData.title}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving || !discoveryData.title || !discoveryData.topic_id}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                >
                  {saving ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Creator */}
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading existing content data...</p>
              </div>
            </div>
          ) : (
            renderCreator()
          )}

          {/* AI Assistant Panel */}
          <Card className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-sm text-gray-600">Get AI suggestions for your {config.title.toLowerCase()}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  toast({
                    title: "AI Assistant",
                    description: "AI suggestions will be available soon!",
                  })
                }}
                variant="outline"
                size="sm"
                disabled={!discoveryData.topic_id}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Get Suggestions
              </Button>
            </div>
          </Card>

          {/* Quick Tips */}
          <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for Creating Great {config.title}s</h3>
            <div className="space-y-2 text-sm text-blue-700">
              {discoveryType === 'fun-fact' ? (
                <>
                  <p>• Make facts surprising and memorable</p>
                  <p>• Use simple language appropriate for the grade level</p>
                  <p>• Include engaging visual descriptions</p>
                  <p>• Connect facts to students' everyday experiences</p>
                </>
              ) : (
                <>
                  <p>• Structure information in logical sections</p>
                  <p>• Use clear headings and bullet points</p>
                  <p>• Include practical applications</p>
                  <p>• Add interactive elements when possible</p>
                </>
              )}
            </div>
          </Card>
        </main>
      </RoleGuard>
    </div>
  )
}