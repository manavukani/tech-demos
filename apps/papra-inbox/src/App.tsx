import { InboxIcon, SearchIcon, SparklesIcon, XIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { DocumentDetail } from '@/components/document-detail'
import { DocumentList, type ListItem } from '@/components/document-list'
import { DropZone } from '@/components/drop-zone'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInbox } from '@/hooks/use-inbox'
import { buildSampleFiles } from '@/lib/samples'
import { buildIndex, runSearch } from '@/lib/search'
import { cn } from '@/lib/utils'

export default function App() {
  const { docs, loaded, addFiles, setTags, remove, retry } = useInbox()
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loadingSamples, setLoadingSamples] = useState(false)

  const index = useMemo(() => buildIndex(docs), [docs])
  const trimmedQuery = query.trim()
  const searching = trimmedQuery.length > 0

  const allTags = useMemo(
    () => Array.from(new Set(docs.flatMap((d) => d.tags))).sort(),
    [docs],
  )

  const items: ListItem[] = useMemo(() => {
    const byTag = (d: { tags: string[] }) => activeTags.every((t) => d.tags.includes(t))
    if (!searching) return docs.filter(byTag).map((doc) => ({ doc, terms: [] }))
    const byId = new Map(docs.map((d) => [d.id, d]))
    return runSearch(index, trimmedQuery).flatMap((hit) => {
      const doc = byId.get(hit.id)
      return doc && byTag(doc) ? [{ doc, terms: hit.terms }] : []
    })
  }, [docs, index, trimmedQuery, searching, activeTags])

  // Prefer the explicit selection if it is visible, otherwise the first visible
  // result (so the detail pane follows the search), otherwise the newest doc.
  const selectedItem = items.find((i) => i.doc.id === selectedId) ?? items[0]
  const selected = selectedItem?.doc ?? docs.find((d) => d.id === selectedId) ?? docs[0] ?? null
  const selectedTerms = selectedItem?.terms ?? []

  const ingest = async (files: File[]) => {
    const ids = await addFiles(files)
    if (ids[0]) setSelectedId(ids[0])
  }

  const addSamples = async () => {
    setLoadingSamples(true)
    try {
      const samples = await buildSampleFiles()
      const tagsFor = new Map(samples.map((s) => [s.file, s.tags]))
      const ids = await addFiles(
        samples.map((s) => s.file),
        (file) => tagsFor.get(file) ?? [],
      )
      if (ids[0]) setSelectedId(ids[0])
    } finally {
      setLoadingSamples(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) void ingest(files)
  }

  // A file dropped anywhere the app doesn't handle would make the browser
  // navigate to it and replace the inbox; block that at the window level.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  return (
    <div
      className="relative flex h-screen flex-col bg-background text-foreground"
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes('Files')) setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={onDrop}
    >
      {dragging && (
        // Sits above everything (including previews) so it owns the drop.
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-ring px-10 py-8 text-center">
            <InboxIcon className="mx-auto mb-2 size-8" />
            <p className="text-lg font-medium">Drop to add to your inbox</p>
            <p className="text-sm text-muted-foreground">Text is extracted right here in the browser.</p>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <InboxIcon className="size-4" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Papra Inbox</h1>
            <p className="text-xs text-muted-foreground">
              Drop documents, extract text, tag and find them. Everything stays in this browser.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={addSamples} disabled={loadingSamples}>
          <SparklesIcon data-icon="inline-start" />
          Add sample documents
        </Button>
      </header>

      <main className="grid min-h-0 flex-1 md:grid-cols-[minmax(320px,400px)_1fr]">
        <aside className="flex min-h-0 flex-col border-r">
          <div className="flex flex-col gap-3 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search names, tags and extracted text…"
                aria-label="Search documents"
                className="pl-8"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setQuery('')}
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1" aria-label="Filter by tag">
                {allTags.map((tag) => {
                  const active = activeTags.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      variant={active ? 'default' : 'outline'}
                      className="cursor-pointer"
                      render={
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setActiveTags((prev) =>
                              active ? prev.filter((t) => t !== tag) : [...prev, tag],
                            )
                          }
                        />
                      }
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            )}
            <DropZone onFiles={(files) => void ingest(files)} compact={docs.length > 0} />
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {loaded && items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {docs.length === 0
                  ? 'Your inbox is empty.'
                  : searching
                    ? `No documents match “${trimmedQuery}”.`
                    : 'No documents with these tags.'}
              </p>
            ) : (
              <DocumentList
                items={items}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                searching={searching}
              />
            )}
          </ScrollArea>

          <footer className={cn('border-t px-4 py-2 text-xs text-muted-foreground')}>
            {docs.length} document{docs.length === 1 ? '' : 's'}
            {searching ? ` · ${items.length} match${items.length === 1 ? '' : 'es'}` : ''} · stored
            locally in IndexedDB
          </footer>
        </aside>

        <section className="min-h-0 overflow-y-auto">
          {selected ? (
            <DocumentDetail
              key={selected.id}
              doc={selected}
              terms={selectedTerms}
              allTags={allTags}
              onTags={(tags) => setTags(selected.id, tags)}
              onDelete={() => void remove(selected.id)}
              onRetry={() => retry(selected.id)}
            />
          ) : (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing here yet</EmptyTitle>
                <EmptyDescription>
                  Drop a PDF, a photo of a receipt or a text file. PDFs use their text layer, images
                  go through OCR, and everything becomes searchable.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={addSamples} disabled={loadingSamples}>
                  <SparklesIcon data-icon="inline-start" />
                  Add sample documents
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </main>
    </div>
  )
}
