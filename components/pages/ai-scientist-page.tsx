"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Send, Sparkles, Loader2, BookOpen, Lightbulb, Rocket, Volume2, VolumeX } from "lucide-react"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import { clearAIChatCaches } from "@/lib/ai-chat-debug"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  hasTextbookContent?: boolean
  contentSources?: number
  textbookSources?: string[]
  gradeLevel?: number
  images?: string[]
}

// Mock user data for demo (fallback when not authenticated)
const mockProfile = {
  full_name: "Science Explorer",
  grade_level: 5,
  learning_preference: "Visual"
}

export function AIScientistPage() {
  const { user, profile, loading } = useAuth()
  
  // Use real user data if available, otherwise fall back to mock data for demo
  const currentProfile = profile ? {
    full_name: profile.full_name || user?.email?.split('@')[0] || "Science Explorer",
    grade_level: profile.grade_level || 5,
    learning_preference: profile.learning_preference || "Visual"
  } : mockProfile

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<Array<{category: string, questions: string[]}>>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [isReadingAloud, setIsReadingAloud] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize welcome message and reset on profile changes
  useEffect(() => {
    console.log("🔄 AI Scientist: Initializing with profile:", currentProfile)
    const welcomeMessage = {
      id: "welcome-" + Date.now() + "-" + Math.random(),
      content: `Hello ${currentProfile.full_name?.split(" ")[0] || "there"}! I'm Professor Nova, your friendly AI Science Assistant! 🤖✨ I'm here to help you explore amazing science topics perfect for Grade ${currentProfile.grade_level} students. I have access to tons of cool science facts and textbook content to give you the best answers. What exciting science mystery would you like to solve today?`,
      sender: "ai" as const,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    setInputMessage("")
    setIsLoading(false)
  }, [currentProfile.grade_level, user?.id]) // Reset when grade level or user changes

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Text-to-speech handler for AI messages
  const handleReadAloud = (messageContent: string) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser')
      return
    }

    if (isReadingAloud) {
      // Stop current speech
      window.speechSynthesis.cancel()
      setIsReadingAloud(false)
    } else {
      // Start reading the message content
      const utterance = new SpeechSynthesisUtterance(messageContent)
      utterance.rate = 0.8 // Slightly slower for better comprehension
      utterance.pitch = 1.0
      utterance.volume = 0.8
      
      // Handle speech events
      utterance.onstart = () => {
        setIsReadingAloud(true)
      }
      
      utterance.onend = () => {
        setIsReadingAloud(false)
      }
      
      utterance.onerror = () => {
        setIsReadingAloud(false)
        console.warn('Speech synthesis error occurred')
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Prevent duplicate requests
    if (isLoading) {
      console.log("⏳ AI Scientist: Request already in progress, ignoring duplicate")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString() + "-" + Math.random(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentMessage = inputMessage // Store the message before clearing
    setInputMessage("")
    setIsLoading(true)

    try {
      // Add enhanced logging and cache prevention with unique request ID
      // Include conversation history for context (last 5 messages to keep it manageable)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      }))

      const requestData = {
        message: currentMessage,
        userId: user?.id || "demo-user-001",
        gradeLevel: currentProfile.grade_level,
        learningPreference: currentProfile.learning_preference,
        conversationHistory: conversationHistory,
        timestamp: Date.now(),
        requestId: Date.now() + "-" + Math.random(),
        source: "ai-scientist-page"
      }

      console.log("🚀 AI Scientist sending request:", {
        ...requestData,
        message: requestData.message.substring(0, 50) + "..."
      })

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "X-Requested-With": "XMLHttpRequest",
          "X-Request-ID": requestData.requestId.toString()
        },
        cache: "no-store",
        body: JSON.stringify(requestData),
      })

      console.log("📡 AI Scientist received response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ AI Scientist API Error:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("📦 AI Scientist received data:", {
        hasResponse: !!data.response,
        responseLength: data.response?.length,
        hasTextbookContent: data.relevantContentFound,
        gradeLevel: data.gradeLevel,
        contentSources: data.contentSources,
        imagesGenerated: data.images?.length || 0,
        isUnique: !data.response?.includes("Science is amazing, isn't it?")
      })

      if (data.error) {
        console.error("❌ AI Scientist API returned error:", data.error)
        throw new Error(data.error)
      }

      // Validate response
      if (!data.response || typeof data.response !== 'string') {
        console.error("❌ AI Scientist Invalid response format:", data)
        throw new Error("Invalid response format from API")
      }

      // Check for unexpected fallback responses
      if (data.response.includes("Science is amazing, isn't it?") && 
          requestData.userId !== "demo-user-001") {
        console.warn("⚠️ AI Scientist: Received unexpected fallback response for real user")
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString() + "-" + Math.random(),
        content: data.response,
        sender: "ai",
        timestamp: new Date(),
        hasTextbookContent: data.relevantContentFound,
        contentSources: data.contentSources,
        textbookSources: data.textbookSources,
        gradeLevel: data.gradeLevel,
        images: data.images || []
      }

      console.log("✅ AI Scientist adding response to messages:", aiResponse.id)
      setMessages((prev) => {
        const newMessages = [...prev, aiResponse]
        console.log("📝 AI Scientist updated messages count:", newMessages.length)
        return newMessages
      })
    } catch (error) {
      console.error("💥 AI Scientist Error sending message:", error)
      
      // Add error message for user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm sorry, I'm having trouble connecting right now. Please try again in a moment! Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Function to clear chat and start fresh
  const clearChatHistory = () => {
    console.log("🧹 AI Scientist: Clearing chat history and starting fresh")
    clearAIChatCaches() // Use the debug utility
    setMessages([])
    setInputMessage("")
    setIsLoading(false)
    
    // Reinitialize with fresh welcome message
    setTimeout(() => {
      const welcomeMessage = {
        id: "welcome-fresh-" + Date.now() + "-" + Math.random(),
        content: `Hello ${currentProfile.full_name?.split(" ")[0] || "there"}! I'm Professor Nova, your friendly AI Science Assistant! 🤖✨ I'm here to help you explore amazing science topics perfect for Grade ${currentProfile.grade_level} students. I have access to tons of cool science facts and textbook content. What exciting science mystery would you like to solve today?`,
        sender: "ai" as const,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }, 100)
  }

  // Load suggested questions based on student's textbook content
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      if (!currentProfile.grade_level) return
      
      setQuestionsLoading(true)
      try {
        console.log(`📋 Loading suggested questions for Grade ${currentProfile.grade_level}...`)
        
        const response = await fetch(`/api/suggested-questions?gradeLevel=${currentProfile.grade_level}&userId=${user?.id || 'demo'}`)
        const data = await response.json()
        
        if (data.success && data.questions) {
          setSuggestedQuestions(data.questions)
          console.log(`✅ Loaded ${data.questions.length} question categories`, data.cached ? '(cached)' : '(fresh)')
        } else {
          console.warn('Failed to load suggested questions, using fallback')
          setSuggestedQuestions(getDefaultQuestions(currentProfile.grade_level))
        }
      } catch (error) {
        console.error('Error loading suggested questions:', error)
        setSuggestedQuestions(getDefaultQuestions(currentProfile.grade_level))
      } finally {
        setQuestionsLoading(false)
      }
    }
    
    loadSuggestedQuestions()
  }, [currentProfile.grade_level, user?.id])

  // Fallback questions if API fails
  const getDefaultQuestions = (gradeLevel: number) => {
    if (gradeLevel <= 2) {
      return [
        {
          category: "Science Questions",
          questions: [
            "What do plants need to grow?",
            "What do animals eat?",
            "How do we take care of pets?",
            "Why do I need to eat food?",
            "What makes my heart beat?",
            "Why do I have teeth?",
            "Why does it rain?",
            "What makes it sunny?",
            "Why is it cold in winter?",
          ]
        }
      ]
    } else if (gradeLevel <= 5) {
      return [
        {
          category: "Science Questions",
          questions: [
            "How do plants make their own food?",
            "How do our bodies digest food?",
            "Why do animals hibernate?",
            "Why do objects fall down?",
            "How do magnets work?",
            "What makes things float?",
            "What makes the weather change?",
            "How are rocks formed?",
            "What are the phases of the moon?",
          ]
        }
      ]
    } else {
      return [
        {
          category: "Science Questions",
          questions: [
            "How do cells divide and grow?",
            "What is photosynthesis?",
            "How does the circulatory system work?",
            "What is the difference between mass and weight?",
            "How do chemical reactions work?",
            "What are the states of matter?",
            "How are mountains formed?",
            "What causes earthquakes?",
            "How does the water cycle work?",
          ]
        }
      ]
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text ${theme.gradient.header} mb-2 flex items-center gap-3`}
          >
            <Bot className={`h-8 w-8 md:h-10 md:w-10 ${theme.icon.accent}`} />
            Professor Nova 🤖
          </h1>
          <p className={`${theme.text.secondary} text-base md:text-lg`}>
            Your friendly AI Science Assistant! Ask me anything about science and I'll explain it in a way that matches your learning style.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Chat Interface */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <Card
              className={`backdrop-blur-lg border-2 border-transparent bg-clip-border bg-gradient-to-br from-purple-500 to-cyan-500 ${theme.background.card} h-[70vh] md:h-[75vh] flex flex-col ai-chat-container`}
            >
              <CardHeader className={`${theme.background.primary} rounded-t-lg flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`${theme.text.primary} flex items-center gap-2 text-lg font-heading`}>
                    <Bot className={`h-5 w-5 ${theme.icon.primary}`} />
                    Professor Nova 🤖
                    <Badge variant="outline" className={`ml-2 ${theme.border.accent} ${theme.text.accent} text-xs`}>
                      Grade {currentProfile.grade_level || 3} Ready
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChatHistory}
                    className="h-8 w-8 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                    title="Clear chat history and start fresh"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 min-h-0">
                <ScrollArea className="flex-1 pr-2 mb-4 min-h-0 ai-chat-scroll-area">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 md:gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {/* AI message - add glowing robot icon */}
                        {message.sender === "ai" && (
                          <Bot className="text-accent animate-pulse-fast h-5 w-5 mt-1 flex-shrink-0" />
                        )}
                        
                        <div
                          className={`flex gap-2 md:gap-3 max-w-[85%] ai-chat-message ${
                            message.sender === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${theme.border.primary} border shadow-sm flex-shrink-0 ${
                              message.sender === "user" ? theme.gradient.primary : theme.gradient.secondary
                            }`}
                          >
                            {message.sender === "user" ? (
                              <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            ) : (
                              <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`rounded-2xl p-3 shadow-sm border break-words min-w-0 ai-chat-message ${
                              message.sender === "user"
                                ? `bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-none`
                                : `bg-white/20 backdrop-blur-md border-white/20 ${theme.text.primary} rounded-tl-none`
                            }`}
                          >
                            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content.replace(/\[IMAGE_(\d+)\]/g, (match, index) => {
                                // Replace image placeholders with actual display
                                const imageIndex = parseInt(index)
                                return message.images && message.images[imageIndex] 
                                  ? `` // We'll handle this in the images section below
                                  : match
                              })}
                            </p>
                            
                            {/* Display generated images */}
                            {message.sender === "ai" && message.images && message.images.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.images.map((imageUrl, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={imageUrl}
                                      alt={`Educational illustration ${index + 1}`}
                                      className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                                      style={{ maxHeight: '300px' }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                      🤖 AI Generated
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Show textbook content indicator for AI messages */}
                            {message.sender === "ai" && message.hasTextbookContent && (
                              <div className="flex flex-col gap-1 mt-2 p-2 rounded-md bg-blue-50/50 border border-blue-200/50">
                                <div className="flex items-center gap-1">
                                  <BookOpen className={`h-3 w-3 ${theme.icon.accent} flex-shrink-0`} />
                                  <span className={`text-xs ${theme.text.muted} font-medium break-words`}>
                                    📚 Grade {message.gradeLevel} textbook content ({message.contentSources} source{message.contentSources !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {message.textbookSources && message.textbookSources.length > 0 && (
                                  <div className="text-xs text-gray-600 ml-4 break-words">
                                    Sources: {message.textbookSources.join(", ")}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Read Aloud Button for AI messages */}
                            {message.sender === "ai" && (
                              <div className="flex justify-end mt-2">
                                <Button
                                  onClick={() => handleReadAloud(message.content)}
                                  size="sm"
                                  variant="ghost"
                                  className={`h-6 w-6 p-0 rounded-full transition-all duration-200 hover:bg-white/20 ${
                                    isReadingAloud ? 'text-accent' : 'text-gray-400 hover:text-white'
                                  }`}
                                  title={isReadingAloud ? "Stop reading aloud" : "Read message aloud"}
                                >
                                  {isReadingAloud ? (
                                    <VolumeX className="h-3 w-3" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            <p className={`text-xs opacity-70 mt-2 ${theme.text.muted}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 md:gap-3 justify-start">
                        <Bot className="text-accent animate-pulse-fast h-5 w-5 mt-1 flex-shrink-0" />
                        
                        <div
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${theme.gradient.secondary} flex items-center justify-center ${theme.border.primary} border shadow-sm flex-shrink-0`}
                        >
                          <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                        <div className={`bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 shadow-sm ai-chat-message`}>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                            <span className={`${theme.text.secondary} text-xs md:text-sm`}>Scanning my knowledge-banks...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="flex gap-2 items-end flex-shrink-0 ai-chat-input-container">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about science..."
                      className={`${theme.input.background} ${theme.input.border} border-2 ${theme.input.text} ${theme.input.placeholder} rounded-lg text-sm focus:border-accent focus:shadow-[0_0_15px_hsl(var(--accent))]`}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`${theme.button.primary} ${theme.border.primary} border rounded-full w-12 h-12 p-0 flex-shrink-0 hover:rotate-12 transition-transform duration-300`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Questions */}
          <div className="xl:col-span-1 order-1 xl:order-2 space-y-4">
            <Card className="bg-white/95 border-gray-300 border-2">
              <CardHeader className="pb-3">
                <CardTitle className={`${theme.text.primary} text-base md:text-lg flex items-center gap-2`}>
                  <Lightbulb className={`h-4 w-4 md:h-5 md:w-5 ${theme.icon.warning}`} />
                  Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Loading personalized questions...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedQuestions.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="space-y-2">
                        <Badge 
                          variant="outline" 
                          className={`${theme.border.accent} ${theme.text.accent} text-xs font-medium`}
                        >
                          {category.category}
                        </Badge>
                        <div className="space-y-1">
                          {category.questions.map((question, questionIndex) => (
                          <Button
                            key={`${categoryIndex}-${questionIndex}`}
                            variant="ghost"
                            size="sm"
                            className={`w-full text-left justify-start h-auto p-2 text-xs rounded-full bg-white/10 border border-white/20 hover:bg-white/20 ${theme.text.secondary} transition-all duration-200 ai-suggested-question`}
                            onClick={() => setInputMessage(question)}
                          >
                            <span className="leading-relaxed text-wrap break-words">{question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Profile */}
            <Card className="bg-white/95 border-gray-300 border-2">
              <CardHeader className="pb-3">
                <CardTitle className={`${theme.text.primary} text-base md:text-lg flex items-center gap-2`}>
                  <Sparkles className={`h-4 w-4 md:h-5 md:w-5 ${theme.icon.warning}`} />
                  Your Learning Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs md:text-sm ${theme.text.secondary}`}>Grade Level:</span>
                  <Badge className={`${theme.gradient.primary} text-white text-xs`}>
                    Grade {currentProfile.grade_level || 3}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs md:text-sm ${theme.text.secondary}`}>Learning Style:</span>
                  <Badge variant="outline" className={`${theme.border.accent} ${theme.text.accent} text-xs`}>
                    {currentProfile.learning_preference || 'Visual'}
                  </Badge>
                </div>
                <div className={`text-xs ${theme.text.muted} mt-3 p-2 rounded ${theme.background.transparent}`}>
                  I adapt my explanations to match your learning style and grade level. I also use textbook content to ensure accuracy!
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
