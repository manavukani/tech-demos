/**
 * `note` — append one line to the log.
 *
 * The limits are the interesting part: one line, 280 bytes, and no editing
 * afterwards. A note that does not fit has to be compressed by whoever wrote
 * it, which is why the byte counter is in front of you while you type.
 */

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import { ENTRY_BYTES } from '#/memory'

type Props = { onAdd: (text: string) => string | null }

export function NoteComposer({ onAdd }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bytes = new TextEncoder().encode(text).length

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = onAdd(text)
    setError(problem)
    if (!problem) setText('')
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
          placeholder="one line worth keeping"
          aria-invalid={error !== null}
          className="text-xs"
        />
        <Button type="submit" size="icon" aria-label="append note">
          <Plus />
        </Button>
      </div>
      <div className="flex items-baseline justify-between text-xs">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="text-muted-foreground">
            Appended, never edited. Each note may trigger a merge.
          </span>
        )}
        <span
          className={cn(
            'text-muted-foreground font-mono tabular-nums',
            bytes > ENTRY_BYTES && 'text-destructive',
          )}
        >
          {bytes}/{ENTRY_BYTES}
        </span>
      </div>
    </form>
  )
}
