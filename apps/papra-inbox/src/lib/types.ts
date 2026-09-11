export type DocKind = 'pdf' | 'image' | 'text' | 'other'

export type TextStatus =
  | 'pending' // queued, extraction not started
  | 'extracting' // extraction running (progress in `progress`)
  | 'ok' // text extracted
  | 'unavailable' // no text could be extracted; documented in `note`
  | 'error' // extraction threw; message in `note`

export interface InboxDocument {
  id: string
  name: string
  mimeType: string
  size: number
  kind: DocKind
  createdAt: number
  blob: Blob
  tags: string[]
  text: string
  textStatus: TextStatus
  /** Human-readable detail for the status (source of text, why unavailable, etc). */
  note?: string
  /** 0..1 while extracting. */
  progress?: number
  pageCount?: number
}

export function detectKind(file: File): DocKind {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (type.startsWith('image/')) return 'image'
  if (
    type.startsWith('text/') ||
    type === 'application/json' ||
    /\.(txt|md|markdown|csv|json|log|yml|yaml|xml|html?)$/.test(name)
  ) {
    return 'text'
  }
  return 'other'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
