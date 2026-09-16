# PLAN

## Goal
Ship a single-user chemistry learning lab: interactive 3Dmol.js molecular viewer paired with a short structural-chemistry / molecular-biology crash course that syncs highlights and styles to the 3D view.

## Single-user MVP
- 3Dmol.js viewer with a small gallery: caffeine, aspirin (or similar small organics), and one protein PDB (cartoon)
- Style toggles: stick, sphere, cartoon (proteins), surface (where sensible)
- Atom click → label / brief property readout
- Crash-course panel (3–5 short lessons) that, when selected, sync the viewer (molecule + style + optional selection/highlight). Suggested arc: atoms & bonds → functional groups on a drug-like small molecule → protein secondary structure (cartoon) → optional ligand-in-pocket teaser
- Lessons are original short educational copy (accurate enough for a crash course; cite PDB ids / common names). No LLM required.
- `bun install && bun run dev` from apps/3dmol-molecule-lab/

## Explicitly out of scope
- Quantum chemistry, docking, MD simulation, accounts, uploading arbitrary huge trajectories, offline PDB mirror of entire RCSB

## Outcome-oriented tasks
1. Write PLAN.md verbatim.
2. Scaffold with Bun-friendly create-* (prefer Vite React or Next); skip-install preferred; bunfig.toml with `[install] minimumReleaseAge = 259200` BEFORE bun install.
3. Integrate `3dmol` (https://3dmol.org/) in React carefully (viewer create/destroy in useEffect; dynamic import if needed).
4. Build gallery + styles + lesson sync as vertical slices until happy path works.
5. PR validation: at least ONE screenshot AND at least ONE video/mp4 of the running app in the PR body (hosted artifacts — do not commit media).

## Stack
- Bun
- 3Dmol.js (the tech under demo)
- Vite React or Next + light UI (shadcn ok)
- Bundled small molecule structures (SDF/PDB text) and/or `$3Dmol.download('pdb:…')` for the protein example

## Deferred
- Full course curriculum, RDKit property calc, multi-user, Cloudflare deploy
