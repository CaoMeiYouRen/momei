#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

import { findProjectRoot, isExecutedDirectly, parseSkillMd, readJson } from './utils.mjs';

async function mapWithConcurrency(items, workerCount, iteratee) {
  const results = new Array(items.length);
  let index = 0;

  async function consume() {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) {
        return;
      }

      try {
        results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
      }
      catch (error) {
        results[currentIndex] = { error };
      }
    }
  }

  const runners = Array.from({ length: Math.max(1, Math.min(workerCount, items.length || 1)) }, () => consume());
  await Promise.all(runners);
  return results;
}

function buildCommandFile(skillName, skillDescription) {
  const indentedDescription = skillDescription
    .split(/\r?\n/u)
    .map(line => `  ${line}`)
    .join('\n');

  return `---\ndescription: |\n${indentedDescription}\n---\n\n# ${skillName}\n\nThis skill handles: ${skillDescription}\n`;
}

export async function runSingleQuery(query, skillName, skillDescription, timeoutSeconds, projectRoot, model = null) {
  const uniqueId = randomUUID().replaceAll('-', '').slice(0, 8);
  const cleanName = `${skillName}-skill-${uniqueId}`;
  const commandsDirectory = path.join(projectRoot, '.claude', 'commands');
  const commandFilePath = path.join(commandsDirectory, `${cleanName}.md`);

  await fs.mkdir(commandsDirectory, { recursive: true });
  await fs.writeFile(commandFilePath, buildCommandFile(skillName, skillDescription), 'utf8');

  const args = [
    '-p', query,
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
  ];
  if (model) {
    args.push('--model', model);
  }

  const env = { ...process.env };
  delete env.CLAUDECODE;

  try {
    return await new Promise(resolve => {
      const child = spawn('claude', args, {
        cwd: projectRoot,
        env,
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      const readline = createInterface({ input: child.stdout });
      let done = false;
      let triggered = false;
      let pendingToolName = null;
      let accumulatedJson = '';

      const finish = result => {
        if (done) {
          return;
        }
        done = true;
        clearTimeout(timer);
        readline.close();
        if (child.exitCode === null && !child.killed) {
          child.kill();
        }
        resolve(result);
      };

      const timer = setTimeout(() => finish(triggered), timeoutSeconds * 1000);

      readline.on('line', line => {
        if (done) {
          return;
        }

        const trimmedLine = line.trim();
        if (trimmedLine === '') {
          return;
        }

        let event = null;
        try {
          event = JSON.parse(trimmedLine);
        }
        catch {
          return;
        }

        if (event.type === 'stream_event') {
          const streamEvent = event.event ?? {};
          const streamType = streamEvent.type ?? '';

          if (streamType === 'content_block_start') {
            const contentBlock = streamEvent.content_block ?? {};
            if (contentBlock.type === 'tool_use') {
              const toolName = contentBlock.name ?? '';
              if (toolName === 'Skill' || toolName === 'Read') {
                pendingToolName = toolName;
                accumulatedJson = '';
                return;
              }
              finish(false);
            }
            return;
          }

          if (streamType === 'content_block_delta' && pendingToolName) {
            const delta = streamEvent.delta ?? {};
            if (delta.type === 'input_json_delta') {
              accumulatedJson += delta.partial_json ?? '';
              if (accumulatedJson.includes(cleanName)) {
                finish(true);
              }
            }
            return;
          }

          if (streamType === 'content_block_stop' && pendingToolName) {
            finish(accumulatedJson.includes(cleanName));
            return;
          }

          if (streamType === 'message_stop') {
            finish(pendingToolName ? accumulatedJson.includes(cleanName) : false);
          }
          return;
        }

        if (event.type === 'assistant') {
          for (const contentItem of event.message?.content ?? []) {
            if (contentItem.type !== 'tool_use') {
              continue;
            }
            const toolName = contentItem.name ?? '';
            const toolInput = contentItem.input ?? {};
            if (toolName === 'Skill' && String(toolInput.skill ?? '').includes(cleanName)) {
              triggered = true;
            }
            else if (toolName === 'Read' && String(toolInput.file_path ?? '').includes(cleanName)) {
              triggered = true;
            }
            finish(triggered);
            return;
          }
          return;
        }

        if (event.type === 'result') {
          finish(triggered);
        }
      });

      child.on('error', () => finish(false));
      child.on('exit', () => finish(triggered));
    });
  }
  finally {
    await fs.unlink(commandFilePath).catch(() => undefined);
  }
}

export async function runEval({
  evalSet,
  skillName,
  description,
  numWorkers,
  timeout,
  projectRoot,
  runsPerQuery = 1,
  triggerThreshold = 0.5,
  model = null,
}) {
  const tasks = [];
  for (const item of evalSet) {
    for (let runIndex = 0; runIndex < runsPerQuery; runIndex += 1) {
      tasks.push({ item, runIndex });
    }
  }

  const queryTriggers = new Map();
  const queryItems = new Map();

  const results = await mapWithConcurrency(tasks, numWorkers, async ({ item }) => {
    const didTrigger = await runSingleQuery(item.query, skillName, description, timeout, projectRoot, model);
    return { item, didTrigger };
  });

  for (const result of results) {
    const item = result.item ?? result.error?.item;
    if (!item) {
      continue;
    }

    queryItems.set(item.query, item);
    const list = queryTriggers.get(item.query) ?? [];
    list.push(Boolean(result.didTrigger));
    queryTriggers.set(item.query, list);
  }

  const summarizedResults = [];
  for (const [query, triggers] of queryTriggers.entries()) {
    const item = queryItems.get(query);
    const triggerRate = triggers.filter(Boolean).length / triggers.length;
    const shouldTrigger = Boolean(item.should_trigger);
    const didPass = shouldTrigger ? triggerRate >= triggerThreshold : triggerRate < triggerThreshold;
    summarizedResults.push({
      query,
      should_trigger: shouldTrigger,
      trigger_rate: triggerRate,
      triggers: triggers.filter(Boolean).length,
      runs: triggers.length,
      pass: didPass,
    });
  }

  summarizedResults.sort((left, right) => left.query.localeCompare(right.query));
  const passed = summarizedResults.filter(result => result.pass).length;

  return {
    skill_name: skillName,
    description,
    results: summarizedResults,
    summary: {
      total: summarizedResults.length,
      passed,
      failed: summarizedResults.length - passed,
    },
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
      'runs-per-query': { type: 'string' },
      'trigger-threshold': { type: 'string' },
      model: { type: 'string' },
      verbose: { type: 'boolean' },
    },
  });

  if (!values['eval-set'] || !values['skill-path']) {
    console.error('Usage: node run_eval.mjs --eval-set <evals.json> --skill-path <skill-dir> [--description <text>] [--num-workers <n>] [--timeout <seconds>] [--runs-per-query <n>] [--trigger-threshold <float>] [--model <name>] [--verbose]');
    process.exit(1);
  }

  const skillPath = path.resolve(values['skill-path']);
  const evalSet = await readJson(path.resolve(values['eval-set']));
  const parsedSkill = await parseSkillMd(skillPath);
  const description = values.description ?? parsedSkill.description;
  const projectRoot = await findProjectRoot();
  const numWorkers = Number.parseInt(values['num-workers'] ?? '10', 10);
  const timeout = Number.parseInt(values.timeout ?? '30', 10);
  const runsPerQuery = Number.parseInt(values['runs-per-query'] ?? '3', 10);
  const triggerThreshold = Number.parseFloat(values['trigger-threshold'] ?? '0.5');

  if (values.verbose) {
    console.error(`Evaluating: ${description}`);
  }

  const output = await runEval({
    evalSet,
    skillName: parsedSkill.name,
    description,
    numWorkers,
    timeout,
    projectRoot,
    runsPerQuery,
    triggerThreshold,
    model: values.model ?? null,
  });

  if (values.verbose) {
    console.error(`Results: ${output.summary.passed}/${output.summary.total} passed`);
    for (const result of output.results) {
      const status = result.pass ? 'PASS' : 'FAIL';
      console.error(`  [${status}] rate=${result.triggers}/${result.runs} expected=${result.should_trigger}: ${result.query.slice(0, 70)}`);
    }
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
