import * as React from "react"
import { Type as TypeIcon, Grid3X3, Image as ImageIcon, HelpCircle, PanelsTopLeft } from "lucide-react"

type Variant = "text" | "flashcards" | "quiz" | "crossword" | "image"

const gradientMap: Record<Variant, string> = {
  text: "from-sky-400/70 via-cyan-400/60 to-indigo-400/70",
  flashcards: "from-fuchsia-400/70 via-pink-400/60 to-rose-400/70",
  quiz: "from-amber-400/70 via-orange-400/60 to-rose-400/70",
  crossword: "from-emerald-400/70 via-teal-400/60 to-lime-400/70",
  image: "from-violet-400/70 via-purple-400/60 to-indigo-400/70",
}

const iconMap: Record<Variant, React.ComponentType<any>> = {
  text: TypeIcon,
  flashcards: PanelsTopLeft,
  quiz: HelpCircle,
  crossword: Grid3X3,
  image: ImageIcon,
}

const labelMap: Record<Variant, string> = {
  text: "Reading",
  flashcards: "Flashcards",
  quiz: "Quiz",
  crossword: "Crossword",
  image: "Image",
}

// Soft, creative default frame gradients per tool (used when no explicit accent color is set)
const defaultFrameGradient: Record<Variant, string> = {
  text: "from-sky-400/70 via-cyan-400/60 to-indigo-400/70",
  flashcards: "from-fuchsia-400/70 via-pink-400/60 to-rose-400/70",
  quiz: "from-amber-400/70 via-orange-400/60 to-rose-400/70",
  crossword: "from-emerald-400/70 via-teal-400/60 to-lime-400/70",
  image: "from-violet-400/70 via-purple-400/60 to-indigo-400/70",
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
    <div
      className={`h-full w-full rounded-3xl p-[2px] ${accentRgb ? '' : `bg-gradient-to-br ${defaultFrameGradient[variant]}`} shadow-[0_8px_24px_rgba(0,0,0,0.18)]`}
      style={frameStyle}
    >
  <div className="h-full w-full rounded-[1.45rem] flex flex-col overflow-hidden bg-transparent" style={{ ['--sn-accent' as any]: accent || 'transparent', ['--sn-accent-strength' as any]: String(Math.max(0.4, Math.min(1.6, intensity))), ['--sn-accent-soft' as any]: softBg }}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" style={{ color: fgHeader }}>
            <span className="h-7 w-7 rounded-full grid place-items-center" style={{ backgroundColor: accentRgb ? rgba(tint(accentRgb, -0.1), 0.35) : 'rgba(255,255,255,0.15)' }}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide">{label}</span>
          </div>
          <div className="shrink-0">{actions}</div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <div className="w-full h-full rounded-xl" style={{ background: 'transparent', color: fgContent }}>
            <div className="p-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
