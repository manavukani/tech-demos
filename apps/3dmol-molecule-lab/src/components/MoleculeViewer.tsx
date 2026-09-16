import { useEffect, useRef, useState } from 'react'
import type { AtomSelectionSpec, AtomSpec, GLModel, GLViewer, Label } from '3dmol'
import { load3Dmol, type Mol3D } from '../lib/threedmol'
import { elementMass } from '../data/elements'
import type { Highlight, SurfaceSpec } from '../data/lessons'
import type { Structure, StyleId } from '../data/structures'

export type AtomPick = {
  elem: string
  serial: number
  atomName?: string
  resn?: string
  resi?: number
  chain?: string
  x: number
  y: number
  z: number
  bondCount: number
}

export type StructureStats = {
  atomCount: number
  elements: { symbol: string; count: number }[]
  formula: string
  molecularWeight: number
  residueCount: number
  chains: string[]
  ligands: string[]
  origin: 'bundled' | 'rcsb'
}

type Props = {
  structure: Structure
  style: StyleId
  surface: SurfaceSpec | null
  highlights: Highlight[]
  /** Selection the camera should frame once the structure is ready */
  focus: AtomSelectionSpec | null
  /** Bumped by the toolbar to re-frame the camera */
  recenterSignal: number
  showLabels: boolean
  spin: boolean
  picked: AtomPick | null
  onPick: (atom: AtomPick | null) => void
  onStats: (stats: StructureStats | null) => void
}

const HOVER_LABEL_STYLE = {
  backgroundColor: '#0b1224',
  backgroundOpacity: 0.92,
  fontColor: '#e2e8f7',
  fontSize: 11,
  borderColor: '#33415c',
  borderThickness: 0.6,
}

function baseStyleSpec(style: StyleId) {
  switch (style) {
    case 'line':
      return { line: { linewidth: 2 } }
    case 'stick':
      return { stick: { radius: 0.15 } }
    case 'ballstick':
      return { stick: { radius: 0.12 }, sphere: { scale: 0.27 } }
    case 'sphere':
      return { sphere: {} }
    case 'cartoon':
      return { cartoon: { color: 'spectrum', arrows: true } }
  }
}

function toPick(atom: AtomSpec): AtomPick {
  return {
    elem: atom.elem ?? '?',
    serial: atom.serial ?? -1,
    atomName: atom.atom,
    resn: atom.resn,
    resi: atom.resi,
    chain: atom.chain,
    x: atom.x ?? 0,
    y: atom.y ?? 0,
    z: atom.z ?? 0,
    bondCount: atom.bonds?.length ?? 0,
  }
}

function atomLabel(atom: AtomPick): string {
  const residue = atom.resn && atom.resn !== 'UNL' ? ` · ${atom.resn}${atom.resi ?? ''}` : ''
  const name = atom.atomName && atom.atomName !== atom.elem ? ` ${atom.atomName}` : ''
  return `${atom.elem}${name}${residue}`
}

const HILL_ORDER = ['C', 'H']

function summarise(model: GLModel, origin: 'bundled' | 'rcsb'): StructureStats {
  const atoms = model.selectedAtoms({}) as AtomSpec[]
  const counts = new Map<string, number>()
  const residues = new Set<string>()
  const chains = new Set<string>()
  const ligands = new Set<string>()
  let molecularWeight = 0

  for (const atom of atoms) {
    const elem = atom.elem ?? '?'
    counts.set(elem, (counts.get(elem) ?? 0) + 1)
    molecularWeight += elementMass(elem)
    if (atom.chain) chains.add(atom.chain)
    if (atom.resi !== undefined) residues.add(`${atom.chain ?? ''}:${atom.resi}`)
    if (atom.hetflag && atom.resn && atom.resn !== 'HOH') ligands.add(atom.resn)
  }

  const elements = [...counts.entries()]
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => {
      const ai = HILL_ORDER.indexOf(a.symbol)
      const bi = HILL_ORDER.indexOf(b.symbol)
      if (ai !== bi) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      return a.symbol.localeCompare(b.symbol)
    })

  return {
    atomCount: atoms.length,
    elements,
    formula: elements.map(({ symbol, count }) => `${symbol}${count > 1 ? count : ''}`).join(''),
    molecularWeight,
    residueCount: residues.size,
    chains: [...chains].sort(),
    ligands: [...ligands].sort(),
    origin,
  }
}

function downloadFromRcsb($3Dmol: Mol3D, viewer: GLViewer, id: string): Promise<GLModel> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      settled = true
      reject(new Error(`RCSB did not answer in time for ${id}`))
    }, 8000)

    try {
      $3Dmol.download(`pdb:${id}`, viewer, { multimodel: false, doAssembly: false }, (model: GLModel | null) => {
        clearTimeout(timer)
        // A late arrival would silently stack a second copy on the fallback model.
        if (settled) {
          if (model) viewer.removeModel(model)
          return
        }
        settled = true
        if (model && model.selectedAtoms({}).length > 0) resolve(model)
        else reject(new Error(`RCSB returned no atoms for ${id}`))
      })
    } catch (error) {
      clearTimeout(timer)
      settled = true
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

export function MoleculeViewer({
  structure,
  style,
  surface,
  highlights,
  focus,
  recenterSignal,
  showLabels,
  spin,
  picked,
  onPick,
  onStats,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<GLViewer | null>(null)
  const molRef = useRef<Mol3D | null>(null)
  const hoverLabelRef = useRef<Label | null>(null)
  const onPickRef = useRef(onPick)
  const onStatsRef = useRef(onStats)
  const [viewerReady, setViewerReady] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [status, setStatus] = useState('Loading 3Dmol.js…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onPickRef.current = onPick
    onStatsRef.current = onStats
  }, [onPick, onStats])

  useEffect(() => {
    let disposed = false
    const host = hostRef.current

    load3Dmol()
      .then(($3Dmol) => {
        if (disposed || !host) return
        molRef.current = $3Dmol
        viewerRef.current = $3Dmol.createViewer(host, {
          backgroundColor: '#070b18',
          antialias: true,
          cartoonQuality: 10,
        })
        setViewerReady(true)
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Could not load 3Dmol.js')
      })

    return () => {
      disposed = true
      setViewerReady(false)
      try {
        viewerRef.current?.clear()
      } catch {
        // viewer may already be halfway torn down; nothing useful to do
      }
      viewerRef.current = null
      hoverLabelRef.current = null
      host?.replaceChildren()
    }
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !viewerReady) return
    const observer = new ResizeObserver(() => viewerRef.current?.resize())
    observer.observe(host)
    return () => observer.disconnect()
  }, [viewerReady])

  // Load (or re-load) the structure whenever the selected entry changes.
  useEffect(() => {
    const viewer = viewerRef.current
    const $3Dmol = molRef.current
    if (!viewerReady || !viewer || !$3Dmol) return

    let cancelled = false
    setModelReady(false)
    setError(null)
    onStatsRef.current(null)
    onPickRef.current(null)
    setStatus(structure.rcsbId ? `Fetching ${structure.reference} from RCSB…` : `Loading ${structure.name}…`)

    const load = async () => {
      viewer.removeAllSurfaces()
      viewer.removeAllLabels()
      viewer.removeAllModels()
      hoverLabelRef.current = null

      if (structure.rcsbId) {
        try {
          const model = await downloadFromRcsb($3Dmol, viewer, structure.rcsbId)
          if (cancelled) return null
          return { model, origin: 'rcsb' as const }
        } catch {
          if (cancelled) return null
          setStatus(`RCSB unreachable — using the bundled copy of ${structure.reference}`)
          viewer.removeAllModels()
        }
      }

      const response = await fetch(structure.file)
      if (!response.ok) throw new Error(`Could not read ${structure.file} (${response.status})`)
      const text = await response.text()
      if (cancelled) return null
      return { model: viewer.addModel(text, structure.format), origin: 'bundled' as const }
    }

    load()
      .then((loaded) => {
        if (cancelled || !loaded) return
        onStatsRef.current(summarise(loaded.model, loaded.origin))
        viewer.zoomTo()
        viewer.render()
        setModelReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load structure')
      })

    return () => {
      cancelled = true
    }
  }, [structure, viewerReady])

  // Re-apply representation, highlights, surface and labels on every view change.
  useEffect(() => {
    const viewer = viewerRef.current
    const $3Dmol = molRef.current
    if (!modelReady || !viewer || !$3Dmol) return

    viewer.removeAllSurfaces()
    viewer.removeAllLabels()
    hoverLabelRef.current = null

    viewer.setStyle({}, baseStyleSpec(style))
    if (structure.ligandSticks && style === 'cartoon') {
      viewer.addStyle({ hetflag: true }, { stick: { radius: 0.2, colorscheme: 'yellowCarbon' } })
    }

    for (const highlight of highlights) {
      if (highlight.as === 'cartoon') {
        viewer.addStyle(highlight.sel, { cartoon: { color: highlight.color } })
      } else if (highlight.as === 'stick') {
        viewer.addStyle(highlight.sel, { stick: { radius: 0.3, color: highlight.color } })
      } else {
        viewer.addStyle(highlight.sel, {
          stick: { radius: 0.24, color: highlight.color },
          sphere: { scale: style === 'sphere' ? 1 : 0.34, color: highlight.color },
        })
      }
      if (showLabels) {
        viewer.addLabel(
          highlight.label,
          { ...HOVER_LABEL_STYLE, fontSize: 12, borderColor: highlight.color, fontColor: highlight.color },
          highlight.sel,
        )
      }
    }

    if (surface) {
      viewer.addSurface(
        $3Dmol.SurfaceType.VDW,
        { opacity: surface.opacity, color: surface.color },
        surface.sel ?? {},
      )
    }

    if (picked) {
      viewer.addLabel(atomLabel(picked), {
        ...HOVER_LABEL_STYLE,
        fontSize: 13,
        position: { x: picked.x, y: picked.y, z: picked.z },
      })
    }

    viewer.setClickable({}, true, (atom: AtomSpec) => {
      onPickRef.current(toPick(atom))
    })

    viewer.setHoverable(
      {},
      true,
      (atom: AtomSpec) => {
        if (hoverLabelRef.current) return
        hoverLabelRef.current = viewer.addLabel(atomLabel(toPick(atom)), {
          ...HOVER_LABEL_STYLE,
          position: { x: atom.x ?? 0, y: atom.y ?? 0, z: atom.z ?? 0 },
        })
        viewer.render()
      },
      () => {
        if (!hoverLabelRef.current) return
        viewer.removeLabel(hoverLabelRef.current)
        hoverLabelRef.current = null
        viewer.render()
      },
    )

    viewer.render()
  }, [modelReady, style, surface, highlights, showLabels, picked, structure])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!modelReady || !viewer) return
    viewer.zoomTo(focus ?? {}, 600)
  }, [modelReady, focus, recenterSignal])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!modelReady || !viewer) return
    viewer.spin(spin ? 'y' : false)
    return () => viewer.spin(false)
  }, [modelReady, spin])

  return (
    <div className="viewer">
      <div ref={hostRef} className="viewer-canvas" />
      {!modelReady && !error ? <div className="viewer-overlay">{status}</div> : null}
      {error ? <div className="viewer-overlay viewer-overlay-error">{error}</div> : null}
    </div>
  )
}
