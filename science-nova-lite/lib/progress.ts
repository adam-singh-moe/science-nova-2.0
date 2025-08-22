export type BlockKey = { lessonId: string; blockId: string }

const donePrefix = 'sn-done:'

export function isBlockDone({ lessonId, blockId }: BlockKey): boolean {
  try {
    return localStorage.getItem(donePrefix + lessonId + ':' + blockId) === '1'
  } catch {
    return false
  }
}

export function setBlockDone({ lessonId, blockId }: BlockKey, done: boolean) {
  try {
    const key = donePrefix + lessonId + ':' + blockId
    if (done) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
  } catch {}
}

export function getLessonProgress(lessonId: string, blockIds: string[]) {
  let done = 0
  for (const id of blockIds) if (isBlockDone({ lessonId, blockId: id })) done++
  const total = blockIds.length || 1
  return { done, total, percent: Math.round((done / total) * 100) }
}
