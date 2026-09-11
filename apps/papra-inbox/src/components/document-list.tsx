import { FileIcon, FileTextIcon, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Highlight } from '@/components/highlight'
import { StatusBadge } from '@/components/status-badge'
import { snippet } from '@/lib/search'
import { formatBytes, type InboxDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ListItem {
  doc: InboxDocument
  terms: string[]
}

interface DocumentListProps {
  items: ListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  searching: boolean
}

export function DocumentList({ items, selectedId, onSelect, searching }: DocumentListProps) {
  return (
    <ul className="flex flex-col gap-1 p-2" aria-label="Documents">
      {items.map(({ doc, terms }) => {
        const selected = doc.id === selectedId
        return (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => onSelect(doc.id)}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'flex w-full flex-col gap-1.5 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                selected && 'border-border bg-muted',
              )}
            >
              <div className="flex items-start gap-2.5">
                <KindIcon doc={doc} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    <Highlight text={doc.name} terms={terms} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                    {doc.pageCount ? ` · ${doc.pageCount} page${doc.pageCount === 1 ? '' : 's'}` : ''}
                  </span>
                </div>
                <StatusBadge doc={doc} />
              </div>
              {searching && doc.text && (
                <p className="line-clamp-2 pl-7 text-xs text-muted-foreground">
                  <Highlight text={snippet(doc.text, terms)} terms={terms} />
                </p>
              )}
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-7">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="h-4 px-1.5 text-[10px]">
                      <Highlight text={tag} terms={terms} />
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function KindIcon({ doc }: { doc: InboxDocument }) {
  const className = 'mt-0.5 size-4.5 shrink-0 text-muted-foreground'
  if (doc.kind === 'image') return <ImageIcon className={className} />
  if (doc.kind === 'pdf' || doc.kind === 'text') return <FileTextIcon className={className} />
  return <FileIcon className={className} />
}
