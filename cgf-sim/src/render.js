/**
 * CGF TERMINAL RENDERER
 * All visual output for the CGF CLI.
 * Uses chalk for color — cyberpunk dark aesthetic in text form.
 *
 * Author: Sean Rangel — u/Cyrus9811
 */

'use strict';

const chalk = require('chalk');

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  brand:    chalk.hex('#44aaff'),
  dim:      chalk.hex('#223344'),
  muted:    chalk.hex('#334455'),
  real:     chalk.hex('#44ff88'),
  est:      chalk.hex('#ff8833'),
  warn:     chalk.hex('#ffaa22'),
  err:      chalk.hex('#ff4422'),
  val:      chalk.hex('#ffcc44'),
  label:    chalk.hex('#445566'),
  triple:   chalk.hex('#ffaa44'),
  topo:     chalk.hex('#aa88ff'),
  dist:     chalk.hex('#22ddcc'),
  title:    chalk.hex('#44aaff').bold,
  hi:       chalk.hex('#ffffff').bold,
};

// Topology color map — each class gets its own color
const TOPO_COLOR = {
  'open':          chalk.hex('#22aaff'),
  'closed':        chalk.hex('#ff5533'),
  'linear':        chalk.hex('#ffff44'),
  'radial':        chalk.hex('#44ffaa'),
  'branching':     chalk.hex('#ffaa22'),
  'nested-open':   chalk.hex('#33ddaa'),
  'nested-closed': chalk.hex('#ff3388'),
  'spiral':        chalk.hex('#ff44aa'),
  'toroidal':      chalk.hex('#aa44ff'),
  'compound':      chalk.hex('#ffffff'),
};

function colorTopo(T) {
  return (TOPO_COLOR[T] || chalk.white)(T);
}

// ── HEADER ───────────────────────────────────────────────────────────────────
function header(subtitle = '') {
  console.log();
  console.log(C.brand('  CGF · COGNITIVE GLYPH FRAMEWORK'));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  if (subtitle) console.log(C.muted(`  ${subtitle}`));
  console.log(C.dim(`  [PRE-DEBUT] · PRIMARY LEDGER: PHYSICAL CARDS · u/Cyrus9811`));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  console.log();
}

// ── STATUS BAR ───────────────────────────────────────────────────────────────
function statusBar(stats) {
  const bar_len  = 40;
  const filled   = Math.round((stats.real / 256) * bar_len);
  const bar      = C.real('█'.repeat(filled)) + C.dim('░'.repeat(bar_len - filled));
  console.log(
    C.label('  CORPUS  ') +
    C.real(`${stats.real} REAL`) + C.dim(' · ') +
    C.est(`${stats.estimated} EST`) + C.dim(' · ') +
    C.val(`${stats.completionPct}%`) + C.dim(' of 256')
  );
  console.log(`  ${bar}`);
  console.log();
}

// ── NODE DISPLAY ─────────────────────────────────────────────────────────────
function nodeRow(node, extra = '') {
  const conf   = node.real ? C.real('●') : C.est('○');
  const id     = C.hi(node.id.padEnd(9));
  const triple = C.triple(
    `D:${node.triple.D.toFixed(2)}  T:${String(node.triple.T).padEnd(14)}  R:${node.triple.R}`
  );
  return `  ${conf} ${id} ${triple} ${extra}`;
}

// ── NEIGHBORS TABLE ──────────────────────────────────────────────────────────
function neighborsTable(node, neighbors) {
  console.log(C.label(`  NEAREST NEIGHBORS of ${node.id}`));
  console.log(C.dim('  ──────────────────────────────────────────'));
  neighbors.forEach((n, i) => {
    const rank = C.dim(`  ${i + 1}.`);
    const conf = n.real ? C.real('●') : C.est('○');
    const id   = C.hi(n.id.padEnd(9));
    const dist = C.dist(n.dist.toFixed(5));
    const top  = colorTopo(n.triple.T);
    console.log(`${rank} ${conf} ${id}  Δ ${dist}  ${top}`);
  });
  console.log();
}

// ── CLUSTER TABLE ────────────────────────────────────────────────────────────
function clusterTable(assigned, centroids) {
  const groups = {};
  assigned.forEach(n => {
    if (!groups[n.cluster]) groups[n.cluster] = [];
    groups[n.cluster].push(n);
  });

  console.log(C.label('  CLUSTER MAP  ·  K=7  ·  D/T/R METRIC SPACE'));
  console.log(C.dim('  ─────────────────────────────────────────────────────'));

  Object.entries(groups).forEach(([ci, members]) => {
    const c      = centroids[ci];
    const real   = members.filter(m => m.real).length;
    const label  = `CLUSTER ${parseInt(ci) + 1}`;
    const cStr   = C.triple(`D:${c.triple.D.toFixed(2)} T:${c.triple.T.padEnd(14)} R:${c.triple.R}`);
    console.log(`\n  ${C.brand(label.padEnd(12))} ${C.label('centroid:')} ${cStr}`);
    console.log(C.dim(`  ${'─'.repeat(50)}`));
    console.log(
      C.label('  members: ') + C.hi(members.length) +
      C.dim('  ·  real: ') + C.real(real) +
      C.dim('  ·  est: ')  + C.est(members.length - real)
    );
    // Show first 4 members
    members.slice(0, 4).forEach(m => {
      process.stdout.write(nodeRow(m) + '\n');
    });
    if (members.length > 4)
      console.log(C.dim(`  ... and ${members.length - 4} more`));
  });
  console.log();
}

// ── PROPAGATION WAVE ─────────────────────────────────────────────────────────
function propagationLog(result, seedId) {
  console.log(C.label(`  PROPAGATION WAVE  ·  SEED: ${C.hi(seedId)}`));
  console.log(C.dim('  ──────────────────────────────────────────'));

  result.wavelog.forEach(step => {
    if (step.step === 0) {
      console.log(`  ${C.val('STEP 0')}  ${C.brand('▸ ORIGIN')}  ${C.hi(seedId)}`);
      return;
    }
    const ids = step.activated.map(a => {
      const id = typeof a === 'string' ? a : a.id;
      const d  = typeof a === 'object' ? C.dim(` Δ${a.dist.toFixed(3)}`) : '';
      return C.brand(id) + d;
    });
    console.log(`  ${C.val(`STEP ${String(step.step).padStart(2, '0')}`)}  ${C.dist('▸')} ${ids.join(C.dim(', '))}`);
  });

  console.log();
  console.log(
    C.label('  REACHED: ') + C.hi(result.totalReached) +
    C.dim(' / ') + C.hi(result.totalNodes) +
    C.dim('  ·  COVERAGE: ') + C.val(((result.totalReached / result.totalNodes) * 100).toFixed(1) + '%')
  );
  console.log();
}

// ── ENTROPY SCAN ─────────────────────────────────────────────────────────────
function entropyReport(scan, topN = 10) {
  const sorted = [...scan].sort((a, b) => b.normalEntropy - a.normalEntropy);

  console.log(C.label('  ENTROPY SCAN  ·  LOCAL TOPOLOGICAL DIVERSITY'));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  console.log(C.dim('  (HIGH ENTROPY = structurally diverse neighborhood)'));
  console.log();

  const show = sorted.slice(0, topN);
  show.forEach((n, i) => {
    const bar    = entropyBar(n.normalEntropy, 20);
    const conf   = n.real ? C.real('●') : C.est('○');
    const rank   = C.dim(`${String(i + 1).padStart(3)}.`);
    const id     = C.hi(n.id.padEnd(9));
    const score  = C.val(n.normalEntropy.toFixed(3));
    console.log(`${rank} ${conf} ${id} ${bar} ${score}  ${colorTopo(n.triple.T)}`);
  });
  console.log();

  const avg = scan.reduce((s, n) => s + n.normalEntropy, 0) / scan.length;
  console.log(C.label('  SPACE AVG ENTROPY: ') + C.val(avg.toFixed(4)));
  console.log();
}

function entropyBar(val, width) {
  const filled = Math.round(val * width);
  const colors = ['#220033','#441155','#661177','#883399','#aa55bb','#cc77dd','#eeccff'];
  const col    = colors[Math.min(Math.floor(val * colors.length), colors.length - 1)];
  return chalk.hex(col)('█'.repeat(filled)) + C.dim('░'.repeat(width - filled));
}

// ── CONVERGENCE REPORT ───────────────────────────────────────────────────────
function convergenceReport(result) {
  console.log(C.label('  CONVERGENCE TEST  ·  REAL vs ESTIMATED DISTRIBUTION'));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  console.log();
  console.log(C.label('  REAL NODES:        ') + C.real(result.realCount));
  console.log(C.label('  ESTIMATED NODES:   ') + C.est(result.estCount));
  console.log(C.label('  COMPLETION:        ') + C.val(result.completion + '%'));
  console.log();

  if (result.convergenceRatio !== null) {
    console.log(C.label('  REAL MEAN DIST:    ') + C.dist(result.realMeanDist));
    console.log(C.label('  EST MEAN DIST:     ') + C.dim(result.estMeanDist));
    console.log(C.label('  CONVERGENCE RATIO: ') + C.val(result.convergenceRatio));
    console.log();

    const ratio = result.convergenceRatio;
    if (ratio < 0.7) {
      console.log(C.real('  ▸ REAL DATA IS CLUSTERING TIGHTLY — space is converging'));
    } else if (ratio < 1.0) {
      console.log(C.warn('  ▸ MILD CLUSTERING DETECTED — commit more cards to confirm'));
    } else {
      console.log(C.est('  ▸ REAL DATA DISPERSED — no clustering pattern yet'));
    }
  } else {
    console.log(C.est('  ▸ NEED ≥2 REAL NODES to compute convergence'));
  }
  console.log();
}

// ── DENSITY MAP ──────────────────────────────────────────────────────────────
function densityChart(bins) {
  const maxCount = Math.max(...bins.map(b => b.count));
  console.log(C.label('  DENSITY MAP  ·  FRACTAL DIMENSION AXIS'));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  bins.forEach(bin => {
    const barLen  = Math.round((bin.count / maxCount) * 28);
    const realLen = Math.round((bin.real / maxCount) * 28);
    const bar     = C.real('█'.repeat(realLen)) +
                    C.est('█'.repeat(Math.max(0, barLen - realLen))) +
                    C.dim('░'.repeat(28 - barLen));
    console.log(`  ${C.dim(bin.label.padEnd(12))} ${bar} ${C.val(String(bin.count).padStart(3))}`);
  });
  console.log();
}

// ── TOPO DISTRIBUTION ────────────────────────────────────────────────────────
function topoChart(dist) {
  const entries  = Object.entries(dist).sort((a, b) => b[1].count - a[1].count);
  const maxCount = Math.max(...entries.map(([, v]) => v.count));

  console.log(C.label('  TOPOLOGY DISTRIBUTION'));
  console.log(C.dim('  ─────────────────────────────────────────────'));
  entries.forEach(([T, { count, real }]) => {
    const barLen  = Math.round((count / maxCount) * 24);
    const realLen = Math.round((real / maxCount) * 24);
    const bar     = C.real('█'.repeat(realLen)) +
                    C.est('█'.repeat(Math.max(0, barLen - realLen))) +
                    C.dim('░'.repeat(24 - barLen));
    const label   = colorTopo(T).padEnd(22);
    console.log(`  ${label} ${bar} ${C.val(String(count).padStart(3))}`);
  });
  console.log();
}

// ── COMMIT CONFIRMATION ──────────────────────────────────────────────────────
function commitConfirm(result) {
  const action = result.action === 'updated' ? C.warn('UPDATED →') : C.real('INSERTED →');
  const node   = result.node;
  console.log(`  ${action} ${C.hi(node.id)}  ` +
    C.triple(`D:${node.triple.D}  T:${node.triple.T}  R:${node.triple.R}`) +
    C.real('  ● REAL'));
  console.log();
}

// ── SEPARATOR ────────────────────────────────────────────────────────────────
function sep() { console.log(C.dim('  ' + '─'.repeat(48))); }

module.exports = {
  header, statusBar, nodeRow, neighborsTable, clusterTable,
  propagationLog, entropyReport, convergenceReport, densityChart,
  topoChart, commitConfirm, sep, C, colorTopo,
};
