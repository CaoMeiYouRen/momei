#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

import { isExecutedDirectly, parseSkillMd, readJson } from './utils.mjs';

async function callClaude(prompt, model, timeoutSeconds = 300) {
  const args = ['-p', '--output-format', 'text'];
  if (model) {
    args.push('--model', model);
  }

  const env = { ...process.env };
  delete env.CLAUDECODE;

  return await new Promise((resolve, reject) => {
    const child = spawn('claude', args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude -p timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    child.stdout.on('data', chunk => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('exit', code => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude -p exited ${code}\nstderr: ${stderr}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.end(prompt, 'utf8');
  });
}

function buildPrompt(skillName, skillContent, currentDescription, evalResults, history, testResults = null) {
  const failedTriggers = evalResults.results.filter(result => result.should_trigger && !result.pass);
  const falseTriggers = evalResults.results.filter(result => !result.should_trigger && !result.pass);
  const trainScore = `${evalResults.summary.passed}/${evalResults.summary.total}`;
  const scoresSummary = testResults
    ? `Train: ${trainScore}, Test: ${testResults.summary.passed}/${testResults.summary.total}`
    : `Train: ${trainScore}`;

  let prompt = `You are optimizing a skill description for a Claude Code skill called "${skillName}". A "skill" is sort of like a prompt, but with progressive disclosure -- there's a title and description that Claude sees when deciding whether to use the skill, and then if it does use the skill, it reads the .md file which has lots more details and potentially links to other resources in the skill folder like helper files and scripts and additional documentation or examples.\n\nThe description appears in Claude's "available_skills" list. When a user sends a query, Claude decides whether to invoke the skill based solely on the title and on this description. Your goal is to write a description that triggers for relevant queries, and doesn't trigger for irrelevant ones.\n\nHere's the current description:\n<current_description>\n"${currentDescription}"\n</current_description>\n\nCurrent scores (${scoresSummary}):\n<scores_summary>\n`;

  if (failedTriggers.length > 0) {
    prompt += 'FAILED TO TRIGGER (should have triggered but did not):\n';
    for (const result of failedTriggers) {
      prompt += `  - "${result.query}" (triggered ${result.triggers}/${result.runs} times)\n`;
    }
    prompt += '\n';
  }

  if (falseTriggers.length > 0) {
    prompt += 'FALSE TRIGGERS (triggered but should not have):\n';
    for (const result of falseTriggers) {
      prompt += `  - "${result.query}" (triggered ${result.triggers}/${result.runs} times)\n`;
    }
    prompt += '\n';
  }

  if (history.length > 0) {
    prompt += 'PREVIOUS ATTEMPTS (do NOT repeat these -- try something structurally different):\n\n';
    for (const item of history) {
      const trainPart = `${item.train_passed ?? item.passed ?? 0}/${item.train_total ?? item.total ?? 0}`;
      const testPart = item.test_passed !== undefined && item.test_passed !== null
        ? `, test=${item.test_passed}/${item.test_total}`
        : '';
      prompt += `<attempt train=${trainPart}${testPart}>\n`;
      prompt += `Description: "${item.description}"\n`;
      for (const result of item.results ?? []) {
        prompt += `  [${result.pass ? 'PASS' : 'FAIL'}] "${result.query.slice(0, 80)}" (triggered ${result.triggers}/${result.runs})\n`;
      }
      if (item.note) {
        prompt += `Note: ${item.note}\n`;
      }
      prompt += '</attempt>\n\n';
    }
  }

  prompt += `</scores_summary>\n\nSkill content (for context on what the skill does):\n<skill_content>\n${skillContent}\n</skill_content>\n\nBased on the failures, write a new and improved description that is more likely to trigger correctly. When I say "based on the failures", it's a bit of a tricky line to walk because we do not want to overfit to the specific cases you are seeing. So what I do NOT want you to do is produce an ever-expanding list of specific queries that this skill should or should not trigger for. Instead, try to generalize from the failures to broader categories of user intent and situations where this skill would be useful or not useful.\n\nConcretely, your description should not be more than about 100-200 words. There is a hard limit of 1024 characters.\n\nHere are some tips that have worked well:\n- Phrase the skill in the imperative, as in "Use this skill for" rather than "this skill does".\n- Focus on the user's intent rather than implementation details.\n- Make the description distinctive and immediately recognizable.\n- If repeated attempts keep failing, change sentence structure or emphasis.\n\nPlease respond with only the new description text in <new_description> tags, nothing else.`;

  return prompt;
}

function extractDescription(responseText) {
  const match = /<new_description>([\s\S]*?)<\/new_description>/u.exec(responseText);
  return (match?.[1] ?? responseText).trim().replace(/^"|"$/gu, '');
}

export async function improveDescription({
  skillName,
  skillContent,
  currentDescription,
  evalResults,
  history,
  model,
  testResults = null,
  logDir = null,
  iteration = null,
}) {
  const prompt = buildPrompt(skillName, skillContent, currentDescription, evalResults, history, testResults);
  const response = await callClaude(prompt, model);
  let description = extractDescription(response);

  const transcript = {
    iteration,
    prompt,
    response,
    parsed_description: description,
    char_count: description.length,
    over_limit: description.length > 1024,
  };

  if (description.length > 1024) {
    const shortenPrompt = `${prompt}\n\n---\n\nA previous attempt produced this description, which at ${description.length} characters is over the 1024-character hard limit:\n\n"${description}"\n\nRewrite it to be under 1024 characters while keeping the most important trigger words and intent coverage. Respond with only the new description in <new_description> tags.`;
    const shortenedResponse = await callClaude(shortenPrompt, model);
    description = extractDescription(shortenedResponse);
    transcript.rewrite_prompt = shortenPrompt;
    transcript.rewrite_response = shortenedResponse;
    transcript.rewrite_description = description;
    transcript.rewrite_char_count = description.length;
  }

  transcript.final_description = description;

  if (logDir) {
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, `improve_iter_${iteration ?? 'unknown'}.json`);
    await fs.writeFile(logPath, `${JSON.stringify(transcript, null, 2)}\n`, 'utf8');
  }

  return description;
}

async function main() {
  const { values } = parseArgs({
    allowPositionals: true,
    options: {
      'eval-results': { type: 'string' },
      'skill-path': { type: 'string' },
      history: { type: 'string' },
      model: { type: 'string' },
      verbose: { type: 'boolean' },
    },
  });

  if (!values['eval-results'] || !values['skill-path'] || !values.model) {
    console.error('Usage: node improve_description.mjs --eval-results <results.json> --skill-path <skill-dir> --model <name> [--history <history.json>] [--verbose]');
    process.exit(1);
  }

  const skillPath = path.resolve(values['skill-path']);
  const evalResults = await readJson(path.resolve(values['eval-results']));
  const history = values.history ? await readJson(path.resolve(values.history)) : [];
  const parsedSkill = await parseSkillMd(skillPath);

  if (values.verbose) {
    console.error(`Current: ${evalResults.description}`);
    console.error(`Score: ${evalResults.summary.passed}/${evalResults.summary.total}`);
  }

  const description = await improveDescription({
    skillName: parsedSkill.name,
    skillContent: parsedSkill.content,
    currentDescription: evalResults.description,
    evalResults,
    history,
    model: values.model,
  });

  if (values.verbose) {
    console.error(`Improved: ${description}`);
  }

  process.stdout.write(`${JSON.stringify({
    description,
    history: [
      ...history,
      {
        description: evalResults.description,
        passed: evalResults.summary.passed,
        failed: evalResults.summary.failed,
        total: evalResults.summary.total,
        results: evalResults.results,
      },
    ],
  }, null, 2)}\n`);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
