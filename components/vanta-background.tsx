"use client"

import { useEffect, useRef } from "react"

interface VantaBackgroundProps {
  effect?: string
  className?: string
}

declare global {
  interface Window {
    THREE: any
    VANTA: any
  }
}

export function VantaBackground({ effect = "GLOBE", className = "" }: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadVanta()
    }, 100)

    const loadVanta = async () => {
      try {
        // Load THREE.js from CDN if not already loaded
        if (!window.THREE) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js")
          // Wait for THREE to be available
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

        // Load the appropriate Vanta effect from CDN
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
          case "fog":
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js"
            break
          default:
            scriptUrl = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"
        }

        // Load the Vanta effect script
        await loadScript(scriptUrl)

        // Wait for VANTA to be available
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

        // Safely destroy existing effect
        if (vantaEffect.current) {
          try {
            if (typeof vantaEffect.current.destroy === "function") {
              vantaEffect.current.destroy()
            }
          } catch (destroyError) {
            console.warn("Error destroying previous Vanta effect:", destroyError)
          }
          vantaEffect.current = null
        }

        // Clear any existing styles to ensure fresh start
        if (vantaRef.current) {
          vantaRef.current.style.background = ''
        }

        // Wait a bit for scripts to be ready and cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Create new effect with validation
        if (window.VANTA && window.THREE && vantaRef.current) {
          const effectConfig = getEffectConfig(effectName)
          const VantaEffect = getVantaEffect(effectName)

          if (VantaEffect && typeof VantaEffect === "function") {
            try {
              vantaEffect.current = VantaEffect({
                el: vantaRef.current,
                THREE: window.THREE,
                ...effectConfig,
                // Force re-render with timestamp to avoid caching
                version: Date.now()
              })
              console.log(`Vanta effect "${effectName}" loaded successfully with colors:`, effectConfig)
            } catch (initError) {
              console.error(`Error initializing Vanta effect "${effectName}":`, initError)
              applyFallbackBackground(effectName)
            }
          } else {
            console.warn(`Vanta effect "${effectName}" not available, using fallback`)
            applyFallbackBackground(effectName)
          }
        } else {
          console.warn("Vanta dependencies not available, using fallback")
          applyFallbackBackground(effectName)
        }
      } catch (error) {
        console.error("Error loading Vanta effect:", error)
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
          fog: "linear-gradient(135deg, #845700 0%, #e6005e 50%, #f58548 100%)",
          globe: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)",
        }

        const gradient = gradients[effectName as keyof typeof gradients] || gradients.globe
        vantaRef.current.style.background = gradient
        console.log(`Applied fallback gradient for ${effectName}`)
      }
    }

    return () => {
      // Clear timer
      clearTimeout(timer)
      
      // Safe cleanup
      if (vantaEffect.current) {
        try {
          if (typeof vantaEffect.current.destroy === "function") {
            vantaEffect.current.destroy()
          }
        } catch (cleanupError) {
          console.warn("Error during Vanta cleanup:", cleanupError)
        }
        vantaEffect.current = null
      }
    }
  }, [effect]) // Re-run when effect changes

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
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
          backgroundColor: 0x111025,
          color: 0x56bb,
          color2: 0xf24a68,
          size: 1.5,
          scale: 1.0,
        }
      case "waves":
        return {
          ...baseConfig,
          color: 0x6788,
          shininess: 30.0,
          waveHeight: 15.0,
          waveSpeed: 1.0,
          zoom: 1.0,
        }
      case "fog":
        return {
          ...baseConfig,
          highlightColor: 0x845700,
          midtoneColor: 0xe6005e,
          lowlightColor: 0xf58548,
        }
      default: // globe
        return {
          ...baseConfig,
          backgroundColor: 0x111025,
          color: 0x56bb,
          color2: 0xf24a68,
          size: 1.5,
          scale: 1.0,
        }
    }
  }

  return <div ref={vantaRef} className={`fixed inset-0 -z-10 ${className}`} />
}
