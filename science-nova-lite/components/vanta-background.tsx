"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface VantaBackgroundProps {
  effect?: string
  className?: string
  children?: ReactNode
  scoped?: boolean
  // Indicates if this is being used in lesson context (for globe color differentiation)
  lessonBuilder?: boolean
}

declare global {
  interface Window {
    THREE: any
    VANTA: any
  }
}

export function VantaBackground({ effect = "GLOBE", className = "", children, scoped = false, lessonBuilder = false }: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    const applyHighlightTokens = (effectName: string) => {
      try {
        const el = document.documentElement
        // Simple highlight colors for dark theme
        el.style.setProperty('--sn-highlight-bg', 'rgba(74, 85, 104, 0.16)')
        el.style.setProperty('--sn-highlight-stroke', 'rgba(255,255,255,0.18)')
        el.setAttribute('data-vanta-preset', effectName)
      } catch {}
    }

    const loadVanta = async () => {
      try {
        if (!window.THREE) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r119/three.min.js")
          await new Promise((resolve) => {
            const checkTHREE = () => {
              if (window.THREE) {
                resolve(true)
              } else {
                setTimeout(checkTHREE, 50)
              }
            }
            checkTHREE()
          })
        }

  const effectName = effect.toLowerCase()
        let scriptUrl = ""

        switch (effectName) {
          case "birds":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"
            break
          case "halo":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js"
            break
          case "net":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
            break
          case "topology":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
            break
          case "clouds2":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds2.min.js"
            break
          case "rings":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.rings.min.js"
            break
          case "cells":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.cells.min.js"
            break
          case "globe":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"
            break
          case "waves":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"
            break
          case "fog":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js"
            break
          default:
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"
        }

        await loadScript(scriptUrl)

        await new Promise((resolve) => {
          const checkVANTA = () => {
            if (window.VANTA) {
              resolve(true)
            } else {
              setTimeout(checkVANTA, 50)
            }
          }
          checkVANTA()
        })

        if (vantaEffect.current) {
          try {
            if (typeof vantaEffect.current.destroy === "function") {
              vantaEffect.current.destroy()
            }
          } catch {}
          vantaEffect.current = null
        }

        await new Promise((resolve) => setTimeout(resolve, 200))

        if (window.VANTA && window.THREE && vantaRef.current) {
          const effectConfig = getEffectConfig(effectName)
          applyHighlightTokens(effectName)
          const VantaEffect = getVantaEffect(effectName)

          if (VantaEffect && typeof VantaEffect === "function") {
            try {
              vantaEffect.current = VantaEffect({
                el: vantaRef.current,
                THREE: window.THREE,
                ...effectConfig,
              })
            } catch {
              applyFallbackBackground(effectName)
            }
          } else {
            applyFallbackBackground(effectName)
          }
        } else {
          applyFallbackBackground(effectName)
        }
  } catch {
        applyFallbackBackground(effect.toLowerCase())
      }
    }

    const applyFallbackBackground = (effectName: string) => {
      if (vantaRef.current) {
        const gradients = {
          birds: "linear-gradient(135deg, #0b1221 0%, #12243f 60%, #0b1221 100%)",
          halo: "linear-gradient(135deg, #0b0f1a 0%, #1b1f3b 100%)",
          net: "linear-gradient(135deg, #0b1221 0%, #0d1b2a 100%)",
          topology: "linear-gradient(135deg, #1a1f2b 0%, #2a2f3b 100%)",
          clouds2: "linear-gradient(135deg, #0c1a2a 0%, #102a43 100%)",
          rings: "linear-gradient(135deg, #0b0f1a 0%, #1a1030 100%)",
          cells: "linear-gradient(135deg, #101826 0%, #16324a 100%)",
          waves: "linear-gradient(135deg, #081826 0%, #0b2a3d 100%)",
          fog: "linear-gradient(135deg, #845700 0%, #e6005e 50%, #f58548 100%)",
          globe: "linear-gradient(135deg, #0b1221 0%, #12243f 50%, #0b1221 100%)",
        }

        const gradient = gradients[effectName as keyof typeof gradients] || gradients.globe
        vantaRef.current.style.background = gradient
      }
    }

    loadVanta()

    return () => {
      if (vantaEffect.current) {
        try {
          if (typeof vantaEffect.current.destroy === "function") {
            vantaEffect.current.destroy()
          }
        } catch {}
        vantaEffect.current = null
      }
    }
  }, [effect, lessonBuilder])

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`)
      if (existingScript) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  const getVantaEffect = (effectName: string) => {
    if (!window.VANTA) return null

    switch (effectName) {
      case "birds":
        return window.VANTA.BIRDS
      case "halo":
        return window.VANTA.HALO
      case "net":
        return window.VANTA.NET
      case "topology":
        // Use NET effect instead of TOPOLOGY due to compatibility issues
        return window.VANTA.NET
      case "clouds2":
        return window.VANTA.CLOUDS2
      case "rings":
        return window.VANTA.RINGS
      case "cells":
        return window.VANTA.CELLS
      case "globe":
        return window.VANTA.GLOBE
      case "waves":
        return window.VANTA.WAVES
      case "fog":
        return window.VANTA.FOG
      default:
        return window.VANTA.GLOBE
    }
  }

  const getEffectConfig = (effectType: string) => {
    const baseConfig = {
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
    }

    switch (effectType) {
      case "birds":
        return {
          ...baseConfig,
          backgroundColor: 0x0c1612,
          color1: 0x52d49b,
          color2: 0x93ff88,
          birdSize: 1.2,
          wingSpan: 25.0,
          speedLimit: 3.5,
          separation: 18.0,
          alignment: 18.0,
          cohesion: 18.0,
          quantity: 3.0,
        }
      case "halo":
        return {
          ...baseConfig,
          backgroundColor: 0x0b0f1a,
          color: 0x9b5cff,
          size: 1.2,
          amplitudeFactor: 1.0,
          xOffset: 0.1,
          yOffset: 0.1,
        }
      case "net":
        return {
          ...baseConfig,
          backgroundColor: 0x13112a,
          color: 0xff3f81,
          points: 12.0,
          maxDistance: 22.0,
          spacing: 16.0,
        }
      case "topology":
        // Use NET effect as topology replacement due to compatibility issues
        return {
          ...baseConfig,
          backgroundColor: 0x1a1210,
          color: 0xff9f6e,
          points: 15.0,
          maxDistance: 23.0,
          spacing: 17.0,
        }
      case "clouds2":
        return {
          ...baseConfig,
          backgroundColor: 0x0b1221,
          cloudColor: 0x2a3f55,
          texturePath: "https://cdn.jsdelivr.net/npm/vanta@latest/dist/gallery/noise.png",
        }
      case "rings":
        return {
          ...baseConfig,
          backgroundColor: 0x0b0f1a,
          color: 0x9b5cff,
          ringSize: 1.0,
          quantity: 30.0,
          yOffset: 0.1,
          xOffset: 0.1,
        }
      case "cells":
        return {
          ...baseConfig,
          backgroundColor: 0x0c1612,
          color1: 0x52d49b,
          color2: 0x93ff88,
          size: 1.3,
          speed: 0.9,
        }
      case "globe":
        if (lessonBuilder) {
          // Lesson globe: Blue/cyan theme
          return {
            ...baseConfig,
            backgroundColor: 0x0b1221,
            color: 0x56bb,
            color2: 0xf24a68,
            size: 1.2,
            scale: 1.0,
          }
        } else {
          // Application globe: Purple/lavender theme
          return {
            ...baseConfig,
            backgroundColor: 0x13112a,
            color: 0xd1ff,
            color2: 0x8beb96,
            size: 1.2,
            scale: 1.0,
          }
        }
      case "waves":
        return {
          ...baseConfig,
          backgroundColor: 0x0b1221,
          color: 0x2487f,
          shininess: 30.0,
          waveHeight: 15.0,
          waveSpeed: 0.8,
          zoom: 1.0,
        }
      case "fog":
        return {
          ...baseConfig,
          highlightColor: 0x845700,
          midtoneColor: 0xe6005e,
          lowlightColor: 0xf58548,
        }
      default:
        return {
          ...baseConfig,
          backgroundColor: 0x13112a,
          color: 0x4a5568,
          color2: 0x8beb96,
          size: 1.2,
          scale: 1.0,
        }
    }
  }

  if (scoped) {
    return (
      <div className={`relative ${className}`}>
        <div ref={vantaRef} className="absolute inset-0 z-0 pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen ${className}`}>
      <div ref={vantaRef} className="fixed inset-0 -z-10" />
      {children}
    </div>
  )
}
