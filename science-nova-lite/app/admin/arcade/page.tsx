"use client"

import { useState } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { ContentManagementPanel } from "@/components/admin/ContentManagementPanel"
import { ArcadeEditor } from "@/components/admin/ArcadeEditor"
import { Card } from "@/components/ui/card"
import { Gamepad2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ContentEntry {
  id: string
  topic_id: string
  category: 'ARCADE' | 'DISCOVERY'
  subtype: string
  title: string
  payload: any
  difficulty?: string
  status: 'draft' | 'published' | 'deleted'
  created_by: string
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export default function ArcadePage() {
  const { session } = useAuth()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<'QUIZ' | 'FLASHCARDS' | 'GAME'>('QUIZ')

  const handleCreateNew = (category: 'ARCADE' | 'DISCOVERY', subtype?: string) => {
    if (category === 'ARCADE' && subtype) {
      setSelectedSubtype(subtype as 'QUIZ' | 'FLASHCARDS' | 'GAME')
      setEditingEntry(null)
      setEditorOpen(true)
    }
  }

  const handleEdit = (entry: ContentEntry) => {
    setEditingEntry(entry)
    setSelectedSubtype(entry.subtype as 'QUIZ' | 'FLASHCARDS' | 'GAME')
    setEditorOpen(true)
  }

  const handleSave = async (data: any) => {
    if (!session) return

    try {
      const url = editingEntry 
        ? `/api/admin/arcade` 
        : `/api/admin/arcade`
      
      const method = editingEntry ? 'PUT' : 'POST'
      const payload = editingEntry 
        ? { ...data, id: editingEntry.id }
        : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save arcade content')

      setEditorOpen(false)
      setEditingEntry(null)
      // Refresh will happen automatically in ContentManagementPanel
    } catch (error) {
      console.error('Error saving arcade content:', error)
    }
  }

  const handleDelete = (entryId: string) => {
    // Handle delete confirmation and refresh
    console.log('Deleted entry:', entryId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Arcade Management</h1>
            </div>
            <p className="text-gray-600">
              Create and manage interactive games, quizzes, and flashcards for your students.
            </p>
          </div>

          <ContentManagementPanel 
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <ArcadeEditor
            subtype={selectedSubtype}
            initialData={editingEntry}
            onSave={handleSave}
            onCancel={() => setEditorOpen(false)}
            open={editorOpen}
          />
        </main>
      </RoleGuard>
    </div>
  )
}
