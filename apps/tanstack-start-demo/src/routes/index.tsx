import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { addLink, getLinks } from '#/lib/links'

export const Route = createFileRoute('/')({
  loader: () => getLinks(),
  component: LinkDump,
})

function LinkDump() {
  const links = Route.useLoaderData()
  const router = useRouter()
  const add = useServerFn(addLink)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return links
    return links.filter(
      (l) =>
        l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q),
    )
  }, [links, filter])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await add({ data: { title, url } })
      setTitle('')
      setUrl('')
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save link')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Link dump</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A single-user URL pile, rendered on the server with TanStack Start.
        </p>
      </header>

      <Card>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <Input
              aria-label="Title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              aria-label="URL"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button type="submit" disabled={saving} className="sm:shrink-0">
              {saving ? 'Adding…' : 'Add link'}
            </Button>
          </form>
          {error ? (
            <p role="alert" className="text-destructive mt-2 text-sm">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Input
          aria-label="Filter links"
          placeholder="Filter by title or URL…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {visible.length} / {links.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {links.length === 0
            ? 'Nothing saved yet. Add your first link above.'
            : 'No links match that filter.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((link) => (
            <li key={link.id}>
              <Card className="py-4">
                <CardContent className="flex flex-col gap-1 px-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {link.title}
                  </a>
                  <span className="text-muted-foreground truncate text-xs">
                    {link.url}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
