"use client"

import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'DEVELOPER'

export function hasAccess(userRole: Role | null | undefined, allowed: Role[] | "ANY_AUTH") {
  if (!userRole) return false
  if (allowed === "ANY_AUTH") return true
  // Developers have full access; Admins also full in this app
  if (userRole === 'DEVELOPER' || userRole === 'ADMIN') return true
  return allowed.includes(userRole)
}

export function RoleGuard({ allowed, children }: { allowed: Role[] | "ANY_AUTH"; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user || !profile || !hasAccess(profile.role as Role, allowed)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Access restricted</h2>
          <p className="text-gray-600 mb-4">You don’t have permission to view this page.</p>
          <Link href="/" className="text-blue-600 underline">Go back home</Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
