import { describe, expect, test } from 'bun:test'
import { recall, splitBySpans } from './recall'
import { appendNote, emptyMemory, type Memory } from './store'

const memoryOf = (texts: string[]): Memory => {
  let memory = emptyMemory()
  for (const text of texts) {
    memory = appendNote(memory, text, '2026-10-20').memory
  }
  return memory
}

const sample = memoryOf([
  'Aya prefers plain SQL migrations',
  'The waitlist fills cancellations automatically',
  'SQL migrations run before deploy',
])

describe('recall', () => {
  test('an empty pattern asks nothing', () => {
    const result = recall(sample, '   ')
    expect(result).toEqual({ ok: true, hits: [], total: 0, truncated: false })
  })

  test('it matches case-insensitively across the whole log', () => {
    const result = recall(sample, 'sql')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.total).toBe(2)
    expect(result.hits.map((hit) => hit.note.id)).toEqual([0, 2])
  })

  test('it is a regex, and it searches the rendered line', () => {
    const byRegex = recall(sample, 'wait(list|ing)')
    expect(byRegex.ok && byRegex.total).toBe(1)
    const byId = recall(sample, '^#2 ')
    expect(byId.ok && byId.total).toBe(1)
    const byDate = recall(sample, '2026-10-20')
    expect(byDate.ok && byDate.total).toBe(3)
  })

  test('a broken pattern is an answer, not a crash', () => {
    const result = recall(sample, '(unclosed')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('spans mark every match in a line', () => {
    const result = recall(memoryOf(['sql and SQL and sql']), 'sql')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const hit = result.hits[0]!
    expect(hit.spans).toHaveLength(3)
    for (const span of hit.spans) {
      expect(hit.line.slice(span.start, span.end).toLowerCase()).toBe('sql')
    }
  })

  test('a pattern that can match nothing does not hang', () => {
    const result = recall(sample, 'x*')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.total).toBe(0)
  })

  test('only the newest hits are handed back, and the rest are counted', () => {
    const many = memoryOf(Array.from({ length: 50 }, (_, i) => `hit ${i}`))
    const result = recall(many, 'hit', 10)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.total).toBe(50)
    expect(result.truncated).toBe(true)
    expect(result.hits).toHaveLength(10)
    expect(result.hits[result.hits.length - 1]!.note.id).toBe(49)
  })
})

describe('highlighting', () => {
  test('a line splits into plain and matched pieces that rejoin', () => {
    const line = 'plain SQL plain'
    const parts = splitBySpans(line, [{ start: 6, end: 9 }])
    expect(parts).toEqual([
      { text: 'plain ', match: false },
      { text: 'SQL', match: true },
      { text: ' plain', match: false },
    ])
    expect(parts.map((part) => part.text).join('')).toBe(line)
  })

  test('a match at the very start or end keeps the line intact', () => {
    expect(splitBySpans('abc', [{ start: 0, end: 3 }])).toEqual([
      { text: 'abc', match: true },
    ])
    expect(splitBySpans('abc', [{ start: 2, end: 3 }])).toEqual([
      { text: 'ab', match: false },
      { text: 'c', match: true },
    ])
  })
})
