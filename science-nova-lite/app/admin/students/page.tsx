"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/layout/role-guard"
import Link from "next/link"
import { 
  Search, 
  Users, 
  Calendar, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  User,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Student = {
  id: string
  email: string
  name: string
  grade_level: number | null
  role: string
  created_at: string
  last_sign_in_at: string | null
  avatar_url: string | null
}

type StudentListResponse = {
  students: Student[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function StudentsPage() {
  const { session } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchStudents = async () => {
    if (!session) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search })
      })

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', response.status, errorText)
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const data: StudentListResponse = await response.json()
      setStudents(data.students)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [session, pagination.page, sortBy, sortOrder])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchStudents()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getActivityStatus = (lastSignIn: string | null) => {
    if (!lastSignIn) return { label: "Never active", color: "bg-gray-500" }
    
    const daysSinceLastActivity = Math.floor(
      (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastActivity === 0) return { label: "Active today", color: "bg-green-500" }
    if (daysSinceLastActivity <= 7) return { label: "Active this week", color: "bg-blue-500" }
    if (daysSinceLastActivity <= 30) return { label: "Active this month", color: "bg-yellow-500" }
    return { label: "Inactive", color: "bg-red-500" }
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
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <Users className="h-4 w-4" /> Students
              </Link>
            </div>
          </div>

          {/* Page header */}
          <div className="mb-6 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">Student Management</h1>
                <p className="mt-2 max-w-3xl text-base text-indigo-900/70 md:text-lg">
                  View and analyze all student accounts, their activity, and progress reports. Monitor engagement and academic performance.
                </p>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-blue-900">{pagination.totalCount}</div>
                    <div className="text-sm text-blue-700">Total Students</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-green-900">
                      {students.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-green-700">Active This Week</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-purple-900">
                      {students.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-purple-700">Active Today</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-orange-900">
                      {students.filter(s => !s.last_sign_in_at).length}
                    </div>
                    <div className="text-sm text-orange-700">Never Signed In</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur">
                  <Download className="h-5 w-5 mr-2" />
                  Export Data
                </Button>
                <Link href="/admin/lessons/builder">
                  <Button className="bg-gradient-to-tr from-indigo-500 to-sky-500 hover:brightness-105 transition-all hover:shadow-xl text-white">
                    <User className="h-5 w-5 mr-2" />
                    View Student Reports
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/lessons"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
              >
                <BookOpen className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Lessons Manager</div>
                  <div className="text-sm text-white/90">View lesson engagement</div>
                </div>
              </Link>
              
              <button className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl">
                <Download className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-white/90">Download student reports</div>
                </div>
              </button>
              
              <Link
                href="/admin/reports"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-sm text-white/90">Weekly activity reports</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Filters and search */}
          <div className="mb-6 rounded-2xl border bg-white/70 p-4 backdrop-blur shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Joined</SelectItem>
                    <SelectItem value="last_sign_in_at">Last Activity</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="grade_level">Grade Level</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>

          {/* Students table */}
          <div className="rounded-2xl border bg-white/70 backdrop-blur overflow-hidden shadow-lg">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading students...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const activity = getActivityStatus(student.last_sign_in_at)
                      return (
                        <TableRow key={student.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={student.avatar_url || undefined} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              Grade {student.grade_level || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${activity.color}`} />
                              <span className="text-sm">{activity.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(student.last_sign_in_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(student.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/students/${student.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t bg-gray-50/50 px-6 py-3">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} students
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm font-medium">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
