"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock } from "lucide-react"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPage() {
  const { user, profile, loading } = useAuth()

  const isAdmin = profile?.role === 'ADMIN' || user?.email === 'adamsingh017@gmail.com' || user?.email === 'admin@sciencenova.com' || false
  const isAuthenticated = !!user

  if (loading) {
    return (
      <>
        <VantaBackground />
        <Navbar />
        <div className="min-h-screen pt-20 p-6 flex items-center justify-center">
          <Card className={`${theme.background.card} ${theme.border.primary}`}>
            <CardContent className="p-8 text-center">
              <Shield className={`h-12 w-12 ${theme.icon.primary} mx-auto mb-4 animate-pulse`} />
              <p className={`${theme.text.secondary}`}>Loading admin dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Show login required message for unauthenticated users
  if (!isAuthenticated) {
    return (
      <>
        <VantaBackground />
        <Navbar />
        <div className="min-h-screen pt-20 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className={`${theme.background.card} ${theme.border.primary}`}>
              <CardHeader className="text-center">
                <Lock className={`h-16 w-16 ${theme.icon.warning} mx-auto mb-4`} />
                <CardTitle className={`text-2xl font-bold ${theme.text.primary}`}>
                  Access Restricted
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className={`${theme.text.secondary} mb-6 max-w-2xl mx-auto`}>
                  You need to be signed in to access the admin dashboard.
                </p>
                <Button asChild>
                  <Link href="/login">
                    Sign In to Continue
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  // Show admin access denied for non-admin users
  if (!isAdmin) {
    return (
      <>
        <VantaBackground />
        <Navbar />
        <div className="min-h-screen pt-20 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className={`${theme.background.card} ${theme.border.primary}`}>
              <CardHeader className="text-center">
                <Shield className={`h-16 w-16 ${theme.icon.warning} mx-auto mb-4`} />
                <CardTitle className={`text-2xl font-bold ${theme.text.primary}`}>
                  Admin Access Required
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className={`${theme.text.secondary} mb-6 max-w-2xl mx-auto`}>
                  You need administrator privileges to access this dashboard.
                  Current user: {profile?.full_name || user.email}
                </p>
                <Button asChild variant="outline">
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  // Show the new functional admin dashboard for admin users
  return (
    <>
      <VantaBackground />
      <Navbar />
      <div className="pt-20">
        <AdminDashboard />
      </div>
    </>
  )
}
