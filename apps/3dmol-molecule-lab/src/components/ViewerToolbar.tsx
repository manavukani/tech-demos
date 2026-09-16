import { STYLE_LABELS, STYLE_NOTES, type Structure, type StyleId } from '../data/structures'

type Props = {
  structure: Structure
  style: StyleId
  onStyle: (style: StyleId) => void
  surfaceOn: boolean
  onSurface: (on: boolean) => void
  showLabels: boolean
  onShowLabels: (on: boolean) => void
  spin: boolean
  onSpin: (on: boolean) => void
  onRecenter: () => void
}

export function ViewerToolbar({
  structure,
  style,
  onStyle,
  surfaceOn,
  onSurface,
  showLabels,
  onShowLabels,
  spin,
  onSpin,
  onRecenter,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <span className="toolbar-label">Representation</span>
        <div className="segmented">
          {structure.styles.map((id) => (
            <button
              key={id}
              type="button"
              className={id === style ? 'segment active' : 'segment'}
              onClick={() => onStyle(id)}
            >
              {STYLE_LABELS[id]}
            </button>
          ))}
        </div>

        <div className="toolbar-toggles">
          <button
            type="button"
            className={surfaceOn ? 'toggle active' : 'toggle'}
            onClick={() => onSurface(!surfaceOn)}
          >
            Surface
          </button>
          <button
            type="button"
            className={showLabels ? 'toggle active' : 'toggle'}
            onClick={() => onShowLabels(!showLabels)}
          >
            Labels
          </button>
          <button type="button" className={spin ? 'toggle active' : 'toggle'} onClick={() => onSpin(!spin)}>
            Spin
          </button>
          <button type="button" className="toggle" onClick={onRecenter}>
            Recenter
          </button>
        </div>
      </div>
      <p className="toolbar-note">{STYLE_NOTES[style]}</p>
    </div>
  )
}
