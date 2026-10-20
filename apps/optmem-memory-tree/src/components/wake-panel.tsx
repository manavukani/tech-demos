/**
 * `wake` — the whole memory as one document, cut to a reading budget.
 *
 * The slider is the only knob upstream suggests touching, so it is the only
 * one here: move it and the same log arrives at a different resolution.
 */

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import { blockLabel, type Block, type WakeView } from '#/memory'

type Props = {
  view: WakeView
  tokenBudget: number
  onTokenBudget: (value: number) => void
  onSelect: (block: Block) => void
}

export function WakePanel({ view, tokenBudget, onTokenBudget, onSelect }: Props) {
  const blocked = view.pending[0] ?? null
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="budget" className="text-xs font-medium">
            Reading budget
          </label>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {tokenBudget} tokens
          </span>
        </div>
        <input
          id="budget"
          type="range"
          min={60}
          max={4000}
          step={20}
          value={tokenBudget}
          onChange={(event) => onTokenBudget(Number(event.target.value))}
          className="w-full"
        />
        <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span>
            <span className="text-foreground font-mono tabular-nums">
              {view.lines.length}
            </span>{' '}
            lines
          </span>
          <span>
            ≈
            <span className="text-foreground font-mono tabular-nums">{view.tokens}</span>{' '}
            tokens
          </span>
          <span>
            covering{' '}
            <span className="text-foreground font-mono tabular-nums">
              {view.noteCount}
            </span>{' '}
            notes
          </span>
        </div>
      </div>

      {blocked ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Cannot wake yet: this document needs {blockLabel(blocked)}, which has not been
          merged. Upstream, the agent answers that merge first and wakes again.
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
        {view.lines.length === 0 ? (
          <p className="text-muted-foreground p-3 text-xs">
            No memories yet. The first note starts the log.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {view.lines.map((line) => (
              <li key={blockLabel(line.block)}>
                <button
                  type="button"
                  onClick={() => onSelect(line.block)}
                  className={cn(
                    'hover:bg-accent/60 block w-full px-3 py-1.5 text-left font-mono text-[11px] leading-snug',
                    line.kind === 'summary' && 'text-sky-200',
                    line.kind === 'pending' && 'text-amber-300',
                  )}
                >
                  {line.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        {view.pending.length === 0 && view.lines.length > 0 ? (
          <>
            <Badge variant="secondary" className="mr-1.5">
              You are awake.
            </Badge>
            Blue lines are summaries, plain lines are notes verbatim. Click any line to
            zoom into it.
          </>
        ) : (
          'Blue lines are summaries, plain lines are notes verbatim. Click any line to zoom into it.'
        )}
      </p>
    </div>
  )
}
