import { describe, expect, test } from 'bun:test'
import {
  blockLabel,
  blockSize,
  cover,
  halves,
  isAlignedBlock,
  nextPowerOfTwo,
  parentOf,
  parseBlockLabel,
} from './blocks'

describe('block shape', () => {
  test('a block is an aligned power-of-two range', () => {
    expect(isAlignedBlock({ lo: 0, hi: 8 })).toBe(true)
    expect(isAlignedBlock({ lo: 8, hi: 16 })).toBe(true)
    expect(isAlignedBlock({ lo: 4, hi: 6 })).toBe(true)
    expect(isAlignedBlock({ lo: 5, hi: 7 })).toBe(false)
    expect(isAlignedBlock({ lo: 0, hi: 6 })).toBe(false)
    expect(isAlignedBlock({ lo: 2, hi: 6 })).toBe(false)
  })

  test('labels are inclusive at both ends', () => {
    expect(blockLabel({ lo: 0, hi: 1 })).toBe('#0')
    expect(blockLabel({ lo: 0, hi: 16 })).toBe('#0-15')
    expect(blockLabel({ lo: 16, hi: 24 })).toBe('#16-23')
  })

  test('labels parse back, and non-blocks are refused', () => {
    expect(parseBlockLabel('#0-15')).toEqual({ lo: 0, hi: 16 })
    expect(parseBlockLabel('16-23')).toEqual({ lo: 16, hi: 24 })
    expect(parseBlockLabel('#7')).toEqual({ lo: 7, hi: 8 })
    expect(parseBlockLabel('5-6')).toBeNull()
    expect(parseBlockLabel('0-5')).toBeNull()
    expect(parseBlockLabel('nope')).toBeNull()
  })

  test('halves split and parents climb', () => {
    expect(halves({ lo: 0, hi: 8 })).toEqual([
      { lo: 0, hi: 4 },
      { lo: 4, hi: 8 },
    ])
    expect(parentOf({ lo: 4, hi: 8 }, 16)).toEqual({ lo: 0, hi: 8 })
    expect(parentOf({ lo: 8, hi: 16 }, 16)).toEqual({ lo: 0, hi: 16 })
    expect(parentOf({ lo: 0, hi: 16 }, 16)).toBeNull()
    expect(nextPowerOfTwo(32)).toBe(32)
    expect(nextPowerOfTwo(33)).toBe(64)
  })
})

describe('cover', () => {
  test('an empty log covers nothing', () => {
    expect(cover(0, 10)).toEqual([])
  })

  test('under budget every note stays verbatim', () => {
    expect(cover(3, 10)).toEqual([
      { lo: 0, hi: 1 },
      { lo: 1, hi: 2 },
      { lo: 2, hi: 3 },
    ])
  })

  test('it tiles the whole log exactly once', () => {
    for (const total of [1, 5, 16, 17, 31, 64, 100, 257]) {
      for (const budget of [1, 2, 3, 8, 12, 40]) {
        const blocks = cover(total, budget)
        let at = 0
        for (const block of blocks) {
          expect(block.lo).toBe(at)
          expect(isAlignedBlock(block)).toBe(true)
          at = block.hi
        }
        expect(at).toBe(total)
      }
    }
  })

  test('it never spends more lines than the budget', () => {
    // A log that is not a power of two long has a floor: 20 notes are 16 + 4
    // whatever the budget, because no aligned block spans the two. So the
    // budget binds, except where that floor is higher.
    const floor = (total: number) => total.toString(2).split('1').length - 1
    for (const total of [20, 33, 64, 500, 1000]) {
      for (const budget of [1, 4, 7, 16, 96]) {
        expect(cover(total, budget).length).toBeLessThanOrEqual(
          Math.max(budget, floor(total)),
        )
      }
    }
    for (const total of [64, 256, 1024]) {
      for (const budget of [1, 4, 7, 16, 96]) {
        expect(cover(total, budget).length).toBeLessThanOrEqual(budget)
      }
    }
  })

  test('detail lands on the recent end', () => {
    const blocks = cover(64, 8)
    const first = blocks[0]!
    const last = blocks[blocks.length - 1]!
    expect(blockSize(first)).toBeGreaterThan(blockSize(last))
    expect(blockSize(last)).toBe(1)
  })

  test('a bigger budget never coarsens the newest line', () => {
    let previous = Infinity
    for (const budget of [2, 4, 8, 16, 32]) {
      const blocks = cover(200, budget)
      const newest = blockSize(blocks[blocks.length - 1]!)
      expect(newest).toBeLessThanOrEqual(previous)
      previous = newest
    }
  })

  test('every block except the newest ones is at least as old as it is big', () => {
    const total = 300
    for (const block of cover(total, 12)) {
      const age = total - block.lo
      expect(blockSize(block)).toBeLessThanOrEqual(age)
    }
  })
})
