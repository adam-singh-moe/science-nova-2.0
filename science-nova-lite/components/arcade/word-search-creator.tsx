"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Wand2, Grid3X3, Shuffle } from "lucide-react"
import { TopicSelect } from "@/components/admin/TopicSelect"
import { toast } from "@/hooks/use-toast"

interface WordSearchCreatorProps {
  gameData: any
  onUpdate: (data: any) => void
  onPreview: () => void
}

export function WordSearchCreator({ gameData, onUpdate, onPreview }: WordSearchCreatorProps) {
  const [words, setWords] = useState<string[]>([''])
  const [gridSize, setGridSize] = useState(12)
  const [directions, setDirections] = useState({
    horizontal: true,
    vertical: true,
    diagonal: true,
    backwards: false
  })
  const [showGrid, setShowGrid] = useState(false)

  // Update parent with current word search data
  useEffect(() => {
    const validWords = words.filter(w => w.trim() !== '').map(w => w.toUpperCase())
    
    onUpdate({
      ...gameData,
      payload: {
        grid: generateGrid(validWords, gridSize, directions),
        words: validWords.map(word => ({ word, found: false })),
        size: gridSize,
        directions
      }
    })
  }, [words, gridSize, directions])

  const generateGrid = (validWords: string[], size: number, dirs: typeof directions): string[][] => {
    const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''))
    const placedWords: { word: string, positions: { row: number, col: number }[] }[] = []

    // Try to place each word
    validWords.forEach(word => {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 50) {
        const direction = getRandomDirection(dirs)
        const startRow = Math.floor(Math.random() * size)
        const startCol = Math.floor(Math.random() * size)
        
        if (canPlaceWord(word, startRow, startCol, direction, size, grid)) {
          placeWord(word, startRow, startCol, direction, grid)
          placed = true
        }
        attempts++
      }
    })

    // Fill empty cells with random letters
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === '') {
          grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }

    return grid
  }

  const getRandomDirection = (dirs: typeof directions) => {
    const availableDirections = []
    if (dirs.horizontal) availableDirections.push({ row: 0, col: 1 })
    if (dirs.vertical) availableDirections.push({ row: 1, col: 0 })
    if (dirs.diagonal) availableDirections.push({ row: 1, col: 1 }, { row: 1, col: -1 })
    if (dirs.backwards) {
      availableDirections.push({ row: 0, col: -1 }, { row: -1, col: 0 })
      if (dirs.diagonal) availableDirections.push({ row: -1, col: -1 }, { row: -1, col: 1 })
    }
    
    return availableDirections[Math.floor(Math.random() * availableDirections.length)]
  }

  const canPlaceWord = (word: string, startRow: number, startCol: number, direction: { row: number, col: number }, size: number, grid: string[][]): boolean => {
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * direction.row
      const col = startCol + i * direction.col
      
      if (row < 0 || row >= size || col < 0 || col >= size) {
        return false
      }
      
      if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
        return false
      }
    }
    return true
  }

  const placeWord = (word: string, startRow: number, startCol: number, direction: { row: number, col: number }, grid: string[][]) => {
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * direction.row
      const col = startCol + i * direction.col
      grid[row][col] = word[i]
    }
  }

  const addWord = () => {
    setWords([...words, ''])
  }

  const removeWord = (index: number) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index))
    }
  }

  const updateWord = (index: number, value: string) => {
    const updated = [...words]
    updated[index] = value.toUpperCase()
    setWords(updated)
  }

  const generateRandomGrid = () => {
    const validWords = words.filter(w => w.trim() !== '')
    if (validWords.length === 0) {
      toast({
        title: "No Words",
        description: "Add some words before generating the grid",
        variant: "destructive"
      })
      return
    }
    
    // Force re-generate by updating a timestamp
    onUpdate({
      ...gameData,
      payload: {
        ...gameData.payload,
        timestamp: Date.now()
      }
    })
    
    toast({
      title: "Grid Generated",
      description: "New word search grid has been created"
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

    // TODO: Implement AI suggestion for word search words
    toast({
      title: "AI Assistant",
      description: "AI suggestions for word search terms will be available soon!",
    })
  }

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Word Search Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Word Search Title *</Label>
            <Input
              id="title"
              value={gameData.title || ''}
              onChange={(e) => onUpdate({ ...gameData, title: e.target.value })}
              placeholder="e.g., Ecosystem Word Search"
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

      {/* Word Directions */}
      <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Word Directions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="horizontal"
              checked={directions.horizontal}
              onCheckedChange={(checked: boolean) => setDirections({...directions, horizontal: checked})}
            />
            <Label htmlFor="horizontal">Horizontal →</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vertical"
              checked={directions.vertical}
              onCheckedChange={(checked: boolean) => setDirections({...directions, vertical: checked})}
            />
            <Label htmlFor="vertical">Vertical ↓</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="diagonal"
              checked={directions.diagonal}
              onCheckedChange={(checked: boolean) => setDirections({...directions, diagonal: checked})}
            />
            <Label htmlFor="diagonal">Diagonal ↘</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="backwards"
              checked={directions.backwards}
              onCheckedChange={(checked: boolean) => setDirections({...directions, backwards: checked})}
            />
            <Label htmlFor="backwards">Backwards ←</Label>
          </div>
        </div>
      </Card>

      {/* Grid Tools */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowGrid(!showGrid)}
              variant="outline"
              size="sm"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </Button>
            <Button
              onClick={generateRandomGrid}
              variant="outline"
              size="sm"
              disabled={words.filter(w => w.trim()).length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Generate New Grid
            </Button>
          </div>
          <div className="text-sm text-blue-600">
            Grid: {gridSize}x{gridSize} | Words: {words.filter(w => w.trim()).length}
          </div>
        </div>
      </Card>

      {/* Grid Preview */}
      {showGrid && (
        <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
          <h4 className="font-medium mb-4">Grid Preview</h4>
          <div className="overflow-auto">
            <div 
              className="grid gap-1 w-fit mx-auto"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array(gridSize).fill(null).map((_, row) =>
                Array(gridSize).fill(null).map((_, col) => {
                  const validWords = words.filter(w => w.trim() !== '').map(w => w.toUpperCase())
                  const grid = generateGrid(validWords, gridSize, directions)
                  const cell = grid[row]?.[col] || ''
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="w-8 h-8 border border-gray-300 bg-white text-xs font-bold flex items-center justify-center text-black"
                    >
                      {cell}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Words to Find */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Words to Find ({words.filter(w => w.trim()).length})</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAISuggest}
              variant="outline"
              size="sm"
              disabled={!gameData.topic_id}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Suggest Words
            </Button>
            <Button onClick={addWord} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Word
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {words.map((word, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                {index + 1}
              </div>
              <Input
                value={word}
                onChange={(e) => updateWord(index, e.target.value)}
                placeholder={`Word ${index + 1}`}
                className="flex-1 font-mono"
                maxLength={Math.floor(gridSize * 0.8)} // Reasonable max length
              />
              {words.length > 1 && (
                <Button
                  onClick={() => removeWord(index)}
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

      {/* Word List Preview */}
      {words.filter(w => w.trim()).length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-medium mb-2">Words Students Will Find:</h4>
          <div className="flex flex-wrap gap-2">
            {words
              .filter(w => w.trim())
              .map((word, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium"
                >
                  {word.toUpperCase()}
                </span>
              ))}
          </div>
        </Card>
      )}


    </div>
  )
}