"use client"

import { RoleGuard } from "@/components/layout/role-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Plus } from "lucide-react"

export default function ArcadePage() {
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

          <Card className="p-8 text-center">
            <Gamepad2 className="h-16 w-16 mx-auto text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Arcade Games Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              Interactive quiz games, flashcard systems, and educational arcade experiences will be available here.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Game
            </Button>
          </Card>
        </main>
      </RoleGuard>
    </div>
  )
}
