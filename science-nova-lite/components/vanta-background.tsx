"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface VantaBackgroundProps {
  effect?: string
  className?: string
  children?: ReactNode
  scoped?: boolean
  // Optional visual preset (no schema changes needed). If omitted, a preset is auto-picked per effect for good contrast.
  preset?: "dark" | "ocean" | "nebula" | "forest" | "sunset"
}

declare global {
  interface Window {
    THREE: any
    VANTA: any
  }
}

export function VantaBackground({ effect = "GLOBE", className = "", children, scoped = false, preset }: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    const applyHighlightTokens = (p?: VantaBackgroundProps["preset"]) => {
      try {
        const el = document.documentElement
        const palette = getPalette(p)
        // Light-on-dark default highlights tuned per palette
        const bg = `rgba(${((palette.primary>>16)&255)}, ${((palette.primary>>8)&255)}, ${(palette.primary&255)}, 0.16)`
        const stroke = `rgba(255,255,255,0.18)`
        el.style.setProperty('--sn-highlight-bg', bg)
        el.style.setProperty('--sn-highlight-stroke', stroke)
        el.setAttribute('data-vanta-preset', String(p||'dark'))
      } catch {}
    }

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
          const chosenPreset = preset || choosePresetForEffect(effectName)
          const effectConfig = getEffectConfig(effectName, chosenPreset)
          applyHighlightTokens(chosenPreset)
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
  }, [effect, preset])

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

  // High-contrast, dark-leaning palettes that keep white text readable over the background.
  const getPalette = (presetName?: VantaBackgroundProps["preset"]) => {
    const p = presetName
    switch (p) {
      case "ocean":
        return { bg: 0x0b1221, primary: 0x52a7f9, secondary: 0x1ec8c8 }
      case "nebula":
        return { bg: 0x0b0f1a, primary: 0x9b5cff, secondary: 0xff5cf7 }
      case "forest":
        return { bg: 0x0c1612, primary: 0x52d49b, secondary: 0x93ff88 }
      case "sunset":
        return { bg: 0x1a1210, primary: 0xff9f6e, secondary: 0xff5e78 }
      case "dark":
      default:
        return { bg: 0x0b1221, primary: 0x52a7f9, secondary: 0x7c90ff }
    }
  }

  // Auto-pick a sensible preset if none is provided, based on effect.
  const choosePresetForEffect = (effectType: string): VantaBackgroundProps["preset"] => {
    switch (effectType) {
      case "clouds2":
      case "waves":
        return "ocean"
      case "rings":
      case "halo":
        return "nebula"
      case "birds":
      case "cells":
        return "forest"
      case "topology":
        return "sunset"
      case "net":
      case "globe":
      default:
        return "dark"
    }
  }

  const getEffectConfig = (effectType: string, explicitPreset?: VantaBackgroundProps["preset"]) => {
    const baseConfig = {
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
    }

    const palette = getPalette(explicitPreset || choosePresetForEffect(effectType))

    switch (effectType) {
      case "birds":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color1: palette.primary,
          color2: palette.secondary,
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
          backgroundColor: palette.bg,
          color: palette.primary,
          size: 1.2,
          amplitudeFactor: 1.0,
          xOffset: 0.1,
          yOffset: 0.1,
        }
      case "net":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
          points: 12.0,
          maxDistance: 22.0,
          spacing: 16.0,
        }
      case "topology":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
        }
      case "clouds2":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          skyColor: palette.primary,
          cloudColor: 0x2a3f55,
          lightColor: 0xffffff,
          speed: 0.6,
        }
      case "rings":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
        }
      case "cells":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color1: palette.primary,
          color2: palette.secondary,
          size: 1.3,
          speed: 0.9,
        }
      case "globe":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
          color2: palette.secondary,
          size: 1.2,
          scale: 1.0,
        }
      case "waves":
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
          shininess: 30.0,
          waveHeight: 15.0,
          waveSpeed: 0.8,
          zoom: 1.0,
        }
      default:
        return {
          ...baseConfig,
          backgroundColor: palette.bg,
          color: palette.primary,
          color2: palette.secondary,
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
