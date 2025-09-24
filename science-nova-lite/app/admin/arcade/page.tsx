"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ArcadeManagerRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/content/arcade")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the Arcade Manager</p>
      </div>
    </div>
  )
}