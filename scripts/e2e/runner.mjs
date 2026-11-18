#!/usr/bin/env node
/**
 * Project EARLY — E2E Test Suite Runner
 * Pure Node.js ESM Test Runner using Node 24 primitives (zero external dependencies).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { EarlyApiClient } from './client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal ANSI color palette
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Parse CLI flags
let args;
try {
  const parsed = parseArgs({
    options: {
      tier: { type: 'string', default: 'all' },
      mode: { type: 'string', default: 'mock' },
      verbose: { type: 'boolean', default: false },
      bail: { type: 'boolean', default: false },
      filter: { type: 'string', default: '' },
      help: { type: 'boolean', default: false }
    },
    strict: false,
    allowPositionals: true
  });
  args = parsed.values;
} catch (e) {
  console.error(`CLI argument parsing error: ${e.message}`);
  process.exit(1);
}

if (args.help) {
  console.log(`
${colors.bold}${colors.cyan}Project EARLY — E2E Test Harness${colors.reset}

Usage:
  node scripts/e2e/runner.mjs [options]

Options:
  --tier=<1|2|3|4|all>   Target test tier(s), comma-separated (default: all)
  --mode=<mock|live>     Execution mode: mock simulation or live HTTP (default: mock)
  --verbose              Print detailed stack traces on errors
  --bail                 Abort execution on first test failure
  --filter=<string>      Filter test cases by substring or name
  --help                 Show this help screen
`);
  process.exit(0);
}

export class TestHarness {
  constructor(options = {}) {
    this.tier = options.tier || 'all';
    this.mode = options.mode || (process.env.E2E_MODE === 'live' ? 'live' : 'mock');
    this.verbose = Boolean(options.verbose);
    this.bail = Boolean(options.bail);
    this.filter = (options.filter || '').trim().toLowerCase();

    this.suites = [];
    this.currentSuite = null;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: 0,
      endTime: 0
    };
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeHooks: [],
      afterHooks: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  it(name, testFn) {
    if (!this.currentSuite) {
      throw new Error(`it('${name}') must be called inside a describe() block`);
    }
    this.currentSuite.tests.push({
      name,
      fn: testFn,
      status: 'pending',
      duration: 0,
      error: null
    });
  }

  test(name, testFn) {
    this.it(name, testFn);
  }

  async run() {
    this.stats.startTime = performance.now();
    this.printHeader();

    let shouldBail = false;

    for (const suite of this.suites) {
      if (shouldBail) break;
      if (suite.tests.length === 0) continue;

      console.log(`\n${colors.bold}${colors.cyan}▶ Suite: ${suite.name}${colors.reset}`);

      for (const t of suite.tests) {
        if (this.filter && !t.name.toLowerCase().includes(this.filter) && !suite.name.toLowerCase().includes(this.filter)) {
          t.status = 'skipped';
          this.stats.skipped++;
          continue;
        }

        const t0 = performance.now();
        try {
          await t.fn();
          t.duration = Math.round(performance.now() - t0);
          t.status = 'passed';
          this.stats.passed++;
          console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${t.name} ${colors.gray}(${t.duration}ms)${colors.reset}`);
        } catch (err) {
          t.duration = Math.round(performance.now() - t0);
          t.status = 'failed';
          t.error = err;
          this.stats.failed++;
          console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${t.name} ${colors.gray}(${t.duration}ms)${colors.reset}`);
          console.log(`    ${colors.red}${err.name || 'AssertionError'}: ${err.message}${colors.reset}`);
          if (this.verbose && err.stack) {
            const stackLines = err.stack.split('\n').slice(1, 5).join('\n    ');
            console.log(`    ${colors.dim}${stackLines}${colors.reset}`);
          }
          if (this.bail) {
            console.log(`\n${colors.yellow}[BAIL] Execution aborted on first test failure.${colors.reset}`);
            shouldBail = true;
            break;
          }
        } finally {
          this.stats.total++;
        }
      }
    }

    this.stats.endTime = performance.now();
    this.printSummary();
    return this.stats.failed === 0;
  }

  printHeader() {
    console.log(`\n${colors.bold}${colors.blue}=================================================================${colors.reset}`);
    console.log(`${colors.bold}  Project EARLY — End-to-End Test Suite Runner (Node ${process.version})${colors.reset}`);
    console.log(`${colors.dim}  Mode: ${this.mode.toUpperCase()} | Tier: ${this.tier} | Bail: ${this.bail} | Verbose: ${this.verbose}${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}=================================================================${colors.reset}`);
  }

  printSummary() {
    const totalTime = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);
    const isPass = this.stats.failed === 0;
    const boxColor = isPass ? colors.green : colors.red;

    console.log(`\n${boxColor}─────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bold}  E2E TEST RUN SUMMARY — Project EARLY${colors.reset}`);
    console.log(`  Execution Mode:    ${this.mode.toUpperCase()}`);
    console.log(`  Target Tier(s):    ${this.tier}`);
    console.log(`  Total Run:         ${this.stats.total}`);
    console.log(`  Passed:            ${colors.green}${this.stats.passed}${colors.reset}`);
    console.log(`  Failed:            ${this.stats.failed > 0 ? colors.red + this.stats.failed + colors.reset : '0'}`);
    console.log(`  Skipped:           ${this.stats.skipped > 0 ? colors.yellow + this.stats.skipped + colors.reset : '0'}`);
    console.log(`  Elapsed Time:      ${totalTime}s`);
    console.log(`  Status:            ${isPass ? colors.green + 'ALL TESTS PASSED (EXIT 0)' : colors.red + 'FAILURES DETECTED (EXIT 1)'}${colors.reset}`);
    console.log(`${boxColor}─────────────────────────────────────────────────────────────────${colors.reset}\n`);
  }
}

// Discover and run test files
async function main() {
  const harness = new TestHarness(args);

  // Expose test globals
  globalThis.describe = harness.describe.bind(harness);
  globalThis.it = harness.it.bind(harness);
  globalThis.test = harness.test.bind(harness);
  globalThis.assert = assert;

  const client = new EarlyApiClient({ mode: harness.mode });

  // Load fixtures
  const fixturesDir = path.join(__dirname, 'fixtures');
  const syntheticPatientsPath = path.join(fixturesDir, 'synthetic_patients.json');
  let syntheticPatients = { patients: [], clinics: [], doctors: [], staff: [] };
  if (fs.existsSync(syntheticPatientsPath)) {
    syntheticPatients = JSON.parse(fs.readFileSync(syntheticPatientsPath, 'utf-8'));
  }

  const fixtures = {
    syntheticPatients,
    hba1cReportText: fs.existsSync(path.join(fixturesDir, 'hba1c_lab_report.txt'))
      ? fs.readFileSync(path.join(fixturesDir, 'hba1c_lab_report.txt'), 'utf-8')
      : '',
    lipidReportText: fs.existsSync(path.join(fixturesDir, 'lipid_panel_report.txt'))
      ? fs.readFileSync(path.join(fixturesDir, 'lipid_panel_report.txt'), 'utf-8')
      : '',
    renalReportText: fs.existsSync(path.join(fixturesDir, 'metabolic_renal_report.txt'))
      ? fs.readFileSync(path.join(fixturesDir, 'metabolic_renal_report.txt'), 'utf-8')
      : '',
    cbcReportText: fs.existsSync(path.join(fixturesDir, 'cbc_blood_report.txt'))
      ? fs.readFileSync(path.join(fixturesDir, 'cbc_blood_report.txt'), 'utf-8')
      : ''
  };

  // Determine tiers to execute
  const requestedTiers = harness.tier === 'all'
    ? ['1', '2', '3', '4']
    : harness.tier.split(',').map(s => s.trim());

  const tierDirectories = {
    '1': 'tier1_features',
    '2': 'tier2_boundaries',
    '3': 'tier3_combinations',
    '4': 'tier4_clinical_journeys'
  };

  const testFilesToExecute = [];

  for (const t of requestedTiers) {
    const dirName = tierDirectories[t];
    if (!dirName) continue;
    const fullDir = path.join(__dirname, dirName);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir)
      .filter(f => f.endsWith('.test.mjs') || (f.endsWith('.mjs') && !f.startsWith('.')))
      .sort();

    for (const f of files) {
      testFilesToExecute.push({
        tier: t,
        fileName: f,
        fullPath: path.join(fullDir, f)
      });
    }
  }

  if (testFilesToExecute.length === 0) {
    console.log(`${colors.yellow}No test files found matching tier(s): ${harness.tier}${colors.reset}`);
    process.exit(0);
  }

  // Import and register suites
  for (const item of testFilesToExecute) {
    const fileUrl = pathToFileURL(item.fullPath).href;
    try {
      const mod = await import(fileUrl);
      if (typeof mod.default === 'function') {
        await mod.default({
          client,
          describe: harness.describe.bind(harness),
          it: harness.it.bind(harness),
          test: harness.test.bind(harness),
          assert,
          fixtures
        });
      }
    } catch (importErr) {
      console.error(`${colors.red}Error importing test file ${item.fileName}:${colors.reset}`, importErr);
      process.exit(1);
    }
  }

  // Execute all registered tests
  const success = await harness.run();
  process.exit(success ? 0 : 1);
}

// Execute if run directly from CLI
if (process.argv[1] && (process.argv[1].endsWith('runner.mjs') || process.argv[1].endsWith('runner'))) {
  main().catch(err => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
}
