"use client"

import { useState } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { ContentManagementPanel } from "@/components/admin/ContentManagementPanel"
import { DiscoveryEditor } from "@/components/admin/DiscoveryEditor"
import { Card } from "@/components/ui/card"
import { Compass } from "lucide-react"
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

export default function DiscoveryPage() {
  const { session } = useAuth()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<'FACT' | 'INFO'>('FACT')

  const handleCreateNew = (category: 'ARCADE' | 'DISCOVERY', subtype?: string) => {
    if (category === 'DISCOVERY' && subtype) {
      setSelectedSubtype(subtype as 'FACT' | 'INFO')
      setEditingEntry(null)
      setEditorOpen(true)
    }
  }

  const handleEdit = (entry: ContentEntry) => {
    setEditingEntry(entry)
    setSelectedSubtype(entry.subtype as 'FACT' | 'INFO')
    setEditorOpen(true)
  }

  const handleSave = async (data: any) => {
    if (!session) return

    try {
      const url = editingEntry 
        ? `/api/admin/discovery` 
        : `/api/admin/discovery`
      
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

      if (!response.ok) throw new Error('Failed to save discovery content')

      setEditorOpen(false)
      setEditingEntry(null)
      // Refresh will happen automatically in ContentManagementPanel
    } catch (error) {
      console.error('Error saving discovery content:', error)
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
              <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Discovery Management</h1>
            </div>
            <p className="text-gray-600">
              Create and manage fun facts and discovery content for your students.
            </p>
          </div>

          <ContentManagementPanel 
            initialCategory="DISCOVERY"
            fixedCategory={true}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <DiscoveryEditor
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
