/**
 * CGF METRIC ENGINE
 * Core mathematical substrate for the 256-pattern cognitive glyph space.
 *
 * Author:  Sean Rangel — u/Cyrus9811
 * Source:  Physical index card ledger (primary)
 * Mirror:  GitHub / u/Cyrus9811 (digital provenance)
 *
 * The identity triple (D, T, R) is the coordinate system.
 * This file computes — it does not assign or author.
 */

'use strict';

// ── TOPOLOGY ORDINAL MAP ─────────────────────────────────────────────────────
// Maps topology class strings to normalized numeric values for metric math.
// Order reflects structural complexity — open=simplest, compound=most complex.
const TOPO_ORD = {
  'open':          1,
  'closed':        2,
  'linear':        3,
  'radial':        4,
  'branching':     5,
  'nested-open':   6,
  'nested-closed': 7,
  'spiral':        8,
  'toroidal':      9,
  'compound':     10,
};

const TOPO_KEYS = Object.keys(TOPO_ORD);
const MAX_NODES = 256;

// ── NORMALIZATION RANGES ─────────────────────────────────────────────────────
const RANGE = {
  D: { min: 1.0, max: 2.0 },   // fractal dimension
  T: { min: 1,   max: 10  },   // topology ordinal
  R: { min: 1,   max: 5   },   // recursion depth
};

function normalize(val, axis) {
  const { min, max } = RANGE[axis];
  return (val - min) / (max - min);
}

function topoOrd(T) {
  return TOPO_ORD[T] ?? 5; // default to branching if unknown
}

// ── METRIC DISTANCE ──────────────────────────────────────────────────────────
// Euclidean distance in normalized (D, T, R) space.
// All three axes scaled to [0,1] before computation so no axis dominates.
function metricDist(a, b) {
  const dD = normalize(a.triple.D, 'D') - normalize(b.triple.D, 'D');
  const dT = normalize(topoOrd(a.triple.T), 'T') - normalize(topoOrd(b.triple.T), 'T');
  const dR = normalize(a.triple.R, 'R') - normalize(b.triple.R, 'R');
  return Math.sqrt(dD * dD + dT * dT + dR * dR);
}

// ── NEAREST NEIGHBORS ────────────────────────────────────────────────────────
function nearestNeighbors(node, corpus, k = 3) {
  return corpus
    .filter(n => n.id !== node.id)
    .map(n => ({ id: n.id, dist: metricDist(node, n), triple: n.triple, real: n.real }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k);
}

// ── CLUSTER ASSIGNMENT (K-means style, 7 clusters) ──────────────────────────
const K = 7;

function randomCentroids(corpus, k, seed = 42) {
  // Seeded selection — deterministic
  const step = Math.floor(corpus.length / k);
  return Array.from({ length: k }, (_, i) => ({ ...corpus[(i * step) % corpus.length] }));
}

function assignClusters(corpus, centroids) {
  return corpus.map(node => {
    let minDist = Infinity, cluster = 0;
    centroids.forEach((c, i) => {
      const d = metricDist(node, c);
      if (d < minDist) { minDist = d; cluster = i; }
    });
    return { ...node, cluster, clusterDist: minDist };
  });
}

function recomputeCentroids(assigned, k) {
  return Array.from({ length: k }, (_, ci) => {
    const members = assigned.filter(n => n.cluster === ci);
    if (!members.length) return assigned[0]; // fallback
    const avgD = members.reduce((s, n) => s + n.triple.D, 0) / members.length;
    const avgT = Math.round(members.reduce((s, n) => s + topoOrd(n.triple.T), 0) / members.length);
    const avgR = Math.round(members.reduce((s, n) => s + n.triple.R, 0) / members.length);
    const T = TOPO_KEYS[Math.min(avgT - 1, TOPO_KEYS.length - 1)];
    return { id: `centroid-${ci}`, triple: { D: parseFloat(avgD.toFixed(3)), T, R: avgR }, real: false };
  });
}

function kMeansClusters(corpus, iterations = 8) {
  let centroids = randomCentroids(corpus, K);
  let assigned  = corpus;
  for (let i = 0; i < iterations; i++) {
    assigned  = assignClusters(corpus, centroids);
    centroids = recomputeCentroids(assigned, K);
  }
  return { assigned, centroids };
}

// ── DENSITY MAP ──────────────────────────────────────────────────────────────
// Partitions the D axis into bins and counts node density per bin.
function densityMap(corpus, bins = 10) {
  const results = Array.from({ length: bins }, (_, i) => ({
    label: `D${(1.0 + i * 0.1).toFixed(1)}–${(1.0 + (i + 1) * 0.1).toFixed(1)}`,
    count: 0,
    real:  0,
  }));
  corpus.forEach(node => {
    const bin = Math.min(bins - 1, Math.floor((node.triple.D - 1.0) / 0.1));
    results[bin].count++;
    if (node.real) results[bin].real++;
  });
  return results;
}

// ── TOPOLOGY DISTRIBUTION ────────────────────────────────────────────────────
function topoDistribution(corpus) {
  const dist = {};
  TOPO_KEYS.forEach(k => { dist[k] = { count: 0, real: 0 }; });
  corpus.forEach(n => {
    if (!dist[n.triple.T]) dist[n.triple.T] = { count: 0, real: 0 };
    dist[n.triple.T].count++;
    if (n.real) dist[n.triple.T].real++;
  });
  return dist;
}

// ── SIMULATION: PROPAGATION WAVE ─────────────────────────────────────────────
// Simulates a signal propagating through the metric space from a seed node.
// At each step, the signal spreads to all unvisited neighbors within threshold.
// Returns a log of steps — who activated when and from where.
function propagationWave(seedId, corpus, threshold = 0.35, maxSteps = 20) {
  const nodeMap = new Map(corpus.map(n => [n.id, n]));
  const visited = new Set([seedId]);
  const wavelog = [{ step: 0, activated: [seedId], from: null }];
  let frontier  = [seedId];

  for (let step = 1; step <= maxSteps; step++) {
    const nextFrontier = [];
    const activated    = [];

    for (const srcId of frontier) {
      const src = nodeMap.get(srcId);
      if (!src) continue;
      for (const node of corpus) {
        if (visited.has(node.id)) continue;
        const d = metricDist(src, node);
        if (d <= threshold) {
          visited.add(node.id);
          nextFrontier.push(node.id);
          activated.push({ id: node.id, dist: d, from: srcId });
        }
      }
    }

    if (!activated.length) break;
    wavelog.push({ step, activated, from: frontier });
    frontier = nextFrontier;
  }

  return { wavelog, totalReached: visited.size, totalNodes: corpus.length };
}

// ── SIMULATION: ENTROPY SCAN ─────────────────────────────────────────────────
// Measures local entropy around each node — how diverse its neighborhood is
// in terms of topology class. High entropy = structurally diverse neighborhood.
function entropyScan(corpus, k = 5) {
  return corpus.map(node => {
    const neighbors = nearestNeighbors(node, corpus, k);
    const topoFreq  = {};
    neighbors.forEach(n => {
      topoFreq[n.triple.T] = (topoFreq[n.triple.T] || 0) + 1;
    });
    const probs   = Object.values(topoFreq).map(c => c / k);
    const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(Math.min(k, TOPO_KEYS.length));
    return {
      id:            node.id,
      triple:        node.triple,
      real:          node.real,
      entropy:       parseFloat(entropy.toFixed(4)),
      normalEntropy: parseFloat((entropy / maxEntropy).toFixed(4)),
      topoFreq,
    };
  });
}

// ── SIMULATION: CONVERGENCE TEST ─────────────────────────────────────────────
// Tests whether the metric space is converging — are real nodes clustering
// more tightly than estimated nodes? Measures mean intra-real distance.
function convergenceTest(corpus) {
  const real = corpus.filter(n => n.real);
  const est  = corpus.filter(n => !n.real);

  function meanPairwiseDist(nodes) {
    if (nodes.length < 2) return 0;
    let sum = 0, count = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        sum += metricDist(nodes[i], nodes[j]);
        count++;
      }
    }
    return sum / count;
  }

  return {
    realCount:     real.length,
    estCount:      est.length,
    completion:    parseFloat(((real.length / MAX_NODES) * 100).toFixed(2)),
    realMeanDist:  parseFloat(meanPairwiseDist(real).toFixed(4)),
    estMeanDist:   parseFloat(meanPairwiseDist(est).toFixed(4)),
    convergenceRatio: real.length > 1
      ? parseFloat((meanPairwiseDist(real) / (meanPairwiseDist(est) || 1)).toFixed(4))
      : null,
  };
}

module.exports = {
  TOPO_KEYS,
  TOPO_ORD,
  MAX_NODES,
  metricDist,
  nearestNeighbors,
  kMeansClusters,
  densityMap,
  topoDistribution,
  propagationWave,
  entropyScan,
  convergenceTest,
  normalize,
  topoOrd,
};
