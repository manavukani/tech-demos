/**
 * `zoom` — one node opened into its two halves, down to the raw notes.
 *
 * Navigating is the point: a summary is a handle, and the half you need is
 * always one click away, without reading the log.
 */

import { ArrowUp, Eraser } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import {
  blockKey,
  blockLabel,
  blockSize,
  getNote,
  nextPowerOfTwo,
  parentOf,
  summaryOf,
  zoom,
  type Block,
  type Memory,
} from '#/memory'

type Props = {
  memory: Memory
  selected: Block | null
  onSelect: (block: Block) => void
  onForget: (block: Block) => void
}

/** The chain of nodes from the root down to `block`, for the breadcrumb. */
const pathTo = (block: Block, total: number): Block[] => {
  const path = [block]
  let current = block
  for (;;) {
    const parent = parentOf(current, total)
    if (!parent) break
    path.unshift(parent)
    current = parent
  }
  return path
}

export function ZoomPanel({ memory, selected, onSelect, onForget }: Props) {
  const total = memory.log.length
  if (!selected) {
    return (
      <p className="text-muted-foreground text-xs">
        Click a node in the tree, or a line in the wake document, to open it here.
      </p>
    )
  }

  const size = blockSize(selected)
  const parent = parentOf(selected, nextPowerOfTwo(total))
  const summary = summaryOf(memory, selected)
  const note = size === 1 ? getNote(memory, selected.lo) : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {pathTo(selected, nextPowerOfTwo(total)).map((step, index, steps) => (
          <span key={blockKey(step)} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(step)}
              className={cn(
                'rounded px-1 py-0.5 font-mono tabular-nums',
                index === steps.length - 1
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {blockLabel(step)}
            </button>
            {index < steps.length - 1 ? (
              <span className="text-muted-foreground">/</span>
            ) : null}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          disabled={!parent}
          onClick={() => parent && onSelect(parent)}
        >
          <ArrowUp /> up
        </Button>
        {summary !== null ? (
          <Button size="xs" variant="destructive" onClick={() => onForget(selected)}>
            <Eraser /> forget this summary
          </Button>
        ) : null}
      </div>

      {note ? (
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground font-mono text-[11px]">
            #{note.id} · {note.date} · raw note, never edited
          </p>
          <p className="mt-1 text-sm leading-snug">{note.text}</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground font-mono text-[11px]">
              {blockLabel(selected)} · {size} notes
            </p>
            <p
              className={cn(
                'mt-1 text-sm leading-snug',
                summary === null && 'text-amber-300',
              )}
            >
              {summary ?? 'Not merged yet — this node has no summary to show.'}
            </p>
          </div>

          <p className="text-muted-foreground text-xs">Its two halves:</p>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {zoom(memory, selected).map((half) => (
              <button
                key={blockKey(half.block)}
                type="button"
                onClick={() => onSelect(half.block)}
                className="hover:bg-accent/60 block w-full rounded-md border p-3 text-left"
              >
                <span className="text-muted-foreground font-mono text-[11px]">
                  {half.kind === 'note'
                    ? `${blockLabel(half.block)} · ${half.note.date} · note`
                    : `${blockLabel(half.block)} · ${blockSize(half.block)} notes`}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-[13px] leading-snug',
                    half.kind === 'summary' && half.text === null && 'text-amber-300',
                  )}
                >
                  {half.kind === 'note'
                    ? half.note.text
                    : (half.text ?? 'not merged yet')}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
