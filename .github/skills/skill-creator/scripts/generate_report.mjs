#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import { stdin as input } from 'node:process';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { escapeHtml, isExecutedDirectly, readJson } from './utils.mjs';

function aggregateRuns(results) {
  let correct = 0;
  let total = 0;
  for (const result of results) {
    const runs = result.runs ?? 0;
    const triggers = result.triggers ?? 0;
    total += runs;
    correct += result.should_trigger === false ? runs - triggers : triggers;
  }
  return { correct, total };
}

function scoreClass(correct, total) {
  if (total === 0) {
    return 'score-bad';
  }
  const ratio = correct / total;
  if (ratio >= 0.8) {
    return 'score-good';
  }
  if (ratio >= 0.5) {
    return 'score-ok';
  }
  return 'score-bad';
}

export function generateHtml(data, autoRefresh = false, skillName = '') {
  const history = data.history ?? [];
  const titlePrefix = skillName ? `${escapeHtml(skillName)} - ` : '';

  const trainQueries = history[0]?.train_results?.map(result => ({
    query: result.query,
    should_trigger: result.should_trigger ?? true,
  })) ?? history[0]?.results?.map(result => ({
    query: result.query,
    should_trigger: result.should_trigger ?? true,
  })) ?? [];

  const testQueries = history[0]?.test_results?.map(result => ({
    query: result.query,
    should_trigger: result.should_trigger ?? true,
  })) ?? [];

  const bestIteration = history.length === 0
    ? null
    : testQueries.length > 0
      ? history.reduce((best, item) => (item.test_passed ?? 0) > (best.test_passed ?? 0) ? item : best, history[0]).iteration
      : history.reduce((best, item) => (item.train_passed ?? item.passed ?? 0) > (best.train_passed ?? best.passed ?? 0) ? item : best, history[0]).iteration;

  const rows = history.map(item => {
    const trainResults = item.train_results ?? item.results ?? [];
    const testResults = item.test_results ?? [];
    const trainSummary = aggregateRuns(trainResults);
    const testSummary = aggregateRuns(testResults);
    const trainLookup = new Map(trainResults.map(result => [result.query, result]));
    const testLookup = new Map(testResults.map(result => [result.query, result]));

    const queryCells = [
      ...trainQueries.map(({ query }) => {
        const result = trainLookup.get(query) ?? {};
        const passed = result.pass === true;
        return `<td class="result ${passed ? 'pass' : 'fail'}">${passed ? '✓' : '✗'}<span class="rate">${result.triggers ?? 0}/${result.runs ?? 0}</span></td>`;
      }),
      ...testQueries.map(({ query }) => {
        const result = testLookup.get(query) ?? {};
        const passed = result.pass === true;
        return `<td class="result test-result ${passed ? 'pass' : 'fail'}">${passed ? '✓' : '✗'}<span class="rate">${result.triggers ?? 0}/${result.runs ?? 0}</span></td>`;
      }),
    ].join('\n');

    return `<tr class="${item.iteration === bestIteration ? 'best-row' : ''}">
                <td>${item.iteration ?? '?'}</td>
                <td><span class="score ${scoreClass(trainSummary.correct, trainSummary.total)}">${trainSummary.correct}/${trainSummary.total}</span></td>
                <td><span class="score ${scoreClass(testSummary.correct, testSummary.total)}">${testSummary.correct}/${testSummary.total}</span></td>
                <td class="description">${escapeHtml(item.description ?? '')}</td>
${queryCells}
            </tr>`;
  }).join('\n');

  const trainHeaders = trainQueries.map(({ query, should_trigger }) => `<th class="${should_trigger ? 'positive-col' : 'negative-col'}">${escapeHtml(query)}</th>`).join('\n');
  const testHeaders = testQueries.map(({ query, should_trigger }) => `<th class="test-col ${should_trigger ? 'positive-col' : 'negative-col'}">${escapeHtml(query)}</th>`).join('\n');
  const refreshTag = autoRefresh ? '    <meta http-equiv="refresh" content="5">\n' : '';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
${refreshTag}    <title>${titlePrefix}Skill Description Optimization</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Lora', Georgia, serif; max-width: 100%; margin: 0 auto; padding: 20px; background: #faf9f5; color: #141413; }
        h1 { font-family: 'Poppins', sans-serif; color: #141413; }
        .explainer, .summary { background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e8e6dc; }
        .explainer { color: #b0aea5; font-size: 0.875rem; line-height: 1.6; }
        .summary p { margin: 5px 0; }
        .best { color: #788c5d; font-weight: bold; }
        .table-container { overflow-x: auto; width: 100%; }
        table { border-collapse: collapse; background: white; border: 1px solid #e8e6dc; border-radius: 6px; font-size: 12px; min-width: 100%; }
        th, td { padding: 8px; text-align: left; border: 1px solid #e8e6dc; white-space: normal; word-wrap: break-word; }
        th { font-family: 'Poppins', sans-serif; background: #141413; color: #faf9f5; font-weight: 500; }
        th.test-col { background: #6a9bcc; }
        th.query-col { min-width: 200px; }
        td.description { font-family: monospace; font-size: 11px; word-wrap: break-word; max-width: 400px; }
        td.result { text-align: center; font-size: 16px; min-width: 40px; }
        td.test-result { background: #f0f6fc; }
        .pass { color: #788c5d; }
        .fail { color: #c44; }
        .rate { font-size: 9px; color: #b0aea5; display: block; }
        tr:hover { background: #faf9f5; }
        .score { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .score-good { background: #eef2e8; color: #788c5d; }
        .score-ok { background: #fef3c7; color: #d97706; }
        .score-bad { background: #fceaea; color: #c44; }
        .best-row { background: #f5f8f2; }
        th.positive-col { border-bottom: 3px solid #788c5d; }
        th.negative-col { border-bottom: 3px solid #c44; }
        th.test-col.positive-col { border-bottom: 3px solid #788c5d; }
        th.test-col.negative-col { border-bottom: 3px solid #c44; }
        .legend { font-family: 'Poppins', sans-serif; display: flex; gap: 20px; margin-bottom: 10px; font-size: 13px; align-items: center; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-swatch { width: 16px; height: 16px; border-radius: 3px; display: inline-block; }
        .swatch-positive { background: #141413; border-bottom: 3px solid #788c5d; }
        .swatch-negative { background: #141413; border-bottom: 3px solid #c44; }
        .swatch-test { background: #6a9bcc; }
        .swatch-train { background: #141413; }
    </style>
</head>
<body>
    <h1>${titlePrefix}Skill Description Optimization</h1>
    <div class="explainer">
        <strong>Optimizing your skill's description.</strong> This page updates automatically as Claude tests different versions of your skill's description. Each row is an iteration. The columns show test queries: green checkmarks mean the skill triggered correctly or correctly did not trigger, red crosses mean it got it wrong. The Train score shows performance on queries used to improve the description; the Test score shows performance on held-out queries the optimizer has not seen. When it is done, the best-performing description can be applied back to the skill.
    </div>
    <div class="summary">
        <p><strong>Original:</strong> ${escapeHtml(data.original_description ?? 'N/A')}</p>
        <p class="best"><strong>Best:</strong> ${escapeHtml(data.best_description ?? 'N/A')}</p>
        <p><strong>Best Score:</strong> ${escapeHtml(data.best_score ?? 'N/A')} ${(data.best_test_score ? '(test)' : '(train)')}</p>
        <p><strong>Iterations:</strong> ${data.iterations_run ?? 0} | <strong>Train:</strong> ${data.train_size ?? '?'} | <strong>Test:</strong> ${data.test_size ?? '?'}</p>
    </div>
    <div class="legend">
        <span style="font-weight:600">Query columns:</span>
        <span class="legend-item"><span class="legend-swatch swatch-positive"></span> Should trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-negative"></span> Should NOT trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-train"></span> Train</span>
        <span class="legend-item"><span class="legend-swatch swatch-test"></span> Test</span>
    </div>
    <div class="table-container">
    <table>
        <thead>
            <tr>
                <th>Iter</th>
                <th>Train</th>
                <th>Test</th>
                <th class="query-col">Description</th>
${trainHeaders}
${testHeaders}
            </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
    </table>
    </div>
</body>
</html>`;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of input) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      'skill-name': { type: 'string' },
    },
  });

  if (positionals.length !== 1) {
    console.error('Usage: node generate_report.mjs <input.json|- > [-o <output.html>] [--skill-name <name>]');
    process.exit(1);
  }

  const source = positionals[0];
  const data = source === '-'
    ? JSON.parse(await readStdin())
    : await readJson(path.resolve(source));

  const html = generateHtml(data, false, values['skill-name'] ?? '');
  if (values.output) {
    await fs.writeFile(path.resolve(values.output), html, 'utf8');
    console.error(`Report written to ${values.output}`);
    return;
  }
  process.stdout.write(html);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
