"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Wand2, Eye, CheckCircle } from "lucide-react"
import { TopicSelect } from "@/components/admin/TopicSelect"
import { toast } from "@/hooks/use-toast"

interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctAnswer: number
  explanation: string
}

interface QuizCreatorProps {
  gameData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export function QuizCreator({ gameData, onUpdate, onPreview }: QuizCreatorProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
  ])

  // Update parent with current questions
  useEffect(() => {
    onUpdate({
      ...gameData,
      payload: {
        questions: questions.filter(q => q.question.trim() !== '')
      }
    })
  }, [questions])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    if (field === 'options') {
      updated[index].options = value as [string, string, string, string]
    } else {
      updated[index][field] = value as never
    }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const handleAISuggest = async (questionIndex: number) => {
    if (!gameData.topic_id) {
      toast({
        title: "Select Topic First",
        description: "Please select a topic before using AI suggestions",
        variant: "destructive"
      })
      return
    }

    try {
      // Get topic information for better context
      const topicResponse = await fetch(`/api/topics/${gameData.topic_id}`)
      let topicName = gameData.grade_level ? `Grade ${gameData.grade_level} Science` : 'Science'
      
      if (topicResponse.ok) {
        const topicData = await topicResponse.json()
        topicName = topicData.title || topicName
      }

      const aiRequest = {
        tool: 'QUIZ',
        grade: gameData.grade_level || 5,
        topic: topicName,
        topicId: gameData.topic_id,
        prompt: 'Create engaging quiz questions that test understanding of key concepts. Include a mix of multiple choice, true/false, and fill-in-the-blank questions.',
        limit: 3
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
      
      if (result.items && Array.isArray(result.items)) {
        const newQuestions = result.items.slice(0, 3).map((item: any, index: number) => {
          if (item.type === 'MCQ') {
            return {
              id: Date.now() + index,
              question: item.question || 'Generated question',
              options: Array.isArray(item.options) ? item.options : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: item.answer || 'A',
              explanation: item.explanation || ''
            }
          } else if (item.type === 'TF') {
            return {
              id: Date.now() + index,
              question: item.question || 'Generated true/false question',
              options: ['True', 'False'],
              correctAnswer: item.answer === true ? 'A' : 'B',
              explanation: item.explanation || ''
            }
          } else {
            // Convert other types to MCQ format
            return {
              id: Date.now() + index,
              question: item.question || 'Generated question',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'A',
              explanation: item.explanation || ''
            }
          }
        })

        // Replace current questions with AI generated ones
        setQuestions(newQuestions)
        
        toast({
          title: "AI Questions Generated",
          description: `${newQuestions.length} quiz questions have been generated for you. Feel free to edit them!`,
        })
      } else {
        throw new Error('No questions generated')
      }
    } catch (error) {
      console.error('AI suggestion error:', error)
      toast({
        title: "AI Suggestion Failed", 
        description: "Unable to generate questions. Please try again or create manually.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Quiz Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={gameData.title || ''}
              onChange={(e) => onUpdate({ ...gameData, title: e.target.value })}
              placeholder="e.g., Solar System Quiz"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select 
              value={gameData.difficulty || 'MEDIUM'} 
              onValueChange={(value) => onUpdate({ ...gameData, difficulty: value })}
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
              value={gameData.grade_level?.toString() || ''} 
              onValueChange={(value) => onUpdate({ ...gameData, grade_level: parseInt(value) })}
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
              value={gameData.topic_id || ''}
              onChange={(topicId) => onUpdate({ ...gameData, topic_id: topicId })}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <Button onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {questions.map((question, questionIndex) => (
          <Card key={question.id} className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Question {questionIndex + 1}</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleAISuggest(questionIndex)}
                  variant="outline"
                  size="sm"
                  disabled={!gameData.topic_id}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Suggest
                </Button>
                {questions.length > 1 && (
                  <Button
                    onClick={() => removeQuestion(questionIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <Label htmlFor={`question-${question.id}`}>Question *</Label>
                <Textarea
                  id={`question-${question.id}`}
                  value={question.question}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(questionIndex, 'question', e.target.value)}
                  placeholder="Enter your question here..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    </div>
                    <Button
                      onClick={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                      variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                      size="sm"
                      className={question.correctAnswer === optionIndex ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {question.correctAnswer === optionIndex ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        "Correct?"
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div>
                <Label htmlFor={`explanation-${question.id}`}>Explanation (Optional)</Label>
                <Textarea
                  id={`explanation-${question.id}`}
                  value={question.explanation}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>


    </div>
  )
}