export interface CrosswordWord { word: string; row: number; col: number; direction: 'across' | 'down' }
export interface ValidationIssue { type: 'bounds'|'overlap'|'duplicate'; message: string; detail?: any }

export function validateCrosswordLayout(gridSize: number, words: CrosswordWord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenCoords = new Map<string, string>() // key -> letter
  const seenWordSet = new Set<string>()
  for (const w of words) {
    if (seenWordSet.has(w.word.toLowerCase())) {
      issues.push({ type:'duplicate', message:`Duplicate word: ${w.word}` })
    } else {
      seenWordSet.add(w.word.toLowerCase())
    }
    for (let i=0;i<w.word.length;i++) {
      const r = w.row + (w.direction==='down'? i:0)
      const c = w.col + (w.direction==='across'? i:0)
      if (r<0 || c<0 || r>=gridSize || c>=gridSize) {
        issues.push({ type:'bounds', message:`Word ${w.word} exceeds bounds at (${r},${c})` })
        continue
      }
      const key = `${r}:${c}`
      const letter = w.word[i].toUpperCase()
      if (seenCoords.has(key)) {
        if (seenCoords.get(key) !== letter) {
          issues.push({ type:'overlap', message:`Conflict at (${r},${c}) expected ${seenCoords.get(key)} got ${letter}` })
        }
      } else {
        seenCoords.set(key, letter)
      }
    }
  }
  return issues
}

export function isCrosswordLayoutValid(gridSize: number, words: CrosswordWord[]): boolean {
  return validateCrosswordLayout(gridSize, words).length === 0
}