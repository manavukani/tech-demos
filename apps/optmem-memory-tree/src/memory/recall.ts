/**
 * `recall`: a regex over every note ever written, word for word.
 *
 * The tree is for navigating; recall is for the case where you remember a word
 * and nothing else. It searches the rendered line, so an id or a date is as
 * searchable as the text.
 */

import { renderNote, type Memory, type Note } from './store'

export type Span = { start: number; end: number }

export type RecallHit = { note: Note; line: string; spans: Span[] }

export type RecallResult =
  | { ok: true; hits: RecallHit[]; total: number; truncated: boolean }
  | { ok: false; error: string }

/** How many hits are handed back; the rest are dropped oldest-first. */
export const RECALL_LIMIT = 200

export const recall = (
  memory: Memory,
  pattern: string,
  limit = RECALL_LIMIT,
): RecallResult => {
  if (pattern.trim().length === 0) {
    return { ok: true, hits: [], total: 0, truncated: false }
  }
  let regex: RegExp
  try {
    regex = new RegExp(pattern, 'gi')
  } catch (error) {
    return { ok: false, error: (error as Error).message }
  }
  const hits: RecallHit[] = []
  let total = 0
  for (const note of memory.log) {
    const line = renderNote(note)
    const spans = matchSpans(regex, line)
    if (spans.length === 0) continue
    total++
    hits.push({ note, line, spans })
    // Keep the newest: a vague regex matches the whole log, and the whole log
    // is not an answer.
    if (hits.length > limit) hits.shift()
  }
  return { ok: true, hits, total, truncated: hits.length < total }
}

const matchSpans = (regex: RegExp, line: string): Span[] => {
  regex.lastIndex = 0
  const spans: Span[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    if (match[0].length === 0) {
      // A pattern that can match nothing would otherwise spin forever, and a
      // zero-width hit is not something to highlight.
      regex.lastIndex++
      continue
    }
    spans.push({ start: match.index, end: match.index + match[0].length })
  }
  return spans
}

/** Split a line into alternating plain and matched pieces, for rendering. */
export const splitBySpans = (line: string, spans: Span[]) => {
  const parts: { text: string; match: boolean }[] = []
  let at = 0
  for (const span of spans) {
    if (span.start > at) parts.push({ text: line.slice(at, span.start), match: false })
    parts.push({ text: line.slice(span.start, span.end), match: true })
    at = span.end
  }
  if (at < line.length) parts.push({ text: line.slice(at), match: false })
  return parts
}
