"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import Link from "next/link"
import { 
  Compass, Plus, Search, Filter, Edit, Trash2, Eye, 
  BarChart3, BookOpen, FileText, Rocket, Users, Settings,
  MoreHorizontal, Calendar, Tag, Archive, CheckCircle, Gamepad2
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface DiscoveryContent {
  id: string
  title: string
  type: 'virtual-lab' | 'field-study' | 'research-project' | 'case-study'
  status: 'draft' | 'published'
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string
}

export default function DiscoveryManagerPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryContent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'virtual-lab' | 'field-study' | 'research-project' | 'case-study'>('all')

  // Mock data for now - replace with actual API call
  useEffect(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setDiscoveryItems([
        {
          id: '1',
          title: 'Ocean Ecosystem Virtual Lab',
          type: 'virtual-lab',
          status: 'published',
          category: 'Marine Biology',
          tags: ['ecosystems', 'marine-life'],
          created_at: '2025-09-20T10:00:00Z',
          updated_at: '2025-09-21T15:30:00Z',
          created_by: 'teacher@example.com'
        },
        {
          id: '2',
          title: 'Local Wildlife Field Study',
          type: 'field-study',
          status: 'draft',
          category: 'Environmental Science',
          tags: ['wildlife', 'observation'],
          created_at: '2025-09-22T09:15:00Z',
          updated_at: '2025-09-22T09:15:00Z',
          created_by: 'teacher@example.com'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredItems = discoveryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: discoveryItems.length,
    published: discoveryItems.filter(item => item.status === 'published').length,
    drafts: discoveryItems.filter(item => item.status === 'draft').length,
    virtualLabs: discoveryItems.filter(item => item.type === 'virtual-lab').length,
    fieldStudies: discoveryItems.filter(item => item.type === 'field-study').length,
    researchProjects: discoveryItems.filter(item => item.type === 'research-project').length,
    caseStudies: discoveryItems.filter(item => item.type === 'case-study').length
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual-lab': return '🧪'
      case 'field-study': return '🌿'
      case 'research-project': return '🔬'
      case 'case-study': return '📊'
      default: return '🔍'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'virtual-lab': return 'bg-blue-100 text-blue-700'
      case 'field-study': return 'bg-green-100 text-green-700'
      case 'research-project': return 'bg-purple-100 text-purple-700'
      case 'case-study': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

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
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BarChart3 className="h-4 w-4"/>Dashboard</Link>
              <Link href="/admin/lessons" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BookOpen className="h-4 w-4"/> Lessons Manager</Link>
              <Link href="/admin/documents" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><FileText className="h-4 w-4"/> Textbooks & Curriculum</Link>
              <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Rocket className="h-4 w-4"/> Content Manager</Link>
              <Link href="/admin/arcade" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Gamepad2 className="h-4 w-4"/> Arcade Manager</Link>
              <Link href="/admin/discovery" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-3 py-2 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-200 hover:from-green-500/15 hover:to-emerald-500/15"><Compass className="h-4 w-4"/> Discovery Manager</Link>
              <RoleGuard allowed={["ADMIN", "DEVELOPER"]}>
                <Link href="/admin/topics" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Settings className="h-4 w-4"/> Topics Manager</Link>
                <Link href="/admin/students" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Users className="h-4 w-4"/> Students</Link>
              </RoleGuard>
            </div>
          </div>

          {/* Header Section */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 p-8 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                  <Compass className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Discovery Manager</h1>
                  <p className="text-gray-600 mt-1">Design explorative and investigative activities for hands-on learning experiences.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/discovery/create"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-500 px-6 py-3 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" /> Create New Activity
                </Link>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6">
              <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                <div className="text-2xl font-bold text-green-700">{stats.total}</div>
                <div className="text-green-600 text-sm">Total Activities</div>
              </div>
              <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                <div className="text-2xl font-bold text-emerald-700">{stats.published}</div>
                <div className="text-emerald-600 text-sm">Published</div>
              </div>
              <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                <div className="text-2xl font-bold text-orange-700">{stats.drafts}</div>
                <div className="text-orange-600 text-sm">Drafts</div>
              </div>
              <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                <div className="text-2xl font-bold text-blue-700">{stats.virtualLabs}</div>
                <div className="text-blue-600 text-sm">Virtual Labs</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/discovery/create?type=virtual-lab"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">🧪</span>
                <div className="text-left">
                  <div className="font-medium">Create Virtual Lab</div>
                  <div className="text-sm text-white/90">Simulated experiments</div>
                </div>
              </Link>
              
              <Link
                href="/admin/discovery/create?type=field-study"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">🌿</span>
                <div className="text-left">
                  <div className="font-medium">Create Field Study</div>
                  <div className="text-sm text-white/90">Outdoor exploration</div>
                </div>
              </Link>
              
              <Link
                href="/admin/discovery/create?type=research-project"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">🔬</span>
                <div className="text-left">
                  <div className="font-medium">Create Research Project</div>
                  <div className="text-sm text-white/90">Independent inquiry</div>
                </div>
              </Link>
              
              <Link
                href="/admin/discovery/create?type=case-study"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">📊</span>
                <div className="text-left">
                  <div className="font-medium">Create Case Study</div>
                  <div className="text-sm text-white/90">Real-world scenarios</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 rounded-2xl border bg-white/70 p-4 backdrop-blur shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-80 rounded-xl border border-gray-200 bg-white/80 pl-10 pr-4 text-sm backdrop-blur placeholder:text-gray-500 focus:border-green-300 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 rounded-xl border border-gray-200 bg-white/80 px-3 text-sm backdrop-blur focus:border-green-300 focus:ring-2 focus:ring-green-200"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="h-10 rounded-xl border border-gray-200 bg-white/80 px-3 text-sm backdrop-blur focus:border-green-300 focus:ring-2 focus:ring-green-200"
                >
                  <option value="all">All Types</option>
                  <option value="virtual-lab">Virtual Labs</option>
                  <option value="field-study">Field Studies</option>
                  <option value="research-project">Research Projects</option>
                  <option value="case-study">Case Studies</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Discovery Activities</h3>
              <div className="text-sm text-gray-500">
                {filteredItems.length} of {discoveryItems.length} activities
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-xl border bg-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gray-200"></div>
                          <div>
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Compass className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first discovery activity"}
                </p>
                <Link
                  href="/admin/discovery/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Create First Activity
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-white/50 p-4 hover:bg-white/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-2xl">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}>
                              {item.type.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {item.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'published' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <Archive className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-gray-400 hover:bg-red-100 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
