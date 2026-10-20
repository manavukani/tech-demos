import { describe, expect, test } from 'bun:test'
import {
  appendNote,
  applyMerge,
  checkNote,
  emptyMemory,
  forgetSummary,
  mergeSource,
  pendingCount,
  pendingMerges,
  summaryOf,
  zoom,
  type Memory,
} from './store'
import { blockLabel } from './blocks'

const withNotes = (count: number): Memory => {
  let memory = emptyMemory()
  for (let i = 0; i < count; i++) {
    memory = appendNote(memory, `note ${i}`, '2026-10-20').memory
  }
  return memory
}

/** Settle every pending merge, labelling each summary with its own block. */
const settle = (memory: Memory): Memory => {
  let next = memory
  for (;;) {
    const [block] = pendingMerges(next, 1)
    if (!block) return next
    const merged = applyMerge(next, block, `sum ${blockLabel(block)}`)
    if (!merged) return next
    next = merged
  }
}

describe('the log', () => {
  test('ids are positions, and the log only grows', () => {
    const first = appendNote(emptyMemory(), 'one', '2026-10-01')
    const second = appendNote(first.memory, 'two', '2026-10-02')
    expect(first.id).toBe(0)
    expect(second.id).toBe(1)
    expect(second.memory.log.map((note) => note.id)).toEqual([0, 1])
    expect(first.memory.log).toHaveLength(1)
  })

  test('a note is one line, within the byte limit', () => {
    expect(checkNote('a normal note')).toBeNull()
    expect(checkNote('   ')?.reason).toContain('one line')
    expect(checkNote('two\nlines')?.reason).toContain('one line')
    expect(checkNote('x'.repeat(281))?.reason).toContain('281 bytes')
    // Accented characters cost two bytes, so the limit bites earlier.
    expect(checkNote('é'.repeat(141))?.reason).toContain('282 bytes')
    expect(checkNote('é'.repeat(140))).toBeNull()
  })
})

describe('pending merges', () => {
  test('nothing is due until a block is complete', () => {
    expect(pendingMerges(withNotes(1))).toEqual([])
    expect(pendingMerges(withNotes(2))).toEqual([{ lo: 0, hi: 2 }])
    expect(pendingMerges(withNotes(3))).toEqual([{ lo: 0, hi: 2 }])
  })

  test('they arrive smallest first, in order', () => {
    expect(pendingMerges(withNotes(4)).map(blockLabel)).toEqual([
      '#0-1',
      '#2-3',
      '#0-3',
    ])
    expect(pendingMerges(withNotes(8)).map(blockLabel)).toEqual([
      '#0-1',
      '#2-3',
      '#4-5',
      '#6-7',
      '#0-3',
      '#4-7',
      '#0-7',
    ])
  })

  test('a block appears only once its halves have settled', () => {
    const memory = withNotes(4)
    const after = applyMerge(memory, { lo: 0, hi: 2 }, 'first pair')!
    expect(pendingMerges(after).map(blockLabel)).toEqual(['#2-3', '#0-3'])
  })

  test('the count matches the queue', () => {
    for (const total of [0, 1, 2, 7, 16, 31, 32]) {
      const memory = withNotes(total)
      expect(pendingCount(memory)).toBe(pendingMerges(memory).length)
    }
  })

  test('32 notes settle into exactly 31 merges and one root', () => {
    const memory = settle(withNotes(32))
    expect(pendingCount(memory)).toBe(0)
    expect(summaryOf(memory, { lo: 0, hi: 32 })).toBe('sum #0-31')
    expect(Object.values(memory.levels).flat()).toHaveLength(31)
  })
})

describe('recording a merge', () => {
  test('a summary out of order is refused', () => {
    const memory = withNotes(4)
    expect(applyMerge(memory, { lo: 2, hi: 4 }, 'early')).toBeNull()
    expect(applyMerge(memory, { lo: 0, hi: 4 }, 'early')).toBeNull()
    expect(applyMerge(memory, { lo: 0, hi: 2 }, 'fine')).not.toBeNull()
  })

  test('a settled block cannot be written twice', () => {
    const memory = applyMerge(withNotes(2), { lo: 0, hi: 2 }, 'once')!
    expect(applyMerge(memory, { lo: 0, hi: 2 }, 'twice')).toBeNull()
  })
})

describe('forgetting', () => {
  test('it drops the summary and everything built on it', () => {
    const memory = settle(withNotes(8))
    const { memory: after, dropped } = forgetSummary(memory, { lo: 2, hi: 4 })
    expect(dropped.map(blockLabel)).toEqual(['#2-3', '#4-5', '#6-7', '#0-3', '#4-7', '#0-7'])
    expect(summaryOf(after, { lo: 0, hi: 2 })).toBe('sum #0-1')
    expect(summaryOf(after, { lo: 2, hi: 4 })).toBeNull()
    expect(summaryOf(after, { lo: 0, hi: 8 })).toBeNull()
  })

  test('the log survives, so the same tree can be rebuilt', () => {
    const before = settle(withNotes(8))
    const { memory: after } = forgetSummary(before, { lo: 0, hi: 2 })
    expect(after.log).toEqual(before.log)
    expect(settle(after).levels).toEqual(before.levels)
  })
})

describe('what a merge is shown', () => {
  test('small blocks merge from the raw notes', () => {
    const source = mergeSource(withNotes(4), { lo: 0, hi: 4 })
    expect(source.kind).toBe('notes')
    if (source.kind === 'notes') {
      expect(source.notes.map((note) => note.text)).toEqual([
        'note 0',
        'note 1',
        'note 2',
        'note 3',
      ])
    }
  })

  test('big blocks merge from the two summaries below', () => {
    const memory = settle(withNotes(32))
    const source = mergeSource(memory, { lo: 0, hi: 32 })
    expect(source.kind).toBe('summaries')
    if (source.kind === 'summaries') {
      expect(source.children.map((child) => child.text)).toEqual([
        'sum #0-15',
        'sum #16-31',
      ])
    }
  })
})

describe('zoom', () => {
  test('a node opens into its two halves', () => {
    const memory = settle(withNotes(8))
    expect(zoom(memory, { lo: 0, hi: 8 })).toEqual([
      { kind: 'summary', block: { lo: 0, hi: 4 }, text: 'sum #0-3' },
      { kind: 'summary', block: { lo: 4, hi: 8 }, text: 'sum #4-7' },
    ])
  })

  test('the last level opens into raw notes', () => {
    const memory = settle(withNotes(8))
    const halves = zoom(memory, { lo: 0, hi: 2 })
    expect(halves.map((half) => half.kind)).toEqual(['note', 'note'])
  })

  test('a half beyond the end of the log is skipped', () => {
    const memory = withNotes(3)
    expect(zoom(memory, { lo: 2, hi: 4 })).toEqual([
      { kind: 'note', block: { lo: 2, hi: 3 }, note: memory.log[2]! },
    ])
  })

  test('an unmerged half reads as missing, not as empty', () => {
    const memory = withNotes(4)
    expect(zoom(memory, { lo: 0, hi: 4 })).toEqual([
      { kind: 'summary', block: { lo: 0, hi: 2 }, text: null },
      { kind: 'summary', block: { lo: 2, hi: 4 }, text: null },
    ])
  })
})
