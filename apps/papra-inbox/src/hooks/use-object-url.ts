import { useEffect, useState } from 'react'

/**
 * Object URL for a blob, created and revoked inside the effect so StrictMode's
 * mount/unmount/mount cycle can't leave a revoked URL behind.
 */
export function useObjectUrl(blob: Blob): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const next = URL.createObjectURL(blob)
    // oxlint-disable-next-line react/set-state-in-effect -- the URL registry is the external system here
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}
