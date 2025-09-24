"use client"

import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Search, Settings, BarChart3, FileText, Plus, Rocket, BookOpen, Users, Eye } from "lucide-react"

export default function ContentManagerPage() {
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
                href="/admin/content"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <Rocket className="h-4 w-4" /> Content Manager
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">Content Manager</h1>
                <p className="mt-2 max-w-3xl text-base text-indigo-900/70 md:text-lg">
                  Create and manage interactive learning experiences. Design arcade games for engagement and discovery content including fun facts and educational info.
                </p>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4 shadow-lg">
                    <div className="text-2xl font-bold text-purple-900">0</div>
                    <div className="text-sm text-purple-700">Arcade Games</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4 shadow-lg">
                    <div className="text-2xl font-bold text-green-900">0</div>
                    <div className="text-sm text-green-700">Discovery Content</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4 shadow-lg">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-sm text-blue-700">Total Interactions</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4 shadow-lg">
                    <div className="text-2xl font-bold text-orange-900">0</div>
                    <div className="text-sm text-orange-700">Content Items</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/admin/content/arcade"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 px-6 py-4 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium"
                >
                  <Plus className="h-5 w-5" /> Create Game
                </Link>
                <Link
                  href="/admin/content/discovery"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-green-500 to-teal-500 px-6 py-4 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium"
                >
                  <Plus className="h-5 w-5" /> Create Fun Fact & Info
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/lessons/builder"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Create New Lesson</div>
                  <div className="text-sm text-white/90">Build interactive lessons</div>
                </div>
              </Link>
              
              <Link
                href="/admin/documents"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Upload Content</div>
                  <div className="text-sm text-white/90">Add textbooks & resources</div>
                </div>
              </Link>
              
              <Link
                href="/admin/students"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Manage Students</div>
                  <div className="text-sm text-white/90">View student progress</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Content Types Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <Settings className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">Content Types</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Arcade Games Card */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-md transition-all shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                      <Gamepad2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-purple-900">Arcade Games</CardTitle>
                      <CardDescription className="text-purple-700">
                        Create interactive learning games like crosswords, word searches, and quizzes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-purple-900 text-base">Crosswords</div>
                      <div className="text-purple-700 mt-1">Interactive puzzles for learning</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-purple-900 text-base">Word Search</div>
                      <div className="text-purple-700 mt-1">Find hidden words and terms</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-purple-900 text-base">Quizzes</div>
                      <div className="text-purple-700 mt-1">Multiple choice assessments</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-purple-900 text-base">Memory Games</div>
                      <div className="text-purple-700 mt-1">Match and remember challenges</div>
                    </div>
                  </div>
                  <Link href="/admin/content/arcade" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Manage Arcade Games
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Discovery Activities Card */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-100/50 hover:shadow-md transition-all shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white">
                      <Search className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-green-900">Discovery Content</CardTitle>
                      <CardDescription className="text-green-700">
                        Create engaging fun facts and educational info content for learning
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-green-900 text-base">Fun Facts</div>
                      <div className="text-green-700 mt-1">Interesting and engaging facts to spark curiosity and wonder</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-6">
                      <div className="font-medium text-green-900 text-base">Infos</div>
                      <div className="text-green-700 mt-1">Educational information content for comprehensive learning</div>
                    </div>
                  </div>
                  <Link href="/admin/content/discovery" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white">
                      <Search className="h-4 w-4 mr-2" />
                      Manage Discovery Content
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center">
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