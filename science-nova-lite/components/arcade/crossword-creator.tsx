"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Cross, Plus, Trash2, RotateCcw, ArrowRight, ArrowDown, Sparkles, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
interface CrosswordWord {
  answer: string
  clue: string
  direction: 'across' | 'down'
  row: number
  col: number
  number: number
}

interface ArcadeGame {
  id?: string
  title: string
  description?: string
  topic_id?: string
  grade_level?: number
  config?: {
    words?: CrosswordWord[]
  }
}

interface CrosswordCreatorProps {
  gameData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export default function CrosswordCreator({ gameData, onUpdate, onPreview }: CrosswordCreatorProps) {
  const { toast } = useToast()
  const [words, setWords] = useState<CrosswordWord[]>([
    { answer: '', clue: '', direction: 'across', row: 1, col: 1, number: 1 }
  ])

  useEffect(() => {
    if (gameData.config?.words) {
      setWords(gameData.config.words)
    }
  }, [gameData.config])

  useEffect(() => {
    onUpdate({
      ...gameData,
      config: { ...gameData.config, words }
    })
  }, [words])

  const canSave = () => {
    return gameData.title && 
           words.length > 0 && 
           words.every(word => word.answer.trim() !== '' && word.clue.trim() !== '')
  }

  const addWord = () => {
    const newWord: CrosswordWord = {
      answer: '',
      clue: '',
      direction: 'across',
      row: words.length + 1,
      col: 1,
      number: words.length + 1
    }
    setWords([...words, newWord])
  }

  const removeWord = (index: number) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index))
    }
  }

  const updateWord = (index: number, field: keyof CrosswordWord, value: any) => {
    const updated = [...words]
    updated[index][field] = value as never
    setWords(updated)
  }

  const autoArrange = () => {
    // Simple auto-arrangement algorithm
    const updated = [...words]
    let currentRow = 1
    let currentCol = 1
    
    updated.forEach((word, index) => {
      if (word.direction === 'across') {
        word.row = currentRow
        word.col = 1
        currentRow += 2
      } else {
        word.row = 1
        word.col = currentCol
        currentCol += Math.max(6, word.answer.length + 2)
      }
      word.number = index + 1
    })
    
    setWords(updated)
    toast({
      title: "Auto-Arranged",
      description: "Words have been automatically positioned on the grid"
    })
  }

  const checkIntersections = () => {
    // Simple intersection checker
    const validWords = words.filter(w => w.answer.trim() !== '')
    let intersections = 0
    
    // This is a simplified check - in a real implementation, you'd want more sophisticated intersection detection
    validWords.forEach((word1, i) => {
      validWords.forEach((word2, j) => {
        if (i !== j && word1.direction !== word2.direction) {
          // Check if words could intersect
          const word1Answer = word1.answer.toUpperCase()
          const word2Answer = word2.answer.toUpperCase()
          
          for (let char1 of word1Answer) {
            if (word2Answer.includes(char1)) {
              intersections++
              break
            }
          }
        }
      })
    })
    
    toast({
      title: "Intersection Check",
      description: `Found ${Math.floor(intersections / 2)} potential intersections`
    })
  }

  const handleAISuggest = async () => {
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
        tool: 'CROSSWORD',
        grade: gameData.grade_level || 5,
        topic: topicName,
        topicId: gameData.topic_id,
        prompt: 'Generate vocabulary words and definitions related to the topic. Focus on key terms students should know.',
        limit: 8
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
        const newWords = result.items.map((item: any, index: number) => ({
          answer: item.answer || '',
          clue: item.clue || '',
          direction: index % 2 === 0 ? 'across' : 'down',
          row: index + 1,
          col: 1,
          number: index + 1
        }))
        
        setWords(newWords)
        toast({
          title: "AI Suggestions Applied",
          description: `Generated ${newWords.length} crossword words`
        })
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('AI suggest error:', error)
      toast({
        title: "AI Suggestion Failed",
        description: "Unable to generate suggestions. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Crossword Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Crossword Title *</Label>
            <Input
              id="title"
              value={gameData.title || ''}
              onChange={(e) => onUpdate({ ...gameData, title: e.target.value })}
              placeholder="e.g., Science Vocabulary Crossword"
              className="bg-white/50"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={gameData.description || ''}
              onChange={(e) => onUpdate({ ...gameData, description: e.target.value })}
              placeholder="A challenging crossword puzzle to test your science vocabulary"
              className="bg-white/50"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Words Management */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Crossword Words</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleAISuggest}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI Suggest
            </Button>
            <Button onClick={addWord} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Word
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {words.map((word, index) => (
            <Card key={index} className="p-4 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Number */}
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">#{word.number}</Label>
                  <Input
                    type="number"
                    value={word.number}
                    onChange={(e) => updateWord(index, 'number', parseInt(e.target.value) || 1)}
                    className="w-full text-center"
                    min="1"
                  />
                </div>

                {/* Answer */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium">Answer *</Label>
                  <Input
                    value={word.answer}
                    onChange={(e) => updateWord(index, 'answer', e.target.value.toUpperCase())}
                    placeholder="WORD"
                    className="uppercase"
                  />
                </div>

                {/* Clue */}
                <div className="md:col-span-4">
                  <Label className="text-sm font-medium">Clue *</Label>
                  <Textarea
                    value={word.clue}
                    onChange={(e) => updateWord(index, 'clue', e.target.value)}
                    placeholder="Definition or hint for this word"
                    rows={2}
                  />
                </div>

                {/* Direction */}
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">Direction</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={word.direction === 'across' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateWord(index, 'direction', 'across')}
                      className="p-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={word.direction === 'down' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateWord(index, 'direction', 'down')}
                      className="p-1"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Position */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={word.row}
                      onChange={(e) => updateWord(index, 'row', parseInt(e.target.value) || 1)}
                      placeholder="Row"
                      className="w-12 text-center text-xs"
                      min="1"
                    />
                    <span className="text-gray-400 text-xs self-center">×</span>
                    <Input
                      type="number"
                      value={word.col}
                      onChange={(e) => updateWord(index, 'col', parseInt(e.target.value) || 1)}
                      placeholder="Col"
                      className="w-12 text-center text-xs"
                      min="1"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium opacity-0">Actions</Label>
                  <Button
                    onClick={() => removeWord(index)}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={words.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tools */}
        <div className="flex gap-2 mt-4">
          <Button onClick={autoArrange} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Auto-Arrange
          </Button>
          <Button onClick={checkIntersections} variant="outline" size="sm">
            <Cross className="w-4 h-4 mr-1" />
            Check Intersections
          </Button>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            {gameData.title || 'Untitled Crossword'} • {words.length} words
          </div>
          <div className="space-y-2">
            <div className="font-medium">Across:</div>
            <div className="pl-4 space-y-1">
              {words.filter(w => w.direction === 'across').map((word, idx) => (
                <div key={idx} className="text-sm">
                  {word.number}. {word.clue} ({word.answer.length} letters)
                </div>
              ))}
            </div>
            <div className="font-medium">Down:</div>
            <div className="pl-4 space-y-1">
              {words.filter(w => w.direction === 'down').map((word, idx) => (
                <div key={idx} className="text-sm">
                  {word.number}. {word.clue} ({word.answer.length} letters)
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}