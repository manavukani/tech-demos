import { AlertCircleIcon, CheckIcon, ClockIcon, TextSearchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { InboxDocument } from '@/lib/types'

export function StatusBadge({ doc }: { doc: InboxDocument }) {
  switch (doc.textStatus) {
    case 'pending':
      return (
        <Badge variant="outline">
          <ClockIcon />
          Queued
        </Badge>
      )
    case 'extracting':
      return (
        <Badge variant="secondary">
          <Spinner />
          {doc.progress !== undefined && doc.progress > 0
            ? `Extracting ${Math.round(doc.progress * 100)}%`
            : 'Extracting'}
        </Badge>
      )
    case 'ok':
      return (
        <Badge variant="secondary">
          <CheckIcon />
          Text ready
        </Badge>
      )
    case 'unavailable':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <TextSearchIcon />
          Text unavailable
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive">
          <AlertCircleIcon />
          Extraction failed
        </Badge>
      )
  }
}
