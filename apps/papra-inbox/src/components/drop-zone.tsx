import { UploadIcon } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

export const ACCEPT = 'application/pdf,image/*,text/*,.md,.csv,.json,.log'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  compact?: boolean
  className?: string
}

export function DropZone({ onFiles, compact, className }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-center text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        compact ? 'px-3 py-3' : 'px-4 py-8',
        className,
      )}
    >
      <UploadIcon className={compact ? 'size-4' : 'size-6'} />
      <span>
        <span className="font-medium text-foreground">Drop files</span> anywhere or click to browse
      </span>
      {!compact && <span className="text-xs">PDF, images (PNG/JPG) and text files</span>}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        data-testid="file-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </button>
  )
}
