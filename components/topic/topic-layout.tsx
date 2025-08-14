import { MissionComplete } from "@/components/topic/mission-complete"

interface TopicLayoutProps {
  children: React.ReactNode
  topicTitle: string
  grade: string
  area: string
}

export function TopicLayout({ children, topicTitle, grade, area }: TopicLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
      
      {/* Mission Complete component at the bottom */}
      <MissionComplete
        topicTitle={topicTitle}
        grade={grade}
        area={area}
        onComplete={() => {
          // Optional: Track completion analytics
          console.log(`Topic completed: ${topicTitle}`)
        }}
      />
    </div>
  )
}
