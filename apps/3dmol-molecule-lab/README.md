# 3Dmol.js Molecule Lab

An interactive molecular viewer built on [3Dmol.js](https://3dmol.org/), wired to a five-step
structural chemistry crash course. Selecting a lesson syncs the viewer: structure, representation,
highlighted atoms/residues, surface and camera all follow the lesson.

## Run it

```bash
bun install
bun run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

> This app lives in a Bun workspace. A cold `bun install` from this directory resolves every app in
> the monorepo, so the first run can take a while; afterwards it is instant.

## What's in here

- **Viewer** — `src/components/MoleculeViewer.tsx` owns the imperative 3Dmol.js lifecycle: the
  `GLViewer` is created once per mount, models are (re)loaded when the selected structure changes,
  and representation/highlights/surface/labels are re-applied on every view change.
- **Crash course** — `src/data/lessons.ts`. Each lesson carries original short educational copy plus
  a `view` spec (structure, style, highlights, optional surface and camera focus) that the viewer
  applies verbatim.
  1. Atoms, bonds, and why 3D matters (caffeine)
  2. Functional groups: reading a drug molecule (aspirin)
  3. Shape and space: van der Waals surfaces (ibuprofen)
  4. Proteins: from chain to fold (crambin, PDB 1CRN)
  5. A ligand in its pocket (HIV-1 protease + indinavir, PDB 1HSG)
- **Gallery** — five structures, freely browsable outside the course.
- **Representations** — lines, sticks, ball & stick, spheres, cartoon, plus a van der Waals surface
  toggle, 3D labels, spin and recenter.
- **Atom inspector** — click (or hover) any atom for a 3D label, element data (Z, mass,
  electronegativity, van der Waals radius) and its coordinates. Formula, mass, residue/chain counts
  and element composition are computed from the parsed model rather than hard-coded.

## Structure data

Bundled under `public/structures/` so the lab works with no network:

| File | Source |
| --- | --- |
| `caffeine.sdf`, `aspirin.sdf`, `ibuprofen.sdf` | PubChem 3D conformers, CIDs 2519 / 2244 / 3672 (public domain) |
| `1crn.pdb` | RCSB PDB entry 1CRN, waters stripped |
| `1hsg.pdb` | RCSB PDB entry 1HSG, waters stripped |

The HIV-1 protease entry is fetched live with `$3Dmol.download('pdb:1HSG', …)` to exercise the
library's own loader; if RCSB is unreachable the viewer falls back to the bundled copy and says so in
the caption.

## Scope

Single-user, client-only, no backend and no API keys. Deliberately out of scope: quantum chemistry,
docking, MD trajectories, accounts, and any local mirror of the PDB.
