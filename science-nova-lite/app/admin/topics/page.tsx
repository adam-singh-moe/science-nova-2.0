"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/layout/role-guard"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { BarChart3, BookOpen, Plus, Edit2, Trash2 } from "lucide-react"

interface Topic {
  id: string
  title: string
  grade_level: number
  admin_prompt: string
  creator_id: string
  created_at: string
  updated_at: string
}

export default function TopicsAdminPage() {
  const { session } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    grade_level: 3,
    admin_prompt: ''
  })

  // Load topics
  useEffect(() => {
    if (!session) return
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/topics', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setTopics(data.topics || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error loading data',
        description: 'Please refresh the page to try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the topic title.',
        variant: 'warning'
      })
      return
    }

    try {
      const url = editingTopic ? `/api/admin/topics/${editingTopic.id}` : '/api/admin/topics'
      const method = editingTopic ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Operation failed')
      }

      toast({
        title: editingTopic ? 'Topic updated' : 'Topic created',
        description: `"${formData.title}" has been ${editingTopic ? 'updated' : 'created'} successfully.`,
        variant: 'success'
      })

      // Reset form and reload
      setFormData({ title: '', grade_level: 3, admin_prompt: '' })
      setEditingTopic(null)
      setShowCreateDialog(false)
      loadData()
    } catch (error: any) {
      toast({
        title: editingTopic ? 'Update failed' : 'Creation failed',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setFormData({
      title: topic.title,
      grade_level: topic.grade_level,
      admin_prompt: topic.admin_prompt || ''
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (topic: Topic) => {
    if (!confirm(`Are you sure you want to delete "${topic.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Delete failed')
      }

      toast({
        title: 'Topic deleted',
        description: `"${topic.title}" has been deleted successfully.`,
        variant: 'success'
      })

      loadData()
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({ title: '', grade_level: 3, admin_prompt: '' })
    setEditingTopic(null)
    setShowCreateDialog(false)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50"
        style={{
          backgroundImage:
            "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading topics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50 font-sans antialiased text-gray-800"
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
      }}
    >
      <RoleGuard allowed={["ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Admin navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/admin/topics"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <BookOpen className="h-4 w-4" /> Topics
              </Link>
            </div>
          </div>

          {/* Page header */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl tracking-tight">Topics Management</h1>
                <p className="mt-2 max-w-3xl text-base text-indigo-900/70 md:text-lg">
                  Manage topics that organize lessons and content across the platform.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-white">{topics.length}</div>
                  <div className="text-white/80 text-sm">Total Topics</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-white">
                    {new Set(topics.map(topic => topic.grade_level)).size}
                  </div>
                  <div className="text-white/80 text-sm">Grade Levels</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-white">
                    {topics.filter(topic => topic.admin_prompt).length}
                  </div>
                  <div className="text-white/80 text-sm">With Prompts</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-white">
                    {topics.filter(topic => topic.created_at && new Date(topic.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <div className="text-white/80 text-sm">Recent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Create Topic</div>
                  <div className="text-sm text-white/90">Add a new topic</div>
                </div>
              </button>
              
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <BookOpen className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Grade Coverage</div>
                  <div className="text-sm text-white/90">{new Set(topics.map(topic => topic.grade_level)).size} grades covered</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <BarChart3 className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Content Health</div>
                  <div className="text-sm text-white/90">{Math.round((topics.filter(t => t.admin_prompt).length / topics.length || 0) * 100)}% have prompts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">All Topics</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700">
                <Plus className="h-4 w-4" />
                New Topic
              </Button>
            </div>

            {/* Topics Grid */}
            {topics.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-2xl bg-gray-50/50 p-8 max-w-md mx-auto">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No topics found</p>
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                    Create your first topic
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/70 rounded-2xl shadow-lg overflow-hidden backdrop-blur border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Topic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200">
                      {topics.map((topic) => (
                        <tr key={topic.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                              {topic.admin_prompt && (
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {topic.admin_prompt}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Grade {topic.grade_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(topic.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(topic)}
                                className="flex items-center gap-1 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(topic)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-lg backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingTopic ? 'Edit Topic' : 'Create New Topic'}
              </DialogTitle>
              <DialogDescription>
                {editingTopic 
                  ? 'Update the topic details below.'
                  : 'Add a new topic to organize lessons and content.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Earth & Ocean Facts"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6].map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Prompt
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Optional prompt to guide content generation for this topic..."
                  rows={3}
                  value={formData.admin_prompt}
                  onChange={(e) => setFormData({ ...formData, admin_prompt: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used by AI helpers when generating content for this topic
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </RoleGuard>
    </div>
  )
}
