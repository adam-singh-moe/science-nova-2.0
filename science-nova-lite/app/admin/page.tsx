"use client"

import { RoleGuard } from "@/components/layout/role-guard"
// Admin pages use a neutral background; no Vanta here
import Link from "next/link"

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-4">Admin</h1>
          <p className="text-gray-600 mb-8">Create and manage lessons.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/lessons/builder" className="block border rounded-xl p-6 bg-white/60 hover:bg-white/80 transition">
              <h2 className="text-xl font-semibold">New Lesson</h2>
              <p className="text-gray-600">Open the Lesson Builder (drag-and-drop).</p>
            </Link>
            <Link href="/admin/lessons" className="block border rounded-xl p-6 bg-white/60 hover:bg-white/80 transition">
              <h2 className="text-xl font-semibold">All Lessons</h2>
              <p className="text-gray-600">Browse drafts and published lessons.</p>
            </Link>
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
