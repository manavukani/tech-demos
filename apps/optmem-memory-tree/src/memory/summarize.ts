/**
 * The merge step, done locally and deterministically.
 *
 * Upstream hands each merge to the agent that owns the memory: a model reads
 * two halves and writes one line. There is no model here, so this stub does
 * the mechanical part of the same job — keep the salient words, drop the rest,
 * fit one line — and does it the same way every time, so a tree rebuilt from
 * the same log comes out identical. It is a stand-in for judgement, not a
 * replacement: it cannot tell what had lasting effect.
 */

import { blockSize, type Block } from './blocks'
import { ENTRY_BYTES, type MergeSource } from './store'

/** Separator between a summary's own line and the trail it carries. */
const TRAIL = ' · '

const TRAIL_PATTERN = / · \d+ notes(?: · [^·]*)?$/

const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'but', 'by', 'can', 'did', 'do',
  'does', 'doing', 'done', 'each', 'for', 'from', 'get', 'got', 'had', 'has',
  'have', 'he', 'her', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'just', 'me', 'more', 'most', 'my', 'no', 'not', 'now', 'of', 'off', 'on',
  'one', 'only', 'or', 'our', 'out', 'over', 'own', 'said', 'same', 'she',
  'should', 'so', 'some', 'still', 'such', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'to', 'too', 'two', 'up',
  'us', 'use', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
])

const WORD = /[A-Za-z0-9][A-Za-z0-9'+./#-]*/g

const byteLength = (text: string) => new TextEncoder().encode(text).length

/** The summary without the trail it accumulated from its children. */
export const summaryCore = (text: string) => text.replace(TRAIL_PATTERN, '').trim()

const words = (text: string) => text.match(WORD) ?? []

/**
 * Word weights for one block. Frequency says what the block is about; capitals
 * and digits mark the names, versions and numbers that a one-line summary can
 * least afford to drop.
 */
const weigh = (texts: string[]) => {
  const scores = new Map<string, number>()
  const firstSeen = new Map<string, number>()
  let position = 0
  for (const text of texts) {
    for (const word of words(text)) {
      const key = word.toLowerCase()
      position++
      if (key.length < 3 || STOPWORDS.has(key)) continue
      let weight = 1
      if (/^[A-Z]/.test(word)) weight += 0.6
      if (/\d/.test(word)) weight += 0.4
      if (key.length >= 8) weight += 0.3
      scores.set(key, (scores.get(key) ?? 0) + weight)
      if (!firstSeen.has(key)) firstSeen.set(key, position)
    }
  }
  return { scores, firstSeen }
}

/** The words a reader should see in the summary's trail, strongest first. */
export const topics = (texts: string[], count: number): string[] => {
  const { scores, firstSeen } = weigh(texts)
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || (firstSeen.get(a[0]) ?? 0) - (firstSeen.get(b[0]) ?? 0))
    .slice(0, count)
    .map(([word]) => word)
}

/** Keep whole words only, and say so when something was cut. */
const clip = (text: string, budget: number): string => {
  if (byteLength(text) <= budget) return text
  const pieces = text.split(' ')
  let out = ''
  for (const piece of pieces) {
    const next = out === '' ? piece : `${out} ${piece}`
    if (byteLength(next) + 1 > budget) break
    out = next
  }
  if (out === '') out = text.slice(0, Math.max(1, budget - 1))
  return `${out.replace(/[,;:.]$/, '')}…`
}

/**
 * Pick the lines that carry the block, then order them as they happened. A
 * line scores by the weight of the words it holds, damped by its length so a
 * long line cannot win on sheer volume.
 */
const leadLines = (texts: string[], howMany: number): string[] => {
  const { scores } = weigh(texts)
  const ranked = texts
    .map((text, index) => {
      const bag = words(text).map((word) => word.toLowerCase())
      const total = bag.reduce((sum, word) => sum + (scores.get(word) ?? 0), 0)
      return { index, text, score: total / Math.sqrt(Math.max(1, bag.length)) }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, howMany)
    .sort((a, b) => a.index - b.index)
  return ranked.map((line) => line.text)
}

/** Strip the leading `#id date` a raw log line carries. */
const noteBody = (text: string) => text.replace(/^#\d+ \d{4}-\d{2}-\d{2} /, '')

/** Separator between the two things a summary found room to keep. */
const JOIN = '; '

/**
 * A child summary contributes only its own strongest clause upward. Carrying
 * both would double the text at every level, and the level above has the same
 * one line to fit it in.
 */
const strongestClause = (core: string) => core.split(JOIN)[0] ?? core

export const summarize = (block: Block, source: MergeSource): string => {
  const size = blockSize(block)
  const inputs =
    source.kind === 'notes'
      ? source.notes.map((note) => noteBody(note.text))
      : source.children.map((child) => strongestClause(summaryCore(child.text)))
  const full =
    source.kind === 'notes' ? inputs : source.children.map((child) => child.text)
  const tags = topics(full, 3)
  const trail = `${size} notes${tags.length > 0 ? ` · ${tags.join(', ')}` : ''}`
  const coreBudget = ENTRY_BYTES - byteLength(trail) - byteLength(TRAIL)
  // A pair of notes keeps one line of the two; everything above keeps two, one
  // from each side, so both halves are represented all the way to the root.
  const keep = size === 2 ? 1 : 2
  const leads = leadLines(inputs, keep)
    .map((line) => line.replace(/\s+/g, ' ').trim().replace(/[.;]$/, ''))
    .filter((line) => line.length > 0)
  if (leads.length === 0) return trail
  const share = Math.floor((coreBudget - byteLength(JOIN)) / leads.length)
  const core = leads.map((line) => clip(line, share)).join(JOIN)
  return `${clip(core, coreBudget)}${TRAIL}${trail}`
}
