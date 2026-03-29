#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

import { generateHtml } from './generate_report.mjs';
import { improveDescription } from './improve_description.mjs';
import { runEval } from './run_eval.mjs';
import { findProjectRoot, isExecutedDirectly, parseSkillMd, readJson, shuffleWithSeed } from './utils.mjs';

function splitEvalSet(evalSet, holdout, seed = 42) {
  const shouldTrigger = shuffleWithSeed(evalSet.filter(item => item.should_trigger), seed);
  const shouldNotTrigger = shuffleWithSeed(evalSet.filter(item => !item.should_trigger), seed + 1);
  const testTriggerCount = Math.min(shouldTrigger.length, Math.max(1, Math.floor(shouldTrigger.length * holdout)));
  const testNoTriggerCount = Math.min(shouldNotTrigger.length, Math.max(1, Math.floor(shouldNotTrigger.length * holdout)));
  return {
    trainSet: [
      ...shouldTrigger.slice(testTriggerCount),
      ...shouldNotTrigger.slice(testNoTriggerCount),
    ],
    testSet: [
      ...shouldTrigger.slice(0, testTriggerCount),
      ...shouldNotTrigger.slice(0, testNoTriggerCount),
    ],
  };
}

function summarizePartition(results, trainQuerySet) {
  const trainResults = results.results.filter(result => trainQuerySet.has(result.query));
  const testResults = results.results.filter(result => !trainQuerySet.has(result.query));
  const summarize = entries => ({
    results: entries,
    summary: {
      passed: entries.filter(result => result.pass).length,
      failed: entries.filter(result => !result.pass).length,
      total: entries.length,
    },
  });
  return {
    train: summarize(trainResults),
    test: summarize(testResults),
  };
}

function openFileInBrowser(filePath) {
  const platform = process.platform;
  const command = platform === 'win32'
    ? ['cmd', ['/c', 'start', '', filePath]]
    : platform === 'darwin'
      ? ['open', [filePath]]
      : ['xdg-open', [filePath]];
  const [bin, args] = command;
  const child = spawn(bin, args, { stdio: 'ignore', detached: true });
  child.unref();
}

export async function runLoop({
  evalSet,
  skillPath,
  descriptionOverride,
  numWorkers,
  timeout,
  maxIterations,
  runsPerQuery,
  triggerThreshold,
  holdout,
  model,
  verbose,
  liveReportPath = null,
  logDir = null,
}) {
  const projectRoot = await findProjectRoot();
  const parsedSkill = await parseSkillMd(skillPath);
  let currentDescription = descriptionOverride ?? parsedSkill.description;
  const { trainSet, testSet } = holdout > 0 ? splitEvalSet(evalSet, holdout) : { trainSet: evalSet, testSet: [] };
  const trainQuerySet = new Set(trainSet.map(item => item.query));
  const history = [];
  let exitReason = 'unknown';

  if (verbose && holdout > 0) {
    console.error(`Split: ${trainSet.length} train, ${testSet.length} test (holdout=${holdout})`);
  }

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (verbose) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`Iteration ${iteration}/${maxIterations}`);
      console.error(`Description: ${currentDescription}`);
      console.error('='.repeat(60));
    }

    const startedAt = Date.now();
    const evalResults = await runEval({
      evalSet: [...trainSet, ...testSet],
      skillName: parsedSkill.name,
      description: currentDescription,
      numWorkers,
      timeout,
      projectRoot,
      runsPerQuery,
      triggerThreshold,
      model,
    });
    const evalElapsed = (Date.now() - startedAt) / 1000;
    const partitions = summarizePartition(evalResults, trainQuerySet);
    const trainResults = partitions.train;
    const testResults = testSet.length > 0 ? partitions.test : null;

    history.push({
      iteration,
      description: currentDescription,
      train_passed: trainResults.summary.passed,
      train_failed: trainResults.summary.failed,
      train_total: trainResults.summary.total,
      train_results: trainResults.results,
      test_passed: testResults?.summary.passed ?? null,
      test_failed: testResults?.summary.failed ?? null,
      test_total: testResults?.summary.total ?? null,
      test_results: testResults?.results ?? null,
      passed: trainResults.summary.passed,
      failed: trainResults.summary.failed,
      total: trainResults.summary.total,
      results: trainResults.results,
    });

    if (liveReportPath) {
      await fs.writeFile(liveReportPath, generateHtml({
        original_description: parsedSkill.description,
        best_description: currentDescription,
        best_score: 'in progress',
        iterations_run: history.length,
        holdout,
        train_size: trainSet.length,
        test_size: testSet.length,
        history,
      }, true, parsedSkill.name), 'utf8');
    }

    if (verbose) {
      console.error(`Train: ${trainResults.summary.passed}/${trainResults.summary.total} (${evalElapsed.toFixed(1)}s)`);
      if (testResults) {
        console.error(`Test:  ${testResults.summary.passed}/${testResults.summary.total}`);
      }
    }

    if (trainResults.summary.failed === 0) {
      exitReason = `all_passed (iteration ${iteration})`;
      break;
    }

    if (iteration === maxIterations) {
      exitReason = `max_iterations (${maxIterations})`;
      break;
    }

    const blindedHistory = history.map(item => Object.fromEntries(Object.entries(item).filter(([key]) => !key.startsWith('test_'))));
    currentDescription = await improveDescription({
      skillName: parsedSkill.name,
      skillContent: parsedSkill.content,
      currentDescription,
      evalResults: trainResults,
      history: blindedHistory,
      model,
      logDir,
      iteration,
    });
  }

  const bestEntry = testSet.length > 0
    ? history.reduce((best, item) => (item.test_passed ?? 0) > (best.test_passed ?? 0) ? item : best, history[0])
    : history.reduce((best, item) => item.train_passed > best.train_passed ? item : best, history[0]);

  return {
    exit_reason: exitReason,
    original_description: parsedSkill.description,
    best_description: bestEntry.description,
    best_score: testSet.length > 0 ? `${bestEntry.test_passed}/${bestEntry.test_total}` : `${bestEntry.train_passed}/${bestEntry.train_total}`,
    best_train_score: `${bestEntry.train_passed}/${bestEntry.train_total}`,
    best_test_score: testSet.length > 0 ? `${bestEntry.test_passed}/${bestEntry.test_total}` : null,
    final_description: currentDescription,
    iterations_run: history.length,
    holdout,
    train_size: trainSet.length,
    test_size: testSet.length,
    history,
  };
}

async function main() {
  const { values } = parseArgs({
    allowPositionals: true,
    options: {
      'eval-set': { type: 'string' },
      'skill-path': { type: 'string' },
      description: { type: 'string' },
      'num-workers': { type: 'string' },
      timeout: { type: 'string' },
      'max-iterations': { type: 'string' },
      'runs-per-query': { type: 'string' },
      'trigger-threshold': { type: 'string' },
      holdout: { type: 'string' },
      model: { type: 'string' },
      verbose: { type: 'boolean' },
      report: { type: 'string' },
      'results-dir': { type: 'string' },
    },
  });

  if (!values['eval-set'] || !values['skill-path'] || !values.model) {
    console.error('Usage: node run_loop.mjs --eval-set <evals.json> --skill-path <skill-dir> --model <name> [--description <text>] [--num-workers <n>] [--timeout <seconds>] [--max-iterations <n>] [--runs-per-query <n>] [--trigger-threshold <float>] [--holdout <float>] [--report <auto|none|path>] [--results-dir <dir>] [--verbose]');
    process.exit(1);
  }

  const evalSet = await readJson(path.resolve(values['eval-set']));
  const skillPath = path.resolve(values['skill-path']);
  const parsedSkill = await parseSkillMd(skillPath);
  const reportSetting = values.report ?? 'auto';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const liveReportPath = reportSetting === 'none'
    ? null
    : reportSetting === 'auto'
      ? path.join(os.tmpdir(), `skill_description_report_${path.basename(skillPath)}_${timestamp}.html`)
      : path.resolve(reportSetting);

  if (liveReportPath) {
    await fs.writeFile(liveReportPath, "<html><body><h1>Starting optimization loop...</h1><meta http-equiv='refresh' content='5'></body></html>", 'utf8');
    openFileInBrowser(liveReportPath);
  }

  const resultsDirectory = values['results-dir']
    ? path.join(path.resolve(values['results-dir']), timestamp)
    : null;
  if (resultsDirectory) {
    await fs.mkdir(resultsDirectory, { recursive: true });
  }

  const output = await runLoop({
    evalSet,
    skillPath,
    descriptionOverride: values.description ?? null,
    numWorkers: Number.parseInt(values['num-workers'] ?? '10', 10),
    timeout: Number.parseInt(values.timeout ?? '30', 10),
    maxIterations: Number.parseInt(values['max-iterations'] ?? '5', 10),
    runsPerQuery: Number.parseInt(values['runs-per-query'] ?? '3', 10),
    triggerThreshold: Number.parseFloat(values['trigger-threshold'] ?? '0.5'),
    holdout: Number.parseFloat(values.holdout ?? '0.4'),
    model: values.model,
    verbose: Boolean(values.verbose),
    liveReportPath,
    logDir: resultsDirectory ? path.join(resultsDirectory, 'logs') : null,
  });

  const jsonOutput = `${JSON.stringify(output, null, 2)}\n`;
  process.stdout.write(jsonOutput);

  if (resultsDirectory) {
    await fs.writeFile(path.join(resultsDirectory, 'results.json'), jsonOutput, 'utf8');
  }

  if (liveReportPath) {
    const report = generateHtml(output, false, parsedSkill.name);
    await fs.writeFile(liveReportPath, report, 'utf8');
    if (resultsDirectory) {
      await fs.writeFile(path.join(resultsDirectory, 'report.html'), report, 'utf8');
    }
    console.error(`\nReport: ${liveReportPath}`);
  }

  if (resultsDirectory) {
    console.error(`Results saved to: ${resultsDirectory}`);
  }
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
