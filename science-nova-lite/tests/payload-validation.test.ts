import { describe, it, expect } from 'vitest'
import { validatePayload } from '@/lib/schemas/content'

describe('validatePayload', () => {
  it('validates QUIZ payload', () => {
    const quiz = { subtype: 'QUIZ', questions: [ { stem: 'Q1', choices: [ { text:'A', correct:true }, { text:'B', correct:false } ] } ] }
    const out = validatePayload('QUIZ', quiz)
    expect(out).toEqual(quiz)
  })
  it('validates FLASHCARDS payload', () => {
    const fc = { subtype: 'FLASHCARDS', cards: [ { front:'F', back:'B' } ] }
    const out = validatePayload('FLASHCARDS', fc)
    expect(out).toEqual(fc)
  })
  it('validates GAME crossword subtype', () => {
    const game = { subtype: 'GAME', type: 'crossword', data: { words: [ { word:'CAT', clue:'Animal' } ] } }
    const out = validatePayload('GAME', game)
    expect(out).toEqual(game)
  })
  it('rejects invalid quiz (no questions)', () => {
    expect(()=> validatePayload('QUIZ', { subtype:'QUIZ', questions: []})).toThrow()
  })
  it('rejects invalid flashcards (empty cards)', () => {
    expect(()=> validatePayload('FLASHCARDS', { subtype:'FLASHCARDS', cards: []})).toThrow()
  })
  it('rejects game missing data field', () => {
    expect(()=> validatePayload('GAME', { subtype:'GAME', type:'matching'})).toThrow()
  })
  it('coerces FACT payload missing subtype', () => {
    const fact = { text: 'Earth orbits the Sun.' }
    const out:any = validatePayload('FACT', fact)
    expect(out.text).toBe(fact.text)
    expect(out.subtype).toBe('FACT')
  })
})
