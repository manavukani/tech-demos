import { elementFacts } from '../data/elements'
import type { Structure } from '../data/structures'
import type { AtomPick, StructureStats } from './MoleculeViewer'

type Props = {
  structure: Structure
  stats: StructureStats | null
  picked: AtomPick | null
  onClear: () => void
}

function formatWeight(weight: number): string {
  return weight >= 1000 ? `${(weight / 1000).toFixed(1)} kDa` : `${weight.toFixed(2)} g/mol`
}

export function AtomInspector({ structure, stats, picked, onClear }: Props) {
  const facts = elementFacts(picked?.elem)

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Atom inspector</h2>
          {picked ? (
            <button type="button" className="ghost" onClick={onClear}>
              clear
            </button>
          ) : null}
        </div>

        {picked ? (
          <div className="inspector">
            <div className="inspector-hero">
              <span className="element-badge" style={{ background: facts?.color ?? '#c084fc' }}>
                {picked.elem}
              </span>
              <div>
                <strong>{facts?.name ?? picked.elem}</strong>
                <span>
                  {picked.resn ? `${picked.resn}${picked.resi ?? ''}` : 'ligand-free small molecule'}
                  {picked.chain ? ` · chain ${picked.chain}` : ''}
                </span>
              </div>
            </div>

            <dl className="facts">
              {facts ? (
                <>
                  <div>
                    <dt>Atomic number</dt>
                    <dd>{facts.atomicNumber}</dd>
                  </div>
                  <div>
                    <dt>Atomic mass</dt>
                    <dd>{facts.atomicMass}</dd>
                  </div>
                  <div>
                    <dt>Electronegativity</dt>
                    <dd>{facts.electronegativity ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>vdW radius</dt>
                    <dd>{facts.vdwRadius} Å</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt>Bonds in file</dt>
                <dd>{picked.bondCount}</dd>
              </div>
              <div>
                <dt>Serial</dt>
                <dd>{picked.serial}</dd>
              </div>
            </dl>

            <p className="coords">
              x {picked.x.toFixed(2)} · y {picked.y.toFixed(2)} · z {picked.z.toFixed(2)} Å
            </p>
            {facts ? <p className="element-note">{facts.note}</p> : null}
          </div>
        ) : (
          <p className="empty">Click any atom in the viewer to read its element data and position.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Structure facts</h2>
        </div>
        {stats ? (
          <div className="stats">
            <dl className="facts">
              <div>
                <dt>Atoms</dt>
                <dd>{stats.atomCount}</dd>
              </div>
              {structure.kind === 'protein' ? (
                <>
                  <div>
                    <dt>Residues</dt>
                    <dd>{stats.residueCount}</dd>
                  </div>
                  <div>
                    <dt>Chains</dt>
                    <dd>{stats.chains.join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt>Ligands</dt>
                    <dd>{stats.ligands.join(', ') || 'none'}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>Formula</dt>
                    <dd>{stats.formula}</dd>
                  </div>
                  <div>
                    <dt>Mass</dt>
                    <dd>{formatWeight(stats.molecularWeight)}</dd>
                  </div>
                </>
              )}
            </dl>

            <h3>Composition</h3>
            <ul className="composition">
              {stats.elements.map((entry) => {
                const elementFact = elementFacts(entry.symbol)
                return (
                  <li key={entry.symbol}>
                    <span className="swatch" style={{ background: elementFact?.color ?? '#c084fc' }} />
                    <span className="composition-symbol">{entry.symbol}</span>
                    <span className="composition-count">{entry.count}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <p className="empty">Reading structure…</p>
        )}
      </section>
    </>
  )
}
