/**
 * The memory itself: an append-only log of one-line notes, plus a cache of
 * one-line summaries over it.
 *
 * The log is the only source of truth. The summary cache is organised by level
 * (block size 2, 4, 8, ...) and each level holds a dense prefix, so the length
 * of a level says exactly how far that level got — which is all `pending`
 * needs to know, with no separate bookkeeping to fall out of sync.
 */

import { blockLabel, blockSize, halves, type Block } from './blocks'

export type Note = { id: number; date: string; text: string }

/** `levels[size]` holds the summaries of blocks of that size, oldest first. */
export type Summaries = Record<number, string[]>

export type Memory = {
  log: Note[]
  levels: Summaries
}

/** One note is one line of at most this many UTF-8 bytes, as upstream. */
export const ENTRY_BYTES = 280

/** Blocks this small merge straight from the raw notes, not from summaries. */
export const RAW_MAX = 16

const utf8Length = (text: string) => new TextEncoder().encode(text).length

export const emptyMemory = (): Memory => ({ log: [], levels: {} })

export const noteCount = (memory: Memory) => memory.log.length

export type NoteProblem = { reason: string }

/** Validate a note the way `memo note` does, before anything is appended. */
export const checkNote = (text: string): NoteProblem | null => {
  const trimmed = text.trim()
  if (trimmed.length === 0) return { reason: 'A note is one line of text.' }
  if (/[\n\r]/.test(trimmed)) {
    return { reason: 'A note is one line. Split it, or merge it yourself.' }
  }
  const bytes = utf8Length(trimmed)
  if (bytes > ENTRY_BYTES) {
    return {
      reason: `${bytes} bytes, limit ${ENTRY_BYTES}. Accented characters cost 2. Compress it further.`,
    }
  }
  return null
}

export const appendNote = (
  memory: Memory,
  text: string,
  date: string,
): { memory: Memory; id: number } => {
  const id = memory.log.length
  const note: Note = { id, date, text: text.trim() }
  return { memory: { ...memory, log: [...memory.log, note] }, id }
}

export const getNote = (memory: Memory, id: number): Note | undefined =>
  memory.log[id]

export const summaryOf = (memory: Memory, block: Block): string | null => {
  const size = blockSize(block)
  if (size === 1) return null
  const level = memory.levels[size]
  return level?.[block.lo / size] ?? null
}

export const builtAtLevel = (memory: Memory, size: number): number =>
  memory.levels[size]?.length ?? 0

/**
 * Blocks that could be merged but have not been, smallest first — the order
 * upstream hands them over, one merge at a time. A level is only ever extended
 * by one at its end, so the whole queue is derived from the level lengths.
 */
export const pendingMerges = (memory: Memory, limit?: number): Block[] => {
  const total = memory.log.length
  const todo: Block[] = []
  for (let size = 2; size <= total; size *= 2) {
    const built = builtAtLevel(memory, size)
    for (let k = built; k < Math.floor(total / size); k++) {
      todo.push({ lo: k * size, hi: (k + 1) * size })
      if (limit !== undefined && todo.length >= limit) return todo
    }
  }
  return todo
}

export const pendingCount = (memory: Memory): number => {
  const total = memory.log.length
  let n = 0
  for (let size = 2; size <= total; size *= 2) {
    n += Math.max(0, Math.floor(total / size) - builtAtLevel(memory, size))
  }
  return n
}

/**
 * Record one summary. A merge is only accepted when everything it is made of
 * is already there: the notes it covers, the two summaries below it, and every
 * earlier block on its own level. Anything else is a stale or out-of-order
 * request, and taking it would put a line in the tree that the log cannot
 * account for.
 */
export const applyMerge = (
  memory: Memory,
  block: Block,
  summary: string,
): Memory | null => {
  const size = blockSize(block)
  if (size < 2 || block.hi > memory.log.length) return null
  if (size >= 4 && halves(block).some((half) => summaryOf(memory, half) === null)) {
    return null
  }
  const level = memory.levels[size] ?? []
  if (level.length !== block.lo / size) return null
  return {
    ...memory,
    levels: { ...memory.levels, [size]: [...level, summary.trim()] },
  }
}

/**
 * Drop a summary and everything built on top of it, by truncating each level
 * back to that point. Later blocks on those levels go too and are merged
 * again; the log is never touched, so no note is ever lost.
 */
export const forgetSummary = (
  memory: Memory,
  block: Block,
): { memory: Memory; dropped: Block[] } => {
  const total = memory.log.length
  const dropped: Block[] = []
  const levels: Summaries = { ...memory.levels }
  for (let size = blockSize(block); size <= total; size *= 2) {
    const level = levels[size]
    if (!level) continue
    const k = Math.floor(block.lo / size)
    if (level.length > k) {
      for (let i = k; i < level.length; i++) {
        dropped.push({ lo: i * size, hi: (i + 1) * size })
      }
      levels[size] = level.slice(0, k)
    }
  }
  return { memory: { ...memory, levels }, dropped }
}

/** The raw notes a block covers, clipped to what the log actually holds. */
export const notesIn = (memory: Memory, block: Block): Note[] =>
  memory.log.slice(block.lo, Math.min(block.hi, memory.log.length))

/**
 * What a merge is shown: the two child summaries, or the raw notes while the
 * block is still small enough that summarising summaries would lose more than
 * it saves.
 */
export type MergeSource =
  | { kind: 'notes'; notes: Note[] }
  | { kind: 'summaries'; children: { block: Block; text: string }[] }

export const mergeSource = (memory: Memory, block: Block): MergeSource => {
  if (blockSize(block) <= RAW_MAX) {
    return { kind: 'notes', notes: notesIn(memory, block) }
  }
  const children = halves(block).map((child) => ({
    block: child,
    text: summaryOf(memory, child) ?? '',
  }))
  return { kind: 'summaries', children }
}

/** The lines `zoom` prints: a node opened into its two halves. */
export type ZoomHalf =
  | { kind: 'note'; block: Block; note: Note }
  | { kind: 'summary'; block: Block; text: string | null }

export const zoom = (memory: Memory, block: Block): ZoomHalf[] => {
  const total = memory.log.length
  const out: ZoomHalf[] = []
  for (const half of halves(block)) {
    if (half.lo >= total) continue
    if (blockSize(half) === 1) {
      const note = memory.log[half.lo]
      if (note) out.push({ kind: 'note', block: half, note })
    } else {
      out.push({ kind: 'summary', block: half, text: summaryOf(memory, half) })
    }
  }
  return out
}

export const renderNote = (note: Note) => `#${note.id} ${note.date} ${note.text}`

export const renderSummary = (block: Block, text: string) =>
  `${blockLabel(block)} ${text}`
