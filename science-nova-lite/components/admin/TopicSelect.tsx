"use client"

import { useEffect, useState } from "react"

interface Topic {
  id: string
  title: string
  grade_level: string | null
  study_area: string
  vanta_effect: string
}

interface TopicSelectProps {
  value: string
  onChange: (topicId: string) => void
  className?: string
  gradeFilter?: number
}

export function TopicSelect({ value, onChange, className, gradeFilter }: TopicSelectProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '200' })
        if (gradeFilter) {
          params.set('grade', gradeFilter.toString())
        }
        
        const res = await fetch(`/api/topics?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setTopics(data.items || [])
        }
      } catch (error) {
        console.error('Failed to load topics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [gradeFilter])

  // Clear selected topic if it's not available for the current grade
  useEffect(() => {
    if (value && topics.length > 0) {
      const selectedTopic = topics.find(t => t.id === value)
      if (!selectedTopic) {
        onChange('') // Clear selection if topic not found for current grade
      }
    }
  }, [value, topics, onChange])

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
    >
      <option value="">
        {loading ? 'Loading topics...' : 'Select a topic'}
      </option>
      {topics.map((topic) => (
        <option key={topic.id} value={topic.id}>
          {topic.title} {topic.grade_level ? `(Grade ${topic.grade_level})` : ''}
        </option>
      ))}
    </select>
  )
}