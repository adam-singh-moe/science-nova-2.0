import * as React from "react"
import { Type as TypeIcon, Grid3X3, Image as ImageIcon, HelpCircle, PanelsTopLeft, Play } from "lucide-react"

type Variant = "text" | "flashcards" | "quiz" | "crossword" | "image" | "video"

const gradientMap: Record<Variant, string> = {
  text: "from-sky-400/70 via-cyan-400/60 to-indigo-400/70",
  flashcards: "from-fuchsia-400/70 via-pink-400/60 to-rose-400/70",
  quiz: "from-amber-400/70 via-orange-400/60 to-rose-400/70",
  crossword: "from-emerald-400/70 via-teal-400/60 to-lime-400/70",
  image: "from-violet-400/70 via-purple-400/60 to-indigo-400/70",
  video: "from-red-400/70 via-orange-400/60 to-pink-400/70",
}

const iconMap: Record<Variant, React.ComponentType<any>> = {
  text: TypeIcon,
  flashcards: PanelsTopLeft,
  quiz: HelpCircle,
  crossword: Grid3X3,
  image: ImageIcon,
  video: Play,
}

const labelMap: Record<Variant, string> = {
  text: "Reading",
  flashcards: "Flashcards",
  quiz: "Quiz",
  crossword: "Crossword",
  image: "Image",
  video: "Video",
}

// Soft, creative default frame gradients per tool (enhanced with better shadows and interactions)
const defaultFrameGradient: Record<Variant, string> = {
  text: "from-sky-400/70 via-cyan-400/60 to-indigo-400/70 shadow-glow",
  flashcards: "from-fuchsia-400/70 via-pink-400/60 to-rose-400/70 shadow-glow-purple",
  quiz: "from-amber-400/70 via-orange-400/60 to-rose-400/70 shadow-glow-orange",
  crossword: "from-emerald-400/70 via-teal-400/60 to-lime-400/70 shadow-glow-green",
  image: "from-violet-400/70 via-purple-400/60 to-indigo-400/70 shadow-glow-purple",
  video: "from-red-400/70 via-orange-400/60 to-pink-400/70 shadow-glow-red",
}

export function StudentToolCard({ variant, actions, children, bodyBgColor, accentIntensity }: { variant: Variant; actions?: React.ReactNode; children: React.ReactNode; bodyBgColor?: string; accentIntensity?: number }) {
  const Icon = iconMap[variant]
  const label = labelMap[variant]
  // Treat empty/transparent values as unset to use creative defaults
  const isTransparentHex = (s: string) => /^#([0-9a-fA-F]{8})$/.test(s) && s.slice(7).toLowerCase() === '00'
  const isHex6 = (s: string) => /^#([0-9a-fA-F]{6})$/.test(s)
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    if (!isHex6(hex)) return null
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const rgba = (rgb: {r:number;g:number;b:number}, a: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
  const tint = (rgb: {r:number;g:number;b:number}, t: number) => {
    // t in [-1,1], negative darkens, positive lightens
    const clamp = (v:number) => Math.max(0, Math.min(255, Math.round(v)))
    const mix = (c:number, toward:number, amt:number) => clamp(c + (toward - c) * amt)
    return {
      r: mix(rgb.r, t >= 0 ? 255 : 0, Math.abs(t)),
      g: mix(rgb.g, t >= 0 ? 255 : 0, Math.abs(t)),
      b: mix(rgb.b, t >= 0 ? 255 : 0, Math.abs(t)),
    }
  }
  // Relative luminance (WCAG) helper
  const relLum = (r: number, g: number, b: number) => {
    const toLin = (c: number) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    const R = toLin(r), G = toLin(g), B = toLin(b)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }
  const chooseFg = (hexBg: string | undefined): string => {
    if (!hexBg || !isHex6(hexBg)) return '#ffffff'
    const rgb = hexToRgb(hexBg)
    if (!rgb) return '#ffffff'
    const L = relLum(rgb.r, rgb.g, rgb.b)
    return L > 0.55 ? '#111827' /* slate-900 */ : '#ffffff'
  }
  // Accent color drives the card frame and header/icon color; content stays neutral
  const accent = ((): string | undefined => {
    if (!bodyBgColor) return undefined
    const v = bodyBgColor.trim()
    if (!v || v.toLowerCase() === 'transparent') return undefined
    if (isTransparentHex(v)) return undefined
    return v
  })()
  const accentRgb = accent && hexToRgb(accent)
  const fgHeader = chooseFg(accent)
  const fgContent = fgHeader
  // Build dynamic frame gradient when accent is provided; fallback to preset tailwind gradient classes
  const intensity = typeof accentIntensity === 'number' && isFinite(accentIntensity) ? accentIntensity : 1
  const frameStyle: React.CSSProperties | undefined = accentRgb
    ? {
        backgroundImage: `linear-gradient(135deg, ${rgba(tint(accentRgb, 0.25 * intensity), 0.7)}, ${rgba(accentRgb, Math.min(1, 0.85 * intensity))}, ${rgba(tint(accentRgb, -0.2 * intensity), 0.7)})`,
      }
    : undefined
  const softAlpha = Math.max(0.06, Math.min(0.25, 0.14 * intensity))
  const softBg = accentRgb ? rgba(accentRgb, softAlpha) : 'transparent'
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-[1.02] bg-white/80 backdrop-blur border border-white/20">
      <div className="h-full w-full flex flex-col">
        {/* Header with glassmorphic gradient */}
        <div 
          className={`flex items-center justify-between px-4 py-3 ${accentRgb ? '' : `bg-gradient-to-r ${gradientMap[variant]}`} border-b border-white/20`}
          style={frameStyle}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/30">
              <Icon className="h-4 w-4 text-white drop-shadow-sm" />
            </div>
            <span className="text-sm font-semibold text-white drop-shadow-sm tracking-wide">{label}</span>
          </div>
          <div className="shrink-0">{actions}</div>
        </div>
        
        {/* Content area with modern styling */}
        <div className="flex-1 overflow-auto p-4">
          <div 
            className="w-full h-full rounded-xl transition-all duration-300" 
            style={{ color: fgContent }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
