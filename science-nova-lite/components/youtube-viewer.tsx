"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Settings, Maximize2, Minimize2 } from "lucide-react"

interface YouTubeViewerProps {
  url?: string
  autoplay?: boolean
  showControls?: boolean
}

// Extract YouTube video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Generate YouTube embed URL with security parameters
function getEmbedUrl(videoId: string, options: { autoplay?: boolean; controls?: boolean } = {}): string {
  const params = new URLSearchParams({
    rel: '0', // Don't show related videos from other channels
    modestbranding: '1', // Reduce YouTube branding
    fs: '0', // Disable fullscreen button (we'll provide our own)
    disablekb: '1', // Disable keyboard controls (we'll handle them)
    iv_load_policy: '3', // Hide video annotations
    cc_load_policy: '0', // Don't show captions by default
    playsinline: '1', // Play inline on mobile
    origin: window.location.origin, // Security measure
    enablejsapi: '1', // Enable JavaScript API
    controls: options.controls ? '1' : '0',
    autoplay: options.autoplay ? '1' : '0'
  })
  
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export function YouTubeViewer({ url, autoplay = false, showControls = true }: YouTubeViewerProps) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCustomControls, setShowCustomControls] = useState(true)
  const [volume, setVolume] = useState(100)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Extract video ID when URL changes
  useEffect(() => {
    if (url) {
      const id = extractVideoId(url)
      setVideoId(id)
      setError(id ? null : "Invalid YouTube URL")
      setIsLoading(!!id)
    } else {
      setVideoId(null)
      setError(null)
    }
  }, [url])

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false)
    setError("Failed to load video")
  }

  // Show/hide custom controls on mouse movement
  const handleMouseMove = () => {
    setShowCustomControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowCustomControls(false)
      }, 3000)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setIsPlaying(prev => !prev)
          break
        case 'KeyM':
          e.preventDefault()
          setIsMuted(prev => !prev)
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(prev => Math.min(100, prev + 10))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(prev => Math.max(0, prev - 10))
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!url) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center" style={{ minHeight: '200px' }}>
        <div className="text-center text-slate-600">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter a YouTube URL to display video</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-lg flex items-center justify-center" style={{ minHeight: '200px' }}>
        <div className="text-center text-red-600">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
            <Play className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-1 opacity-75">Please check the YouTube URL</p>
        </div>
      </div>
    )
  }

  if (!videoId) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center" style={{ minHeight: '200px' }}>
        <div className="text-center text-slate-600">
          <div className="animate-spin w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Processing video URL...</p>
        </div>
      </div>
    )
  }

  const embedUrl = getEmbedUrl(videoId, { autoplay: isPlaying, controls: showControls })

  return (
    <div 
      ref={containerRef}
      className={`youtube-player relative w-full h-full bg-black rounded-lg overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowCustomControls(false)}
      tabIndex={0}
      style={{ minHeight: isFullscreen ? 'auto' : '200px', aspectRatio: isFullscreen ? 'auto' : '16/9' }}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false} // We handle fullscreen ourselves
        title="YouTube video player"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Custom controls overlay */}
      {showControls && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
            showCustomControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(prev => !prev)}
              className="text-white hover:text-blue-300 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="text-white hover:text-blue-300 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = Number(e.target.value)
                  setVolume(newVolume)
                  setIsMuted(newVolume === 0)
                }}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`
                }}
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(prev => !prev)}
                className="text-white hover:text-blue-300 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-[200px]">
                  <div className="text-white text-sm space-y-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Playback Speed</label>
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(Number(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>Normal</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={1.75}>1.75x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-300 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Progress bar placeholder */}
          <div className="mt-3">
            <div className="w-full h-1 bg-white/20 rounded-full">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/70 rounded-lg p-2 text-white text-xs space-y-1 max-w-[200px]">
          <div className="font-medium mb-1">Keyboard Shortcuts:</div>
          <div>Space - Play/Pause</div>
          <div>M - Mute/Unmute</div>
          <div>F - Fullscreen</div>
          <div>↑/↓ - Volume</div>
        </div>
      </div>
    </div>
  )
}

export default YouTubeViewer
