"use client"

import { useEffect, useState } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, 
  Search, 
  PenSquare, 
  Trash2, 
  ExternalLink, 
  BarChart3, 
  BookOpen,
  FileText,
  Users,
  Eye,
  Clock,
  Globe
} from "lucide-react"

type Lesson = { 
  id: string
  title: string
  topic: string | null
  grade_level: number | null
  status: 'draft'|'published'
  updated_at: string 
}

export default function AdminLessons() {
  const { session } = useAuth()
  const confirmDialog = useConfirm()
  const [drafts, setDrafts] = useState<Lesson[]>([])
  const [published, setPublished] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'saved' | 'published'>('saved')
  const [offset, setOffset] = useState(0)
  const limit = 10

  const fetchLessons = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = session.access_token
      const qs = (status: string) => `/api/lessons?status=${status}&search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`
      const [dRes, pRes] = await Promise.all([
        fetch(qs('draft'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(qs('published'), { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const dJson = await dRes.json()
      const pJson = await pRes.json()
      setDrafts(dJson.lessons || [])
      setPublished(pJson.lessons || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchLessons() 
  }, [session, search, offset])

  const onDelete = async (id: string) => {
    if (!session) return
    const confirm = await confirmDialog({
      title: 'Delete lesson?',
      description: 'This action cannot be undone.',
      actionText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })
    if (!confirm) return
    
    const token = session.access_token
    const prevDrafts = drafts
    const prevPublished = published
    
    // Optimistic update
    setDrafts(prevDrafts.filter(l => l.id !== id))
    setPublished(prevPublished.filter(l => l.id !== id))
    
    const res = await fetch('/api/lessons', { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
      body: JSON.stringify({ id }) 
    })
    const json = await res.json()
    
    if (!res.ok) {
      setDrafts(prevDrafts)
      setPublished(prevPublished)
      toast({ title: 'Delete failed', description: json?.error || 'Could not delete the lesson.', variant: 'destructive' })
      return
    }
    
    const t = toast({
      title: 'Lesson deleted',
      description: 'The lesson was removed.',
      variant: 'success',
      action: (
        <ToastAction altText="Undo" onClick={() => {
          setDrafts(prevDrafts)
          setPublished(prevPublished)
          t.dismiss()
          toast({ title: 'Delete undone', description: 'The lesson was restored locally.', variant: 'info' })
        }}>Undo</ToastAction>
      )
    })
  }

  const currentLessons = activeTab === 'saved' ? drafts : published

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50"
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
      }}
    >
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
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
                href="/admin/lessons"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <BookOpen className="h-4 w-4" /> Lessons Manager
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">Lessons Manager</h1>
                <p className="mt-2 max-w-3xl text-base text-indigo-900/70 md:text-lg">
                  Manage your saved drafts and published lessons. Create engaging science lessons with interactive elements.
                </p>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-blue-900">{drafts.length}</div>
                    <div className="text-sm text-blue-700">Saved Drafts</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-green-900">{published.length}</div>
                    <div className="text-sm text-green-700">Published Lessons</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-purple-900">{drafts.length + published.length}</div>
                    <div className="text-sm text-purple-700">Total Lessons</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-orange-900">0</div>
                    <div className="text-sm text-orange-700">Student Views</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/admin/lessons/builder"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 px-6 py-4 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium"
                >
                  <Plus className="h-5 w-5" /> Create New Lesson
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/content"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Content Manager</div>
                  <div className="text-sm text-white/90">Manage arcade & discovery</div>
                </div>
              </Link>
              
              <Link
                href="/admin/students"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">View Students</div>
                  <div className="text-sm text-white/90">Monitor progress</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Tabbed Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex rounded-2xl border bg-white/70 p-1 backdrop-blur shadow-lg">
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                    activeTab === 'saved'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Saved Drafts ({drafts.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('published')}
                  className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                    activeTab === 'published'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Published ({published.length})
                  </div>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                  value={search} 
                  onChange={(e) => { setOffset(0); setSearch(e.target.value) }} 
                  placeholder="Search lessons..." 
                  className="h-11 w-80 rounded-xl border border-white/25 bg-white/70 pl-10 pr-4 text-sm shadow-sm backdrop-blur placeholder:text-gray-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <Card className="border-white/20 bg-white/70 backdrop-blur">
            <CardContent className="p-0">
              {loading && (
                <div className="p-8 text-center">
                  <div className="text-gray-500">Loading lessons...</div>
                </div>
              )}
              
              {!loading && currentLessons.length === 0 && (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-gray-500 text-lg font-medium mb-2">
                    No {activeTab === 'saved' ? 'saved drafts' : 'published lessons'} found
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    {activeTab === 'saved' 
                      ? 'Create your first lesson draft to get started'
                      : 'Publish some lessons to see them here'
                    }
                  </div>
                  <Link href="/admin/lessons/builder">
                    <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Lesson
                    </Button>
                  </Link>
                </div>
              )}
              
              {!loading && currentLessons.length > 0 && (
                <div className="divide-y divide-gray-200/50">
                  {currentLessons.map((lesson) => (
                    <div key={lesson.id} className="p-6 hover:bg-white/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lesson.title || 'Untitled Lesson'}
                            </h3>
                            {activeTab === 'published' && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                <Globe className="h-3 w-3 mr-1" />
                                Live
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Grade {lesson.grade_level ?? '-'}</span>
                            <span>•</span>
                            <span>Updated {new Date(lesson.updated_at).toLocaleDateString()}</span>
                            {lesson.topic && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">{lesson.topic}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {activeTab === 'published' && (
                            <Link 
                              href={`/lessons/${lesson.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Live
                            </Link>
                          )}
                          <Link 
                            href={`/admin/lessons/builder?id=${lesson.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <PenSquare className="h-4 w-4" />
                            Edit
                          </Link>
                          <button 
                            onClick={() => onDelete(lesson.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && currentLessons.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {currentLessons.length} {activeTab === 'saved' ? 'drafts' : 'published lessons'}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={offset === 0} 
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="bg-white/70 backdrop-blur"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  className="bg-white/70 backdrop-blur"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="text-center mt-8">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                ← Back to Admin Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
