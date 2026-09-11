import { DownloadIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Highlight } from '@/components/highlight'
import { StatusBadge } from '@/components/status-badge'
import { TagEditor } from '@/components/tag-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatBytes, type InboxDocument } from '@/lib/types'

interface DocumentDetailProps {
  doc: InboxDocument
  terms: string[]
  allTags: string[]
  onTags: (tags: string[]) => void
  onDelete: () => void
  onRetry: () => void
}

export function DocumentDetail({ doc, terms, allTags, onTags, onDelete, onRetry }: DocumentDetailProps) {
  const url = useMemo(() => URL.createObjectURL(doc.blob), [doc.blob])
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-lg font-semibold" title={doc.name}>
            {doc.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {doc.mimeType} · {formatBytes(doc.size)} · added{' '}
            {new Date(doc.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<a href={url} download={doc.name} />}>
            <DownloadIcon data-icon="inline-start" />
            Download
          </Button>
          {(doc.textStatus === 'error' || doc.textStatus === 'unavailable') && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcwIcon data-icon="inline-start" />
              Retry extraction
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </header>

      <div className="px-6 pb-4">
        <TagEditor tags={doc.tags} suggestions={allTags} onChange={onTags} />
      </div>

      <Separator />

      <div className="grid min-h-0 flex-1 gap-4 p-6 lg:grid-cols-2">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Original file, served from IndexedDB.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <Preview doc={doc} url={url} />
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Extracted text
              <StatusBadge doc={doc} />
            </CardTitle>
            <CardDescription>{doc.note ?? 'Waiting in the extraction queue.'}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <ScrollArea className="h-full max-h-[60vh] rounded-lg border bg-muted/30">
              {doc.text ? (
                <pre className="p-3 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                  <Highlight text={doc.text} terms={terms} />
                </pre>
              ) : (
                <p className="p-3 text-sm text-muted-foreground">
                  {doc.textStatus === 'unavailable'
                    ? 'Nothing to search in this document. It still shows up by name and tags.'
                    : doc.textStatus === 'error'
                      ? 'Extraction failed. Retry, or the document remains searchable by name and tags.'
                      : 'Text will appear here once extraction finishes.'}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Preview({ doc, url }: { doc: InboxDocument; url: string }) {
  if (doc.kind === 'image') {
    return (
      <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        <img src={url} alt={doc.name} className="max-h-[60vh] w-auto max-w-full object-contain" />
      </div>
    )
  }
  if (doc.kind === 'pdf') {
    return <iframe src={url} title={doc.name} className="h-[60vh] w-full rounded-lg border bg-white" />
  }
  return (
    <ScrollArea className="h-full max-h-[60vh] rounded-lg border bg-muted/30">
      <pre className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{doc.text}</pre>
    </ScrollArea>
  )
}
