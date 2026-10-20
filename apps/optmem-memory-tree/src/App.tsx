import { useMemo, useState } from 'react'
import { FastForward, Pause, Play, RotateCcw, Sprout, Trash2 } from 'lucide-react'

import { Explainer } from '#/components/explainer'
import { LogPanel } from '#/components/log-panel'
import { NoteComposer } from '#/components/note-composer'
import { RecallPanel } from '#/components/recall-panel'
import { TreeLegend, TreeView } from '#/components/tree-view'
import { WakePanel } from '#/components/wake-panel'
import { ZoomPanel } from '#/components/zoom-panel'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { useMemory } from '#/hooks/use-memory'
import { cn } from '#/lib/utils'
import { blockKey, blockLabel, wakeWithinTokens, type Block } from '#/memory'

const TABS = ['wake', 'zoom', 'recall'] as const
type Tab = (typeof TABS)[number]

const TAB_HINT: Record<Tab, string> = {
  wake: 'What a session is handed, oldest first.',
  zoom: 'One node, opened into its two halves.',
  recall: 'Every note ever written, word for word.',
}

export default function App() {
  const controller = useMemory()
  const { memory, pending } = controller
  const [tokenBudget, setTokenBudget] = useState(420)
  const [tab, setTab] = useState<Tab>('wake')
  const [selected, setSelected] = useState<Block | null>(null)

  const view = useMemo(() => wakeWithinTokens(memory, tokenBudget), [memory, tokenBudget])
  const wakeKeys = useMemo(
    () => new Set(view.lines.map((line) => blockKey(line.block))),
    [view],
  )

  const select = (block: Block) => {
    setSelected(block)
    setTab('zoom')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[110rem] flex-col gap-4 p-4 lg:p-6 xl:h-screen xl:overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">OptMem memory tree</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            An append-only log of one-line notes, folded into a binary tree of one-line
            summaries. Watch it build, then read it back within a token budget.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="h-8 px-2.5 font-mono tabular-nums">
            {memory.log.length} notes
          </Badge>
          <Badge
            variant={pending.length > 0 ? 'warn' : 'secondary'}
            className="h-8 px-2.5 font-mono tabular-nums"
          >
            {pending.length > 0
              ? `${pending.length} ${pending.length === 1 ? 'merge' : 'merges'} due · next ${blockLabel(pending[0]!)}`
              : 'tree settled'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => controller.setAutoMerge(!controller.autoMerge)}
          >
            {controller.autoMerge ? <Pause /> : <Play />}
            {controller.autoMerge ? 'pause merging' : 'resume merging'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending.length === 0}
            onClick={controller.mergeNext}
          >
            <FastForward /> merge next
          </Button>
          <Button size="sm" variant="outline" onClick={controller.reseed}>
            <Sprout /> reseed
          </Button>
          <Button size="sm" variant="outline" onClick={controller.clear}>
            <Trash2 /> empty
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_26rem]">
        <div className="flex min-h-0 flex-col gap-4">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader>
              <CardTitle>LOG.txt</CardTitle>
              <CardDescription>
                One line per note, newest first. Position is identity: note #7 is the
                eighth line, forever.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
              <NoteComposer onAdd={controller.addNote} />
              <LogPanel
                memory={memory}
                selected={selected}
                onSelect={select}
                lastNoteId={controller.lastNoteId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>The summary tree</CardTitle>
                  <CardDescription>
                    Each row is one level of merges; a node is as wide as the number of
                    notes it stands for.
                  </CardDescription>
                </div>
                <TreeLegend pendingCount={pending.length} />
              </div>
            </CardHeader>
            <CardContent>
              <TreeView
                memory={memory}
                wakeKeys={wakeKeys}
                selected={selected}
                onSelect={select}
                lastSettledKey={controller.lastSettledKey}
                lastNoteId={controller.lastNoteId}
              />
            </CardContent>
          </Card>
          <Explainer />
        </div>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <div className="flex items-center gap-1 rounded-md border p-1">
              {TABS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTab(name)}
                  className={cn(
                    'flex-1 rounded-sm px-2 py-1 font-mono text-xs transition-colors',
                    tab === name
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            <CardDescription>{TAB_HINT[tab]}</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            {tab === 'wake' ? (
              <WakePanel
                view={view}
                tokenBudget={tokenBudget}
                onTokenBudget={setTokenBudget}
                onSelect={select}
              />
            ) : null}
            {tab === 'zoom' ? (
              <ZoomPanel
                memory={memory}
                selected={selected}
                onSelect={setSelected}
                onForget={controller.forget}
              />
            ) : null}
            {tab === 'recall' ? <RecallPanel memory={memory} onSelect={select} /> : null}
          </CardContent>
        </Card>
      </div>

      <footer className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <RotateCcw className="size-3" />
        The log lives in this browser&apos;s localStorage. Summaries come from a local
        stub, so nothing leaves the page.
      </footer>
    </div>
  )
}
