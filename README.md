# Index Cards — Cognitive Glyph Field (CGF)

178 hand-authored index card patterns — each a unique cognitive state drawn without reference. Complete set targets **256**.

Each glyph carries an identity triple: `(D, T, R)` — fractal dimension, topology class, recursion depth.

---

## What's Here

| Path | What |
|------|------|
| `CGF.html` | Interactive neural field visualizer — 178 nodes, 352 edges by structural similarity |
| `CGFS.html` | CGF static viewer |
| `Metric.html` | Metric space explorer — D/T/R coordinate system |
| `cgf-sim/` | **Simulation engine** — Node.js CLI for the metric space |
| `images/thumbnails/` | Card photos and visual documentation |

---

## CGF-SIM — Simulation Engine

A command-line simulation engine that treats the 256-pattern glyph set as a **real metric space**. Distance between any two patterns is computable. Run entropy scans, K-means clustering, propagation waves — all from your terminal.

```bash
cd cgf-sim
npm install
node src/index.js status
```

### Commands

```bash
node src/index.js status              # corpus overview + completion
node src/index.js scan --neighbors 5  # entropy scan (topological diversity)
node src/index.js map --bins 10       # density map
node src/index.js cluster             # K-means cluster analysis (K=7)
node src/index.js query CGF-001       # inspect node + nearest neighbors
node src/index.js sim wave CGF-001    # propagation wave from seed
node src/index.js sim converge        # real vs estimated convergence
node src/index.js commit --id CGF-042 --d 1.67 --t branching --r 2
node src/index.js export              # export JSON snapshot
```

See [`cgf-sim/README.md`](cgf-sim/README.md) for full documentation.

---

## Current Status

| Metric | Value |
|--------|-------|
| Physical cards authored | 178 |
| Target set size | 256 |
| Committed to corpus | 2 real · 174 estimated |
| Completion | 0.8% |

As cards are committed via `cgf commit`, the completion percentage ticks up and the engine's simulations converge toward the true shape of the space.

## Topology Classes (178-card sample)

| Class | Count | Description |
|-------|-------|-------------|
| Ω-ORGANIC | 93 | Dense, high-entropy branching |
| Ω-CROSS | 48 | Axially balanced, centered |
| Ω-MANDALA | 13 | Radially symmetric field |
| Ω-LATTICE | 12 | Open symmetric grid |
| Ω-FIELD | 5 | Diffuse low-density |
| Ω-ASYMMETRIC | 4 | Deliberately unbalanced |
| Ω-WEAVE | 2 | Interlocked, no focal center |
| Ω-TREE | 1 | Pure open branching |

## How to Run the Visualizers

Each `.html` file is self-contained. **Download and open locally** — no build step, no backend, no dependencies.

- `CGF.html` — Interactive force-directed graph of all 178 patterns
- `CGFS.html` — Static structural view
- `Metric.html` — The metric space itself: D × T × R

## Provenance

Physical index cards are the **primary ledger**. This repo is the digital record.

- **Author:** Sean Rangel
- **Reddit:** [u/](https://www.reddit.com/user/)
- **Card photos:** 
200 index cards  https://photos.app.goo.gl/YqH8BNKudkpYgW4EA