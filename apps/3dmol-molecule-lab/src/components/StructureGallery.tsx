import type { Structure, StructureId } from '../data/structures'

type Props = {
  structures: Structure[]
  activeId: StructureId
  onSelect: (id: StructureId) => void
}

export function StructureGallery({ structures, activeId, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Structures</h2>
      </div>
      <ul className="gallery">
        {structures.map((structure) => (
          <li key={structure.id}>
            <button
              type="button"
              className={structure.id === activeId ? 'gallery-card active' : 'gallery-card'}
              onClick={() => onSelect(structure.id)}
            >
              <span className="gallery-name">{structure.name}</span>
              <span className="gallery-kind">{structure.kind}</span>
              <span className="gallery-blurb">{structure.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
