"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Admin layout that prevents unwanted redirects
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  useEffect(() => {
    // Log admin navigation for debugging
    console.log('AdminLayout: Navigated to', pathname)
    
    // Prevent any global navigation interceptors from redirecting admin pages
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    
    // Track any unwanted redirects
    window.history.pushState = function(state, title, url) {
      console.log('AdminLayout: History pushState intercepted:', { state, title, url })
      
      // Check if it's trying to redirect to content manager
      if (typeof url === 'string' && url.includes('/admin/content?tab=')) {
        console.warn('AdminLayout: Blocking redirect to content manager with tabs:', url)
        return // Block the redirect
      }
      
      return originalPushState.call(this, state, title, url)
    }
    
    window.history.replaceState = function(state, title, url) {
      console.log('AdminLayout: History replaceState intercepted:', { state, title, url })
      
      // Check if it's trying to redirect to content manager
      if (typeof url === 'string' && url.includes('/admin/content?tab=')) {
        console.warn('AdminLayout: Blocking replace redirect to content manager with tabs:', url)
        return // Block the redirect
      }
      
      return originalReplaceState.call(this, state, title, url)
    }
    
    // Cleanup on unmount
    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [pathname])

  return <>{children}</>
}