/**
 * The app's one piece of state: the memory, plus the merge queue that drains
 * it. Merges are applied one at a time on a timer, because that is how they
 * arrive upstream — a note comes in, the next merge comes due, and the agent
 * answers it before doing anything else. Draining them one by one is also what
 * makes the tree visibly build itself.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  appendNote,
  applyMerge,
  blockKey,
  checkNote,
  emptyMemory,
  forgetSummary,
  mergeSource,
  pendingMerges,
  SEED_NOTES,
  summarize,
  type Block,
  type Memory,
} from '#/memory'

const STORAGE_KEY = 'optmem-memory-tree:v1'

/** Between merges, so the tree can be watched rather than just read. */
const MERGE_INTERVAL_MS = 170

type Stored = { log: Memory['log']; levels: Memory['levels'] }

const load = (): Memory | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!Array.isArray(parsed.log)) return null
    return { log: parsed.log, levels: parsed.levels ?? {} }
  } catch {
    return null
  }
}

const seededMemory = (): Memory => {
  let memory = emptyMemory()
  for (const note of SEED_NOTES) {
    memory = appendNote(memory, note.text, note.date).memory
  }
  return memory
}

const today = () => new Date().toISOString().slice(0, 10)

export type MemoryController = ReturnType<typeof useMemory>

export const useMemory = () => {
  const [memory, setMemory] = useState<Memory>(() => load() ?? seededMemory())
  const [autoMerge, setAutoMerge] = useState(true)
  const [lastSettled, setLastSettled] = useState<Block | null>(null)
  const [lastNoteId, setLastNoteId] = useState<number | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ log: memory.log, levels: memory.levels } satisfies Stored),
    )
  }, [memory])

  const pending = useMemo(() => pendingMerges(memory), [memory])

  const mergeNext = useCallback(() => {
    setMemory((current) => {
      const [block] = pendingMerges(current, 1)
      if (!block) return current
      const next = applyMerge(current, block, summarize(block, mergeSource(current, block)))
      if (!next) return current
      setLastSettled(block)
      return next
    })
  }, [])

  useEffect(() => {
    if (!autoMerge || pending.length === 0) return
    timer.current = window.setTimeout(mergeNext, MERGE_INTERVAL_MS)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [autoMerge, pending.length, mergeNext])

  const addNote = useCallback((text: string): string | null => {
    const problem = checkNote(text)
    if (problem) return problem.reason
    setMemory((current) => {
      const { memory: next, id } = appendNote(current, text, today())
      setLastNoteId(id)
      return next
    })
    return null
  }, [])

  const forget = useCallback((block: Block) => {
    setMemory((current) => forgetSummary(current, block).memory)
    setLastSettled(null)
  }, [])

  const reseed = useCallback(() => {
    setMemory(seededMemory())
    setLastSettled(null)
    setLastNoteId(null)
  }, [])

  const clear = useCallback(() => {
    setMemory(emptyMemory())
    setLastSettled(null)
    setLastNoteId(null)
  }, [])

  return {
    memory,
    pending,
    autoMerge,
    setAutoMerge,
    mergeNext,
    addNote,
    forget,
    reseed,
    clear,
    lastSettledKey: lastSettled ? blockKey(lastSettled) : null,
    lastNoteId,
  }
}
