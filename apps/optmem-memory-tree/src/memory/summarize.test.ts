import { describe, expect, test } from 'bun:test'
import { blockLabel, type Block } from './blocks'
import { SEED_NOTES } from './seed'
import {
  appendNote,
  applyMerge,
  emptyMemory,
  ENTRY_BYTES,
  mergeSource,
  pendingMerges,
  summaryOf,
  type Memory,
} from './store'
import { summarize, summaryCore, topics } from './summarize'

const seeded = (count = SEED_NOTES.length): Memory => {
  let memory = emptyMemory()
  for (const note of SEED_NOTES.slice(0, count)) {
    memory = appendNote(memory, note.text, note.date).memory
  }
  return memory
}

const settle = (memory: Memory): Memory => {
  let next = memory
  for (;;) {
    const [block] = pendingMerges(next, 1)
    if (!block) return next
    next = applyMerge(next, block, summarize(block, mergeSource(next, block)))!
  }
}

const allBlocks = (memory: Memory): Block[] => {
  const out: Block[] = []
  for (const [size, level] of Object.entries(memory.levels)) {
    level.forEach((_, index) => {
      out.push({ lo: index * Number(size), hi: (index + 1) * Number(size) })
    })
  }
  return out
}

describe('the local summariser', () => {
  test('every summary is one line inside the note limit', () => {
    const memory = settle(seeded())
    const summaries = Object.values(memory.levels).flat()
    expect(summaries).toHaveLength(31)
    for (const summary of summaries) {
      expect(summary).not.toContain('\n')
      expect(new TextEncoder().encode(summary).length).toBeLessThanOrEqual(ENTRY_BYTES)
    }
  })

  test('it is deterministic: the same log rebuilds the same tree', () => {
    expect(settle(seeded()).levels).toEqual(settle(seeded()).levels)
  })

  test('a summary says how many notes it stands for', () => {
    const memory = settle(seeded())
    for (const block of allBlocks(memory)) {
      expect(summaryOf(memory, block)).toContain(`${block.hi - block.lo} notes`)
    }
  })

  test('it invents nothing: every clause is text from a note it covers', () => {
    const memory = settle(seeded())
    for (const block of allBlocks(memory)) {
      const covered = memory.log.slice(block.lo, block.hi).map((note) => note.text)
      for (const clause of summaryCore(summaryOf(memory, block)!).split('; ')) {
        const quoted = clause.replace(/…$/, '')
        expect(covered.some((text) => text.includes(quoted))).toBe(true)
      }
    }
  })

  test('a merge is shorter than the lines it merges', () => {
    const memory = settle(seeded())
    for (const block of allBlocks(memory)) {
      const summary = summaryOf(memory, block)!
      const covered = memory.log
        .slice(block.lo, block.hi)
        .reduce((sum, note) => sum + note.text.length, 0)
      expect(summary.length).toBeLessThan(covered)
    }
  })

  test('the trail does not nest as the tree grows', () => {
    const memory = settle(seeded())
    const root = summaryOf(memory, { lo: 0, hi: 32 })!
    expect(root.match(/ · \d+ notes/g)).toHaveLength(1)
    expect(summaryCore(root)).not.toMatch(/ · \d+ notes/)
  })

  test('a merge of summaries reads from its children, not the raw log', () => {
    const memory = settle(seeded())
    const parent = summaryOf(memory, { lo: 0, hi: 32 })!
    const left = summaryCore(summaryOf(memory, { lo: 0, hi: 16 })!)
    const right = summaryCore(summaryOf(memory, { lo: 16, hi: 32 })!)
    const words = (text: string) => new Set(text.toLowerCase().match(/[a-z]{5,}/g) ?? [])
    const fromChildren = new Set([...words(left), ...words(right)])
    const shared = [...words(summaryCore(parent))].filter((word) => fromChildren.has(word))
    expect(shared.length).toBeGreaterThan(0)
  })

  test('summaries differ: each block describes its own notes', () => {
    const memory = settle(seeded())
    const labels = allBlocks(memory).map((block) => blockLabel(block))
    const summaries = allBlocks(memory).map((block) => summaryOf(memory, block))
    expect(new Set(summaries).size).toBe(labels.length)
  })

  test('topics rank the salient words and ignore filler', () => {
    const tags = topics(
      [
        'The waitlist fills cancellations for Rowan Dental',
        'Rowan Dental asked about the waitlist again',
      ],
      3,
    )
    expect(tags).toContain('rowan')
    expect(tags).toContain('waitlist')
    expect(tags).not.toContain('the')
  })

  test('a summary of nothing is still a line', () => {
    const summary = summarize({ lo: 0, hi: 2 }, { kind: 'notes', notes: [] })
    expect(summary).toBe('2 notes')
  })
})
