// Simple deterministic hash for daily topic selection.
export function stableHash(input: string): number {
  let h = 0, i = 0, len = input.length
  while (i < len) {
    h = (Math.imul(31, h) + input.charCodeAt(i++)) | 0
  }
  return (h >>> 0)
}
