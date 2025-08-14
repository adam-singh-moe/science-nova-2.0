"use client"

import { useState, useEffect } from "react"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { FloatingAIChat } from "@/components/floating-ai-chat"
import { Home, BookOpen, Sparkles, Bot } from "lucide-react"
import { motion } from "framer-motion"

interface ExplorerHUDProps {
  topicTitle: string
  studyAreaName: string
  gradeLevel: number
}

export function ExplorerHUD({ topicTitle, studyAreaName, gradeLevel }: ExplorerHUDProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showAIChat, setShowAIChat] = useState(false)

  useEffect(() => {
    const calculateScrollProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(Math.min(Math.max(scrollPercent, 0), 100))
    }

    window.addEventListener('scroll', calculateScrollProgress, { passive: true })
    calculateScrollProgress()

    return () => window.removeEventListener('scroll', calculateScrollProgress)
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 border-b-2 border-white/20 shadow-2xl">
        <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Breadcrumb>
                  <BreadcrumbList className="text-white/90">
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/topics" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium">
                        <Home className="h-4 w-4" />
                        Topics
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-white/60" />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/topics" className="text-white/80 hover:text-white transition-colors font-medium">
                        {studyAreaName}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-white/60" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-white font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                        {topicTitle}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex-1 max-w-xs">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-white/80 flex-shrink-0" />
                  <div className="flex-1">
                    <Progress value={scrollProgress} className="h-3 bg-white/20 border border-white/30 rounded-full overflow-hidden" />
                  </div>
                  <span className="text-xs font-bold text-white/90 min-w-[3rem] text-right">
                    {Math.round(scrollProgress)}%
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setShowAIChat(true)} className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-900 font-bold px-4 py-2 rounded-full shadow-lg border-2 border-amber-300 hover:border-amber-200 transition-all duration-300">
                    <Bot className="h-4 w-4 mr-2" />
                    <Sparkles className="h-4 w-4 mr-1" />
                    Ask Professor Nova
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      {showAIChat && (
        <FloatingAIChat position="bottom-right" />
      )}
    </>
  )
}
