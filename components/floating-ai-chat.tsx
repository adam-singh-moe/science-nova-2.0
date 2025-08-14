"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Send, X, MessageCircle, Loader2, BookOpen, Minimize2, Maximize2, Lightbulb, Beaker, Atom, Microscope, Zap } from "lucide-react"
import { theme } from "@/lib/theme"
import Link from "next/link"
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
}

interface FloatingAIChatProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

interface FloatingChatSettings {
  enabled: boolean
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  autoOpen: boolean
}

export function FloatingAIChat({ position: propPosition }: FloatingAIChatProps) {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [settings, setSettings] = useState<FloatingChatSettings>({
    enabled: true,
    position: propPosition || "bottom-right",
    autoOpen: false,
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('floating-chat-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
        
        // Auto-open if enabled
        if (parsed.autoOpen && pathname !== '/ai-scientist') {
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Failed to parse floating chat settings:', error)
      }
    }
  }, [pathname])

  // Force fresh state on user/profile changes
  useEffect(() => {
    console.log("🔄 User or profile changed, resetting chat state")
    setMessages([])
    setInputMessage("")
    setIsLoading(false)
  }, [user?.id, profile?.grade_level])

  // Initialize welcome message with user context
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: "welcome-" + Date.now() + "-" + Math.random(),
        content: user && profile 
          ? `Hi ${profile.full_name?.split(" ")[0] || 'there'}! I'm Professor Nova, your AI Science Assistant! 🤖 I'm here to help Grade ${profile.grade_level || 5} students with quick science questions. Ask me anything or click "Full Chat" for more features!`
          : `Hi there! I'm Professor Nova, your friendly AI Science Assistant! 🤖 Ask me a quick science question or click "Full Chat" for more features!`,
        sender: "ai" as const,
        timestamp: new Date(),
      }
      console.log("🎯 Setting fresh welcome message:", welcomeMessage.id)
      setMessages([welcomeMessage])
    }
  }, [messages.length, user, profile])

  // Function to clear chat and start fresh
  const clearChatHistory = () => {
    console.log("🧹 Clearing chat history and starting fresh")
    clearAIChatCaches() // Use the debug utility
    setMessages([])
    setInputMessage("")
    setIsLoading(false)
    // Force re-render
    setTimeout(() => {
      setMessages([])
    }, 100)
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Don't render if on AI Scientist page or disabled in settings
  if (pathname === '/ai-scientist' || !settings.enabled) {
    return null
  }

  // Position classes based on settings
  const getPositionClasses = () => {
    switch (settings.position) {
      case "bottom-left":
        return "bottom-4 left-4"
      case "top-right":
        return "top-4 right-4"
      case "top-left":
        return "top-4 left-4"
      default:
        return "bottom-4 right-4"
    }
  }

  // Generate grade-appropriate suggested questions
  const getGradeAppropriateQuestions = (gradeLevel: number) => {
    if (gradeLevel <= 2) {
      return [
        {
          category: "Living Things",
          questions: [
            "What do plants need to grow?",
            "What do animals eat?",
            "How do we take care of pets?",
          ]
        },
        {
          category: "My Body", 
          questions: [
            "Why do I need to eat food?",
            "What makes my heart beat?",
            "Why do I have teeth?",
          ]
        },
        {
          category: "Weather",
          questions: [
            "Why does it rain?",
            "What makes it sunny?",
            "Why is it cold in winter?",
          ]
        }
      ]
    } else if (gradeLevel <= 5) {
      return [
        {
          category: "Biology",
          questions: [
            "How do plants make their own food?",
            "How do our bodies digest food?",
            "Why do animals hibernate?",
          ]
        },
        {
          category: "Physics", 
          questions: [
            "Why do objects fall down?",
            "How do magnets work?",
            "What makes things float?",
          ]
        },
        {
          category: "Earth Science",
          questions: [
            "What makes the weather change?",
            "How are rocks formed?",
            "What are the phases of the moon?",
          ]
        }
      ]
    } else if (gradeLevel <= 8) {
      return [
        {
          category: "Life Science",
          questions: [
            "How do cells divide and grow?",
            "What is photosynthesis?",
            "How does the circulatory system work?",
          ]
        },
        {
          category: "Physical Science", 
          questions: [
            "What is the difference between mass and weight?",
            "How do chemical reactions work?",
            "What are the states of matter?",
          ]
        },
        {
          category: "Earth Science",
          questions: [
            "How are mountains and valleys formed?",
            "What causes earthquakes?",
            "How does the water cycle work?",
          ]
        }
      ]
    } else {
      return [
        {
          category: "Biology",
          questions: [
            "How does DNA replication work?",
            "What is genetic inheritance?",
            "How do ecosystems maintain balance?",
          ]
        },
        {
          category: "Chemistry", 
          questions: [
            "What are chemical bonds?",
            "How do acids and bases interact?",
            "What is the periodic table?",
          ]
        },
        {
          category: "Physics",
          questions: [
            "What is Newton's laws of motion?",
            "How does electricity work?",
            "What is electromagnetic radiation?",
          ]
        }
      ]
    }
  }

  const suggestedQuestions = getGradeAppropriateQuestions(6) // Default to grade 6

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Prevent duplicate requests
    if (isLoading) {
      console.log("⏳ Request already in progress, ignoring duplicate")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString() + "-" + Math.random(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage("")
    setIsLoading(true)

    try {
      // Create unique request to prevent caching
      const requestData = {
        message: currentMessage,
        userId: user?.id || "demo-user-001",
        gradeLevel: profile?.grade_level || 5,
        learningPreference: profile?.learning_preference || "visual",
        timestamp: Date.now(),
        requestId: Date.now() + "-" + Math.random() // Unique request ID
      }

      console.log("🚀 Sending AI chat request:", {
        ...requestData,
        message: requestData.message.substring(0, 50) + "..."
      })

      // Clear any browser cache for this endpoint
      const cacheKey = `/api/ai-chat-${requestData.requestId}`
      
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
        cache: "no-store", // Force no caching
        body: JSON.stringify(requestData),
      })

      console.log("📡 Received response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error Response:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("📦 Received AI response data:", {
        hasResponse: !!data.response,
        responseLength: data.response?.length,
        hasTextbookContent: data.relevantContentFound,
        gradeLevel: data.gradeLevel,
        contentSources: data.contentSources,
        isUnique: !data.response?.includes("Science is amazing, isn't it?")
      })

      if (data.error) {
        console.error("❌ API returned error:", data.error)
        throw new Error(data.error)
      }

      // Validate that we received a proper response
      if (!data.response || typeof data.response !== 'string') {
        console.error("❌ Invalid response format:", data)
        throw new Error("Invalid response format from API")
      }

      // Check for fallback responses that shouldn't appear for real users
      if (data.response.includes("Science is amazing, isn't it?") && 
          requestData.userId !== "demo-user-001") {
        console.warn("⚠️ Received unexpected fallback response for real user")
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
      }

      console.log("✅ Adding AI response to messages:", aiResponse.id)
      
      // Force state update with new message
      setMessages((prev) => {
        const newMessages = [...prev, aiResponse]
        console.log("📝 Updated messages count:", newMessages.length)
        return newMessages
      })

    } catch (error) {
      console.error("💥 Error in handleSendMessage:", error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString() + "-error",
        content: `I'm having trouble connecting right now. Please try clearing your browser cache or refreshing the page. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="group relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="floating-chat-button w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 border-2 border-white/30 shadow-xl text-white transition-all duration-300 relative overflow-hidden"
            aria-label="Open AI Science Assistant"
          >
            {/* Single animated Bot icon */}
            <Bot className="h-6 w-6 text-white animate-pulse-fast" />
          </Button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900/90 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
              Ask your AI Scientist! 🧪
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`w-80 ${isMinimized ? 'h-12' : 'h-96'} bg-card/80 backdrop-blur-xl border-2 border-purple-200/50 shadow-2xl transition-all duration-300 floating-chat-window overflow-hidden`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4">
              <Atom className="h-8 w-8 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="absolute top-8 right-6">
              <Microscope className="h-6 w-6 text-purple-500 opacity-60" />
            </div>
            <div className="absolute bottom-8 left-6">
              <Beaker className="h-7 w-7 text-cyan-500 opacity-40" />
            </div>
          </div>
          
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-t-lg p-3 flex-shrink-0 relative overflow-hidden">
            {/* Animated header background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <CardTitle className="text-white flex items-center gap-2 text-sm font-semibold">
                <div className="relative">
                  <Microscope className="h-4 w-4 text-white" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                AI Lab Assistant
                <Badge variant="outline" className="border-white/30 text-white text-xs bg-white/10 backdrop-blur-sm">
                  Grade 6
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChatHistory}
                  className="h-6 w-6 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                  title="Clear chat history"
                >
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3 text-white" />
                  ) : (
                    <Minimize2 className="h-3 w-3 text-white" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                >
                  <X className="h-3 w-3 text-white" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="flex-1 flex flex-col p-2 min-h-0">
              {/* Chat Messages */}
              <ScrollArea className="h-44 pr-2 mb-3 floating-chat-scroll-area">
                <div className="space-y-3 pb-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${
                          message.sender === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {/* Enhanced avatar with scientific theme */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg flex-shrink-0 relative overflow-hidden ${
                            message.sender === "user" 
                              ? "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-300" 
                              : "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 border-cyan-300"
                          }`}
                        >
                          {/* Animated background for AI */}
                          {message.sender === "ai" && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse"></div>
                          )}
                          
                          {message.sender === "user" ? (
                            <User className="h-3.5 w-3.5 text-white relative z-10" />
                          ) : (
                            <div className="relative z-10">
                              <Bot className="h-3.5 w-3.5 text-white animate-pulse-fast" />
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced message bubble */}
                        <div
                          className={`rounded-2xl p-3 shadow-lg border break-words min-w-0 relative backdrop-blur-sm ${
                            message.sender === "user"
                              ? "bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 text-white rounded-tr-md border-purple-300/50"
                              : "bg-gradient-to-br from-white/90 via-cyan-50/70 to-blue-50/90 text-gray-800 rounded-tl-md border-cyan-200/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                          }`}
                        >
                          {/* Subtle pattern overlay for AI messages */}
                          {message.sender === "ai" && (
                            <div className="absolute inset-0 opacity-5">
                              <div className="absolute top-1 right-2">
                                <Atom className="h-3 w-3 text-blue-500" />
                              </div>
                            </div>
                          )}
                          
                          <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words relative z-10 ${
                            message.sender === "user" ? "text-white" : "text-gray-800"
                          }`}>
                            {message.content}
                          </p>
                          
                          {/* Enhanced textbook content indicator */}
                          {message.sender === "ai" && message.hasTextbookContent && (
                            <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/60 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse"></div>
                              <div className="relative z-10 flex items-center gap-1.5">
                                <div className="relative">
                                  <BookOpen className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                                </div>
                                <span className="text-xs text-emerald-700 font-medium">
                                  🧪 Grade {message.gradeLevel} Lab Data
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <p className={`text-xs opacity-70 mt-2 relative z-10 ${
                            message.sender === "user" ? "text-white/80" : "text-gray-500"
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start animate-in slide-in-from-bottom-2 duration-300">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 border-2 border-cyan-300 flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse"></div>
                        <div className="relative z-10">
                          <Bot className="h-3.5 w-3.5 text-white animate-pulse-fast" />
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-white/90 to-blue-50/90 border border-blue-200/50 rounded-2xl rounded-tl-md p-3 shadow-lg backdrop-blur-sm relative">
                        <div className="absolute inset-0 opacity-5">
                          <Atom className="absolute top-1 right-2 h-3 w-3 text-blue-500 animate-spin" />
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">Scanning my knowledge-banks...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="space-y-1.5">
                {/* Enhanced Suggested Questions Tabs */}
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-1 mb-1 animate-in slide-in-from-bottom-1 duration-500">
                    {suggestedQuestions.slice(0, 2).flatMap((category, catIndex) => 
                      category.questions.slice(0, 2).map((question, index) => (
                        <Button
                          key={`${category.category}-${index}`}
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-white/10 text-xs px-3 py-1 hover:bg-white/20 transition-all duration-300 hover:scale-105 border-white/20 text-gray-700 hover:text-gray-800 backdrop-blur-sm shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          onClick={() => setInputMessage(question)}
                        >
                          <span className="font-medium">
                            {question.length > 18 ? `${question.substring(0, 18)}...` : question}
                          </span>
                        </Button>
                      ))
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1 min-w-0 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="🧪 Ask your science question..."
                      className="bg-gradient-to-r from-white/90 to-blue-50/90 border-2 border-blue-200/60 text-gray-800 text-xs h-8 rounded-xl backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 placeholder:text-gray-500"
                      disabled={isLoading}
                    />
                    {/* Input decoration */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Microscope className="h-3 w-3 text-blue-400 opacity-60" />
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-br from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 border-0 rounded-full h-8 w-8 p-0 flex-shrink-0 shadow-lg hover:scale-105 hover:rotate-12 transition-all duration-300 relative overflow-hidden group"
                  >
                    {isLoading ? (
                      <Bot className="h-3.5 w-3.5 text-white animate-pulse-fast" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-white rotate-45" />
                    )}
                  </Button>
                </div>
                
                {/* Enhanced Full Chat Link */}
                <Link href="/ai-scientist">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200/60 text-blue-700 hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 rounded-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group backdrop-blur-sm"
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex items-center justify-center gap-1.5">
                      <Beaker className="h-3 w-3" />
                      <span className="font-medium">Open Lab Console</span>
                      <Zap className="h-2.5 w-2.5 opacity-60" />
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
