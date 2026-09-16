import { useMemo, useState } from 'react'
import { MoleculeViewer, type AtomPick, type StructureStats } from './components/MoleculeViewer'
import { AtomInspector } from './components/AtomInspector'
import { LessonPanel } from './components/LessonPanel'
import { StructureGallery } from './components/StructureGallery'
import { ViewerToolbar } from './components/ViewerToolbar'
import { LESSONS } from './data/lessons'
import { STRUCTURES, structureById, type StructureId, type StyleId } from './data/structures'

const FIRST_LESSON = LESSONS[0]

export default function App() {
  const [lessonId, setLessonId] = useState<string | null>(FIRST_LESSON.id)
  const [structureId, setStructureId] = useState<StructureId>(FIRST_LESSON.view.structureId)
  const [style, setStyle] = useState<StyleId>(FIRST_LESSON.view.style)
  const [surfaceOn, setSurfaceOn] = useState(Boolean(FIRST_LESSON.view.surface))
  const [showLabels, setShowLabels] = useState(true)
  const [spin, setSpin] = useState(false)
  const [picked, setPicked] = useState<AtomPick | null>(null)
  const [stats, setStats] = useState<StructureStats | null>(null)
  const [recenterSignal, setRecenterSignal] = useState(0)

  const structure = structureById(structureId)
  const lesson = LESSONS.find((entry) => entry.id === lessonId) ?? null
  // A lesson only drives the viewer while its own structure is on screen.
  const syncedLesson = lesson && lesson.view.structureId === structureId ? lesson : null

  const highlights = useMemo(() => syncedLesson?.view.highlights ?? [], [syncedLesson])
  const surface = useMemo(() => {
    if (!surfaceOn) return null
    return syncedLesson?.view.surface ?? { opacity: 0.55, color: '#7dd3fc' }
  }, [surfaceOn, syncedLesson])
  const focus = syncedLesson?.view.zoomTo ?? null

  const selectLesson = (id: string) => {
    const next = LESSONS.find((entry) => entry.id === id)
    if (!next) return
    setLessonId(id)
    setStructureId(next.view.structureId)
    setStyle(next.view.style)
    setSurfaceOn(Boolean(next.view.surface))
    setPicked(null)
  }

  const selectStructure = (id: StructureId) => {
    if (id === structureId) return
    const next = structureById(id)
    setStructureId(id)
    setStyle(next.defaultStyle)
    setSurfaceOn(false)
    setPicked(null)
    // Leaving a lesson's structure means the lesson highlights no longer apply.
    if (lesson && lesson.view.structureId !== id) setLessonId(null)
  }

  const lessonIndex = lesson ? LESSONS.indexOf(lesson) : -1

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>Molecule Lab</h1>
          <p>
            A 3Dmol.js viewer wired to a five-step structural chemistry crash course. Pick a lesson and the
            viewer follows: structure, representation, highlights and camera.
          </p>
        </div>
        <a className="masthead-link" href="https://3dmol.org/" target="_blank" rel="noreferrer">
          3Dmol.js ↗
        </a>
      </header>

      <div className="layout">
        <aside className="column column-left">
          <LessonPanel
            lessons={LESSONS}
            activeId={lessonId}
            synced={Boolean(syncedLesson)}
            onSelect={selectLesson}
            onClear={() => setLessonId(null)}
          />
          <StructureGallery structures={STRUCTURES} activeId={structureId} onSelect={selectStructure} />
        </aside>

        <main className="column column-center">
          <ViewerToolbar
            structure={structure}
            style={style}
            onStyle={setStyle}
            surfaceOn={surfaceOn}
            onSurface={setSurfaceOn}
            showLabels={showLabels}
            onShowLabels={setShowLabels}
            spin={spin}
            onSpin={setSpin}
            onRecenter={() => setRecenterSignal((value) => value + 1)}
          />

          <MoleculeViewer
            structure={structure}
            style={style}
            surface={surface}
            highlights={highlights}
            focus={focus}
            recenterSignal={recenterSignal}
            showLabels={showLabels}
            spin={spin}
            picked={picked}
            onPick={setPicked}
            onStats={setStats}
          />

          <div className="caption">
            <div className="caption-main">
              <strong>{structure.name}</strong>
              <span>{structure.subtitle}</span>
              <a href={structure.referenceUrl} target="_blank" rel="noreferrer">
                {structure.reference} ↗
              </a>
              {stats ? (
                <span className="tag">{stats.origin === 'rcsb' ? 'fetched from RCSB' : 'bundled file'}</span>
              ) : null}
            </div>
            {highlights.length > 0 ? (
              <ul className="legend">
                {highlights.map((highlight) => (
                  <li key={highlight.label}>
                    <span className="swatch" style={{ background: highlight.color }} />
                    {highlight.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caption-hint">
                Drag to rotate, scroll to zoom, click an atom to inspect it.
                {lessonIndex >= 0 ? '' : ' Pick a lesson on the left to sync highlights.'}
              </p>
            )}
          </div>
        </main>

        <aside className="column column-right">
          <AtomInspector structure={structure} stats={stats} picked={picked} onClear={() => setPicked(null)} />
        </aside>
      </div>
    </div>
  )
}
