/**
 * CGF CORPUS LOADER
 * Loads the glyph corpus from data/corpus.json.
 * Validates every node against CGF canonical shape.
 * Enforces 256-max constraint and physical-first provenance rules.
 *
 * Author: Sean Rangel — u/Cyrus9811
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { TOPO_KEYS, MAX_NODES } = require('./engine');

const CORPUS_PATH = path.join(__dirname, '../data/corpus.json');

// ── CANONICAL NODE SHAPE ─────────────────────────────────────────────────────
function validateNode(node, index) {
  const errors = [];

  if (!node.id || typeof node.id !== 'string')
    errors.push(`[${index}] missing or invalid id`);

  if (!node.triple || typeof node.triple !== 'object')
    errors.push(`[${index}] missing triple`);
  else {
    const { D, T, R } = node.triple;
    if (typeof D !== 'number' || D < 1.0 || D > 2.0)
      errors.push(`[${index}:${node.id}] D must be float 1.0–2.0, got: ${D}`);
    if (!TOPO_KEYS.includes(T))
      errors.push(`[${index}:${node.id}] T must be a valid topology class, got: ${T}`);
    if (!Number.isInteger(R) || R < 1 || R > 5)
      errors.push(`[${index}:${node.id}] R must be integer 1–5, got: ${R}`);
  }

  if (typeof node.real !== 'boolean')
    errors.push(`[${index}:${node.id}] real must be boolean`);

  return errors;
}

// ── LOAD CORPUS ──────────────────────────────────────────────────────────────
function loadCorpus() {
  if (!fs.existsSync(CORPUS_PATH)) {
    // First run — generate seed corpus of estimated nodes
    return generateSeedCorpus();
  }

  const raw  = fs.readFileSync(CORPUS_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.nodes))
    throw new Error('corpus.json must have a nodes array');

  if (data.nodes.length > MAX_NODES)
    throw new Error(`Corpus exceeds 256-node maximum. Got: ${data.nodes.length}`);

  const allErrors = [];
  data.nodes.forEach((n, i) => {
    const errs = validateNode(n, i);
    allErrors.push(...errs);
  });

  if (allErrors.length > 0) {
    throw new Error(`Corpus validation failed:\n${allErrors.join('\n')}`);
  }

  return data.nodes;
}

// ── SAVE CORPUS ──────────────────────────────────────────────────────────────
function saveCorpus(nodes) {
  if (nodes.length > MAX_NODES)
    throw new Error(`Cannot save — exceeds 256-node maximum`);

  const data = {
    meta: {
      author:     'Sean Rangel',
      provenance: 'Physical index card ledger (primary)',
      mirror:     'u/Cyrus9811 · GitHub',
      maxNodes:   MAX_NODES,
      version:    '0.1.0',
      saved:      new Date().toISOString(),
      realCount:  nodes.filter(n => n.real).length,
      estCount:   nodes.filter(n => !n.real).length,
    },
    nodes,
  };

  fs.mkdirSync(path.dirname(CORPUS_PATH), { recursive: true });
  fs.writeFileSync(CORPUS_PATH, JSON.stringify(data, null, 2));
}

// ── COMMIT REAL NODE ─────────────────────────────────────────────────────────
// Promotes an estimated node to real, or inserts a new real node.
// This is the only mutation path — all changes come from physical cards.
function commitRealNode(corpus, { id, D, T, R }) {
  const errors = validateNode({ id, triple: { D, T, R }, real: true }, 'input');
  if (errors.length) throw new Error(errors.join('\n'));

  const existing = corpus.findIndex(n => n.id === id);

  if (existing >= 0) {
    // Update estimated → real
    corpus[existing] = {
      ...corpus[existing],
      triple: { D, T, R },
      real:   true,
    };
    return { action: 'updated', node: corpus[existing] };
  }

  if (corpus.length >= MAX_NODES)
    throw new Error(`Cannot add — corpus is at maximum capacity (${MAX_NODES})`);

  const newNode = { id, triple: { D, T, R }, real: true, provenance: { card: true } };
  corpus.push(newNode);
  return { action: 'inserted', node: newNode };
}

// ── SEED CORPUS (first run) ──────────────────────────────────────────────────
// Generates 176 estimated placeholder nodes distributed across the D/T/R space.
// These are NOT real data — they are structural scaffolding until cards are committed.
function generateSeedCorpus() {
  function seededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rng   = seededRng(0xCF256);
  const nodes = [];

  for (let i = 0; i < 176; i++) {
    const D = parseFloat((1.0 + rng() * 1.0).toFixed(2));
    const T = TOPO_KEYS[Math.floor(rng() * TOPO_KEYS.length)];
    const R = Math.ceil(rng() * 5);
    nodes.push({
      id:     `CGF-${String(i + 1).padStart(3, '0')}`,
      triple: { D, T, R },
      real:   false,
    });
  }

  saveCorpus(nodes);
  return nodes;
}

// ── CORPUS STATS ─────────────────────────────────────────────────────────────
function corpusStats(corpus) {
  const real  = corpus.filter(n => n.real).length;
  const est   = corpus.length - real;
  const pct   = ((real / MAX_NODES) * 100).toFixed(1);

  const topoBreakdown = {};
  corpus.forEach(n => {
    topoBreakdown[n.triple.T] = (topoBreakdown[n.triple.T] || 0) + 1;
  });

  const dValues = corpus.map(n => n.triple.D);
  const rValues = corpus.map(n => n.triple.R);

  return {
    total:         corpus.length,
    real,
    estimated:     est,
    completionPct: pct,
    remaining:     MAX_NODES - real,
    topoBreakdown,
    dRange: {
      min: Math.min(...dValues).toFixed(2),
      max: Math.max(...dValues).toFixed(2),
      avg: (dValues.reduce((s, v) => s + v, 0) / dValues.length).toFixed(3),
    },
    rRange: {
      min: Math.min(...rValues),
      max: Math.max(...rValues),
      avg: (rValues.reduce((s, v) => s + v, 0) / rValues.length).toFixed(2),
    },
  };
}

module.exports = { loadCorpus, saveCorpus, commitRealNode, corpusStats, CORPUS_PATH };
