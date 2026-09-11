import { highlightSegments } from '@/lib/search'

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  return (
    <>
      {highlightSegments(text, terms).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5 text-foreground dark:bg-amber-400/40">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}
