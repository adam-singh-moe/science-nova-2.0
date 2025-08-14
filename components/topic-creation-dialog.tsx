"use client"

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface TopicCreationDialogProps {
  onTopicCreated?: () => void
  triggerButton?: React.ReactNode
}

interface StudyArea {
  id: string
  name: string
  vanta_effect: string
}

export function TopicCreationDialog({ onTopicCreated, triggerButton }: TopicCreationDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([])
  const [formData, setFormData] = useState({
    title: "",
    gradeLevel: "",
    adminPrompt: "",
    studyAreaIds: [] as string[]
  })

  const fetchStudyAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('study_areas')
        .select('*')
        .order('name')

      if (error) throw error
      setStudyAreas(data || [])
    } catch (error) {
      console.error('Error fetching study areas:', error)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      fetchStudyAreas()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to create topics",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: formData.title,
          grade_level: parseInt(formData.gradeLevel),
          admin_prompt: formData.adminPrompt || null,
          study_area_ids: formData.studyAreaIds
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create topic')
      }

      const data = await response.json()
      
      toast({
        title: "Topic created successfully",
        description: `"${formData.title}" has been added to Grade ${formData.gradeLevel}`,
      })

      // Reset form
      setFormData({
        title: "",
        gradeLevel: "",
        adminPrompt: "",
        studyAreaIds: []
      })

      setIsOpen(false)
      onTopicCreated?.()

    } catch (error) {
      console.error('Error creating topic:', error)
      toast({
        title: "Error creating topic",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStudyAreaToggle = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      studyAreaIds: prev.studyAreaIds.includes(areaId)
        ? prev.studyAreaIds.filter(id => id !== areaId)
        : [...prev.studyAreaIds, areaId]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="flex items-center gap-2 h-12">
            <Plus className="h-4 w-4" />
            Create Topic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>
              Add a new science topic for students to explore
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Topic Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., The Water Cycle"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adminPrompt">Admin Prompt (Optional)</Label>
              <Textarea
                id="adminPrompt"
                value={formData.adminPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, adminPrompt: e.target.value }))}
                placeholder="Special instructions for AI when discussing this topic..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Study Areas</Label>
              <div className="grid grid-cols-2 gap-2">
                {studyAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`area-${area.id}`}
                      checked={formData.studyAreaIds.includes(area.id)}
                      onChange={() => handleStudyAreaToggle(area.id)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`area-${area.id}`} className="text-sm">
                      {area.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
