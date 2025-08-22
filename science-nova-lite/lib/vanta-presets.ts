// Shared mapping from study area to Vanta effect + preset
export type VantaPreset = "dark" | "ocean" | "nebula" | "forest" | "sunset"

export function getVantaForStudyArea(area?: string): { effect: string; preset?: VantaPreset } {
  const name = (area || "").toLowerCase()
  // Map common science areas; default to a calm dark globe
  if (name.includes("astronomy") || name.includes("space")) return { effect: "rings", preset: "nebula" }
  if (name.includes("physics")) return { effect: "halo", preset: "nebula" }
  if (name.includes("chem")) return { effect: "net", preset: "sunset" }
  if (name.includes("bio") || name.includes("ecology")) return { effect: "birds", preset: "forest" }
  if (name.includes("anatomy") || name.includes("cells")) return { effect: "cells", preset: "forest" }
  if (name.includes("geo") || name.includes("earth")) return { effect: "topology", preset: "sunset" }
  if (name.includes("meteorology") || name.includes("weather")) return { effect: "clouds2", preset: "ocean" }
  if (name.includes("ocean") || name.includes("marine")) return { effect: "waves", preset: "ocean" }
  return { effect: "globe", preset: "dark" }
}
