"use client"

import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Search, Settings } from "lucide-react"

export default function ContentManagerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
                <p className="text-gray-600 mt-1">Manage arcade games and discovery activities</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500 text-white">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-purple-900">Arcade Games</CardTitle>
                    <CardDescription className="text-purple-700">
                      Create and manage interactive learning games
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/admin/arcade" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Manage Arcade Games
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-100/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-green-900">Discovery Activities</CardTitle>
                    <CardDescription className="text-green-700">
                      Design explorative and investigative activities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/admin/discovery" className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Manage Discovery Activities
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
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