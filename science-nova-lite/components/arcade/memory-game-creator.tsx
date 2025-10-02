"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Wand2, Shuffle } from "lucide-react"
import { TopicSelect } from "@/components/admin/TopicSelect"
import { toast } from "@/hooks/use-toast"

interface MemoryPair {
  id: string
  term: string
  definition: string
}

interface MemoryGameCreatorProps {
  gameData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export function MemoryGameCreator({ gameData, onUpdate, onPreview }: MemoryGameCreatorProps) {
  const [pairs, setPairs] = useState<MemoryPair[]>([
    {
      id: crypto.randomUUID(),
      term: '',
      definition: ''
    }
  ])
  const [gridSize, setGridSize] = useState('4x3')

  // Update parent with current memory game data
  useEffect(() => {
    const validPairs = pairs.filter(p => p.term.trim() !== '' && p.definition.trim() !== '')
    
    // Create the pairs array for the game (each pair becomes two cards)
    const gamePairs: any[] = []
    validPairs.forEach((pair, index) => {
      gamePairs.push(
        { id: index + 1, content: pair.term, type: 'term' },
        { id: index + 1, content: pair.definition, type: 'definition' }
      )
    })
    
    onUpdate({
      ...gameData,
      payload: {
        pairs: gamePairs,
        gridSize,
        pairCount: validPairs.length
      }
    })
  }, [pairs, gridSize])

  const addPair = () => {
    const maxPairs = getMaxPairs(gridSize)
    if (pairs.length >= maxPairs) {
      toast({
        title: "Grid Full",
        description: `This grid size can only accommodate ${maxPairs} pairs`,
        variant: "destructive"
      })
      return
    }

    const newPair: MemoryPair = {
      id: crypto.randomUUID(),
      term: '',
      definition: ''
    }
    setPairs([...pairs, newPair])
  }

  const removePair = (index: number) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter((_, i) => i !== index))
    }
  }

  const updatePair = (index: number, field: 'term' | 'definition', value: string) => {
    const updated = [...pairs]
    updated[index][field] = value
    setPairs(updated)
  }

  const getMaxPairs = (size: string): number => {
    const [rows, cols] = size.split('x').map(Number)
    return Math.floor((rows * cols) / 2)
  }

  const getGridDimensions = (size: string) => {
    const [rows, cols] = size.split('x').map(Number)
    return { rows, cols, total: rows * cols }
  }

  const shufflePairs = () => {
    const shuffled = [...pairs].sort(() => Math.random() - 0.5)
    setPairs(shuffled)
    toast({
      title: "Pairs Shuffled",
      description: "The order of pairs has been randomized"
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

    // TODO: Implement AI suggestion for memory game pairs
    toast({
      title: "AI Assistant",
      description: "AI suggestions for memory game pairs will be available soon!",
    })
  }

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Memory Game Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Memory Game Title *</Label>
            <Input
              id="title"
              value={gameData.title || ''}
              onChange={(e) => onUpdate({ ...gameData, title: e.target.value })}
              placeholder="e.g., Physics Terms Memory Game"
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
              value={gameData.grade_level && gameData.grade_level > 0 ? gameData.grade_level.toString() : ''} 
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
              gradeFilter={gameData.grade_level && gameData.grade_level > 0 ? gameData.grade_level : undefined}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Grid Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">
              Grid: {gridSize} ({getGridDimensions(gridSize).total} cards)
            </span>
            <span className="font-medium">
              Max Pairs: {getMaxPairs(gridSize)}
            </span>
            <span className="font-medium">
              Current Pairs: {pairs.filter(p => p.term.trim() && p.definition.trim()).length}
            </span>
          </div>
          <Button
            onClick={shufflePairs}
            variant="outline"
            size="sm"
            disabled={pairs.length <= 1}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle Order
          </Button>
        </div>
      </Card>

      {/* Pairs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Term & Definition Pairs ({pairs.length})</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAISuggest}
              variant="outline"
              size="sm"
              disabled={!gameData.topic_id}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Suggest Pairs
            </Button>
            <Button 
              onClick={addPair} 
              size="sm"
              disabled={pairs.length >= getMaxPairs(gridSize)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pair
            </Button>
          </div>
        </div>

        {pairs.map((pair, pairIndex) => (
          <Card key={pair.id} className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Pair {pairIndex + 1}</h4>
              <div className="flex items-center gap-2">
                {pairs.length > 1 && (
                  <Button
                    onClick={() => removePair(pairIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Term */}
              <div>
                <Label htmlFor={`term-${pair.id}`}>Term/Concept *</Label>
                <Input
                  id={`term-${pair.id}`}
                  value={pair.term}
                  onChange={(e) => updatePair(pairIndex, 'term', e.target.value)}
                  placeholder="e.g., Photosynthesis"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Short term or concept name</p>
              </div>

              {/* Definition */}
              <div>
                <Label htmlFor={`definition-${pair.id}`}>Definition/Description *</Label>
                <Textarea
                  id={`definition-${pair.id}`}
                  value={pair.definition}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updatePair(pairIndex, 'definition', e.target.value)}
                  placeholder="e.g., Process plants use to make food from sunlight"
                  className="mt-1"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">Explanation or definition</p>
              </div>
            </div>

            {/* Preview Cards */}
            {pair.term.trim() && pair.definition.trim() && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600 mb-2">Preview Cards:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-purple-100 border border-purple-200 rounded text-sm">
                    <div className="text-xs text-purple-600 font-medium mb-1">🏷️ Term</div>
                    <div className="font-medium">{pair.term}</div>
                  </div>
                  <div className="p-3 bg-cyan-100 border border-cyan-200 rounded text-sm">
                    <div className="text-xs text-cyan-600 font-medium mb-1">📝 Definition</div>
                    <div>{pair.definition}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Game Preview */}
      {pairs.filter(p => p.term.trim() && p.definition.trim()).length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h4 className="font-medium mb-4">Memory Game Preview</h4>
          <div 
            className="grid gap-2 w-fit mx-auto"
            style={{ gridTemplateColumns: `repeat(${getGridDimensions(gridSize).cols}, 1fr)` }}
          >
            {Array(getGridDimensions(gridSize).total).fill(null).map((_, index) => {
              const pairIndex = Math.floor(index / 2)
              const isValidPair = pairs[pairIndex]?.term.trim() && pairs[pairIndex]?.definition.trim()
              
              return (
                <div
                  key={index}
                  className={`w-16 h-16 rounded border-2 border-dashed flex items-center justify-center text-xs font-medium ${
                    isValidPair 
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {isValidPair ? '🧠' : '?'}
                </div>
              )
            })}
          </div>
          <p className="text-center text-sm text-green-600 mt-3">
            Students will flip cards to match terms with their definitions
          </p>
        </Card>
      )}


    </div>
  )
}