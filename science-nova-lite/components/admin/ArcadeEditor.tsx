"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Wand2, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  HelpCircle,
  Gamepad2,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface Question {
  question: string
  options: string[]
  correct: number
  explanation?: string
}

interface FlashCard {
  front: string
  back: string
}

interface CrosswordClue {
  clue: string
  answer: string
  direction: 'across' | 'down'
  position: { row: number; col: number }
}

interface ArcadeEditorProps {
  subtype: 'QUIZ' | 'FLASHCARDS' | 'GAME'
  initialData?: any
  topicId?: string
  onSave: (data: any) => void
  onCancel: () => void
  open: boolean
}

export function ArcadeEditor({ subtype, initialData, topicId, onSave, onCancel, open }: ArcadeEditorProps) {
  const { session } = useAuth()
  const [currentTab, setCurrentTab] = useState('content')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [selectedTopicId, setSelectedTopicId] = useState(topicId || '')
  const [aiDescription, setAiDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  // Quiz specific state
  const [questions, setQuestions] = useState<Question[]>([])
  
  // Flashcards specific state
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  
  // Game specific state
  const [crosswordClues, setCrosswordClues] = useState<CrosswordClue[]>([])

  // Topics for selection
  const [topics, setTopics] = useState<any[]>([])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDifficulty(initialData.difficulty || 'MEDIUM')
      setSelectedTopicId(initialData.topic_id || topicId || '')
      
      if (subtype === 'QUIZ' && initialData.payload?.questions) {
        // Ensure each question has proper structure
        const validatedQuestions = initialData.payload.questions.map((q: any) => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correct: q.correct || 0,
          explanation: q.explanation || ''
        }))
        setQuestions(validatedQuestions)
      } else if (subtype === 'FLASHCARDS' && initialData.payload?.cards) {
        setFlashcards(initialData.payload.cards)
      } else if (subtype === 'GAME' && initialData.payload?.clues) {
        setCrosswordClues(initialData.payload.clues)
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
      const response = await fetch('/api/admin/arcade-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topic_id: selectedTopicId,
          subtype,
          description: aiDescription,
          difficulty,
          count: 5
        })
      })

      if (!response.ok) throw new Error('Failed to generate content')

      const result = await response.json()
      const generatedData = result.data

      setTitle(generatedData.title)
      
      if (subtype === 'QUIZ' && generatedData.payload?.questions) {
        // Ensure each question has proper structure
        const validatedQuestions = generatedData.payload.questions.map((q: any) => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correct: q.correct || 0,
          explanation: q.explanation || ''
        }))
        setQuestions(validatedQuestions)
      } else if (subtype === 'FLASHCARDS' && generatedData.payload?.cards) {
        setFlashcards(generatedData.payload.cards)
      } else if (subtype === 'GAME' && generatedData.payload?.clues) {
        setCrosswordClues(generatedData.payload.clues)
      }

      setCurrentTab('content')
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!title || !selectedTopicId) return

    let payload
    if (subtype === 'QUIZ') {
      payload = { questions, type: 'multiple_choice' }
    } else if (subtype === 'FLASHCARDS') {
      payload = { cards: flashcards, type: 'flashcards' }
    } else if (subtype === 'GAME') {
      payload = { clues: crosswordClues, type: 'crossword' }
    }

    const data = {
      topic_id: selectedTopicId,
      subtype,
      title,
      payload,
      difficulty,
      status: 'draft',
      created_by: session?.user?.id,
      ai_generated: false
    }

    onSave(data)
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: ''
    }])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    if (field === 'options' && Array.isArray(value)) {
      updated[index] = { ...updated[index], [field]: value }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addFlashcard = () => {
    setFlashcards([...flashcards, { front: '', back: '' }])
  }

  const updateFlashcard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...flashcards]
    updated[index] = { ...updated[index], [field]: value }
    setFlashcards(updated)
  }

  const removeFlashcard = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index))
  }

  const addCrosswordClue = () => {
    setCrosswordClues([...crosswordClues, {
      clue: '',
      answer: '',
      direction: 'across',
      position: { row: 0, col: 0 }
    }])
  }

  const updateCrosswordClue = (index: number, field: keyof CrosswordClue, value: any) => {
    const updated = [...crosswordClues]
    updated[index] = { ...updated[index], [field]: value }
    setCrosswordClues(updated)
  }

  const removeCrosswordClue = (index: number) => {
    setCrosswordClues(crosswordClues.filter((_, i) => i !== index))
  }

  const renderQuizEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quiz Questions</h3>
        <Button onClick={addQuestion} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
      
      {questions.map((question, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Question {index + 1}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeQuestion(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Enter your question..."
              value={question.question}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateQuestion(index, 'question', e.target.value)
              }
            />
            
            <div className="grid grid-cols-2 gap-2">
              {(question.options || []).map((option, optIndex) => (
                <div key={optIndex} className="flex gap-2">
                  <Input
                    placeholder={`Option ${optIndex + 1}`}
                    value={option}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newOptions = [...(question.options || [])]
                      newOptions[optIndex] = e.target.value
                      updateQuestion(index, 'options', newOptions)
                    }}
                  />
                  <Button
                    variant={question.correct === optIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateQuestion(index, 'correct', optIndex)}
                  >
                    {question.correct === optIndex ? '✓' : 'X'}
                  </Button>
                </div>
              ))}
            </div>
            
            <Input
              placeholder="Explanation (optional)"
              value={question.explanation || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateQuestion(index, 'explanation', e.target.value)
              }
            />
          </div>
        </Card>
      ))}
    </div>
  )

  const renderFlashcardsEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flashcards</h3>
        <Button onClick={addFlashcard} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>
      
      {flashcards.map((card, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Card {index + 1}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFlashcard(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Front (Question/Term)</Label>
                <Input
                  placeholder="Enter front of card..."
                  value={card.front}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateFlashcard(index, 'front', e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Back (Answer/Definition)</Label>
                <Input
                  placeholder="Enter back of card..."
                  value={card.back}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateFlashcard(index, 'back', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderGameEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Crossword Clues</h3>
        <Button onClick={addCrosswordClue} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Clue
        </Button>
      </div>
      
      {crosswordClues.map((clue, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Clue {index + 1}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCrosswordClue(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Clue</Label>
                <Input
                  placeholder="Enter clue..."
                  value={clue.clue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateCrosswordClue(index, 'clue', e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Answer</Label>
                <Input
                  placeholder="Enter answer..."
                  value={clue.answer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateCrosswordClue(index, 'answer', e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Direction</Label>
                <Select 
                  value={clue.direction} 
                  onValueChange={(value: 'across' | 'down') => 
                    updateCrosswordClue(index, 'direction', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="across">Across</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Row</Label>
                <Input
                  type="number"
                  min="0"
                  value={clue.position.row}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateCrosswordClue(index, 'position', {
                      ...clue.position,
                      row: parseInt(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Column</Label>
                <Input
                  type="number"
                  min="0"
                  value={clue.position.col}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateCrosswordClue(index, 'position', {
                      ...clue.position,
                      col: parseInt(e.target.value) || 0
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            {initialData ? 'Edit' : 'Create'} {subtype}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Helper
            </TabsTrigger>
            <TabsTrigger value="content">
              Content Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Description for AI</Label>
                  <Input
                    placeholder="Describe what you want to create..."
                    value={aiDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiDescription(e.target.value)}
                  />
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
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={(value: 'EASY' | 'MEDIUM' | 'HARD') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Enter title..."
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value: 'EASY' | 'MEDIUM' | 'HARD') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {subtype === 'QUIZ' && renderQuizEditor()}
            {subtype === 'FLASHCARDS' && renderFlashcardsEditor()}
            {subtype === 'GAME' && renderGameEditor()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title || !selectedTopicId}>
            <Save className="h-4 w-4 mr-2" />
            Save {subtype}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}