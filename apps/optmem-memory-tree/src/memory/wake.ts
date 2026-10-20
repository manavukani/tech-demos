/**
 * `wake`: the document an agent reads at the start of a session.
 *
 * It is a reading budget, not a storage budget. The log never shrinks; the
 * budget only decides how much of it is spent on summaries versus verbatim
 * notes. Spend more and the recent past arrives note by note; spend less and
 * the old end collapses into single lines.
 */

import { blockLabel, blockSize, cover, type Block } from './blocks'
import { renderNote, summaryOf, type Memory, type Note } from './store'

export type WakeLine =
  | { kind: 'note'; block: Block; note: Note; text: string }
  | { kind: 'summary'; block: Block; text: string }
  | { kind: 'pending'; block: Block; text: string }

export type WakeView = {
  /** How many lines the cover was allowed to use. */
  lineBudget: number
  lines: WakeLine[]
  tokens: number
  /** Blocks the document needs but that have not been merged yet. */
  pending: Block[]
  noteCount: number
}

/**
 * A rough stand-in for a tokenizer: four characters per token, one more for
 * the line break. Good enough to shop for a budget, and it never calls out.
 */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4) + 1

export const wakeLineText = (line: WakeLine) => line.text

export const wake = (memory: Memory, lineBudget: number): WakeView => {
  const total = memory.log.length
  const lines: WakeLine[] = []
  const pending: Block[] = []
  for (const block of cover(total, lineBudget)) {
    if (blockSize(block) === 1) {
      const note = memory.log[block.lo]
      if (!note) continue
      lines.push({ kind: 'note', block, note, text: renderNote(note) })
      continue
    }
    const summary = summaryOf(memory, block)
    if (summary === null) {
      pending.push(block)
      lines.push({
        kind: 'pending',
        block,
        text: `${blockLabel(block)} (not merged yet)`,
      })
      continue
    }
    lines.push({
      kind: 'summary',
      block,
      text: `${blockLabel(block)} ${summary}`,
    })
  }
  const tokens = lines.reduce((sum, line) => sum + estimateTokens(line.text), 0)
  return { lineBudget, lines, tokens, pending, noteCount: total }
}

/**
 * The most detailed wake that still fits `tokenBudget`. Token cost grows with
 * the line budget, so the largest affordable budget is found by bisection; a
 * budget too small for even one line still returns that line, so the caller
 * always has something to show and can see that it overflows.
 */
export const wakeWithinTokens = (
  memory: Memory,
  tokenBudget: number,
): WakeView => {
  const total = memory.log.length
  if (total === 0) return wake(memory, 1)
  let low = 1
  let high = total
  let best = wake(memory, 1)
  if (best.tokens > tokenBudget) return best
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const view = wake(memory, mid)
    if (view.tokens <= tokenBudget) {
      best = view
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return best
}
