/**
 * The short version of the idea, for someone who arrived at this page without
 * having read upstream.
 */

import { ExternalLink } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

const POINTS: { head: string; body: string }[] = [
  {
    head: 'The log is the memory',
    body: 'Every note is one line, appended and never touched again. Nothing is edited, nothing is deleted, so the oldest memory is as trustworthy as the newest.',
  },
  {
    head: 'Summaries are a cache, not the memory',
    body: 'Notes pair up into #0-1, #2-3, those pair into #0-3, and so on. Each node is one line standing for everything beneath it. Throw the whole tree away and the log rebuilds it.',
  },
  {
    head: 'Reading is budgeted, storing is not',
    body: 'A session reads a fixed number of lines: recent notes verbatim, older stretches as single summaries. Detail decays with age, which is how a log of any size still fits in one prompt.',
  },
  {
    head: 'Lost detail is one click away',
    body: 'A summary is a handle. Zoom opens a node into its two halves until you reach raw notes, and recall greps the log itself when you remember a word but not where.',
  },
]

export function Explainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How OptMem works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <dl className="space-y-2.5">
          {POINTS.map((point) => (
            <div key={point.head}>
              <dt className="text-[13px] font-medium">{point.head}</dt>
              <dd className="text-muted-foreground text-xs leading-relaxed">
                {point.body}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
          Upstream, a model writes each summary and the tree lives in files under{' '}
          <code className="font-mono">~/.optmem/memory</code>. Here the merges come from
          a deterministic local stub that keeps the most salient line of what it merges —
          enough to show the shape of the thing, with no API key and no network.{' '}
          <a
            href="https://github.com/VictorTaelin/OptMem"
            target="_blank"
            rel="noreferrer"
            className="text-foreground inline-flex items-center gap-1 underline underline-offset-2"
          >
            VictorTaelin/OptMem
            <ExternalLink className="size-3" />
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
