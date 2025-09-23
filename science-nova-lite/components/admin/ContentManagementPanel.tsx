"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Gamepad2,
  Compass,
  Calendar,
  User,
  BookOpen,
  Target
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'

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
  topics?: {
    id: string
    title: string
    grade_level: number
    study_areas?: {
      name: string
    }
  }
  profiles?: {
    full_name: string
  }
}

interface ContentManagementPanelProps {
  initialCategory?: 'ARCADE' | 'DISCOVERY'
  fixedCategory?: boolean // If true, prevents tab switching
  onCreateNew: (category: 'ARCADE' | 'DISCOVERY', subtype?: string) => void
  onEdit: (entry: ContentEntry) => void
  onDelete: (entryId: string) => void
}

export function ContentManagementPanel({ initialCategory = 'ARCADE', fixedCategory = false, onCreateNew, onEdit, onDelete }: ContentManagementPanelProps) {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState<'ARCADE' | 'DISCOVERY'>(initialCategory)
  const [content, setContent] = useState<ContentEntry[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('published')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  const fetchContent = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: activeTab,
        status: statusFilter,
        limit: itemsPerPage.toString(),
        offset: (currentPage * itemsPerPage).toString()
      })
      
      if (search) params.append('search', search)
      if (gradeFilter && gradeFilter !== 'all') params.append('grade', gradeFilter)
      if (subtypeFilter && subtypeFilter !== 'all') params.append('subtype', subtypeFilter)

      const response = await fetch(`/api/admin/content?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const data = await response.json()
      setContent(data.data || [])
      setTotalCount(data.total || 0)
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [activeTab, statusFilter, gradeFilter, subtypeFilter, currentPage, session])

  const handleSearch = () => {
    setCurrentPage(0)
    fetchContent()
  }

  const handleDelete = async (entryId: string) => {
    if (!session || !window.confirm('Are you sure you want to delete this content?')) return
    
    try {
      const response = await fetch(`/api/admin/content?id=${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete content')
      
      // Refresh the list
      fetchContent()
      onDelete(entryId)
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const getSubtypeOptions = (category: 'ARCADE' | 'DISCOVERY') => {
    if (category === 'ARCADE') {
      return [
        { value: 'QUIZ', label: 'Quiz' },
        { value: 'FLASHCARDS', label: 'Flashcards' },
        { value: 'GAME', label: 'Game' }
      ]
    } else {
      return [
        { value: 'FACT', label: 'Fun Fact' },
        { value: 'INFO', label: 'Information' }
      ]
    }
  }

  const renderContentCard = (entry: ContentEntry) => (
    <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {entry.category === 'ARCADE' ? (
              <Gamepad2 className="h-4 w-4 text-purple-600" />
            ) : (
              <Compass className="h-4 w-4 text-green-600" />
            )}
            <h3 className="font-semibold text-sm">{entry.title || 'Untitled'}</h3>
            <Badge variant={entry.status === 'published' ? 'default' : 'secondary'} className="text-xs">
              {entry.status}
            </Badge>
            {entry.ai_generated && (
              <Badge variant="outline" className="text-xs">AI</Badge>
            )}
          </div>
          
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {entry.subtype}
              </span>
              {entry.topics && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Grade {entry.topics.grade_level}
                </span>
              )}
              {entry.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {entry.difficulty}
                </Badge>
              )}
            </div>
            
            {entry.topics && (
              <div className="text-gray-500">
                Topic: {entry.topics.title}
                {entry.topics.study_areas && ` • ${entry.topics.study_areas.name}`}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {entry.profiles?.full_name || 'Unknown'} • 
              <Calendar className="h-3 w-3 ml-2" />
              {new Date(entry.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(entry)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(entry.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-gray-600">Manage arcade games and discovery content</p>
        </div>
        
        <div className="flex gap-2">
          {getSubtypeOptions(activeTab).map((option) => (
            <Button
              key={option.value}
              onClick={() => onCreateNew(activeTab, option.value)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'ARCADE' | 'DISCOVERY')}>
        {!fixedCategory && (
          <TabsList>
            <TabsTrigger value="ARCADE" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Arcade
            </TabsTrigger>
            <TabsTrigger value="DISCOVERY" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Discovery
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search content..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={subtypeFilter} onValueChange={setSubtypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getSubtypeOptions(activeTab).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Content List */}
          <div className="space-y-2">
            {loading ? (
              <Card className="p-8 text-center">
                <div className="animate-pulse">Loading content...</div>
              </Card>
            ) : content.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  No {activeTab.toLowerCase()} content found.
                </div>
                <Button 
                  onClick={() => onCreateNew(activeTab)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First {activeTab === 'ARCADE' ? 'Game' : 'Discovery'}
                </Button>
              </Card>
            ) : (
              content.map(renderContentCard)
            )}
          </div>

          {/* Pagination */}
          {totalCount > itemsPerPage && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalCount)} of {totalCount} items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={(currentPage + 1) * itemsPerPage >= totalCount}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}