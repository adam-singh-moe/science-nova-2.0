"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PublishedLessonsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the unified content manager with lessons tab and published sub-tab
    router.replace("/admin/content?tab=lessons&subTab=published")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Content Manager...</p>
      </div>
    </div>
  )
}
