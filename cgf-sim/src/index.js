#!/usr/bin/env node
/**
 * CGF-SIM — COGNITIVE GLYPH FRAMEWORK SIMULATION ENGINE
 * Command-line interface
 *
 * Author:    Sean Rangel — u/Cyrus9811
 * Ledger:    Physical index cards (256-pattern set)
 * Mirror:    GitHub · u/Cyrus9811
 * Version:   0.1.0 · PRE-DEBUT
 *
 * COMMANDS:
 *   cgf status              — corpus overview and completion status
 *   cgf scan                — entropy scan across all nodes
 *   cgf map                 — density + topology distribution maps
 *   cgf cluster             — K-means cluster analysis
 *   cgf sim wave <id>       — propagation wave from seed node
 *   cgf sim converge        — convergence test (real vs estimated)
 *   cgf query <id>          — inspect single node + neighbors
 *   cgf commit              — commit a real triple from a physical card
 *   cgf export              — export corpus snapshot to JSON
 */

'use strict';

const { Command } = require('commander');
const fs          = require('fs');
const path        = require('path');

const engine  = require('./engine');
const corpus_ = require('./corpus');
const R       = require('./render');

const program = new Command();

// ── BOOT ──────────────────────────────────────────────────────────────────────
function boot() {
  try {
    return corpus_.loadCorpus();
  } catch (err) {
    console.error(R.C.err(`\n  CORPUS ERROR: ${err.message}\n`));
    process.exit(1);
  }
}

// ── CLI METADATA ─────────────────────────────────────────────────────────────
program
  .name('cgf')
  .description('CGF Metric Space Simulation Engine — Cognitive Glyph Framework')
  .version('0.1.0');

// ─────────────────────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('status')
  .description('Corpus overview — completion, distribution, ranges')
  .action(() => {
    const corpus = boot();
    const stats  = corpus_.corpusStats(corpus);
    R.header('STATUS · CORPUS OVERVIEW');
    R.statusBar(stats);

    console.log(R.C.label('  TOTAL NODES:   ') + R.C.hi(stats.total));
    console.log(R.C.label('  REAL:          ') + R.C.real(stats.real) + R.C.dim(' (from physical cards)'));
    console.log(R.C.label('  ESTIMATED:     ') + R.C.est(stats.estimated) + R.C.dim(' (structural placeholders)'));
    console.log(R.C.label('  REMAINING:     ') + R.C.warn(stats.remaining) + R.C.dim(' cards to commit'));
    console.log(R.C.label('  COMPLETION:    ') + R.C.val(stats.completionPct + '%'));
    console.log();
    console.log(R.C.label('  D RANGE:  ') +
      R.C.val(`${stats.dRange.min} → ${stats.dRange.max}`) +
      R.C.dim(`  avg ${stats.dRange.avg}`));
    console.log(R.C.label('  R RANGE:  ') +
      R.C.val(`${stats.rRange.min} → ${stats.rRange.max}`) +
      R.C.dim(`  avg ${stats.rRange.avg}`));
    console.log();
  });

// ─────────────────────────────────────────────────────────────────────────────
// SCAN
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('scan')
  .description('Entropy scan — local topological diversity across the space')
  .option('-k, --neighbors <n>', 'neighborhood size for entropy computation', '5')
  .option('-n, --top <n>', 'show top N results', '12')
  .action((opts) => {
    const corpus = boot();
    const k      = parseInt(opts.neighbors);
    const topN   = parseInt(opts.top);
    R.header(`ENTROPY SCAN  ·  k=${k}`);
    R.statusBar(corpus_.corpusStats(corpus));
    const scan = engine.entropyScan(corpus, k);
    R.entropyReport(scan, topN);
  });

// ─────────────────────────────────────────────────────────────────────────────
// MAP
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('map')
  .description('Density map — distribution across D axis and topology classes')
  .option('-b, --bins <n>', 'number of D-axis bins', '10')
  .action((opts) => {
    const corpus = boot();
    const bins   = parseInt(opts.bins);
    R.header('DENSITY + TOPOLOGY MAP');
    R.statusBar(corpus_.corpusStats(corpus));
    R.densityChart(engine.densityMap(corpus, bins));
    R.topoChart(engine.topoDistribution(corpus));
  });

// ─────────────────────────────────────────────────────────────────────────────
// CLUSTER
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('cluster')
  .description('K-means cluster analysis across D/T/R metric space')
  .option('-i, --iterations <n>', 'K-means iterations', '10')
  .action((opts) => {
    const corpus     = boot();
    const iterations = parseInt(opts.iterations);
    R.header('CLUSTER ANALYSIS  ·  K=7  ·  D/T/R METRIC SPACE');
    R.statusBar(corpus_.corpusStats(corpus));
    const { assigned, centroids } = engine.kMeansClusters(corpus, iterations);
    R.clusterTable(assigned, centroids);
  });

// ─────────────────────────────────────────────────────────────────────────────
// QUERY
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('query <id>')
  .description('Inspect a single node and its nearest neighbors')
  .option('-k, --neighbors <n>', 'number of neighbors to show', '5')
  .action((id, opts) => {
    const corpus = boot();
    const k      = parseInt(opts.neighbors);
    const node   = corpus.find(n => n.id.toUpperCase() === id.toUpperCase());

    if (!node) {
      console.error(R.C.err(`\n  NODE NOT FOUND: ${id}\n`));
      process.exit(1);
    }

    R.header(`QUERY  ·  ${node.id}`);
    console.log(R.nodeRow(node));
    console.log();

    const conf = node.real
      ? R.C.real('  ● REAL — sourced from physical card')
      : R.C.est('  ○ ESTIMATED — structural placeholder');
    console.log(conf);
    console.log();

    const nn = engine.nearestNeighbors(node, corpus, k);
    R.neighborsTable(node, nn);
  });

// ─────────────────────────────────────────────────────────────────────────────
// SIM (subcommand group)
// ─────────────────────────────────────────────────────────────────────────────
const sim = program.command('sim').description('Simulation modes');

// sim wave
sim
  .command('wave <seedId>')
  .description('Propagation wave simulation from a seed node')
  .option('-t, --threshold <f>', 'activation distance threshold (0.0–1.0)', '0.35')
  .option('-s, --steps <n>',     'maximum propagation steps', '20')
  .action((seedId, opts) => {
    const corpus    = boot();
    const threshold = parseFloat(opts.threshold);
    const maxSteps  = parseInt(opts.steps);
    const id        = seedId.toUpperCase();
    const node      = corpus.find(n => n.id === id);

    if (!node) {
      console.error(R.C.err(`\n  SEED NODE NOT FOUND: ${seedId}\n`));
      process.exit(1);
    }

    R.header(`PROPAGATION WAVE  ·  SEED: ${id}  ·  THRESHOLD: ${threshold}`);
    R.statusBar(corpus_.corpusStats(corpus));

    const result = engine.propagationWave(id, corpus, threshold, maxSteps);
    R.propagationLog(result, id);
  });

// sim converge
sim
  .command('converge')
  .description('Convergence test — compare real vs estimated distribution')
  .action(() => {
    const corpus = boot();
    R.header('CONVERGENCE TEST');
    R.statusBar(corpus_.corpusStats(corpus));
    const result = engine.convergenceTest(corpus);
    R.convergenceReport(result);
  });

// sim full — run all simulations in sequence
sim
  .command('full <seedId>')
  .description('Full simulation suite — wave + entropy + convergence + clusters')
  .option('-t, --threshold <f>', 'wave propagation threshold', '0.35')
  .action((seedId, opts) => {
    const corpus    = boot();
    const threshold = parseFloat(opts.threshold);
    const id        = seedId.toUpperCase();
    const node      = corpus.find(n => n.id === id);

    if (!node) {
      console.error(R.C.err(`\n  SEED NODE NOT FOUND: ${seedId}\n`));
      process.exit(1);
    }

    R.header(`FULL SIM SUITE  ·  SEED: ${id}`);
    R.statusBar(corpus_.corpusStats(corpus));

    console.log(R.C.brand('  [1/4] PROPAGATION WAVE\n'));
    R.propagationLog(engine.propagationWave(id, corpus, threshold), id);

    R.sep();
    console.log(R.C.brand('\n  [2/4] ENTROPY SCAN\n'));
    R.entropyReport(engine.entropyScan(corpus, 5), 8);

    R.sep();
    console.log(R.C.brand('\n  [3/4] CONVERGENCE\n'));
    R.convergenceReport(engine.convergenceTest(corpus));

    R.sep();
    console.log(R.C.brand('\n  [4/4] CLUSTER MAP\n'));
    const { assigned, centroids } = engine.kMeansClusters(corpus, 10);
    R.clusterTable(assigned, centroids);
  });

// ─────────────────────────────────────────────────────────────────────────────
// COMMIT
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('commit')
  .description('Commit a real triple from a physical card to the corpus')
  .requiredOption('--id <id>',   'node ID (e.g. CGF-001)')
  .requiredOption('--d <d>',     'fractal dimension (1.00–2.00)')
  .requiredOption('--t <t>',     'topology class (open|closed|branching|...)')
  .requiredOption('--r <r>',     'recursion depth (1–5)')
  .action((opts) => {
    const corpus = boot();
    const D      = parseFloat(opts.d);
    const T      = opts.t.toLowerCase();
    const R_val  = parseInt(opts.r);
    const id     = opts.id.toUpperCase();

    R.header(`COMMIT  ·  ${id}  →  REAL`);

    try {
      const result = corpus_.commitRealNode(corpus, { id, D, T, R: R_val });
      corpus_.saveCorpus(corpus);
      R.commitConfirm(result);

      const stats = corpus_.corpusStats(corpus);
      R.statusBar(stats);
      console.log(R.C.dim(`  Corpus saved to ${corpus_.CORPUS_PATH}`));
      console.log();
    } catch (err) {
      console.error(R.C.err(`\n  COMMIT ERROR: ${err.message}\n`));
      process.exit(1);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('export')
  .description('Export corpus snapshot to output/cgf-snapshot-<date>.json')
  .option('--real-only', 'export only real nodes', false)
  .action((opts) => {
    const corpus  = boot();
    const nodes   = opts.realOnly ? corpus.filter(n => n.real) : corpus;
    const stats   = corpus_.corpusStats(corpus);
    const outDir  = path.join(__dirname, '../output');
    const date    = new Date().toISOString().slice(0,10);
    const fname   = `cgf-snapshot-${date}${opts.realOnly ? '-real-only' : ''}.json`;
    const outPath = path.join(outDir, fname);

    fs.mkdirSync(outDir, { recursive: true });

    const snapshot = {
      meta: {
        author:     'Sean Rangel',
        provenance: 'Physical index card ledger (primary)',
        mirror:     'u/Cyrus9811 · GitHub',
        exported:   new Date().toISOString(),
        realOnly:   opts.realOnly,
        ...stats,
      },
      nodes,
    };

    fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

    R.header('EXPORT');
    console.log(R.C.real(`  ✓ Exported ${nodes.length} nodes`));
    console.log(R.C.dim(`  → ${outPath}`));
    console.log();
    R.statusBar(stats);
  });

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT — show status if no command given
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('help-all', { hidden: true })
  .action(() => program.help());

program.addHelpText('after', `
${R.C.dim('  Examples:')}
  ${R.C.brand('cgf status')}
  ${R.C.brand('cgf scan --neighbors 5 --top 10')}
  ${R.C.brand('cgf map --bins 10')}
  ${R.C.brand('cgf cluster')}
  ${R.C.brand('cgf query CGF-001 --neighbors 5')}
  ${R.C.brand('cgf sim wave CGF-042 --threshold 0.3')}
  ${R.C.brand('cgf sim converge')}
  ${R.C.brand('cgf sim full CGF-001')}
  ${R.C.brand('cgf commit --id CGF-001 --d 1.42 --t nested-closed --r 3')}
  ${R.C.brand('cgf export --real-only')}
`);

program.parse(process.argv);

// If no args — show status by default
if (process.argv.length <= 2) {
  const corpus = boot();
  const stats  = corpus_.corpusStats(corpus);
  R.header('CGF-SIM · v0.1.0');
  R.statusBar(stats);
  console.log(R.C.dim('  Run ') + R.C.brand('cgf --help') + R.C.dim(' for available commands.\n'));
}
