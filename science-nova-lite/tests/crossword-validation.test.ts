import { describe, it, expect } from 'vitest'
import { validateCrosswordLayout, isCrosswordLayoutValid } from '@/lib/crossword/validate'

describe('crossword layout validation', () => {
  it('accepts simple non-overlapping words', () => {
    const words = [
      { word:'CAT', row:0, col:0, direction:'across' as const },
      { word:'DOG', row:2, col:0, direction:'across' as const }
    ]
    expect(isCrosswordLayoutValid(15, words)).toBe(true)
  })
  it('flags bounds issue', () => {
    const words = [ { word:'HELLO', row:0, col:12, direction:'across' as const } ]
    const issues = validateCrosswordLayout(15, words)
    expect(issues.some(i=>i.type==='bounds')).toBe(true)
  })
  it('flags conflicting overlap', () => {
    const words = [
      { word:'CAT', row:0, col:0, direction:'across' as const },
      { word:'DOG', row:0, col:0, direction:'down' as const }
    ]
    const issues = validateCrosswordLayout(15, words)
    expect(issues.some(i=>i.type==='overlap')).toBe(true)
  })
  it('allows proper intersection', () => {
    const words = [
      { word:'CAT', row:0, col:0, direction:'across' as const },
      { word:'AXIS', row:0, col:1, direction:'down' as const } // intersects at 'A'
    ]
    const issues = validateCrosswordLayout(15, words)
    expect(issues.length).toBe(0)
  })
})
