/**
 * `recall` — a regex over every note ever written.
 *
 * The tree is lossy by design, so recall is the escape hatch: it reads the log
 * itself, word for word, and never a summary.
 */

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { recall, splitBySpans, type Block, type Memory } from '#/memory'

type Props = {
  memory: Memory
  onSelect: (block: Block) => void
}

const EXAMPLES = ['waitlist', 'audit|compliance', '^#1[0-9] ', 'SQL|Postgres']

export function RecallPanel({ memory, onSelect }: Props) {
  const [pattern, setPattern] = useState('')
  const result = useMemo(() => recall(memory, pattern), [memory, pattern])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder="regex over every note"
          aria-invalid={!result.ok}
          className="pl-8 font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs">try</span>
        {EXAMPLES.map((example) => (
          <Button
            key={example}
            size="xs"
            variant="outline"
            className="font-mono"
            onClick={() => setPattern(example)}
          >
            {example}
          </Button>
        ))}
      </div>

      {!result.ok ? (
        <p className="text-destructive text-xs">Bad regex: {result.error}</p>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs">
            {pattern.trim().length === 0 ? (
              <span className="text-muted-foreground">
                Searches the rendered line, so ids and dates match too.
              </span>
            ) : (
              <>
                <Badge variant={result.total > 0 ? 'accent' : 'secondary'}>
                  {result.total} {result.total === 1 ? 'match' : 'matches'}
                </Badge>
                {result.truncated ? (
                  <span className="text-muted-foreground">
                    newest {result.hits.length} shown — narrow the regex
                  </span>
                ) : null}
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
            {result.hits.length === 0 ? (
              <p className="text-muted-foreground p-3 text-xs">
                {pattern.trim().length === 0 ? 'No pattern yet.' : 'No match.'}
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {result.hits.map((hit) => (
                  <li key={hit.note.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ lo: hit.note.id, hi: hit.note.id + 1 })}
                      className="hover:bg-accent/60 block w-full px-3 py-1.5 text-left font-mono text-[11px] leading-snug"
                    >
                      {splitBySpans(hit.line, hit.spans).map((part, index) =>
                        part.match ? (
                          <mark
                            key={`${hit.note.id}:${index}`}
                            className="rounded-sm bg-sky-400/30 text-sky-100"
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <span key={`${hit.note.id}:${index}`}>{part.text}</span>
                        ),
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
