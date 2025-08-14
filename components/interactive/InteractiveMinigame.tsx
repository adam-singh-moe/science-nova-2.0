"use client"

import React, { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Sparkles, Trophy, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Types for different game data structures
export interface MatchingGameData {
  gameType: "matching"
  title: string
  items: Array<{
    id: string
    term: string
    definition: string
  }>
}

export interface SequencingGameData {
  gameType: "sequencing"
  title: string
  steps: Array<{
    id: string
    text: string
    order: number
  }>
}

export interface LabelingGameData {
  gameType: "labeling"
  title: string
  imageUrl: string
  labels: Array<{
    id: string
    text: string
    x: number // percentage position
    y: number // percentage position
  }>
  hotspots: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    correctLabelId: string
  }>
}

export type MinigameData = MatchingGameData | SequencingGameData | LabelingGameData

interface InteractiveMinigameProps {
  gameType: "matching" | "sequencing" | "labeling"
  data: MinigameData
  onComplete?: () => void
}

// Shuffle array utility
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function InteractiveMinigame({ gameType, data, onComplete }: InteractiveMinigameProps) {
  const [gameState, setGameState] = useState<"playing" | "completed" | "celebrating">("playing")
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)

  // Matching game state
  const [matchingItems, setMatchingItems] = useState<Array<{
    id: string
    term: string
    definition: string
    matched: boolean
  }>>([])
  const [matchingDropped, setMatchingDropped] = useState<Record<string, string>>({})

  // Sequencing game state
  const [sequenceItems, setSequenceItems] = useState<Array<{
    id: string
    text: string
    order: number
    currentPosition: number
  }>>([])

  // Labeling game state
  const [labelingAssignments, setLabelingAssignments] = useState<Record<string, string>>({})
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null)

  useEffect(() => {
    initializeGame()
  }, [data])

  const initializeGame = () => {
    setGameState("playing")
    setScore(0)
    setAttempts(0)

    switch (gameType) {
      case "matching":
        const matchingData = data as MatchingGameData
        setMatchingItems(
          matchingData.items.map(item => ({ ...item, matched: false }))
        )
        setMatchingDropped({})
        break

      case "sequencing":
        const sequencingData = data as SequencingGameData
        const shuffledSteps = shuffleArray(sequencingData.steps).map((step, index) => ({
          ...step,
          currentPosition: index
        }))
        setSequenceItems(shuffledSteps)
        break

      case "labeling":
        setLabelingAssignments({})
        setDraggedLabel(null)
        break
    }
  }

  const checkCompletion = () => {
    let isComplete = false
    let correctCount = 0

    switch (gameType) {
      case "matching":
        const matchingData = data as MatchingGameData
        correctCount = Object.entries(matchingDropped).filter(([termId, defId]) => {
          const item = matchingData.items.find(i => i.id === termId)
          return item && defId === `def-${item.id}`
        }).length
        isComplete = correctCount === matchingData.items.length
        break

      case "sequencing":
        const sequencingData = data as SequencingGameData
        const currentOrder = sequenceItems
          .sort((a, b) => a.currentPosition - b.currentPosition)
          .map(item => item.order)
        const correctOrder = sequencingData.steps
          .sort((a, b) => a.order - b.order)
          .map(step => step.order)
        isComplete = JSON.stringify(currentOrder) === JSON.stringify(correctOrder)
        correctCount = currentOrder.filter((order, index) => order === correctOrder[index]).length
        break

      case "labeling":
        const labelingData = data as LabelingGameData
        correctCount = Object.entries(labelingAssignments).filter(([hotspotId, labelId]) => {
          const hotspot = labelingData.hotspots.find(h => h.id === hotspotId)
          return hotspot && hotspot.correctLabelId === labelId
        }).length
        isComplete = correctCount === labelingData.hotspots.length
        break
    }

    setScore(correctCount)
    setAttempts(prev => prev + 1)

    if (isComplete) {
      setGameState("celebrating")
      setTimeout(() => {
        setGameState("completed")
        setTimeout(() => {
          onComplete?.()
        }, 1500)
      }, 2000)
    }
  }

  // Drag and drop handlers
  const onDragEnd = (result: any) => {
    if (!result.destination) return

    switch (gameType) {
      case "matching":
        handleMatchingDrop(result)
        break
      case "sequencing":
        handleSequencingDrop(result)
        break
    }
  }

  const handleMatchingDrop = (result: any) => {
    const { source, destination, draggableId } = result
    
    if (destination.droppableId.startsWith("def-")) {
      const termId = draggableId.replace("term-", "")
      const defId = destination.droppableId
      
      setMatchingDropped(prev => ({
        ...prev,
        [termId]: defId
      }))
      
      setTimeout(checkCompletion, 100)
    }
  }

  const handleSequencingDrop = (result: any) => {
    const { source, destination } = result
    
    if (source.index === destination.index) return

    const newItems = [...sequenceItems]
    const [reorderedItem] = newItems.splice(source.index, 1)
    newItems.splice(destination.index, 0, reorderedItem)
    
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      currentPosition: index
    }))
    
    setSequenceItems(updatedItems)
    setTimeout(checkCompletion, 100)
  }

  // Labeling game handlers
  const handleLabelDrop = (e: React.DragEvent, hotspotId: string) => {
    e.preventDefault()
    if (draggedLabel) {
      setLabelingAssignments(prev => ({
        ...prev,
        [hotspotId]: draggedLabel
      }))
      setDraggedLabel(null)
      setTimeout(checkCompletion, 100)
    }
  }

  const renderMatchingGame = () => {
    const matchingData = data as MatchingGameData
    const shuffledTerms = shuffleArray([...matchingData.items])
    const shuffledDefinitions = shuffleArray([...matchingData.items])

    return (
      <div className="grid md:grid-cols-2 gap-6">
        {/* Terms */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold mb-4">Terms</h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="terms">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {shuffledTerms.map((item, index) => (
                    <Draggable key={item.id} draggableId={`term-${item.id}`} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-400/40 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                            snapshot.isDragging ? "scale-105 shadow-xl shadow-blue-500/30" : ""
                          }`}
                        >
                          <CardContent className="p-3">
                            <p className="text-white font-medium text-sm">{item.term}</p>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Definitions */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold mb-4">Definitions</h3>
          {shuffledDefinitions.map((item) => (
            <Droppable key={item.id} droppableId={`def-${item.id}`}>
              {(provided, snapshot) => {
                const isDropped = Object.values(matchingDropped).includes(`def-${item.id}`)
                const droppedTermId = Object.entries(matchingDropped).find(([_, defId]) => defId === `def-${item.id}`)?.[0]
                const isCorrect = droppedTermId === item.id
                
                return (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`border-2 transition-all duration-200 ${
                      snapshot.isDraggingOver 
                        ? "border-yellow-400/60 bg-yellow-500/20 scale-105" 
                        : isDropped && isCorrect
                        ? "border-green-400/60 bg-green-500/20"
                        : isDropped
                        ? "border-red-400/60 bg-red-500/20"
                        : "border-purple-400/40 bg-purple-500/20"
                    }`}
                  >
                    <CardContent className="p-3 min-h-[60px] flex items-center">
                      {isDropped && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${isCorrect ? "bg-green-500" : "bg-red-500"}`}>
                            {matchingData.items.find(i => i.id === droppedTermId)?.term}
                          </Badge>
                          {isCorrect ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        </div>
                      )}
                      <p className="text-white text-sm">{item.definition}</p>
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )
              }}
            </Droppable>
          ))}
        </div>
      </div>
    )
  }

  const renderSequencingGame = () => {
    const sequencingData = data as SequencingGameData

    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold mb-4">Drag to arrange in the correct order:</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sequence">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {sequenceItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400/40 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                          snapshot.isDragging ? "scale-105 shadow-xl shadow-emerald-500/30" : ""
                        }`}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/50 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <p className="text-white font-medium">{item.text}</p>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    )
  }

  const renderLabelingGame = () => {
    const labelingData = data as LabelingGameData

    return (
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Image with hotspots */}
        <div className="lg:col-span-2 relative">
          <div className="relative inline-block">
            <img 
              src={labelingData.imageUrl} 
              alt={labelingData.title}
              className="w-full max-w-lg rounded-lg shadow-xl"
            />
            {labelingData.hotspots.map((hotspot) => {
              const assignedLabel = labelingAssignments[hotspot.id]
              const label = labelingData.labels.find(l => l.id === assignedLabel)
              const isCorrect = assignedLabel === hotspot.correctLabelId
              
              return (
                <div
                  key={hotspot.id}
                  className={`absolute border-2 border-dashed transition-all duration-200 ${
                    assignedLabel 
                      ? isCorrect 
                        ? "border-green-400 bg-green-500/20" 
                        : "border-red-400 bg-red-500/20"
                      : "border-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30"
                  }`}
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`
                  }}
                  onDrop={(e) => handleLabelDrop(e, hotspot.id)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {assignedLabel && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge className={`text-xs ${isCorrect ? "bg-green-500" : "bg-red-500"}`}>
                        {label?.text}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold mb-4">Labels</h3>
          {labelingData.labels.map((label) => {
            const isUsed = Object.values(labelingAssignments).includes(label.id)
            
            return (
              <Card
                key={label.id}
                draggable={!isUsed}
                onDragStart={() => setDraggedLabel(label.id)}
                onDragEnd={() => setDraggedLabel(null)}
                className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                  isUsed 
                    ? "opacity-50 cursor-not-allowed bg-gray-500/20 border-gray-400/40" 
                    : "bg-gradient-to-r from-pink-500/30 to-rose-500/30 border-2 border-pink-400/40 hover:scale-105"
                }`}
              >
                <CardContent className="p-3">
                  <p className="text-white font-medium text-sm">{label.text}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (gameState === "celebrating") {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
          >
            <Trophy className="h-24 w-24 text-yellow-400" />
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Success! 🎉</h2>
            <p className="text-white/80 text-lg">You completed the minigame!</p>
            <p className="text-yellow-400 text-lg mt-2">Score: {score} points in {attempts} attempts</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Sparkles className="h-12 w-12 text-purple-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{data.title}</h2>
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              {gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game
            </Badge>
            <span className="text-white/70 text-sm">Score: {score}</span>
            <span className="text-white/70 text-sm">Attempts: {attempts}</span>
          </div>
        </div>
        <Button
          onClick={initializeGame}
          variant="outline"
          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Game Content */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-white/20">
        <CardContent className="p-6">
          {gameType === "matching" && renderMatchingGame()}
          {gameType === "sequencing" && renderSequencingGame()}
          {gameType === "labeling" && renderLabelingGame()}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-300 mt-0.5" />
            <div>
              <h4 className="text-white font-semibold mb-1">How to play:</h4>
              <p className="text-white/80 text-sm">
                {gameType === "matching" && "Drag terms from the left to match them with their correct definitions on the right."}
                {gameType === "sequencing" && "Drag the items to arrange them in the correct chronological order."}
                {gameType === "labeling" && "Drag labels from the right panel onto the correct parts of the image."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
