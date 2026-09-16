export type ElementFacts = {
  symbol: string
  name: string
  atomicNumber: number
  atomicMass: number
  /** Pauling electronegativity, undefined for elements without a meaningful value */
  electronegativity?: number
  /** van der Waals radius in ångström — the radius 3Dmol.js draws for sphere styles */
  vdwRadius: number
  /** CPK-ish swatch matching the default 3Dmol.js element colors */
  color: string
  note: string
}

const TABLE: Record<string, ElementFacts> = {
  H: {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    atomicMass: 1.008,
    electronegativity: 2.2,
    vdwRadius: 1.2,
    color: '#f1f5f9',
    note: 'One bond only. Attached to N, O or F it becomes a hydrogen-bond donor.',
  },
  C: {
    symbol: 'C',
    name: 'Carbon',
    atomicNumber: 6,
    atomicMass: 12.011,
    electronegativity: 2.55,
    vdwRadius: 1.7,
    color: '#909090',
    note: 'Four bonds. Carbon skeletons are the scaffold every other group hangs off.',
  },
  N: {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    atomicMass: 14.007,
    electronegativity: 3.04,
    vdwRadius: 1.55,
    color: '#3050f8',
    note: 'Lone pair makes it basic; in amides it is flat and a hydrogen-bond donor.',
  },
  O: {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    atomicMass: 15.999,
    electronegativity: 3.44,
    vdwRadius: 1.52,
    color: '#ff0d0d',
    note: 'Strongly electronegative. Carbonyl and hydroxyl oxygens drive polarity.',
  },
  F: {
    symbol: 'F',
    name: 'Fluorine',
    atomicNumber: 9,
    atomicMass: 18.998,
    electronegativity: 3.98,
    vdwRadius: 1.47,
    color: '#90e050',
    note: 'Most electronegative element; often swapped in to block metabolism.',
  },
  P: {
    symbol: 'P',
    name: 'Phosphorus',
    atomicNumber: 15,
    atomicMass: 30.974,
    electronegativity: 2.19,
    vdwRadius: 1.8,
    color: '#ff8000',
    note: 'Backbone of nucleic acids and the currency atom of ATP.',
  },
  S: {
    symbol: 'S',
    name: 'Sulfur',
    atomicNumber: 16,
    atomicMass: 32.06,
    electronegativity: 2.58,
    vdwRadius: 1.8,
    color: '#ffff30',
    note: 'Two cysteine sulfurs can oxidise into a disulfide bond that staples a fold.',
  },
  Cl: {
    symbol: 'Cl',
    name: 'Chlorine',
    atomicNumber: 17,
    atomicMass: 35.45,
    electronegativity: 3.16,
    vdwRadius: 1.75,
    color: '#1ff01f',
    note: 'Bulky and greasy; a common way to fill a hydrophobic pocket.',
  },
  Br: {
    symbol: 'Br',
    name: 'Bromine',
    atomicNumber: 35,
    atomicMass: 79.904,
    electronegativity: 2.96,
    vdwRadius: 1.85,
    color: '#a62929',
    note: 'Heavy halogen, historically handy for phasing crystal structures.',
  },
  FE: {
    symbol: 'Fe',
    name: 'Iron',
    atomicNumber: 26,
    atomicMass: 55.845,
    electronegativity: 1.83,
    vdwRadius: 2.0,
    color: '#e06633',
    note: 'Redox-active metal at the centre of haem and many enzyme active sites.',
  },
  ZN: {
    symbol: 'Zn',
    name: 'Zinc',
    atomicNumber: 30,
    atomicMass: 65.38,
    electronegativity: 1.65,
    vdwRadius: 2.1,
    color: '#7d80b0',
    note: 'Structural and catalytic metal; loves histidine and cysteine ligands.',
  },
}

const BY_UPPERCASE = new Map(Object.values(TABLE).map((facts) => [facts.symbol.toUpperCase(), facts]))

/** PDB and SDF files disagree about case ("FE" vs "Fe"), so look up case-insensitively. */
export function elementFacts(symbol: string | undefined): ElementFacts | null {
  if (!symbol) return null
  return BY_UPPERCASE.get(symbol.toUpperCase()) ?? null
}

export function elementColor(symbol: string | undefined): string {
  return elementFacts(symbol)?.color ?? '#c084fc'
}

export function elementMass(symbol: string | undefined): number {
  return elementFacts(symbol)?.atomicMass ?? 0
}
