/**
 * LOG.txt, newest first. One line per note, exactly as the tool renders it.
 */

import { cn } from '#/lib/utils'
import { renderNote, type Block, type Memory } from '#/memory'

type Props = {
  memory: Memory
  selected: Block | null
  onSelect: (block: Block) => void
  lastNoteId: number | null
}

export function LogPanel({ memory, selected, onSelect, lastNoteId }: Props) {
  const notes = [...memory.log].reverse()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
      {notes.length === 0 ? (
        <p className="text-muted-foreground p-3 text-xs">The log is empty.</p>
      ) : (
        <ul className="divide-border divide-y">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelect({ lo: note.id, hi: note.id + 1 })}
                className={cn(
                  'hover:bg-accent/60 block w-full px-3 py-1.5 text-left font-mono text-[11px] leading-snug',
                  selected?.lo === note.id &&
                    selected.hi === note.id + 1 &&
                    'bg-accent/80',
                  lastNoteId === note.id && 'animate-settle',
                )}
              >
                {renderNote(note)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
