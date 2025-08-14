// Cache clearing utility for AI Chat issues
// This script helps clear all browser caches related to AI chat

export function clearAIChatCaches() {
  console.log("🧹 Clearing all AI Chat related caches...")
  
  // Clear localStorage items
  const keysToRemove = [
    'ai-chat-cache',
    'ai-scientist-cache', 
    'floating-chat-settings',
    'ai-chat-state',
    'ai-chat-messages'
  ]
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`✅ Cleared localStorage: ${key}`)
    } catch (error) {
      console.warn(`⚠️ Could not clear localStorage ${key}:`, error)
    }
  })
  
  // Clear sessionStorage items
  try {
    sessionStorage.clear()
    console.log("✅ Cleared sessionStorage")
  } catch (error) {
    console.warn("⚠️ Could not clear sessionStorage:", error)
  }
  
  // Clear any cached fetch responses
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.includes('ai-chat') || cacheName.includes('api')) {
            console.log(`✅ Clearing cache: ${cacheName}`)
            return caches.delete(cacheName)
          }
        })
      )
    }).catch(error => {
      console.warn("⚠️ Could not clear caches:", error)
    })
  }
  
  console.log("🎉 Cache clearing complete!")
  return true
}

export function diagnoseAIChatIssue() {
  console.log("🔍 Diagnosing AI Chat Issue...")
  
  // Check browser support
  const checks = {
    localStorage: typeof Storage !== "undefined",
    fetch: typeof fetch !== "undefined", 
    websockets: typeof WebSocket !== "undefined",
    serviceWorker: 'serviceWorker' in navigator,
    cache: 'caches' in window
  }
  
  console.log("🌐 Browser capabilities:", checks)
  
  // Check for cached data
  const cachedData = {
    localStorage: Object.keys(localStorage).filter(key => 
      key.includes('ai-chat') || key.includes('floating-chat')
    ),
    sessionStorage: Object.keys(sessionStorage).filter(key => 
      key.includes('ai-chat') || key.includes('floating-chat')
    )
  }
  
  console.log("💾 Cached AI Chat data found:", cachedData)
  
  // Check network status
  console.log("🌍 Network status:", {
    online: navigator.onLine,
    connection: (navigator as any).connection?.effectiveType || 'unknown'
  })
  
  // Recommendations
  const recommendations = []
  
  if (cachedData.localStorage.length > 0 || cachedData.sessionStorage.length > 0) {
    recommendations.push("Clear cached data using clearAIChatCaches()")
  }
  
  if (!navigator.onLine) {
    recommendations.push("Check internet connection")
  }
  
  if (!checks.fetch) {
    recommendations.push("Browser may not support modern fetch API")
  }
  
  console.log("💡 Recommendations:", recommendations.length > 0 ? recommendations : ["Everything looks good!"])
  
  return {
    checks,
    cachedData,
    recommendations,
    networkStatus: {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    }
  }
}

// Auto-run diagnostics in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make functions available globally for easy debugging
  (window as any).clearAIChatCaches = clearAIChatCaches;
  (window as any).diagnoseAIChatIssue = diagnoseAIChatIssue;
  
  console.log("🛠️ AI Chat debugging tools loaded!")
  console.log("Run clearAIChatCaches() to clear all caches")
  console.log("Run diagnoseAIChatIssue() to diagnose issues")
}
