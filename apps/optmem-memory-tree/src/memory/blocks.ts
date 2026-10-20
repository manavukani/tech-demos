/**
 * Block arithmetic.
 *
 * A block is an aligned power-of-two range of note ids, written `[lo, hi)`
 * internally and `#lo-(hi-1)` wherever a human reads it. Blocks tile the log
 * into a binary tree: `[lo, hi)` is the merge of `[lo, mid)` and `[mid, hi)`.
 * Alignment is what makes a range identify a tree node — `#4-5` is a node,
 * `#5-6` is just two notes that happen to be adjacent.
 */

export type Block = { lo: number; hi: number }

export const blockKey = ({ lo, hi }: Block) => `${lo}:${hi}`

/** `#lo-hi` the way the UI shows it: inclusive on both ends. */
export const blockLabel = ({ lo, hi }: Block) =>
  hi - lo === 1 ? `#${lo}` : `#${lo}-${hi - 1}`

export const blockSize = ({ lo, hi }: Block) => hi - lo

export const isAlignedBlock = ({ lo, hi }: Block) => {
  const n = hi - lo
  return n >= 1 && (n & (n - 1)) === 0 && lo % n === 0 && lo >= 0
}

export const halves = (block: Block): [Block, Block] => {
  const mid = (block.lo + block.hi) / 2
  return [
    { lo: block.lo, hi: mid },
    { lo: mid, hi: block.hi },
  ]
}

/** The node one level up that contains `block`, or null at the root. */
export const parentOf = (block: Block, total: number): Block | null => {
  const size = blockSize(block)
  if (size >= nextPowerOfTwo(total)) return null
  const lo = Math.floor(block.lo / (size * 2)) * (size * 2)
  return { lo, hi: lo + size * 2 }
}

export const nextPowerOfTwo = (n: number) => {
  let p = 1
  while (p < n) p *= 2
  return p
}

/** Parse the inclusive form a user can type or click, e.g. `0-7` or `#12`. */
export const parseBlockLabel = (text: string): Block | null => {
  const match = /^#?(\d+)(?:-(\d+))?$/.exec(text.trim())
  if (!match) return null
  const lo = Number(match[1])
  const hi = match[2] === undefined ? lo + 1 : Number(match[2]) + 1
  if (hi <= lo) return null
  const block = { lo, hi }
  return isAlignedBlock(block) ? block : null
}

/**
 * Tile `[0, total)` with aligned blocks, keeping a block whole only while its
 * size stays within `alpha` times its age. Larger alpha tolerates coarser
 * blocks, so it yields fewer lines; the newest notes are the youngest, so
 * they are the last to be collapsed.
 */
const coverAtAlpha = (total: number, alpha: number): Block[] => {
  const out: Block[] = []
  const stack: Block[] = [{ lo: 0, hi: nextPowerOfTwo(total) }]
  while (stack.length > 0) {
    const { lo, hi } = stack.pop()!
    if (lo >= total) continue
    const size = hi - lo
    // `hi > total` forces a split: a block that reaches past the end of the
    // log is not a finished node, so it has no summary to print.
    if (size > 1 && (hi > total || size > alpha * (total - lo))) {
      const mid = (lo + hi) / 2
      stack.push({ lo: mid, hi })
      stack.push({ lo, hi: mid })
    } else {
      out.push({ lo, hi })
    }
  }
  return out.sort((a, b) => a.lo - b.lo)
}

/**
 * The lines `wake` prints: at most `budget` blocks, detail concentrated on the
 * recent end. Under the budget nothing is collapsed and every note is verbatim.
 */
export const cover = (total: number, budget: number): Block[] => {
  if (total <= 0 || budget <= 0) return []
  if (total <= budget) {
    return Array.from({ length: total }, (_, i) => ({ lo: i, hi: i + 1 }))
  }
  let lo = 0
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (coverAtAlpha(total, mid).length > budget) lo = mid
    else hi = mid
  }
  const out = coverAtAlpha(total, hi)
  // Block sizes move in powers of two, so the search can land well under the
  // budget. Spend the slack on the newest splittable block, where the extra
  // line buys the most detail.
  while (out.length < budget) {
    let index = -1
    for (let i = out.length - 1; i >= 0; i--) {
      if (blockSize(out[i]!) > 1) {
        index = i
        break
      }
    }
    if (index === -1) break
    const [left, right] = halves(out[index]!)
    out.splice(index, 1, left, right)
  }
  return out
}
