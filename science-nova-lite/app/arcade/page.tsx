"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VantaBackground } from '@/components/vanta-background'
import { PageTransition } from '@/components/layout/page-transition'
import { 
  Gamepad2, 
  Zap, 
  Shuffle, 
  Trophy,
  Star,
  RefreshCw,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  ChevronLeft,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface ArcadeEntry {
  id: string
  topic_id: string
  subtype: 'QUIZ' | 'CROSSWORD' | 'WORDSEARCH' | 'MEMORY'
  title: string
  payload: any
  difficulty?: string
  topics: {
    title: string
    grade_level: number
    study_areas: {
      name: string
    }
  }
}

// Mock data for demonstration
const mockArcadeContent: ArcadeEntry[] = [
  {
    id: 'quiz-1',
    topic_id: 'physics-1',
    subtype: 'QUIZ',
    title: 'Solar System Quiz',
    difficulty: 'easy',
    payload: {
      questions: [
        {
          question: 'Which planet is closest to the Sun?',
          options: ['Venus', 'Mercury', 'Earth', 'Mars'],
          correctAnswer: 'Mercury'
        },
        {
          question: 'How many moons does Earth have?',
          options: ['0', '1', '2', '3'],
          correctAnswer: '1'
        },
        {
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
          correctAnswer: 'Mars'
        }
      ]
    },
    topics: {
      title: 'Space Science',
      grade_level: 4,
      study_areas: {
        name: 'Physics'
      }
    }
  },
  {
    id: 'quiz-2',
    topic_id: 'biology-1',
    subtype: 'QUIZ',
    title: 'Animal Kingdom',
    difficulty: 'hard',
    payload: {
      questions: [
        {
          question: 'Which animal is the largest mammal on Earth?',
          options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
          correctAnswer: 'Blue Whale'
        },
        {
          question: 'How many hearts does an octopus have?',
          options: ['1', '2', '3', '4'],
          correctAnswer: '3'
        }
      ]
    },
    topics: {
      title: 'Animal Biology',
      grade_level: 6,
      study_areas: {
        name: 'Biology'
      }
    }
  },
  {
    id: 'crossword-1',
    topic_id: 'chemistry-1',
    subtype: 'CROSSWORD',
    title: 'Chemistry Crossword',
    difficulty: 'medium',
    payload: {
      grid: [
        ['', '', 'C', 'A', 'R', 'B', 'O', 'N', '', ''],
        ['', '', 'H', '', '', '', '', '', '', ''],
        ['O', 'X', 'Y', 'G', 'E', 'N', '', '', 'H', ''],
        ['', '', 'D', '', '', '', '', '', 'E', ''],
        ['', '', 'R', '', '', '', '', '', 'L', ''],
        ['', '', 'O', '', '', '', '', '', 'I', ''],
        ['', '', 'G', '', '', '', '', '', 'U', ''],
        ['', '', 'E', '', '', '', '', '', 'M', ''],
        ['', '', 'N', '', '', '', 'I', 'R', 'O', 'N']
      ],
      clues: {
        across: [
          { number: 1, clue: 'Essential element for life, found in all organic compounds', answer: 'CARBON', row: 0, col: 2 },
          { number: 3, clue: 'Gas we breathe', answer: 'OXYGEN', row: 2, col: 0 },
          { number: 5, clue: 'Noble gas used in balloons', answer: 'HELIUM', row: 2, col: 8 },
          { number: 7, clue: 'Metal that rusts', answer: 'IRON', row: 8, col: 6 }
        ],
        down: [
          { number: 2, clue: 'Most abundant element in the universe', answer: 'HYDROGEN', row: 1, col: 2 }
        ]
      }
    },
    topics: {
      title: 'Chemical Elements',
      grade_level: 5,
      study_areas: {
        name: 'Chemistry'
      }
    }
  },
  {
    id: 'wordsearch-1',
    topic_id: 'biology-2',
    subtype: 'WORDSEARCH',
    title: 'Animal Parts Word Search',
    difficulty: 'easy',
    payload: {
      grid: [
        ['B', 'E', 'A', 'K', 'X', 'F', 'I', 'N', 'S', 'T'],
        ['R', 'T', 'A', 'I', 'L', 'P', 'A', 'W', 'S', 'A'],
        ['A', 'H', 'O', 'R', 'N', 'S', 'K', 'E', 'Y', 'I'],
        ['I', 'E', 'A', 'R', 'S', 'G', 'I', 'L', 'L', 'L'],
        ['N', 'A', 'F', 'E', 'A', 'T', 'H', 'E', 'R', 'S'],
        ['S', 'R', 'W', 'I', 'N', 'G', 'S', 'C', 'L', 'A'],
        ['H', 'T', 'U', 'S', 'K', 'S', 'H', 'E', 'L', 'L'],
        ['A', 'N', 'T', 'E', 'N', 'N', 'A', 'E', 'Y', 'E'],
        ['R', 'K', 'L', 'E', 'G', 'S', 'M', 'O', 'U', 'T'],
        ['K', 'S', 'C', 'A', 'L', 'E', 'S', 'H', 'O', 'O']
      ],
      words: [
        { word: 'BEAK', found: false },
        { word: 'TAIL', found: false },
        { word: 'PAWS', found: false },
        { word: 'HORNS', found: false },
        { word: 'EARS', found: false },
        { word: 'GILLS', found: false },
        { word: 'FEATHERS', found: false },
        { word: 'WINGS', found: false },
        { word: 'SHELL', found: false },
        { word: 'SCALES', found: false }
      ]
    },
    topics: {
      title: 'Animal Anatomy',
      grade_level: 4,
      study_areas: {
        name: 'Biology'
      }
    }
  },
  {
    id: 'memory-1',
    topic_id: 'physics-2',
    subtype: 'MEMORY',
    title: 'Physics Terms Memory',
    difficulty: 'medium',
    payload: {
      pairs: [
        { id: 1, content: 'Force', type: 'term' },
        { id: 1, content: 'Push or pull on an object', type: 'definition' },
        { id: 2, content: 'Energy', type: 'term' },
        { id: 2, content: 'Ability to do work', type: 'definition' },
        { id: 3, content: 'Gravity', type: 'term' },
        { id: 3, content: 'Force that attracts objects', type: 'definition' },
        { id: 4, content: 'Mass', type: 'term' },
        { id: 4, content: 'Amount of matter in object', type: 'definition' },
        { id: 5, content: 'Velocity', type: 'term' },
        { id: 5, content: 'Speed with direction', type: 'definition' },
        { id: 6, content: 'Friction', type: 'term' },
        { id: 6, content: 'Force that opposes motion', type: 'definition' }
      ]
    },
    topics: {
      title: 'Physics Basics',
      grade_level: 6,
      study_areas: {
        name: 'Physics'
      }
    }
  }
]

export default function ArcadePage() {
  const { session } = useAuth()
  const [arcadeContent, setArcadeContent] = useState<ArcadeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGameIndex, setSelectedGameIndex] = useState(0)
  const [currentDate] = useState(new Date().toISOString().split('T')[0])
  const [score, setScore] = useState(0)
  const [gameProgress, setGameProgress] = useState({ current: 0, total: 0 })
  const [showFeedback, setShowFeedback] = useState<{ type: 'correct' | 'incorrect', message: string } | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [gameData, setGameData] = useState<any>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Crossword specific state
  const [crosswordAnswers, setCrosswordAnswers] = useState<{[key: string]: string}>({})
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)
  const [selectedClueDirection, setSelectedClueDirection] = useState<'across' | 'down' | null>(null)
  const [selectedClueNumber, setSelectedClueNumber] = useState<number | null>(null)
  
  // Word Search specific state
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  
  // Memory Game specific state
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [shuffledCards, setShuffledCards] = useState<any[]>([])
  const [canFlip, setCanFlip] = useState(true)

  const fetchArcadeContent = async (forceRefresh = false) => {
    setLoading(true)
    try {
      // Use mock data for now
      setArcadeContent(mockArcadeContent)
      if (mockArcadeContent.length > 0) {
        loadGame(mockArcadeContent[0], 0)
      }
    } catch (error) {
      console.error('Error fetching arcade content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTopic = async () => {
    try {
      // Shuffle mock data for new topic
      const shuffled = [...mockArcadeContent].sort(() => Math.random() - 0.5)
      setArcadeContent(shuffled)
      if (shuffled.length > 0) {
        loadGame(shuffled[0], 0)
      }
    } catch (error) {
      console.error('Error getting new topic:', error)
    }
  }

  const loadGame = (content: ArcadeEntry, index: number) => {
    setSelectedGameIndex(index)
    setCurrentQuestion(0)
    setScore(0)
    setGameProgress({ current: 0, total: 0 })
    setUserAnswers([])
    setShowFeedback(null)
    setIsFlipped(false) // Reset flip state when loading new game

    // Reset game-specific states
    setCrosswordAnswers({})
    setSelectedCell(null)
    setSelectedClueDirection(null)
    setSelectedClueNumber(null)
    setSelectedCells([])
    setFoundWords([])
    setIsSelecting(false)
    setFlippedCards([])
    setMatchedPairs([])
    setCanFlip(true)

    // Process game data based on type
    let processedData = null
    let total = 0

    switch (content.subtype) {
      case 'QUIZ':
        const quizItems = Array.isArray(content.payload) 
          ? content.payload 
          : content.payload?.items || content.payload?.questions || []
        processedData = quizItems
        total = quizItems.length
        break
      case 'CROSSWORD':
        const crosswordData = content.payload?.clues
        processedData = crosswordData?.across.concat(crosswordData?.down) || []
        total = processedData.length
        break
      case 'WORDSEARCH':
        const wordsearchData = content.payload?.words || []
        processedData = wordsearchData
        total = wordsearchData.length
        break
      case 'MEMORY':
        const memoryData = content.payload?.pairs || []
        // Shuffle the cards for memory game
        const shuffled = [...memoryData].sort(() => Math.random() - 0.5)
        setShuffledCards(shuffled)
        processedData = memoryData
        total = memoryData.length / 2 // pairs
        break
    }

    setGameData(processedData)
    setGameProgress({ current: 0, total })
  }

  const handleAnswer = (answer: string, isCorrect: boolean) => {
    const newAnswers = [...userAnswers, answer]
    setUserAnswers(newAnswers)

    if (isCorrect) {
      setScore(prev => prev + 1)
      setShowFeedback({
        type: 'correct',
        message: '🎉 Excellent! You\'re a science superstar!'
      })
    } else {
      setShowFeedback({
        type: 'incorrect',
        message: '🌟 Great try! Keep exploring!'
      })
    }

    setGameProgress(prev => ({ ...prev, current: prev.current + 1 }))

    // Auto advance after 2 seconds
    setTimeout(() => {
      setShowFeedback(null)
      setIsFlipped(false) // Reset flip state when advancing questions
      if (currentQuestion < gameProgress.total - 1) {
        setCurrentQuestion(prev => prev + 1)
      }
    }, 2000)
  }

  const resetGame = () => {
    if (arcadeContent.length > 0) {
      loadGame(arcadeContent[selectedGameIndex], selectedGameIndex)
    }
  }

  // Crossword functions
  const handleCrosswordCellClick = (row: number, col: number) => {
    if (!arcadeContent[selectedGameIndex]?.payload?.grid[row][col]) return
    setSelectedCell({ row, col })
  }

  const handleCrosswordInput = (row: number, col: number, value: string) => {
    const key = `${row}-${col}`
    setCrosswordAnswers(prev => ({
      ...prev,
      [key]: value.toUpperCase()
    }))
  }

  const checkCrosswordCompletion = () => {
    const currentGame = arcadeContent[selectedGameIndex]
    if (!currentGame?.payload?.clues) return

    let correctAnswers = 0
    const allClues = [...currentGame.payload.clues.across, ...currentGame.payload.clues.down]
    
    allClues.forEach(clue => {
      let isCorrect = true
      const answer = clue.answer.toUpperCase()
      
      for (let i = 0; i < answer.length; i++) {
        // For across clues: row stays same, col increases
        // For down clues: row increases, col stays same
        const isAcross = currentGame.payload.clues.across.includes(clue)
        const cellKey = isAcross 
          ? `${clue.row}-${clue.col + i}` 
          : `${clue.row + i}-${clue.col}`
        
        if (crosswordAnswers[cellKey] !== answer[i]) {
          isCorrect = false
          break
        }
      }
      
      if (isCorrect) correctAnswers++
    })
    
    setScore(correctAnswers)
    setGameProgress({ current: correctAnswers, total: allClues.length })
  }

  // Word Search functions
  const handleWordSearchCellClick = (row: number, col: number) => {
    if (selectedCells.length === 0) {
      // Start selection
      setSelectedCells([{ row, col }])
      setIsSelecting(true)
    } else if (selectedCells.length === 1) {
      // Complete selection with straight line
      const startCell = selectedCells[0]
      const endCell = { row, col }
      const lineSelection = getLineBetweenCells(startCell, endCell)
      setSelectedCells(lineSelection)
      checkWordSelection(lineSelection)
      setTimeout(() => {
        setSelectedCells([])
        setIsSelecting(false)
      }, 1000)
    } else {
      // Reset selection
      setSelectedCells([{ row, col }])
      setIsSelecting(true)
    }
  }

  const getLineBetweenCells = (start: {row: number, col: number}, end: {row: number, col: number}) => {
    const cells = []
    const rowDiff = end.row - start.row
    const colDiff = end.col - start.col
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff))
    
    if (steps === 0) return [start]
    
    const rowStep = rowDiff / steps
    const colStep = colDiff / steps
    
    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: Math.round(start.row + rowStep * i),
        col: Math.round(start.col + colStep * i)
      })
    }
    
    return cells
  }

  const checkWordSelection = (cells: {row: number, col: number}[]) => {
    if (cells.length < 2) return

    const currentGame = arcadeContent[selectedGameIndex]
    if (!currentGame?.payload?.words) return

    const selectedLetters = cells.map(cell => 
      currentGame.payload.grid[cell.row][cell.col]
    ).join('')

    const reversedLetters = selectedLetters.split('').reverse().join('')

    currentGame.payload.words.forEach((wordObj: any) => {
      if ((selectedLetters === wordObj.word || reversedLetters === wordObj.word) && !foundWords.includes(wordObj.word)) {
        setFoundWords(prev => [...prev, wordObj.word])
        setScore(prev => prev + 1)
        setGameProgress(prev => ({ ...prev, current: prev.current + 1 }))
      }
    })
  }

  // Memory Game functions
  const handleMemoryCardClick = (index: number) => {
    if (!canFlip || flippedCards.includes(index) || matchedPairs.includes(shuffledCards[index].id)) return

    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setCanFlip(false)
      const [first, second] = newFlipped
      const firstCard = shuffledCards[first]
      const secondCard = shuffledCards[second]

      setTimeout(() => {
        if (firstCard.id === secondCard.id) {
          setMatchedPairs(prev => [...prev, firstCard.id])
          setScore(prev => prev + 1)
          setGameProgress(prev => ({ ...prev, current: prev.current + 1 }))
        }
        setFlippedCards([])
        setCanFlip(true)
      }, 1000)
    }
  }

  useEffect(() => {
    fetchArcadeContent()
  }, [session])

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getSubtypeIcon = (subtype: string) => {
    switch (subtype) {
      case 'QUIZ': return <Target className="h-5 w-5" />
      case 'CROSSWORD': return <BookOpen className="h-5 w-5" />
      case 'WORDSEARCH': return <Shuffle className="h-5 w-5" />
      case 'MEMORY': return <Trophy className="h-5 w-5" />
      default: return <Gamepad2 className="h-5 w-5" />
    }
  }

  const renderGameContent = () => {
    if (!gameData || gameData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Gamepad2 className="h-16 w-16 mx-auto text-purple-400/60 mb-4" />
            <p className="text-xl text-white/80">No game content available</p>
          </div>
        </div>
      )
    }

    const currentGame = arcadeContent[selectedGameIndex]
    const currentItem = gameData[currentQuestion]

    if (!currentItem) return null

    // Show completion screen
    if (currentQuestion >= gameData.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg text-center max-w-md">
            <Trophy className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Game Complete!</h3>
            <p className="text-lg text-white/80 mb-4">
              Score: {score} / {gameData.length}
            </p>
            <p className="text-white/60 mb-6">
              {score === gameData.length ? 'Perfect score! 🌟' : 
               score >= gameData.length * 0.8 ? 'Excellent work! 🎉' : 
               score >= gameData.length * 0.6 ? 'Good job! 👍' : 'Keep practicing! 💪'}
            </p>
            <Button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg px-6 py-3"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </Card>
        </div>
      )
    }

    // Render based on game type
    switch (currentGame.subtype) {
      case 'QUIZ':
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white">Question {currentQuestion + 1}</h3>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                    {currentQuestion + 1} / {gameData.length}
                  </Badge>
                </div>
                <p className="text-xl text-white leading-relaxed mb-8 min-h-[60px]">
                  {currentItem.question}
                </p>
              </div>

              {showFeedback ? (
                <div className={`text-center p-6 rounded-xl ${
                  showFeedback.type === 'correct' 
                    ? 'bg-green-500/20 border border-green-400/30' 
                    : 'bg-orange-500/20 border border-orange-400/30'
                }`}>
                  <div className={`text-4xl mb-2 ${
                    showFeedback.type === 'correct' ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {showFeedback.type === 'correct' ? <CheckCircle className="h-12 w-12 mx-auto" /> : <XCircle className="h-12 w-12 mx-auto" />}
                  </div>
                  <p className="text-xl text-white font-medium">{showFeedback.message}</p>
                  {showFeedback.type === 'incorrect' && currentItem.correctAnswer && (
                    <p className="text-lg text-white/80 mt-2">
                      Correct answer: {currentItem.correctAnswer}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentItem.options?.map((option: string, index: number) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswer(option, option === currentItem.correctAnswer)}
                      className="min-h-[60px] text-lg p-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 rounded-xl"
                      disabled={!!showFeedback}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )

      case 'CROSSWORD':
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg">
              <div className="mb-6 text-center">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                  Crossword Puzzle
                </Badge>
                <p className="text-white/70 text-sm mt-2">Click on cells to fill in answers</p>
              </div>
              
              {/* Crossword Grid - Interactive */}
              <div className="mb-6">
                <div className="grid grid-cols-10 gap-1 max-w-2xl mx-auto">
                  {arcadeContent[selectedGameIndex]?.payload?.grid?.map((row: string[], rowIndex: number) =>
                    row.map((cell: string, colIndex: number) => {
                      const cellKey = `${rowIndex}-${colIndex}`
                      const isBlank = !cell
                      const userInput = crosswordAnswers[cellKey] || ''
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                      
                      return (
                        <div
                          key={cellKey}
                          className={`aspect-square flex items-center justify-center text-sm font-bold border cursor-pointer transition-all ${
                            isBlank 
                              ? 'bg-transparent border-transparent' 
                              : isSelected
                                ? 'bg-cyan-200 text-black border-cyan-400 shadow-lg'
                                : userInput
                                  ? 'bg-green-100 text-black border-green-400'
                                  : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                          }`}
                          onClick={() => !isBlank && handleCrosswordCellClick(rowIndex, colIndex)}
                        >
                          {!isBlank && (
                            <input
                              type="text"
                              value={userInput}
                              onChange={(e) => {
                                const value = e.target.value.slice(-1).toUpperCase()
                                handleCrosswordInput(rowIndex, colIndex, value)
                                setTimeout(checkCrosswordCompletion, 100)
                              }}
                              className="w-full h-full text-center bg-transparent outline-none text-black font-bold"
                              maxLength={1}
                              onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                            />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              
              {/* Progress Display */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-semibold">
                      Completed: {score} / {gameData?.length || 0}
                    </span>
                  </div>
                  <Button
                    onClick={resetGame}
                    size="sm"
                    className="bg-purple-600/60 hover:bg-purple-600/80 text-white rounded-lg px-3 py-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
                
                {score === gameData?.length && score > 0 && (
                  <div className="mt-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                    <Trophy className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
                    <p className="text-white font-bold">Crossword Complete!</p>
                    <p className="text-green-300">All clues solved correctly!</p>
                  </div>
                )}
              </div>
              
              {/* Clues Display */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Across</h3>
                  <div className="space-y-2">
                    {arcadeContent[selectedGameIndex]?.payload?.clues?.across?.map((clue: any, index: number) => (
                      <div key={index} className="text-white/80 text-sm">
                        <span className="font-semibold text-cyan-300">{clue.number}.</span> {clue.clue}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Down</h3>
                  <div className="space-y-2">
                    {arcadeContent[selectedGameIndex]?.payload?.clues?.down?.map((clue: any, index: number) => (
                      <div key={index} className="text-white/80 text-sm">
                        <span className="font-semibold text-cyan-300">{clue.number}.</span> {clue.clue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'WORDSEARCH':
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg">
              <div className="mb-6 text-center">
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                  Word Search
                </Badge>
                <p className="text-white/70 text-sm mt-2">Click first letter, then click last letter to select a word</p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Word Search Grid */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Find the words in the grid:</h3>
                  <div className="grid grid-cols-10 gap-1 max-w-sm mx-auto">
                    {arcadeContent[selectedGameIndex]?.payload?.grid?.map((row: string[], rowIndex: number) =>
                      row.map((letter: string, colIndex: number) => {
                        const isSelected = selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex)
                        
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`aspect-square flex items-center justify-center text-sm font-bold border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-yellow-400/80 text-black border-yellow-500 shadow-lg' 
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                            onClick={() => handleWordSearchCellClick(rowIndex, colIndex)}
                          >
                            {letter}
                          </div>
                        )
                      })
                    )}
                  </div>
                  
                  {/* Progress */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                        <Target className="h-4 w-4 text-green-400" />
                        <span className="text-white font-semibold">
                          Found: {foundWords.length} / {arcadeContent[selectedGameIndex]?.payload?.words?.length || 0}
                        </span>
                      </div>
                      <Button
                        onClick={resetGame}
                        size="sm"
                        className="bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg px-3 py-1"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Words to Find */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Words to find:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {arcadeContent[selectedGameIndex]?.payload?.words?.map((wordObj: any, index: number) => {
                      const isFound = foundWords.includes(wordObj.word)
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-center font-semibold transition-all ${
                            isFound 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30 line-through scale-95' 
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {wordObj.word}
                          {isFound && <span className="ml-2">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                  
                  {foundWords.length === arcadeContent[selectedGameIndex]?.payload?.words?.length && (
                    <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-center">
                      <Trophy className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
                      <p className="text-white font-bold">Congratulations!</p>
                      <p className="text-green-300">All words found!</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )

      case 'MEMORY':
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg">
              <div className="mb-6 text-center">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                  Memory Game - Match Terms & Definitions
                </Badge>
                <p className="text-white/70 text-sm mt-2">Click cards to flip and find matching pairs</p>
              </div>
              
              {/* Progress */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                    <Trophy className="h-4 w-4 text-orange-400" />
                    <span className="text-white font-semibold">
                      Matches: {matchedPairs.length} / {(arcadeContent[selectedGameIndex]?.payload?.pairs?.length || 0) / 2}
                    </span>
                  </div>
                  <Button
                    onClick={resetGame}
                    size="sm"
                    className="bg-orange-600/60 hover:bg-orange-600/80 text-white rounded-lg px-3 py-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Memory Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {shuffledCards.map((card: any, index: number) => {
                  const isFlipped = flippedCards.includes(index)
                  const isMatched = matchedPairs.includes(card.id)
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        isMatched 
                          ? 'bg-green-500/20 border-2 border-green-400/50 scale-95' 
                          : isFlipped
                            ? 'bg-gradient-to-br from-blue-600/60 to-cyan-600/60 border-2 border-blue-400/50 scale-105'
                            : 'bg-gradient-to-br from-purple-600/60 to-pink-600/60 border-2 border-purple-400/30 hover:scale-105 hover:border-purple-400/50'
                      }`}
                      onClick={() => handleMemoryCardClick(index)}
                    >
                      <div className="h-full flex items-center justify-center text-center">
                        {isFlipped || isMatched ? (
                          <div>
                            <div className={`text-xs font-semibold mb-2 ${
                              card.type === 'term' ? 'text-yellow-300' : 'text-cyan-300'
                            }`}>
                              {card.type === 'term' ? '🏷️ Term' : '📝 Definition'}
                            </div>
                            <p className="text-white text-xs leading-tight">
                              {card.content}
                            </p>
                          </div>
                        ) : (
                          <div className="text-4xl">
                            🧠
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {matchedPairs.length === (arcadeContent[selectedGameIndex]?.payload?.pairs?.length || 0) / 2 && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-center">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
                  <p className="text-white font-bold">Excellent Memory!</p>
                  <p className="text-green-300">All pairs matched!</p>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  {flippedCards.length === 1 ? 'Select another card to find its match!' : 
                   flippedCards.length === 2 ? 'Checking for match...' :
                   'Click cards to flip and find matching pairs!'}
                </p>
              </div>
            </Card>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-white/80">Game type not supported yet</p>
          </div>
        )
    }
  }

  return (
    <VantaBackground>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - 320px width */}
        <div className="w-80 bg-black/30 backdrop-blur-lg border-r border-white/20 p-6 overflow-y-auto">
          <PageTransition>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 p-3 backdrop-blur-sm border border-purple-400/30 shadow-lg">
                  <Gamepad2 className="h-6 w-6 text-white drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]" />
                </div>
                <h1 className="text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Knowledge Arcade
                </h1>
              </div>
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-4 text-white/80 border border-white/30 bg-white/10 hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Daily Topic Display */}
            {arcadeContent.length > 0 && (
              <Card className="mb-6 p-4 rounded-xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white text-lg">Today's Topic</h3>
                </div>
                <div className="mb-3">
                  <p className="text-white font-medium">
                    {arcadeContent[0]?.topics?.title}
                  </p>
                  <p className="text-sm text-white/70">
                    {arcadeContent[0]?.topics?.study_areas?.name} • Grade {arcadeContent[0]?.topics?.grade_level}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleNewTopic}
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200"
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    New Topic
                  </Button>
                </div>
              </Card>
            )}

            {/* Games List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Available Games</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse rounded-xl border border-white/25 bg-white/12">
                      <div className="h-4 bg-white/20 rounded mb-2"></div>
                      <div className="h-3 bg-white/20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : arcadeContent.length === 0 ? (
                <Card className="p-6 text-center rounded-xl border border-white/25 bg-white/12">
                  <p className="text-white/80">No games available</p>
                  <Button 
                    onClick={() => fetchArcadeContent(true)}
                    className="mt-3 bg-purple-600/60 hover:bg-purple-600/80 text-white"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </Card>
              ) : (
                arcadeContent.map((content, index) => (
                  <Card 
                    key={content.id}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${
                      selectedGameIndex === index
                        ? 'border-purple-400/60 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                        : 'border-white/25 bg-white/12 hover:bg-white/20'
                    }`}
                    onClick={() => loadGame(content, index)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-purple-400">
                        {getSubtypeIcon(content.subtype)}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200"
                      >
                        {content.subtype}
                      </Badge>
                      {content.difficulty && (
                        <Badge className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(content.difficulty)}`}>
                          {content.difficulty}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-white font-medium text-lg mb-2 leading-tight">
                      {content.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock className="h-3 w-3" />
                      <span>
                        {content.subtype === 'QUIZ' && content.payload.questions 
                          ? `${content.payload.questions.length} questions`
                          : content.subtype === 'CROSSWORD' && content.payload.clues
                          ? `${content.payload.clues.across.length + content.payload.clues.down.length} clues`
                          : content.subtype === 'WORDSEARCH' && content.payload.words
                          ? `${content.payload.words.length} words`
                          : content.subtype === 'MEMORY' && content.payload.pairs
                          ? `${content.payload.pairs.length / 2} pairs`
                          : 'Interactive content'
                        }
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Score Display */}
            {gameProgress.total > 0 && (
              <Card className="mt-6 p-4 rounded-xl border border-white/25 bg-white/12 backdrop-blur-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-white/80">
                    <span>Score:</span>
                    <span className="font-bold text-green-400">{score} / {gameProgress.total}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Progress:</span>
                    <span>{gameProgress.current} / {gameProgress.total}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(gameProgress.current / gameProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </Card>
            )}
          </PageTransition>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <PageTransition>
            {renderGameContent()}
          </PageTransition>
        </div>
      </div>
    </VantaBackground>
  )
}