import type { Lesson } from '../data/lessons'

type Props = {
  lessons: Lesson[]
  activeId: string | null
  synced: boolean
  onSelect: (id: string) => void
  onClear: () => void
}

export function LessonPanel({ lessons, activeId, synced, onSelect, onClear }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Crash course</h2>
        {activeId ? (
          <button type="button" className="ghost" onClick={onClear}>
            free explore
          </button>
        ) : null}
      </div>

      <ol className="lesson-list">
        {lessons.map((lesson) => {
          const open = lesson.id === activeId
          return (
            <li key={lesson.id} className={open ? 'lesson open' : 'lesson'}>
              <button type="button" className="lesson-button" onClick={() => onSelect(lesson.id)}>
                <span className="lesson-step">{lesson.step}</span>
                <span className="lesson-title">{lesson.title}</span>
                <span className="lesson-summary">{lesson.summary}</span>
              </button>

              {open ? (
                <div className="lesson-body">
                  {!synced ? (
                    <p className="lesson-warning">
                      Viewer is showing a different structure — reselect this lesson to resync.
                    </p>
                  ) : null}
                  {lesson.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                  <h3>Look for</h3>
                  <ul className="look-for">
                    {lesson.lookFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="lesson-reference">{lesson.reference}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
