/**
 * The tree, drawn over the log.
 *
 * Every row is one level of merges and every column is one note, so a node's
 * width is literally the number of notes it stands for. Reading bottom to top
 * is reading the log compressing itself; the leaf row is the log.
 */

import { useMemo } from 'react'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import {
  blockKey,
  blockLabel,
  nextPowerOfTwo,
  summaryOf,
  type Block,
  type Memory,
} from '#/memory'

type NodeState = 'settled' | 'pending' | 'incomplete'

type TreeNode = {
  block: Block
  state: NodeState
  summary: string | null
}

type Props = {
  memory: Memory
  wakeKeys: Set<string>
  selected: Block | null
  onSelect: (block: Block) => void
  lastSettledKey: string | null
  lastNoteId: number | null
}

/** A column is one note, between these widths, so the tree keeps its shape
 * whether the log holds four notes or four hundred. */
const SLOT_MIN_PX = 22
const SLOT_MAX_PX = 44

export function TreeView({
  memory,
  wakeKeys,
  selected,
  onSelect,
  lastSettledKey,
  lastNoteId,
}: Props) {
  const total = memory.log.length
  const slots = Math.max(1, nextPowerOfTwo(total))

  const rows = useMemo(() => {
    const out: TreeNode[][] = []
    for (let size = slots; size >= 2; size /= 2) {
      const row: TreeNode[] = []
      for (let lo = 0; lo < slots; lo += size) {
        const block = { lo, hi: lo + size }
        if (lo >= total) continue
        const summary = summaryOf(memory, block)
        const state: NodeState =
          summary !== null ? 'settled' : block.hi > total ? 'incomplete' : 'pending'
        row.push({ block, state, summary })
      }
      if (row.length > 0) out.push(row)
    }
    return out
  }, [memory, slots, total])

  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        No notes yet. Write one, or seed the log.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="flex flex-col gap-1"
        style={{
          minWidth: `${slots * SLOT_MIN_PX}px`,
          maxWidth: `${slots * SLOT_MAX_PX}px`,
        }}
      >
        {rows.map((row) => (
          <div
            key={blockKey(row[0]!.block)}
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}
          >
            {row.map((node) => (
              <SummaryNode
                key={blockKey(node.block)}
                node={node}
                selected={selected !== null && blockKey(selected) === blockKey(node.block)}
                inWake={wakeKeys.has(blockKey(node.block))}
                justSettled={lastSettledKey === blockKey(node.block)}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}

        <div
          className="mt-1 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}
        >
          {memory.log.map((note) => {
            const block = { lo: note.id, hi: note.id + 1 }
            const key = blockKey(block)
            return (
              <button
                key={key}
                type="button"
                title={`#${note.id} ${note.date} ${note.text}`}
                onClick={() => onSelect(block)}
                className={cn(
                  'h-7 rounded-sm border text-[10px] font-mono tabular-nums transition-colors',
                  'bg-secondary/40 hover:bg-secondary',
                  wakeKeys.has(key) && 'border-sky-500/60 bg-sky-500/15 text-sky-200',
                  selected !== null &&
                    blockKey(selected) === key &&
                    'ring-2 ring-ring ring-offset-1 ring-offset-background',
                  lastNoteId === note.id && 'animate-settle',
                )}
              >
                {note.id}
              </button>
            )
          })}
        </div>
        <p className="text-muted-foreground text-[10px]">
          LOG.txt — one cell per note, in the order they were written
        </p>
      </div>
    </div>
  )
}

function SummaryNode({
  node,
  selected,
  inWake,
  justSettled,
  onSelect,
}: {
  node: TreeNode
  selected: boolean
  inWake: boolean
  justSettled: boolean
  onSelect: (block: Block) => void
}) {
  const size = node.block.hi - node.block.lo
  const label = blockLabel(node.block)
  const wide = size >= 4
  return (
    <button
      type="button"
      onClick={() => onSelect(node.block)}
      title={node.summary ?? `${label} — not merged yet`}
      style={{ gridColumn: `span ${size}` }}
      className={cn(
        'flex flex-col items-start gap-0.5 overflow-hidden rounded-md border px-2 py-1 text-left transition-colors',
        node.state === 'settled' && 'bg-card hover:bg-accent',
        node.state === 'pending' &&
          'animate-pending border-dashed border-amber-500/60 bg-amber-500/5',
        node.state === 'incomplete' && 'border-dashed bg-transparent opacity-50',
        inWake && node.state === 'settled' && 'border-sky-500/60 bg-sky-500/10',
        selected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
        justSettled && 'animate-settle',
      )}
    >
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums',
          node.state === 'settled' ? 'text-muted-foreground' : 'text-amber-300/90',
          inWake && node.state === 'settled' && 'text-sky-300',
        )}
      >
        {label}
      </span>
      {wide ? (
        <span className="text-foreground/80 w-full truncate text-[11px] leading-tight">
          {node.state === 'settled'
            ? node.summary
            : node.state === 'pending'
              ? 'merge due'
              : 'waiting for more notes'}
        </span>
      ) : null}
    </button>
  )
}

export function TreeLegend({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-card size-3 rounded-sm border" /> summary
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-sky-500/60 bg-sky-500/15" /> in
        this wake
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-dashed border-amber-500/60 bg-amber-500/5" />{' '}
        merge due
      </span>
      {pendingCount > 0 ? (
        <Badge variant="warn">{pendingCount} pending</Badge>
      ) : (
        <Badge variant="secondary">tree settled</Badge>
      )}
    </div>
  )
}
