import { createServerFn } from '@tanstack/react-start'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Link = {
  id: string
  title: string
  url: string
  createdAt: string
}

// Session-scoped persistence: a gitignored JSON file next to the app.
// Good enough for a single-user demo; swap for a real DB later.
const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'links.json')

function readLinks(): Link[] {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Link[]
  } catch {
    return []
  }
}

function writeLinks(links: Link[]) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(links, null, 2))
}

export const getLinks = createServerFn({ method: 'GET' }).handler(() =>
  readLinks(),
)

export const addLink = createServerFn({ method: 'POST' })
  .validator((input: { title: string; url: string }) => {
    const title = input.title.trim()
    const url = input.url.trim()
    if (!title) throw new Error('Title is required')
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error('URL must be absolute, e.g. https://example.com')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('URL must start with http:// or https://')
    }
    return { title, url: parsed.toString() }
  })
  .handler(({ data }) => {
    const links = readLinks()
    const link: Link = {
      id: crypto.randomUUID(),
      title: data.title,
      url: data.url,
      createdAt: new Date().toISOString(),
    }
    writeLinks([link, ...links])
    return link
  })
