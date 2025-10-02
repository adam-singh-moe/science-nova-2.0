"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import Link from "next/link"
import { 
  Compass, Plus, Search, Filter, Edit, Trash2, Eye, 
  BarChart3, BookOpen, FileText, Rocket, Users, Settings,
  MoreHorizontal, Calendar, Tag, Archive, CheckCircle, ArrowRight, ArrowLeft
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface DiscoveryContent {
  id: string
  title: string
  type: 'fun-fact' | 'info'
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'fun-fact' | 'info'>('all')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DiscoveryContent | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DiscoveryContent | null>(null)

  // Fetch discovery content from API
  useEffect(() => {
    const fetchDiscoveryContent = async () => {
      if (!session) return
      
      setLoading(true)
      try {
        const params = new URLSearchParams({
          category: 'DISCOVERY',
          limit: '100'
        })
        
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (typeFilter !== 'all') params.append('content_type', typeFilter.toUpperCase())
        
        const response = await fetch(`/api/admin/content?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch discovery content')
        
        const data = await response.json()
        const content = (data.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          type: (item.content_type || item.subtype || '').toLowerCase().replace('_', '-'),
          status: item.status,
          category: item.topics?.title || 'Unknown',
          tags: [], // TODO: Add tags support if needed
          created_at: item.created_at,
          updated_at: item.updated_at,
          created_by: item.profiles?.full_name || item.created_by
        }))
        
        setDiscoveryItems(content)
        
        // Show success toast only on initial load (when there's no existing data)
        if (content.length > 0 && discoveryItems.length === 0) {
          toast({
            title: "Content Loaded",
            description: `Successfully loaded ${content.length} discovery item${content.length === 1 ? '' : 's'}`,
            variant: "default"
          })
        } else if (content.length === 0 && discoveryItems.length === 0) {
          toast({
            title: "No Content Found",
            description: "No discovery content found. Create your first content to get started!",
            variant: "default"
          })
        }
      } catch (error) {
        console.error('Error fetching discovery content:', error)
        setDiscoveryItems([])
        toast({
          title: "Loading Error",
          description: "Failed to load discovery content. Please refresh the page.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDiscoveryContent()
  }, [session, statusFilter, typeFilter])

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
    funFacts: discoveryItems.filter(item => item.type === 'fun-fact').length,
    infos: discoveryItems.filter(item => item.type === 'info').length
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fun-fact': return '�'
      case 'info': return 'ℹ️'
      default: return '🔍'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fun-fact': return 'bg-blue-100 text-blue-700'
      case 'info': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Handle view item
  const handleViewItem = (item: DiscoveryContent) => {
    setSelectedItem(item)
    setViewModalOpen(true)
  }

  // Handle edit item
  const handleEditItem = (item: DiscoveryContent) => {
    // Navigate to edit page with item data
    const editUrl = `/admin/content/discovery/create?type=${item.type}&edit=${item.id}`
    toast({
      title: "Redirecting to Editor",
      description: `Opening "${item.title}" for editing...`,
      variant: "default"
    })
    window.location.href = editUrl
  }

  // Handle delete item
  const handleDeleteItem = (item: DiscoveryContent) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform this action",
        variant: "destructive"
      })
      return
    }

    // Show custom confirmation dialog
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!itemToDelete || !session) return

    try {
      const response = await fetch(`/api/admin/content?id=${itemToDelete.id}&category=DISCOVERY`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      // Remove item from local state
      setDiscoveryItems(prev => prev.filter(i => i.id !== itemToDelete.id))
      
      // Show success message
      toast({
        title: "Success",
        description: `"${itemToDelete.title}" has been deleted successfully`,
        variant: "default"
      })
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      })
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
          {/* Child navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50">
                <BarChart3 className="h-4 w-4"/>
                Dashboard
              </Link>
              <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50">
                <Rocket className="h-4 w-4"/> 
                Content Manager
              </Link>
              <ArrowRight className="h-4 w-4 text-gray-400 animate-pulse" />
              <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-3 py-2 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-200">
                <Compass className="h-4 w-4"/> 
                Discovery Manager
              </span>
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

            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 space-y-4">
              {/* Primary Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-green-700">{stats.total}</div>
                  <div className="text-green-600 text-sm">Total Content</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-emerald-700">{stats.published}</div>
                  <div className="text-emerald-600 text-sm">Published</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="text-2xl font-bold text-orange-700">{stats.drafts}</div>
                  <div className="text-orange-600 text-sm">Drafts</div>
                </div>
              </div>
              
              {/* Content Type Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-md bg-white/20 rounded-xl p-4 border border-white/30 shadow-lg">
                  <div className="text-xl font-bold text-blue-700">{stats.funFacts}</div>
                  <div className="text-blue-600 text-sm">Fun Facts</div>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-xl p-4 border border-white/30 shadow-lg">
                  <div className="text-xl font-bold text-green-700">{stats.infos}</div>
                  <div className="text-green-600 text-sm">Infos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Fun Fact & Info */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Fun Fact & Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/content/discovery/create?type=fun-fact"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">💡</span>
                <div className="text-left">
                  <div className="font-medium">Create Fun Fact</div>
                  <div className="text-sm text-white/90">Interesting and engaging facts</div>
                </div>
              </Link>
              
              <Link
                href="/admin/content/discovery/create?type=info"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">ℹ️</span>
                <div className="text-left">
                  <div className="font-medium">Create Info</div>
                  <div className="text-sm text-white/90">Educational information content</div>
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
                    placeholder="Search content..."
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
                  <option value="fun-fact">Fun Facts</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Discovery Content</h3>
              <div className="text-sm text-gray-500">
                {filteredItems.length} of {discoveryItems.length} items
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first fun fact or info"}
                </p>
                <Link
                  href="/admin/content/discovery/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Create First Content
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
                          <button 
                            onClick={() => handleViewItem(item)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="View content"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditItem(item)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Edit content"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-100 hover:text-red-600"
                            title="Delete content"
                          >
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

          {/* Back to Content Manager Link */}
          <div className="mt-6 text-center">
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Content Manager
            </Link>
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirmOpen && itemToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl">
                {/* Dialog Header */}
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Confirm Delete</h3>
                      <p className="text-red-100 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Dialog Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete this discovery activity?
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(itemToDelete.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{itemToDelete.title}</h4>
                        <p className="text-sm text-gray-500">{itemToDelete.type.replace('-', ' ')} • {itemToDelete.category}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialog Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(false)
                      setItemToDelete(null)
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Activity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Modal */}
          {viewModalOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="max-w-2xl w-full mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(selectedItem.type)}</span>
                      <div>
                        <h3 className="text-xl font-bold">{selectedItem.title}</h3>
                        <p className="text-green-100 text-sm">
                          {selectedItem.type.replace('-', ' ')} • {selectedItem.category}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="text-white/80 hover:text-white text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          selectedItem.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedItem.status === 'published' ? (
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
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <div className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(selectedItem.type)}`}>
                          {selectedItem.type.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="mt-1 text-gray-900">{selectedItem.category}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="mt-1 text-gray-900">{new Date(selectedItem.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created By</label>
                        <p className="mt-1 text-gray-900">{selectedItem.created_by}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="mt-1 text-gray-900">{new Date(selectedItem.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-b-2xl">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Close
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setViewModalOpen(false)
                        handleEditItem(selectedItem)
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </RoleGuard>
      <Toaster />
    </div>
  )
}