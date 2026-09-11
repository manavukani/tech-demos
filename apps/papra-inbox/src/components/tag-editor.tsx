import { PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TagEditorProps {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}

export function TagEditor({ tags, suggestions, onChange }: TagEditorProps) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    if (parts.length) onChange([...tags, ...parts])
    setDraft('')
  }

  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 6)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="pr-1">
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
            >
              <XIcon />
            </button>
          </Badge>
        ))}
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            add(draft)
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === ',') {
                e.preventDefault()
                add(draft)
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            placeholder="Add tag…"
            aria-label="Add tag"
            className="h-6 w-28 text-xs md:text-xs"
          />
        </form>
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <span>Reuse:</span>
          {unused.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer"
              render={<button type="button" onClick={() => onChange([...tags, s])} />}
            >
              <PlusIcon />
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
