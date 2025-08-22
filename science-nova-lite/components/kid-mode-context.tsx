"use client"

import * as React from "react"

type KidModeState = {
  enabled: boolean
  fontScale: number // 1.0 = base, 1.25, 1.5, etc
  dyslexic: boolean
  readSpeed: number // 0.8 - 1.5
  cardFlow: boolean
}

type KidModeContextValue = KidModeState & {
  setEnabled: (v: boolean) => void
  setFontScale: (v: number) => void
  setDyslexic: (v: boolean) => void
  setReadSpeed: (v: number) => void
  setCardFlow: (v: boolean) => void
}

const KidModeContext = React.createContext<KidModeContextValue | undefined>(undefined)

const KEY = {
  enabled: "sn.kid.enabled",
  font: "sn.kid.fontScale",
  dys: "sn.kid.dyslexic",
  speed: "sn.kid.readSpeed",
  flow: "sn.kid.cardFlow",
}

export function KidModeProvider({ children, defaults }: { children: React.ReactNode; defaults?: Partial<KidModeState> }) {
  const [enabled, setEnabled] = React.useState<boolean>(() => getLS(KEY.enabled, defaults?.enabled ?? true))
  const [fontScale, setFontScale] = React.useState<number>(() => getLS(KEY.font, defaults?.fontScale ?? 1.2))
  const [dyslexic, setDyslexic] = React.useState<boolean>(() => getLS(KEY.dys, defaults?.dyslexic ?? false))
  const [readSpeed, setReadSpeed] = React.useState<number>(() => getLS(KEY.speed, defaults?.readSpeed ?? 1.0))
  const [cardFlow, setCardFlow] = React.useState<boolean>(() => getLS(KEY.flow, defaults?.cardFlow ?? true))

  React.useEffect(() => setLS(KEY.enabled, enabled), [enabled])
  React.useEffect(() => setLS(KEY.font, fontScale), [fontScale])
  React.useEffect(() => setLS(KEY.dys, dyslexic), [dyslexic])
  React.useEffect(() => setLS(KEY.speed, readSpeed), [readSpeed])
  React.useEffect(() => setLS(KEY.flow, cardFlow), [cardFlow])

  // Apply CSS vars/class at document level
  React.useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--kids-font-scale", String(fontScale))
    root.classList.toggle("font-dyslexic", dyslexic)
    root.classList.toggle("kid-mode", enabled)
  }, [enabled, fontScale, dyslexic])

  const value: KidModeContextValue = {
    enabled,
    fontScale,
    dyslexic,
    readSpeed,
    cardFlow,
    setEnabled,
    setFontScale,
    setDyslexic,
    setReadSpeed,
    setCardFlow,
  }

  return <KidModeContext.Provider value={value}>{children}</KidModeContext.Provider>
}

export function useKidMode() {
  const ctx = React.useContext(KidModeContext)
  if (!ctx) throw new Error("useKidMode must be used within KidModeProvider")
  return ctx
}

function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}
function setLS<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {}
}
