"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Wand2, BookOpen, Eye, ArrowUp, ArrowDown, Lightbulb } from "lucide-react"
import { TopicSelect } from "@/components/admin/TopicSelect"
import { toast } from "@/hooks/use-toast"

interface InfoSection {
  id: string
  type: 'text' | 'list' | 'steps' | 'tip'
  title: string
  content: string
  bullets?: string[]
}

interface InfoCreatorProps {
  contentData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export function InfoCreator({ contentData, onUpdate, onPreview }: InfoCreatorProps) {
  const [sections, setSections] = useState<InfoSection[]>([
    {
      id: crypto.randomUUID(),
      type: 'text',
      title: '',
      content: ''
    }
  ])
  const [interactiveElements, setInteractiveElements] = useState({
    hasQuiz: false,
    hasVideo: false,
    hasLink: false
  })
  const [difficultyLevel, setDifficultyLevel] = useState('medium')
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)

  // Update parent with current info data
  useEffect(() => {
    const totalWords = sections.reduce((count, section) => {
      const sectionWords = section.content.split(' ').length + 
                          (section.bullets?.join(' ').split(' ').length || 0)
      return count + sectionWords
    }, 0)
    
    const readTime = Math.ceil(totalWords / 200) // Average reading speed

    setEstimatedReadTime(readTime)

    onUpdate({
      ...contentData,
      payload: {
        sections: sections.filter(s => s.content.trim() || (s.bullets && s.bullets.some(b => b.trim()))),
        interactiveElements,
        difficultyLevel,
        estimatedReadTime: readTime,
        wordCount: totalWords
      }
    })
  }, [sections, interactiveElements, difficultyLevel])

  const addSection = (type: InfoSection['type'] = 'text') => {
    const newSection: InfoSection = {
      id: crypto.randomUUID(),
      type,
      title: '',
      content: '',
      bullets: type === 'list' || type === 'steps' ? [''] : undefined
    }
    setSections([...sections, newSection])
  }

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSection = (index: number, field: keyof InfoSection, value: any) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return
    }

    const updated = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap sections
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    
    setSections(updated)
  }

  const addBulletPoint = (sectionIndex: number) => {
    const updated = [...sections]
    if (!updated[sectionIndex].bullets) {
      updated[sectionIndex].bullets = ['']
    } else {
      updated[sectionIndex].bullets!.push('')
    }
    setSections(updated)
  }

  const removeBulletPoint = (sectionIndex: number, bulletIndex: number) => {
    const updated = [...sections]
    if (updated[sectionIndex].bullets && updated[sectionIndex].bullets!.length > 1) {
      updated[sectionIndex].bullets!.splice(bulletIndex, 1)
      setSections(updated)
    }
  }

  const updateBulletPoint = (sectionIndex: number, bulletIndex: number, value: string) => {
    const updated = [...sections]
    if (updated[sectionIndex].bullets) {
      updated[sectionIndex].bullets![bulletIndex] = value
      setSections(updated)
    }
  }

  const handleAISuggest = async () => {
    if (!contentData.topic_id) {
      toast({
        title: "Select Topic First",
        description: "Please select a topic before using AI suggestions",
        variant: "destructive"
      })
      return
    }

    try {
      // Get topic information for better context
      const topicResponse = await fetch(`/api/topics/${contentData.topic_id}`)
      let topicName = contentData.grade_level ? `Grade ${contentData.grade_level} Science` : 'Science'
      
      if (topicResponse.ok) {
        const topicData = await topicResponse.json()
        topicName = topicData.title || topicName
      }

      const aiRequest = {
        tool: 'TEXT',
        grade: contentData.grade_level || 5,
        topic: topicName,
        topicId: contentData.topic_id,
        prompt: 'Write an informative section that explains key concepts in a clear, educational way suitable for students. Include important details and explanations.',
        minWords: 80,
        maxWords: 200
      }

      const response = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequest)
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestion')
      }

      const result = await response.json()
      
      if (result.text) {
        // Update the first section's content or create a new section
        const updatedSections = [...sections]
        if (updatedSections.length > 0) {
          updatedSections[0] = {
            ...updatedSections[0],
            content: result.text.trim()
          }
        } else {
          // Create a new section if none exist
          updatedSections.push({
            id: Date.now().toString(),
            type: 'text' as const,
            title: 'AI Generated Content',
            content: result.text.trim()
          })
        }
        
        setSections(updatedSections)
        
        toast({
          title: "AI Content Generated",
          description: "Information content has been generated for you. Feel free to edit it!",
        })
      } else {
        throw new Error('No content generated')
      }
    } catch (error) {
      console.error('AI suggestion error:', error)
      toast({
        title: "AI Suggestion Failed", 
        description: "Unable to generate suggestion. Please try again or create manually.",
        variant: "destructive"
      })
    }
  }

  const getSectionTypeIcon = (type: InfoSection['type']) => {
    switch (type) {
      case 'text': return '📝'
      case 'list': return '📋'
      case 'steps': return '📊'
      case 'tip': return '💡'
      default: return '📝'
    }
  }

  const getSectionTypeColor = (type: InfoSection['type']) => {
    switch (type) {
      case 'text': return 'bg-blue-100 border-blue-200'
      case 'list': return 'bg-green-100 border-green-200'
      case 'steps': return 'bg-purple-100 border-purple-200'
      case 'tip': return 'bg-yellow-100 border-yellow-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Info Content Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Info Title *</Label>
            <Input
              id="title"
              value={contentData.title || ''}
              onChange={(e) => onUpdate({ ...contentData, title: e.target.value })}
              placeholder="e.g., Complete Guide to Photosynthesis"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select 
              value={difficultyLevel} 
              onValueChange={setDifficultyLevel}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gradeLevel">Grade Level *</Label>
            <Select 
              value={contentData.grade_level?.toString() || ''} 
              onValueChange={(value) => onUpdate({ ...contentData, grade_level: parseInt(value) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Grade 1</SelectItem>
                <SelectItem value="2">Grade 2</SelectItem>
                <SelectItem value="3">Grade 3</SelectItem>
                <SelectItem value="4">Grade 4</SelectItem>
                <SelectItem value="5">Grade 5</SelectItem>
                <SelectItem value="6">Grade 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="topic">Topic *</Label>
            <TopicSelect
              value={contentData.topic_id || ''}
              onChange={(topicId) => onUpdate({ ...contentData, topic_id: topicId })}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Content Sections ({sections.length})</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAISuggest}
              variant="outline"
              size="sm"
              disabled={!contentData.topic_id}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Suggest
            </Button>
            <Select onValueChange={(value) => addSection(value as InfoSection['type'])}>
              <SelectTrigger className="w-48">
                <Plus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Add Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Text Section</SelectItem>
                <SelectItem value="list">📋 Bullet List</SelectItem>
                <SelectItem value="steps">📊 Step-by-Step</SelectItem>
                <SelectItem value="tip">💡 Tip/Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sections.map((section, sectionIndex) => (
          <Card key={section.id} className={`p-6 ${getSectionTypeColor(section.type)} shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSectionTypeIcon(section.type)}</span>
                <h4 className="font-medium capitalize">
                  {section.type.replace('-', ' ')} Section {sectionIndex + 1}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => moveSection(sectionIndex, 'up')}
                  variant="outline"
                  size="sm"
                  disabled={sectionIndex === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => moveSection(sectionIndex, 'down')}
                  variant="outline"
                  size="sm"
                  disabled={sectionIndex === sections.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {sections.length > 1 && (
                  <Button
                    onClick={() => removeSection(sectionIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Section Title */}
              <div>
                <Label htmlFor={`title-${section.id}`}>Section Title {section.type !== 'tip' ? '*' : '(Optional)'}</Label>
                <Input
                  id={`title-${section.id}`}
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder={section.type === 'tip' ? 'Optional tip title...' : 'Section title...'}
                  className="mt-1 bg-white/70"
                />
              </div>

              {/* Section Content */}
              {(section.type === 'text' || section.type === 'tip') && (
                <div>
                  <Label htmlFor={`content-${section.id}`}>
                    {section.type === 'tip' ? 'Tip Content' : 'Content'} *
                  </Label>
                  <Textarea
                    id={`content-${section.id}`}
                    value={section.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSection(sectionIndex, 'content', e.target.value)}
                    placeholder={
                      section.type === 'tip' 
                        ? 'Write your helpful tip or important note here...' 
                        : 'Write the main content for this section...'
                    }
                    className="mt-1 bg-white/70"
                    rows={4}
                  />
                </div>
              )}

              {/* List/Steps Content */}
              {(section.type === 'list' || section.type === 'steps') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{section.type === 'steps' ? 'Steps' : 'Items'} *</Label>
                    <Button
                      onClick={() => addBulletPoint(sectionIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {section.type === 'steps' ? 'Step' : 'Item'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {section.bullets?.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-medium">
                          {section.type === 'steps' ? bulletIndex + 1 : '•'}
                        </div>
                        <Input
                          value={bullet}
                          onChange={(e) => updateBulletPoint(sectionIndex, bulletIndex, e.target.value)}
                          placeholder={`${section.type === 'steps' ? 'Step' : 'Item'} ${bulletIndex + 1}...`}
                          className="flex-1 bg-white/70"
                        />
                        {section.bullets && section.bullets.length > 1 && (
                          <Button
                            onClick={() => removeBulletPoint(sectionIndex, bulletIndex)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Preview */}
              {(section.title.trim() || section.content.trim() || (section.bullets && section.bullets.some(b => b.trim()))) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Section Preview:</p>
                  <div className="bg-white/70 border border-gray-200 rounded-lg p-4">
                    {section.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{section.title}</h4>
                    )}
                    {section.content && (
                      <p className="text-gray-700 mb-2">{section.content}</p>
                    )}
                    {section.bullets && section.bullets.some(b => b.trim()) && (
                      <div className="space-y-1">
                        {section.bullets.filter(b => b.trim()).map((bullet, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-gray-500 mt-1">
                              {section.type === 'steps' ? `${idx + 1}.` : '•'}
                            </span>
                            <span className="text-gray-700">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>


    </div>
  )
}