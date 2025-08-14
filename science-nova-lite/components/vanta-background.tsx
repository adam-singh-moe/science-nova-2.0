"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface VantaBackgroundProps {
  effect?: string
  className?: string
  children?: ReactNode
  scoped?: boolean
}

declare global {
  interface Window {
    THREE: any
    VANTA: any
  }
}

export function VantaBackground({ effect = "GLOBE", className = "", children, scoped = false }: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    const loadVanta = async () => {
      try {
        if (!window.THREE) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js")
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
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js"
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
          birds: "linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)",
          halo: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
          net: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
          topology: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          clouds2: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          rings: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          cells: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
          waves: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          globe: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)",
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
  }, [effect])

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
        return window.VANTA.TOPOLOGY
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
          backgroundColor: 0xe2edc9,
          color1: 0x397203,
          color2: 0x6cff,
          colorMode: "varianceGradient",
          birdSize: 1.5,
          wingSpan: 25.0,
          speedLimit: 4.0,
          separation: 18.0,
          alignment: 18.0,
          cohesion: 18.0,
          quantity: 5.0,
        }
      case "halo":
        return {
          ...baseConfig,
          backgroundColor: 0x0,
          color: 0x1a59,
          size: 1.5,
          amplitudeFactor: 1.0,
          xOffset: 0.1,
          yOffset: 0.1,
        }
      case "net":
        return {
          ...baseConfig,
          backgroundColor: 0xf0f0f,
          color: 0x486141,
          points: 15.0,
          maxDistance: 25.0,
          spacing: 18.0,
        }
      case "topology":
        return {
          ...baseConfig,
          backgroundColor: 0x2222,
          color: 0x89964e,
        }
      case "clouds2":
        return {
          ...baseConfig,
          backgroundColor: 0x0,
          skyColor: 0x5ca6ca,
          cloudColor: 0x4d4d4d,
          lightColor: 0xffffff,
          speed: 0.8,
        }
      case "rings":
        return {
          ...baseConfig,
          backgroundColor: 0x202428,
          color: 0x88ff00,
        }
      case "cells":
        return {
          ...baseConfig,
          color1: 0x8c8c,
          color2: 0x33ca28,
          size: 1.5,
          speed: 1.0,
        }
      case "globe":
        return {
          ...baseConfig,
          backgroundColor: 0xcbe6e6,
          color: 0x870c,
          color2: 0x39bbfa,
          size: 1.5,
          scale: 1.0,
        }
      case "waves":
        return {
          ...baseConfig,
          color: 0xd3b84,
          shininess: 30.0,
          waveHeight: 15.0,
          waveSpeed: 1.0,
          zoom: 1.0,
        }
      default:
        return {
          ...baseConfig,
          backgroundColor: 0xcbe6e6,
          color: 0x870c,
          color2: 0x39bbfa,
          size: 1.5,
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
