import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { loadPdfjs, renderPdfPage } from '@/lib/extract'

/** Pages rendered for the preview; enough to recognise a document. */
const MAX_PREVIEW_PAGES = 5

interface PdfPreviewProps {
  blob: Blob
  name: string
}

/**
 * Renders PDF pages to images with pdf.js instead of embedding the browser's
 * PDF viewer, so previews look the same everywhere and never capture drops.
 */
export function PdfPreview({ blob, name }: PdfPreviewProps) {
  const [state, setState] = useState<{ pages: string[]; total: number } | { error: string } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    // oxlint-disable-next-line react/set-state-in-effect -- reset while the new blob renders
    setState(null)
    void (async () => {
      try {
        const pdfjs = await loadPdfjs()
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
        const count = Math.min(pdf.numPages, MAX_PREVIEW_PAGES)
        const pages: string[] = []
        for (let i = 1; i <= count && !cancelled; i++) {
          const canvas = await renderPdfPage(await pdf.getPage(i), 1.25)
          pages.push(canvas.toDataURL('image/png'))
        }
        if (!cancelled) setState({ pages, total: pdf.numPages })
      } catch (err) {
        if (!cancelled) setState({ error: err instanceof Error ? err.message : String(err) })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [blob])

  if (!state) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        <Spinner className="mr-2" /> Rendering preview…
      </div>
    )
  }
  if ('error' in state) {
    return (
      <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        Could not render this PDF: {state.error}
      </p>
    )
  }
  return (
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
      {state.pages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${name}, page ${i + 1}`}
          className="w-full rounded-sm border bg-white shadow-sm"
        />
      ))}
      {state.total > state.pages.length && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {state.pages.length} of {state.total} pages
        </p>
      )}
    </div>
  )
}
