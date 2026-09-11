import MiniSearch from 'minisearch'
import type { InboxDocument } from './types'

interface IndexedDoc {
  id: string
  name: string
  text: string
  tags: string
}

export interface SearchHit {
  id: string
  score: number
  /** Query terms (post-stemming/prefix) that matched, for highlighting. */
  terms: string[]
}

export function buildIndex(docs: InboxDocument[]): MiniSearch<IndexedDoc> {
  const index = new MiniSearch<IndexedDoc>({
    fields: ['name', 'text', 'tags'],
    searchOptions: {
      boost: { name: 3, tags: 2 },
      prefix: true,
      fuzzy: 0.15,
      combineWith: 'AND',
    },
  })
  index.addAll(
    docs.map((d) => ({ id: d.id, name: d.name, text: d.text, tags: d.tags.join(' ') })),
  )
  return index
}

export function runSearch(index: MiniSearch<IndexedDoc>, query: string): SearchHit[] {
  return index
    .search(query)
    .map((r) => ({ id: r.id as string, score: r.score, terms: r.terms }))
}

/** A short window of `text` around the first occurrence of any term. */
export function snippet(text: string, terms: string[], radius = 70): string {
  if (!text) return ''
  const lower = text.toLowerCase()
  let at = -1
  for (const term of terms) {
    const i = lower.indexOf(term.toLowerCase())
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  if (at === -1) return text.slice(0, radius * 2).replace(/\s+/g, ' ')
  const start = Math.max(0, at - radius)
  const end = Math.min(text.length, at + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ')}${end < text.length ? '…' : ''}`
}

/** Split `text` into alternating [plain, match, plain, ...] segments. */
export function highlightSegments(text: string, terms: string[]): { text: string; hit: boolean }[] {
  const clean = terms.map((t) => t.trim()).filter(Boolean)
  if (!clean.length || !text) return [{ text, hit: false }]
  const alternation = clean.map(escapeRegExp).join('|')
  const splitter = new RegExp(`(${alternation})`, 'gi')
  const isHit = new RegExp(`^(?:${alternation})$`, 'i')
  return text
    .split(splitter)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, hit: isHit.test(part) }))
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
