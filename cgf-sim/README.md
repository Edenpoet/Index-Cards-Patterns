# CGF-SIM — Cognitive Glyph Framework Simulation Engine
### v0.1.0 · PRE-DEBUT

> Part of the [Index Cards — CGF](https://github.com/Edenpoet/Index-Cards-Patterns) project. This is the simulation engine for the hand-drawn fractal pattern metric space.

```
  CGF · COGNITIVE GLYPH FRAMEWORK
  ─────────────────────────────────────────────
  [PRE-DEBUT] · PRIMARY LEDGER: PHYSICAL CARDS · u/Cyrus9811
```

---

## What This Is

A Node.js command-line simulation engine built on the **256-pattern cognitive glyph set** — a
hand-authored metric space where every pattern holds a unique identity triple **(D, T, R)**:

| Axis | Name | Range | Meaning |
|------|------|-------|---------|
| **D** | Fractal Dimension | 1.00 – 2.00 | Self-similar structural complexity |
| **T** | Topology Class | 10 classes | Fundamental shape relationship |
| **R** | Recursion Depth | 1 – 5 | Generative layer count |

The triple is the **coordinate** — not a label, not metadata. Distance between any two glyphs
is computable. The corpus is a real metric space.

**Primary ledger: physical index cards (Sean Rangel)**
**Digital provenance: u/Cyrus9811 (Reddit) · GitHub**

---

## Install

```bash
npm install 
node src/index.js status
```

No build step. No external services. Runs from any machine with Node.js ≥ 14.

---

## Commands

```bash
node src/index.js status                              # corpus overview + completion
node src/index.js scan --neighbors 5 --top 12        # entropy scan (topological diversity)
node src/index.js map --bins 10                      # density map (D axis + topology dist)
node src/index.js cluster                            # K-means cluster analysis (K=7)
node src/index.js query CGF-001 --neighbors 5        # inspect node + nearest neighbors
node src/index.js sim wave CGF-001 --threshold 0.3   # propagation wave from seed
node src/index.js sim converge                       # real vs estimated convergence test
node src/index.js sim full CGF-001                   # full suite: wave + scan + converge + cluster
node src/index.js commit --id CGF-042 --d 1.67 --t branching --r 2   # commit real card data
node src/index.js export                             # export JSON snapshot
node src/index.js export --real-only                 # export only real nodes
```

---

## Simulation Modes

### `sim wave <seedId>`
Propagation wave from a seed node. Spreads activation through the metric space
step by step — every node within `--threshold` distance gets activated.
Models how a signal (cognitive, structural, informational) moves through the glyph space.

```bash
node src/index.js sim wave CGF-001 --threshold 0.35 --steps 20
```

### `scan`
Local entropy scan — measures topological diversity in each node's neighborhood.
High entropy = structurally varied neighbors. Low entropy = clustered region.
Reveals which areas of the space are informationally dense vs homogeneous.

```bash
node src/index.js scan --neighbors 5 --top 12
```

### `cluster`
K-means (K=7) across normalized D/T/R space. Each cluster has a centroid triple
and a breakdown of real vs estimated members. Reveals natural groupings that
emerge from the math, not from visual appearance.

```bash
node src/index.js cluster
```

### `sim converge`
Convergence test — measures mean pairwise distance among real nodes vs estimated nodes.
A convergence ratio < 1.0 means real data is clustering more tightly than the scaffolding.
As more cards are committed, this ratio reveals the true shape of the space.

```bash
node src/index.js sim converge
```

---

## Committing Real Data

The corpus ships with 176 **estimated placeholder nodes** — structural scaffolding that
distributes evenly across the D/T/R space. As you work through the physical cards,
commit real data one node at a time:

```bash
node src/index.js commit --id CGF-001 --d 1.42 --t nested-closed --r 3
```

This promotes the estimated node to **REAL** (●), updating its coordinates to the
true triple from the card. The corpus file updates in place. The completion percentage
ticks up. Real edges in the 3D visualizer go bright.

**Topology classes:**
`open` · `closed` · `nested-open` · `nested-closed` · `branching`
`toroidal` · `radial` · `linear` · `spiral` · `compound`

---

## Corpus File

`data/corpus.json` — auto-generated on first run if absent.
Validates every node on load. Hard cap at 256 nodes (MAX_NODES constant).
Includes provenance metadata in the header.

---

## Architecture

```
cgf-sim/
├── src/
│   ├── index.js      # CLI commands (commander)
│   ├── engine.js     # metric math (distance, clusters, simulations)
│   ├── corpus.js     # load/save/validate/commit
│   └── render.js     # terminal output (chalk)
├── data/
│   └── corpus.json   # live corpus — 256 nodes max
└── output/
    └── *.json        # exported snapshots
```

**Dependencies:** `commander` (CLI), `chalk` (color output)
No database. No API. No build pipeline.

---

## Provenance Chain

```
Physical index cards (primary ledger)
    ↓
Hand-authored by Sean Rangel
    ↓
Posted to u/Cyrus9811 (verified digital provenance)
    ↓
GitHub (reference archive)
    ↓
cgf-sim corpus.json (live mirror)
    ↓
cgf-sim engine (interpreter — never author)
```

The chain does not run backward.
This software reads the space. It does not define it.

---

*CGF-SIM v0.1.0 · PRE-DEBUT*
*Author: Sean Rangel · u/Cyrus9811*
*Primary ledger: physical index cards*
