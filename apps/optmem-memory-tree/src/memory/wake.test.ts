import { describe, expect, test } from 'bun:test'
import { blockLabel } from './blocks'
import {
  appendNote,
  applyMerge,
  emptyMemory,
  pendingMerges,
  type Memory,
} from './store'
import { estimateTokens, wake, wakeWithinTokens } from './wake'

const build = (count: number, settled: boolean): Memory => {
  let memory = emptyMemory()
  for (let i = 0; i < count; i++) {
    memory = appendNote(memory, `note number ${i}`, '2026-10-20').memory
  }
  if (!settled) return memory
  for (;;) {
    const [block] = pendingMerges(memory, 1)
    if (!block) return memory
    memory = applyMerge(memory, block, `summary of ${blockLabel(block)}`)!
  }
}

describe('wake', () => {
  test('an empty memory wakes with nothing', () => {
    const view = wake(emptyMemory(), 10)
    expect(view.lines).toEqual([])
    expect(view.tokens).toBe(0)
  })

  test('within the budget every line is a raw note', () => {
    const view = wake(build(6, true), 10)
    expect(view.lines.map((line) => line.kind)).toEqual(Array(6).fill('note'))
    expect(view.lines[0]!.text).toBe('#0 2026-10-20 note number 0')
  })

  test('over the budget the old end collapses into summaries', () => {
    const view = wake(build(32, true), 8)
    expect(view.lines.length).toBeLessThanOrEqual(8)
    expect(view.lines[0]!.kind).toBe('summary')
    expect(view.lines[view.lines.length - 1]!.kind).toBe('note')
    expect(view.lines[0]!.text).toMatch(/^#0-\d+ summary of /)
  })

  test('a line the tree has not merged yet is reported, not invented', () => {
    const view = wake(build(32, false), 8)
    expect(view.pending.length).toBeGreaterThan(0)
    expect(view.lines.some((line) => line.kind === 'pending')).toBe(true)
    expect(view.pending.map(blockLabel)).toEqual(
      view.lines.filter((line) => line.kind === 'pending').map((line) => blockLabel(line.block)),
    )
  })

  test('every note is still reachable, however small the budget', () => {
    const memory = build(32, true)
    for (const budget of [1, 2, 5, 32]) {
      const view = wake(memory, budget)
      const covered = view.lines.reduce(
        (sum, line) => sum + (line.block.hi - line.block.lo),
        0,
      )
      expect(covered).toBe(32)
    }
  })
})

describe('the token budget', () => {
  test('tokens are counted per line', () => {
    const view = wake(build(4, true), 10)
    expect(view.tokens).toBe(
      view.lines.reduce((sum, line) => sum + estimateTokens(line.text), 0),
    )
  })

  test('it buys the most detailed wake that fits', () => {
    const memory = build(64, true)
    const small = wakeWithinTokens(memory, 120)
    const large = wakeWithinTokens(memory, 600)
    expect(small.tokens).toBeLessThanOrEqual(120)
    expect(large.tokens).toBeLessThanOrEqual(600)
    expect(large.lines.length).toBeGreaterThan(small.lines.length)
  })

  test('a budget too small for one line still returns that line', () => {
    const view = wakeWithinTokens(build(64, true), 1)
    expect(view.lines).toHaveLength(1)
    expect(view.tokens).toBeGreaterThan(1)
  })

  test('the budget is a reading budget: the log is untouched', () => {
    const memory = build(64, true)
    const before = JSON.stringify(memory)
    wakeWithinTokens(memory, 200)
    wakeWithinTokens(memory, 2000)
    expect(JSON.stringify(memory)).toBe(before)
  })
})
