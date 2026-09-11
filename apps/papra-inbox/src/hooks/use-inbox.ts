import { useCallback, useEffect, useRef, useState } from 'react'
import { extractText } from '@/lib/extract'
import { deleteDocument, loadDocuments, saveDocument } from '@/lib/store'
import { detectKind, type InboxDocument } from '@/lib/types'

export function useInbox() {
  const [docs, setDocs] = useState<InboxDocument[]>([])
  const [loaded, setLoaded] = useState(false)

  // The ref is the synchronous source of truth (React state mirrors it) so the
  // extraction loop and tag edits can interleave without clobbering each other.
  const docsRef = useRef<InboxDocument[]>([])
  const queueRef = useRef<string[]>([])
  const runningRef = useRef(false)

  const commit = useCallback((next: InboxDocument[]) => {
    docsRef.current = next
    setDocs(next)
  }, [])

  const patch = useCallback(
    (id: string, changes: Partial<InboxDocument>, persist = true) => {
      let updated: InboxDocument | undefined
      commit(
        docsRef.current.map((d) => {
          if (d.id !== id) return d
          updated = { ...d, ...changes }
          return updated
        }),
      )
      if (persist && updated) void saveDocument(updated)
    },
    [commit],
  )

  const pump = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    try {
      while (queueRef.current.length) {
        const id = queueRef.current.shift()!
        const doc = docsRef.current.find((d) => d.id === id)
        if (!doc) continue
        patch(id, { textStatus: 'extracting', progress: 0, note: 'Starting…' }, false)
        let lastTick = 0
        try {
          const result = await extractText(doc.blob, doc.kind, (progress, stage) => {
            const now = performance.now()
            if (now - lastTick < 120 && progress < 1) return
            lastTick = now
            patch(id, { progress, note: stage }, false)
          })
          patch(id, {
            text: result.text,
            textStatus: result.status,
            note: result.note,
            pageCount: result.pageCount,
            progress: undefined,
          })
        } catch (err) {
          patch(id, {
            textStatus: 'error',
            note: err instanceof Error ? err.message : String(err),
            progress: undefined,
          })
        }
      }
    } finally {
      runningRef.current = false
    }
  }, [patch])

  const enqueue = useCallback(
    (ids: string[]) => {
      queueRef.current.push(...ids)
      void pump()
    },
    [pump],
  )

  useEffect(() => {
    let cancelled = false
    void loadDocuments().then((stored) => {
      if (cancelled) return
      commit(stored)
      setLoaded(true)
      enqueue(stored.filter((d) => d.textStatus === 'pending').map((d) => d.id))
    })
    return () => {
      cancelled = true
    }
  }, [commit, enqueue])

  const addFiles = useCallback(
    async (files: File[], tagsFor?: (file: File) => string[]) => {
      const created: InboxDocument[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        kind: detectKind(file),
        createdAt: Date.now(),
        blob: file,
        tags: tagsFor?.(file) ?? [],
        text: '',
        textStatus: 'pending',
      }))
      await Promise.all(created.map(saveDocument))
      commit([...created, ...docsRef.current])
      enqueue(created.map((d) => d.id))
      return created.map((d) => d.id)
    },
    [commit, enqueue],
  )

  const setTags = useCallback(
    (id: string, tags: string[]) => {
      const clean = Array.from(new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)))
      patch(id, { tags: clean })
    },
    [patch],
  )

  const remove = useCallback(async (id: string) => {
    queueRef.current = queueRef.current.filter((q) => q !== id)
    commit(docsRef.current.filter((d) => d.id !== id))
    await deleteDocument(id)
  }, [commit])

  const retry = useCallback(
    (id: string) => {
      patch(id, { textStatus: 'pending', note: undefined })
      enqueue([id])
    },
    [enqueue, patch],
  )

  return { docs, loaded, addFiles, setTags, remove, retry }
}
