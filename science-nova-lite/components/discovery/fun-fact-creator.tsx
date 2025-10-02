"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Wand2, Lightbulb, Eye, Sparkles } from "lucide-react"
import { TopicSelect } from "@/components/admin/TopicSelect"
import { toast } from "@/hooks/use-toast"

interface FunFactCreatorProps {
  contentData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export function FunFactCreator({ contentData, onUpdate, onPreview }: FunFactCreatorProps) {
  const [fact, setFact] = useState('')
  const [explanation, setExplanation] = useState('')
  const [interactionType, setInteractionType] = useState('click')
  const [visualElements, setVisualElements] = useState({
    hasImage: false,
    hasAnimation: false,
    hasSound: false
  })
  const [relatedFacts, setRelatedFacts] = useState<string[]>([''])
  const [difficultyLevel, setDifficultyLevel] = useState('medium')
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)

  // Update parent with current fun fact data
  useEffect(() => {
    const wordCount = (fact.split(' ').length + explanation.split(' ').length)
    const readTime = Math.ceil(wordCount / 200) // Average reading speed

    setEstimatedReadTime(readTime)

    onUpdate({
      ...contentData,
      payload: {
        fact: fact.trim(),
        explanation: explanation.trim(),
        interactionType,
        visualElements,
        relatedFacts: relatedFacts.filter(rf => rf.trim() !== ''),
        difficultyLevel,
        estimatedReadTime: readTime,
        wordCount
      }
    })
  }, [fact, explanation, interactionType, visualElements, relatedFacts, difficultyLevel])

  const addRelatedFact = () => {
    setRelatedFacts([...relatedFacts, ''])
  }

  const removeRelatedFact = (index: number) => {
    if (relatedFacts.length > 1) {
      setRelatedFacts(relatedFacts.filter((_, i) => i !== index))
    }
  }

  const updateRelatedFact = (index: number, value: string) => {
    const updated = [...relatedFacts]
    updated[index] = value
    setRelatedFacts(updated)
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
        prompt: 'Generate an interesting, surprising, and educational fun fact that would captivate students. Make it engaging and memorable.',
        minWords: 10,
        maxWords: 50
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
        setFact(result.text.trim())
        toast({
          title: "AI Suggestion Generated",
          description: "A fun fact has been generated for you. Feel free to edit it!",
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
      
      // Fallback to example facts
      generateExampleFacts()
    }
  }

  const generateExampleFacts = () => {
    const examples = [
      "Octopuses have three hearts and blue blood!",
      "A group of flamingos is called a 'flamboyance'",
      "Honey never spoils - archaeologists have found 3000-year-old honey that's still edible",
      "A single cloud can weigh more than a million pounds",
      "Bananas are berries, but strawberries aren't!"
    ]
    
    const randomFact = examples[Math.floor(Math.random() * examples.length)]
    setFact(randomFact)
    
    toast({
      title: "Example Loaded!",
      description: "Feel free to edit this example or create your own",
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Fun Fact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Fun Fact Title *</Label>
            <Input
              id="title"
              value={contentData.title || ''}
              onChange={(e) => onUpdate({ ...contentData, title: e.target.value })}
              placeholder="e.g., Amazing Ocean Facts"
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

      {/* Fun Fact Content */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">The Fun Fact</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateExampleFacts}
              variant="outline"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Load Example
            </Button>
            <Button
              onClick={handleAISuggest}
              variant="outline"
              size="sm"
              disabled={!contentData.topic_id}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Suggest
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main Fact */}
          <div>
            <Label htmlFor="fact">The Fun Fact Statement *</Label>
            <Textarea
              id="fact"
              value={fact}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFact(e.target.value)}
              placeholder="Write your amazing, surprising, or interesting fact here..."
              className="mt-1"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">Make it catchy and surprising!</p>
          </div>

          {/* Explanation */}
          <div>
            <Label htmlFor="explanation">Detailed Explanation *</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExplanation(e.target.value)}
              placeholder="Explain why this fact is true, provide context, or add more details..."
              className="mt-1"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">Help students understand the science behind the fact</p>
          </div>

          {/* Interaction Settings */}
          <div>
            <Label htmlFor="interaction">How should students interact with this fact?</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">Click to reveal explanation</SelectItem>
                <SelectItem value="hover">Hover to see details</SelectItem>
                <SelectItem value="expand">Expandable card</SelectItem>
                <SelectItem value="flip">Flip card animation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {fact.trim() && explanation.trim() && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-600 mb-3">Live Preview:</p>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-500 p-2 flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-2">{fact}</div>
                    <div className="text-sm text-blue-700 bg-white/50 p-3 rounded-lg">
                      {explanation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>




    </div>
  )
}