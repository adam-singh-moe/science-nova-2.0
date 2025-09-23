"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  Wand2, 
  Save, 
  Sparkles,
  Compass,
  Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface DiscoveryEditorProps {
  subtype?: 'FACT' | 'INFO'
  initialData?: any
  topicId?: string
  onSave: (data: any) => void
  onCancel: () => void
  open: boolean
}

export function DiscoveryEditor({ subtype = 'FACT', initialData, topicId, onSave, onCancel, open }: DiscoveryEditorProps) {
  const { session } = useAuth()
  const [currentTab, setCurrentTab] = useState('ai')
  const [title, setTitle] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [fullText, setFullText] = useState('')
  const [source, setSource] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState(topicId || '')
  const [selectedSubtype, setSelectedSubtype] = useState<'FACT' | 'INFO'>(subtype)
  const [aiDescription, setAiDescription] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  // Topics for selection
  const [topics, setTopics] = useState<any[]>([])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setSelectedTopicId(initialData.topic_id || topicId || '')
      setSelectedSubtype(initialData.subtype || subtype)
      
      if (initialData.payload) {
        setPreviewText(initialData.payload.preview_text || '')
        setFullText(initialData.payload.full_text || '')
        setSource(initialData.payload.source || '')
      }
    }
  }, [initialData, subtype, topicId])

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    if (!session) return
    
    try {
      const response = await fetch('/api/admin/topics', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTopics(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const generateWithAI = async () => {
    if (!aiDescription || !selectedTopicId || !session) return
    
    setAiGenerating(true)
    try {
      const response = await fetch('/api/admin/discovery-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topic_id: selectedTopicId,
          description: aiDescription,
          subtype: selectedSubtype,
          length: 'medium'
        })
      })

      if (!response.ok) throw new Error('Failed to generate content')

      const result = await response.json()
      const generatedData = result.data

      setTitle(generatedData.title)
      
      if (generatedData.payload) {
        setPreviewText(generatedData.payload.preview_text || '')
        setFullText(generatedData.payload.full_text || '')
        setSource(generatedData.payload.source || '')
      }

      setCurrentTab('content')
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!title || !selectedTopicId || !previewText || !fullText) return

    const payload = {
      preview_text: previewText,
      full_text: fullText,
      source: source || 'Educational Content',
      type: selectedSubtype.toLowerCase()
    }

    const data = {
      topic_id: selectedTopicId,
      subtype: selectedSubtype,
      title,
      payload,
      status: 'draft',
      created_by: session?.user?.id,
      ai_generated: false
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            {initialData ? 'Edit' : 'Create'} Discovery {selectedSubtype}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Helper
            </TabsTrigger>
            <TabsTrigger value="content">
              Content Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>What do you want to create?</Label>
                  <Input
                    placeholder="Describe the discovery content you want to create..."
                    value={aiDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiDescription(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: "Fun facts about photosynthesis for 4th graders" or "Interesting information about the solar system"
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Topic</Label>
                    <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.title} (Grade {topic.grade_level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Type</Label>
                    <Select value={selectedSubtype} onValueChange={(value: 'FACT' | 'INFO') => setSelectedSubtype(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FACT">Fun Fact</SelectItem>
                        <SelectItem value="INFO">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={generateWithAI} 
                  disabled={!aiDescription || !selectedTopicId || aiGenerating}
                  className="w-full"
                >
                  {aiGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Enter a catchy title..."
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Preview Text (Card Preview)</Label>
                  <Input
                    placeholder="Short preview that appears on the card (1-2 sentences)..."
                    value={previewText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreviewText(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This text will be displayed on the discovery card to entice students to learn more.
                  </p>
                </div>
                
                <div>
                  <Label>Full Content</Label>
                  <textarea
                    className="w-full h-32 p-3 border rounded-md resize-none"
                    placeholder="Enter the detailed content that will be shown when the card is opened..."
                    value={fullText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFullText(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the detailed information that students will see when they open the discovery item.
                  </p>
                </div>
                
                <div>
                  <Label>Source (Optional)</Label>
                  <Input
                    placeholder="Source or reference (e.g., 'NASA Kids' or 'Educational Content')..."
                    value={source}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSource(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Card Preview</h3>
              
              {/* Preview Card */}
              <div className="max-w-md mx-auto">
                <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">
                        {title || 'Discovery Title'}
                      </h4>
                    </div>
                    
                    <p className="text-sm text-green-700">
                      {previewText || 'Preview text will appear here...'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-600">
                        {source || 'Educational Content'}
                      </span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Discover More
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Full Content Preview</h3>
              <div className="bg-gray-50 p-4 rounded-md min-h-[200px]">
                <h4 className="font-semibold mb-2">{title || 'Discovery Title'}</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {fullText || 'Full content will appear here when students open the discovery item...'}
                </div>
                {source && (
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Source: {source}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title || !selectedTopicId || !previewText || !fullText}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Discovery
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}