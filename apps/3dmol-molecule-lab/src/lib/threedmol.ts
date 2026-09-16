export type Mol3D = typeof import('3dmol')

let pending: Promise<Mol3D> | null = null

/**
 * 3Dmol.js ships a UMD bundle that touches `window` and WebGL at import time,
 * so it is only ever pulled in lazily from the browser.
 */
export function load3Dmol(): Promise<Mol3D> {
  pending ??= import('3dmol').then((mod) => {
    const resolved = (mod as unknown as { default?: Mol3D }).default ?? (mod as unknown as Mol3D)
    if (typeof resolved.createViewer !== 'function') {
      throw new Error('3Dmol.js loaded but createViewer is missing')
    }
    return resolved
  })
  return pending
}
