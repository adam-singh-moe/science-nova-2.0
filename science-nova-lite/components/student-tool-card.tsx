import * as React from "react"
import { Sparkles, Type as TypeIcon, Grid3X3, Image as ImageIcon, HelpCircle, PanelsTopLeft } from "lucide-react"

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

export function StudentToolCard({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const Icon = iconMap[variant]
  const label = labelMap[variant]
  const lightBgMap: Record<Variant, string> = {
    text: "bg-sky-50",
    flashcards: "bg-rose-50",
    quiz: "bg-amber-50",
    crossword: "bg-emerald-50",
    image: "bg-violet-50",
  }
  return (
    <div className={`h-full w-full rounded-3xl p-[2px] bg-gradient-to-br ${gradientMap[variant]} shadow-[0_10px_30px_rgba(0,0,0,0.15)]`}>
      <div className={`h-full w-full rounded-[1.45rem] ${lightBgMap[variant]}/90 backdrop-blur-md flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 bg-white/40">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full grid place-items-center text-white bg-gradient-to-br from-white/30 to-black/20 shadow">
              <Icon className="h-4 w-4 drop-shadow" />
            </span>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </div>
          <Sparkles className="h-4 w-4 text-gray-500/80" />
        </div>
        <div className="flex-1 overflow-auto p-3">
          {children}
        </div>
      </div>
    </div>
  )
}
