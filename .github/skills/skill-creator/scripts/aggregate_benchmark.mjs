#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { formatSignedNumber, isExecutedDirectly, readJson, writeJson } from './utils.mjs';

function calculateStats(values) {
  if (values.length === 0) {
    return { mean: 0, stddev: 0, min: 0, max: 0 };
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.length > 1
    ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length - 1)
    : 0;

  return {
    mean: Number(mean.toFixed(4)),
    stddev: Number(Math.sqrt(variance).toFixed(4)),
    min: Number(Math.min(...values).toFixed(4)),
    max: Number(Math.max(...values).toFixed(4)),
  };
}

export async function loadRunResults(benchmarkDirectory) {
  const runsDirectory = path.join(benchmarkDirectory, 'runs');
  let searchDirectory = benchmarkDirectory;

  try {
    const runStats = await fs.stat(runsDirectory);
    if (runStats.isDirectory()) {
      searchDirectory = runsDirectory;
    }
  }
  catch {
    const entries = await fs.readdir(benchmarkDirectory, { withFileTypes: true }).catch(() => []);
    if (!entries.some(entry => entry.isDirectory() && entry.name.startsWith('eval-'))) {
      console.log(`No eval directories found in ${benchmarkDirectory} or ${runsDirectory}`);
      return {};
    }
  }

  const result = {};
  const evalDirectories = (await fs.readdir(searchDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name.startsWith('eval-'))
    .map(entry => entry.name)
    .sort();

  for (const [defaultEvalId, evalDirectoryName] of evalDirectories.entries()) {
    const evalDirectory = path.join(searchDirectory, evalDirectoryName);
    const metadataPath = path.join(evalDirectory, 'eval_metadata.json');
    let evalId = defaultEvalId;

    try {
      const metadata = await readJson(metadataPath);
      evalId = metadata.eval_id ?? defaultEvalId;
    }
    catch {
      const parsed = Number.parseInt(evalDirectoryName.split('-')[1], 10);
      if (Number.isFinite(parsed)) {
        evalId = parsed;
      }
    }

    const configDirectories = (await fs.readdir(evalDirectory, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();

    for (const configName of configDirectories) {
      const configDirectory = path.join(evalDirectory, configName);
      const runEntries = (await fs.readdir(configDirectory, { withFileTypes: true }).catch(() => []))
        .filter(entry => entry.isDirectory() && entry.name.startsWith('run-'))
        .map(entry => entry.name)
        .sort();

      if (runEntries.length === 0) {
        continue;
      }

      if (!result[configName]) {
        result[configName] = [];
      }

      for (const runEntry of runEntries) {
        const runDirectory = path.join(configDirectory, runEntry);
        const gradingPath = path.join(runDirectory, 'grading.json');
        try {
          await fs.access(gradingPath);
        }
        catch {
          console.log(`Warning: grading.json not found in ${runDirectory}`);
          continue;
        }

        let grading = null;
        try {
          grading = await readJson(gradingPath);
        }
        catch (error) {
          console.log(`Warning: Invalid JSON in ${gradingPath}: ${error.message}`);
          continue;
        }

        const runNumber = Number.parseInt(runEntry.split('-')[1], 10);
        const summary = grading.summary ?? {};
        const metrics = grading.execution_metrics ?? {};
        const timing = grading.timing ?? {};
        const timingPath = path.join(runDirectory, 'timing.json');
        let timeSeconds = timing.total_duration_seconds ?? 0;
        let tokens = metrics.output_chars ?? 0;

        if (timeSeconds === 0) {
          try {
            const timingData = await readJson(timingPath);
            timeSeconds = timingData.total_duration_seconds ?? 0;
            tokens = timingData.total_tokens ?? tokens;
          }
          catch {
            // Ignore missing timing data.
          }
        }

        const expectations = Array.isArray(grading.expectations) ? grading.expectations : [];
        for (const expectation of expectations) {
          if (!Object.hasOwn(expectation, 'text') || !Object.hasOwn(expectation, 'passed')) {
            console.log(`Warning: expectation in ${gradingPath} missing required fields (text, passed, evidence): ${JSON.stringify(expectation)}`);
          }
        }

        const notesSummary = grading.user_notes_summary ?? {};
        result[configName].push({
          eval_id: evalId,
          run_number: Number.isFinite(runNumber) ? runNumber : 0,
          pass_rate: summary.pass_rate ?? 0,
          passed: summary.passed ?? 0,
          failed: summary.failed ?? 0,
          total: summary.total ?? 0,
          time_seconds: timeSeconds,
          tokens,
          tool_calls: metrics.total_tool_calls ?? 0,
          errors: metrics.errors_encountered ?? 0,
          expectations,
          notes: [
            ...(notesSummary.uncertainties ?? []),
            ...(notesSummary.needs_review ?? []),
            ...(notesSummary.workarounds ?? []),
          ],
        });
      }
    }
  }

  return result;
}

export function aggregateResults(results) {
  const runSummary = {};
  const configs = Object.keys(results);

  for (const config of configs) {
    const runs = results[config] ?? [];
    if (runs.length === 0) {
      runSummary[config] = {
        pass_rate: calculateStats([]),
        time_seconds: calculateStats([]),
        tokens: calculateStats([]),
      };
      continue;
    }

    runSummary[config] = {
      pass_rate: calculateStats(runs.map(run => run.pass_rate ?? 0)),
      time_seconds: calculateStats(runs.map(run => run.time_seconds ?? 0)),
      tokens: calculateStats(runs.map(run => run.tokens ?? 0)),
    };
  }

  const [primaryConfig, baselineConfig] = configs;
  const primary = primaryConfig ? runSummary[primaryConfig] : {};
  const baseline = baselineConfig ? runSummary[baselineConfig] : {};
  const deltaPassRate = (primary.pass_rate?.mean ?? 0) - (baseline.pass_rate?.mean ?? 0);
  const deltaTimeSeconds = (primary.time_seconds?.mean ?? 0) - (baseline.time_seconds?.mean ?? 0);
  const deltaTokens = (primary.tokens?.mean ?? 0) - (baseline.tokens?.mean ?? 0);

  runSummary.delta = {
    pass_rate: formatSignedNumber(deltaPassRate, 2),
    time_seconds: formatSignedNumber(deltaTimeSeconds, 1),
    tokens: `${Math.round(deltaTokens) >= 0 ? '+' : ''}${Math.round(deltaTokens)}`,
  };

  return runSummary;
}

export async function generateBenchmark(benchmarkDirectory, skillName = '', skillPath = '') {
  const results = await loadRunResults(benchmarkDirectory);
  const runSummary = aggregateResults(results);
  const runs = [];

  for (const [configName, configRuns] of Object.entries(results)) {
    for (const run of configRuns) {
      runs.push({
        eval_id: run.eval_id,
        configuration: configName,
        run_number: run.run_number,
        result: {
          pass_rate: run.pass_rate,
          passed: run.passed,
          failed: run.failed,
          total: run.total,
          time_seconds: run.time_seconds,
          tokens: run.tokens,
          tool_calls: run.tool_calls,
          errors: run.errors,
        },
        expectations: run.expectations,
        notes: run.notes,
      });
    }
  }

  const evalIds = [...new Set(runs.map(run => run.eval_id))].sort((left, right) => left - right);

  return {
    metadata: {
      skill_name: skillName || '<skill-name>',
      skill_path: skillPath || '<path/to/skill>',
      executor_model: '<model-name>',
      analyzer_model: '<model-name>',
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      evals_run: evalIds,
      runs_per_configuration: 3,
    },
    runs,
    run_summary: runSummary,
    notes: [],
  };
}

export function generateMarkdown(benchmark) {
  const metadata = benchmark.metadata;
  const runSummary = benchmark.run_summary;
  const configs = Object.keys(runSummary).filter(key => key !== 'delta');
  const [configA = 'config_a', configB = 'config_b'] = configs;
  const labelA = configA.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  const labelB = configB.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  const summaryA = runSummary[configA] ?? {};
  const summaryB = runSummary[configB] ?? {};
  const delta = runSummary.delta ?? {};

  const lines = [
    `# Skill Benchmark: ${metadata.skill_name}`,
    '',
    `**Model**: ${metadata.executor_model}`,
    `**Date**: ${metadata.timestamp}`,
    `**Evals**: ${metadata.evals_run.join(', ')} (${metadata.runs_per_configuration} runs each per configuration)`,
    '',
    '## Summary',
    '',
    `| Metric | ${labelA} | ${labelB} | Delta |`,
    '|--------|------------|---------------|-------|',
  ];

  lines.push(`| Pass Rate | ${((summaryA.pass_rate?.mean ?? 0) * 100).toFixed(0)}% ± ${((summaryA.pass_rate?.stddev ?? 0) * 100).toFixed(0)}% | ${((summaryB.pass_rate?.mean ?? 0) * 100).toFixed(0)}% ± ${((summaryB.pass_rate?.stddev ?? 0) * 100).toFixed(0)}% | ${delta.pass_rate ?? '—'} |`);
  lines.push(`| Time | ${(summaryA.time_seconds?.mean ?? 0).toFixed(1)}s ± ${(summaryA.time_seconds?.stddev ?? 0).toFixed(1)}s | ${(summaryB.time_seconds?.mean ?? 0).toFixed(1)}s ± ${(summaryB.time_seconds?.stddev ?? 0).toFixed(1)}s | ${delta.time_seconds ?? '—'}s |`);
  lines.push(`| Tokens | ${(summaryA.tokens?.mean ?? 0).toFixed(0)} ± ${(summaryA.tokens?.stddev ?? 0).toFixed(0)} | ${(summaryB.tokens?.mean ?? 0).toFixed(0)} ± ${(summaryB.tokens?.stddev ?? 0).toFixed(0)} | ${delta.tokens ?? '—'} |`);

  if (Array.isArray(benchmark.notes) && benchmark.notes.length > 0) {
    lines.push('', '## Notes', '');
    for (const note of benchmark.notes) {
      lines.push(`- ${note}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'skill-name': { type: 'string' },
      'skill-path': { type: 'string' },
      output: { type: 'string', short: 'o' },
    },
  });

  if (positionals.length !== 1) {
    console.log('Usage: node aggregate_benchmark.mjs <benchmark_dir> [--skill-name <name>] [--skill-path <path>] [-o <output>]');
    process.exit(1);
  }

  const benchmarkDirectory = path.resolve(positionals[0]);
  try {
    const stats = await fs.stat(benchmarkDirectory);
    if (!stats.isDirectory()) {
      console.log(`Directory not found: ${benchmarkDirectory}`);
      process.exit(1);
    }
  }
  catch {
    console.log(`Directory not found: ${benchmarkDirectory}`);
    process.exit(1);
  }

  const benchmark = await generateBenchmark(benchmarkDirectory, values['skill-name'] ?? '', values['skill-path'] ?? '');
  const outputJsonPath = values.output ? path.resolve(values.output) : path.join(benchmarkDirectory, 'benchmark.json');
  const outputMarkdownPath = outputJsonPath.replace(/\.json$/u, '.md');

  await writeJson(outputJsonPath, benchmark);
  await fs.writeFile(outputMarkdownPath, generateMarkdown(benchmark), 'utf8');

  console.log(`Generated: ${outputJsonPath}`);
  console.log(`Generated: ${outputMarkdownPath}`);
  console.log('\nSummary:');
  for (const config of Object.keys(benchmark.run_summary).filter(key => key !== 'delta')) {
    const label = config.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
    console.log(`  ${label}: ${(benchmark.run_summary[config].pass_rate.mean * 100).toFixed(1)}% pass rate`);
  }
  console.log(`  Delta:         ${benchmark.run_summary.delta?.pass_rate ?? '—'}`);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
