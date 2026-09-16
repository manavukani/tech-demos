import type { AtomSelectionSpec } from '3dmol'
import type { StructureId, StyleId } from './structures'

export type Highlight = {
  label: string
  color: string
  sel: AtomSelectionSpec
  /** atoms: fat coloured spheres+sticks, cartoon: recolour the ribbon, stick: coloured sticks only */
  as: 'atoms' | 'cartoon' | 'stick'
}

export type SurfaceSpec = {
  sel?: AtomSelectionSpec
  opacity: number
  color: string
}

export type Lesson = {
  id: string
  step: string
  title: string
  summary: string
  body: string[]
  lookFor: string[]
  reference: string
  view: {
    structureId: StructureId
    style: StyleId
    surface?: SurfaceSpec
    highlights?: Highlight[]
    zoomTo?: AtomSelectionSpec
  }
}

/** 3Dmol.js accepts a list for most selection properties at runtime; its types only declare scalars. */
const anyOf = (spec: Record<string, unknown>) => spec as AtomSelectionSpec

const AMBER = '#f59e0b'
const VIOLET = '#a78bfa'
const CYAN = '#22d3ee'
const MAGENTA = '#f472b6'

export const LESSONS: Lesson[] = [
  {
    id: 'atoms-and-bonds',
    step: 'Lesson 1',
    title: 'Atoms, bonds, and why 3D matters',
    summary: 'What is actually inside a structure file, and what the renderer adds.',
    body: [
      'A structure file is mostly boring: a list of atoms with x, y, z coordinates, plus a table saying which atoms are bonded to which. Colours, sticks and spheres are not in the file — they are choices 3Dmol.js makes when it draws.',
      'Caffeine is a good first molecule. Twenty-four atoms, two fused rings, and enough nitrogen and oxygen to show why chemists single out heteroatoms: they carry the lone pairs and partial charges that decide how a molecule interacts with everything around it.',
      'The colouring here is the usual CPK convention — carbon grey, hydrogen white, nitrogen blue, oxygen red. Bond lengths and angles are not free parameters either. Every ring atom is sp2 hybridised, so the whole ring system is essentially flat.',
    ],
    lookFor: [
      'A six-membered ring fused to a five-membered ring — the xanthine core',
      'Three methyl groups, each attached to a nitrogen (hence 1,3,7-trimethylxanthine)',
      'Rotate until the rings are edge-on: the molecule nearly vanishes because it is planar',
    ],
    reference: 'Coordinates: PubChem CID 2519 (computed 3D conformer)',
    view: {
      structureId: 'caffeine',
      style: 'ballstick',
      highlights: [{ label: 'N and O heteroatoms', color: CYAN, sel: anyOf({ elem: ['N', 'O'] }), as: 'atoms' }],
    },
  },
  {
    id: 'functional-groups',
    step: 'Lesson 2',
    title: 'Functional groups: reading a drug molecule',
    summary: 'Chemists scan for reusable groups instead of reading atom by atom.',
    body: [
      'Nobody reads a molecule atom by atom. You scan for functional groups: recurring arrangements whose behaviour carries over from one molecule to the next.',
      'Aspirin is acetylsalicylic acid, and the name is the parts list. The carboxylic acid (amber) loses its proton around intestinal pH, so most aspirin in circulation is an anion. The acetyl ester (violet) is the business end: it hands its acetyl group to cyclooxygenase, permanently switching that copy of the enzyme off, which is why the effect outlasts the drug in your bloodstream.',
      'The benzene ring the two groups hang off is rigid and greasy. It mostly supplies shape and holds the two groups at a fixed distance from each other.',
    ],
    lookFor: [
      'Amber: the carboxylic acid — carbon, a double-bonded oxygen, and an O–H',
      'Violet: the acetyl ester — the C–O–C(=O)–CH3 linkage that does the acetylating',
      'The flat six-carbon ring holding both groups in place',
    ],
    reference: 'Coordinates: PubChem CID 2244 (computed 3D conformer)',
    view: {
      structureId: 'aspirin',
      style: 'stick',
      highlights: [
        { label: 'carboxylic acid', color: AMBER, sel: { index: [10, 1, 2, 20] }, as: 'atoms' },
        { label: 'acetyl ester', color: VIOLET, sel: { index: [0, 11, 3, 12, 17, 18, 19] }, as: 'atoms' },
      ],
    },
  },
  {
    id: 'shape-and-space',
    step: 'Lesson 3',
    title: 'Shape and space: van der Waals surfaces',
    summary: 'Sticks are bookkeeping. Surfaces are what the molecule feels like.',
    body: [
      'Sticks are honest about connectivity and dishonest about size. The translucent skin here is a van der Waals surface that 3Dmol.js computes from per-element radii — roughly the distance at which electron clouds start pushing back.',
      'Ibuprofen splits neatly into two halves. The isobutyl group (amber) is pure bulk: no charge, no hydrogen bonds, just a greasy shape that has to fit a hydrophobic channel in cyclooxygenase. The carboxylic acid (cyan) at the far end is the polar handle that anchors it.',
      'One carbon (magenta) carries four different substituents, making it a stereocenter. Ibuprofen is sold as a mixture of both mirror images even though only the S form inhibits the enzyme; the body slowly converts the other one.',
    ],
    lookFor: [
      'Switch the representation to Spheres — almost no empty space is left',
      'Amber greasy bulk at one end, cyan ionisable acid at the other',
      'The magenta stereocenter: four different groups on one carbon',
    ],
    reference: 'Coordinates: PubChem CID 3672 (computed 3D conformer)',
    view: {
      structureId: 'ibuprofen',
      style: 'ballstick',
      surface: { opacity: 0.55, color: '#7dd3fc' },
      highlights: [
        { label: 'isobutyl bulk', color: AMBER, sel: { index: [2, 3, 7, 8] }, as: 'atoms' },
        { label: 'carboxylic acid', color: CYAN, sel: { index: [14, 0, 1, 32] }, as: 'atoms' },
        { label: 'stereocenter', color: MAGENTA, sel: { index: [6] }, as: 'atoms' },
      ],
    },
  },
  {
    id: 'secondary-structure',
    step: 'Lesson 4',
    title: 'Proteins: from chain to fold',
    summary: 'Why the cartoon representation exists, and what it throws away.',
    body: [
      'Proteins are polymers of amino acids, but drawing every atom stops being useful past a few dozen residues. The cartoon representation discards side chains and traces the backbone instead: helices as coiled ribbons, beta strands as arrows, everything else as tube.',
      'Crambin (PDB 1CRN) is a 46-residue protein from Abyssinian kale seed and one of the smallest well-ordered entries in the PDB. Even at this size it speaks the full vocabulary: two short alpha helices (amber), a two-stranded beta sheet (violet), and loops connecting them.',
      'Secondary structure comes from backbone hydrogen bonds, not from side chains. A helix repeats a hydrogen bond from residue i to residue i+4; a sheet pairs strands side by side. That is why the cartoon can ignore side chains and still tell you the important part.',
    ],
    lookFor: [
      'Two amber helices packed against each other as the ordered core',
      'Violet arrows: the short beta sheet, with arrowheads pointing N to C',
      'Switch to Sticks to see how much detail the cartoon is hiding',
    ],
    reference: 'Coordinates: PDB 1CRN (Hendrickson & Teeter, 1981)',
    view: {
      structureId: 'crambin',
      style: 'cartoon',
      highlights: [
        { label: 'alpha helices', color: AMBER, sel: { ss: 'h' }, as: 'cartoon' },
        { label: 'beta sheet', color: VIOLET, sel: { ss: 's' }, as: 'cartoon' },
      ],
    },
  },
  {
    id: 'ligand-in-pocket',
    step: 'Lesson 5',
    title: 'A ligand in its pocket',
    summary: 'Structure-based drug design in one picture.',
    body: [
      'PDB entry 1HSG is HIV-1 protease — a homodimer of two identical 99-residue chains — with the inhibitor indinavir bound in the middle. In the file the drug is a HETATM residue named MK1, after its development code L-735,524.',
      'The enzyme cuts the viral polyprotein into working pieces, and it does so with a pair of aspartate residues, one from each chain, facing each other at the dimer interface (magenta). Indinavir mimics the shape of a cut-in-progress but has no bond that can be broken, so it parks in the site and blocks it.',
      'The translucent surface is drawn only for residues within 5 Å of the drug, so it traces the pocket rather than the whole protein. The drug is almost completely enclosed: that shape complementarity is what "selective" means in practice.',
    ],
    lookFor: [
      'Amber sticks: indinavir wedged between two identical protein chains',
      'Magenta: the catalytic Asp25 pair directly under the ligand',
      'The two beta hairpin "flaps" closing over the top of the site',
    ],
    reference: 'Coordinates: PDB 1HSG (Chen et al., 1994), fetched live from RCSB when online',
    view: {
      structureId: 'hiv-protease',
      style: 'cartoon',
      surface: { sel: { byres: true, within: { distance: 5, sel: { resn: 'MK1' } } }, opacity: 0.45, color: '#38bdf8' },
      highlights: [
        { label: 'indinavir (MK1)', color: AMBER, sel: { resn: 'MK1' }, as: 'atoms' },
        { label: 'catalytic Asp25 pair', color: MAGENTA, sel: { resn: 'ASP', resi: 25 }, as: 'stick' },
      ],
      zoomTo: { byres: true, within: { distance: 9, sel: { resn: 'MK1' } } },
    },
  },
]
