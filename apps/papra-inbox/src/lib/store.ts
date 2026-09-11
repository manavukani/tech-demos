import { createStore, del, entries, set } from 'idb-keyval'
import type { InboxDocument } from './types'

// Blobs survive structured cloning, so each document (file bytes included)
// lives in one IndexedDB record. Nothing ever leaves the browser.
const store = createStore('papra-inbox', 'documents')

export async function loadDocuments(): Promise<InboxDocument[]> {
  const all = await entries<string, InboxDocument>(store)
  return all
    .map(([, doc]) => doc)
    // A reload mid-extraction leaves a stale in-flight status behind.
    .map((doc) =>
      doc.textStatus === 'extracting' || doc.textStatus === 'pending'
        ? { ...doc, textStatus: 'pending' as const, progress: undefined }
        : doc,
    )
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function saveDocument(doc: InboxDocument): Promise<void> {
  return set(doc.id, doc, store)
}

export function deleteDocument(id: string): Promise<void> {
  return del(id, store)
}
