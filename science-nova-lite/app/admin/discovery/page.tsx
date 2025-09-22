"use client"

import { RoleGuard } from "@/components/layout/role-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Compass, Plus } from "lucide-react"

export default function DiscoveryPage() {
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
              Create and manage exploratory activities and interactive discovery experiences.
            </p>
          </div>

          <Card className="p-8 text-center">
            <Compass className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discovery Activities Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              Interactive exploration tools, research activities, and discovery-based learning experiences will be available here.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Activity
            </Button>
          </Card>
        </main>
      </RoleGuard>
    </div>
  )
}
