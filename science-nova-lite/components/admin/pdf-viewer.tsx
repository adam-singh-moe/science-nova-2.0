"use client"

import { useState, useEffect } from "react"
import { Loader2, ChevronLeft } from "lucide-react"

interface PDFViewerProps {
  url: string
  title: string
  onClose: () => void
  publicUrl?: string
  signedUrl?: string
  bucket?: string
  path?: string
}

export function PDFViewer({ url, title, onClose, publicUrl, signedUrl, bucket, path }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [triedUrls, setTriedUrls] = useState(new Set<string>())
  const [useEmbeddedViewer, setUseEmbeddedViewer] = useState(true)

  useEffect(() => {
    // Use the best available URL - prefer signedUrl, then publicUrl, then original url
    let bestUrl = signedUrl || publicUrl || url;
    
    // Ensure we have a valid URL before setting it
    if (!bestUrl || bestUrl.trim() === '') {
      setError("Invalid document URL")
      setLoading(false)
      return
    }
    
    // Reset state when URL changes
    setLoading(true)
    setError(null)
    setCurrentUrl(bestUrl)
    setTriedUrls(new Set([bestUrl]))

    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000) // Give more time for PDF to load

    return () => clearTimeout(timer)
  }, [url, signedUrl, publicUrl, bucket, path])

  const handleLoadError = () => {
    // Try alternative URLs if available
    const alternativeUrls = [url, publicUrl].filter(Boolean).filter(u => !triedUrls.has(u!))
    
    if (alternativeUrls.length > 0) {
      const nextUrl = alternativeUrls[0]!
      setTriedUrls(prev => new Set([...prev, nextUrl]))
      setCurrentUrl(nextUrl)
      setLoading(true)
      setError(null)
      console.log(`Trying alternative URL: ${nextUrl}`)
    } else {
      // If iframe fails, suggest opening in new tab
      setError("PDF could not be displayed in this viewer. Try opening in a new tab.")
      setLoading(false)
    }
  }

  const openInNewTab = () => {
    window.open(currentUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-gray-100"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-medium truncate max-w-md">{title}</h3>
          </div>
          <button
            onClick={openInNewTab}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Open in Full Viewer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-2 text-gray-600">Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50">
              <div className="text-center max-w-md">
                <p className="text-blue-800 text-lg font-medium mb-2">Document Viewer</p>
                <p className="text-blue-700 mb-4">For the best viewing experience, open this document in the full viewer.</p>
                <button
                  onClick={openInNewTab}
                  className="rounded-lg bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  Open in Full Viewer
                </button>
              </div>
            </div>
          )}

          {!error && currentUrl && (
            <div className="relative w-full h-full">
              {/* Overlay message encouraging full viewer */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm">
                  <span className="font-medium">Tip:</span> Use "Open in Full Viewer" for better navigation and tools
                </p>
              </div>
              
              <iframe
                src={currentUrl}
                className="w-full h-full"
                title={title}
                onError={handleLoadError}
                onLoad={() => setLoading(false)}
                allow="same-origin"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
