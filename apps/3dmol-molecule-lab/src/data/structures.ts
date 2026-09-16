export type StructureFormat = 'sdf' | 'pdb'

export type StyleId = 'line' | 'stick' | 'ballstick' | 'sphere' | 'cartoon'

export type StructureId = 'caffeine' | 'aspirin' | 'ibuprofen' | 'crambin' | 'hiv-protease'

export type Structure = {
  id: StructureId
  name: string
  subtitle: string
  kind: 'small molecule' | 'protein'
  blurb: string
  /** Bundled copy, always present so the lab works with no network */
  file: string
  format: StructureFormat
  /** When set, 3Dmol.js fetches the entry live from RCSB and the bundled file is the fallback */
  rcsbId?: string
  reference: string
  referenceUrl: string
  styles: StyleId[]
  defaultStyle: StyleId
  /** Draw HETATM records (ligands, cofactors) as sticks on top of a cartoon */
  ligandSticks?: boolean
}

export const STRUCTURES: Structure[] = [
  {
    id: 'caffeine',
    name: 'Caffeine',
    subtitle: '1,3,7-trimethylxanthine',
    kind: 'small molecule',
    blurb: 'Twenty-four atoms, two fused rings, four nitrogens. A good first look at bonds in 3D.',
    file: '/structures/caffeine.sdf',
    format: 'sdf',
    reference: 'PubChem CID 2519',
    referenceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/2519',
    styles: ['line', 'stick', 'ballstick', 'sphere'],
    defaultStyle: 'ballstick',
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    subtitle: 'acetylsalicylic acid',
    kind: 'small molecule',
    blurb: 'A benzene ring wearing two functional groups: a carboxylic acid and an acetyl ester.',
    file: '/structures/aspirin.sdf',
    format: 'sdf',
    reference: 'PubChem CID 2244',
    referenceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/2244',
    styles: ['line', 'stick', 'ballstick', 'sphere'],
    defaultStyle: 'stick',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    subtitle: '2-(4-isobutylphenyl)propanoic acid',
    kind: 'small molecule',
    blurb: 'Polar acid at one end, greasy isobutyl bulk at the other, one stereocenter in between.',
    file: '/structures/ibuprofen.sdf',
    format: 'sdf',
    reference: 'PubChem CID 3672',
    referenceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/3672',
    styles: ['line', 'stick', 'ballstick', 'sphere'],
    defaultStyle: 'sphere',
  },
  {
    id: 'crambin',
    name: 'Crambin',
    subtitle: '46-residue plant seed protein',
    kind: 'protein',
    blurb: 'One of the smallest well-ordered entries in the PDB, and still enough for two helices and a sheet.',
    file: '/structures/1crn.pdb',
    format: 'pdb',
    reference: 'PDB 1CRN',
    referenceUrl: 'https://www.rcsb.org/structure/1CRN',
    styles: ['cartoon', 'stick', 'line', 'sphere'],
    defaultStyle: 'cartoon',
  },
  {
    id: 'hiv-protease',
    name: 'HIV-1 protease + indinavir',
    subtitle: 'homodimer with a bound inhibitor',
    kind: 'protein',
    blurb: 'The textbook structure-based drug design picture: a drug buried in the enzyme it shuts down.',
    file: '/structures/1hsg.pdb',
    format: 'pdb',
    rcsbId: '1HSG',
    reference: 'PDB 1HSG',
    referenceUrl: 'https://www.rcsb.org/structure/1HSG',
    styles: ['cartoon', 'stick', 'line'],
    defaultStyle: 'cartoon',
    ligandSticks: true,
  },
]

export const STYLE_LABELS: Record<StyleId, string> = {
  line: 'Lines',
  stick: 'Sticks',
  ballstick: 'Ball & stick',
  sphere: 'Spheres',
  cartoon: 'Cartoon',
}

export const STYLE_NOTES: Record<StyleId, string> = {
  line: 'Thinnest possible bond drawing. Cheap to render, useless for judging size.',
  stick: 'Bonds as cylinders. The default way chemists sketch connectivity in 3D.',
  ballstick: 'Sticks plus shrunken spheres, so atoms are visible without hiding bonds.',
  sphere: 'Space filling at van der Waals radii — what a neighbouring molecule actually meets.',
  cartoon: 'Backbone trace only: helices as ribbons, strands as arrows, loops as tube.',
}

export function structureById(id: StructureId): Structure {
  const found = STRUCTURES.find((structure) => structure.id === id)
  if (!found) throw new Error(`Unknown structure: ${id}`)
  return found
}
