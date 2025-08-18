export type PlacedItem = {
  id: string
  kind: string
  x: number
  y: number
  w: number
  h: number
  z?: number
  data?: any
}

// Base design size used as the authoring coordinate system
export const DESIGN_SIZE = { width: 1280, height: 800 } // Option E

// Sort items by visual layer (z), then position for stability
export function sortByLayer(items: PlacedItem[]): PlacedItem[] {
  return items
    .slice()
    .sort((a, b) => {
      const za = a.z ?? 0
      const zb = b.z ?? 0
      if (za !== zb) return za - zb // background first, top-most last
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })
}

// Sort by position (top-left flow) – kept for potential future use
export function sortByPosition(items: PlacedItem[]): PlacedItem[] {
  return items
    .slice()
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
}

// Compute a scale that fits the design width into the available width
export function computeScale(availableWidth: number, designWidth = DESIGN_SIZE.width, padding = 0) {
  const w = Math.max(0, availableWidth - padding)
  if (designWidth <= 0) return 1
  return Math.max(0.1, Math.min(2, w / designWidth))
}
