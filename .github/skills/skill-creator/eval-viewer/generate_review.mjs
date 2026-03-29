#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { isExecutedDirectly, readJson } from '../scripts/utils.mjs';

const METADATA_FILES = new Set(['transcript.md', 'user_notes.md', 'metrics.json']);
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.csv', '.py', '.js', '.ts', '.tsx', '.jsx',
  '.yaml', '.yml', '.xml', '.html', '.css', '.sh', '.rb', '.go', '.rs',
  '.java', '.c', '.cpp', '.h', '.hpp', '.sql', '.r', '.toml',
]);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const MIME_OVERRIDES = {
  '.svg': 'image/svg+xml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
const SKIP_DIRECTORIES = new Set(['node_modules', '.git', '__pycache__', 'skill', 'inputs']);

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (MIME_OVERRIDES[extension]) {
    return MIME_OVERRIDES[extension];
  }

  const commonTypes = {
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.json': 'application/json',
    '.csv': 'text/csv; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return commonTypes[extension] ?? 'application/octet-stream';
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  }
  catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  if (!await pathExists(filePath)) {
    return null;
  }

  try {
    return await readJson(filePath);
  }
  catch {
    return null;
  }
}

async function findRuns(workspacePath) {
  const runs = [];

  async function visit(currentPath) {
    const stats = await fs.stat(currentPath).catch(() => null);
    if (!stats?.isDirectory()) {
      return;
    }

    const outputsPath = path.join(currentPath, 'outputs');
    if (await pathExists(outputsPath)) {
      const run = await buildRun(workspacePath, currentPath);
      if (run) {
        runs.push(run);
      }
      return;
    }

    const children = await fs.readdir(currentPath, { withFileTypes: true }).catch(() => []);
    for (const child of children.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!child.isDirectory() || SKIP_DIRECTORIES.has(child.name)) {
        continue;
      }
      await visit(path.join(currentPath, child.name));
    }
  }

  await visit(workspacePath);
  runs.sort((left, right) => {
    const leftEval = left.eval_id ?? Number.POSITIVE_INFINITY;
    const rightEval = right.eval_id ?? Number.POSITIVE_INFINITY;
    if (leftEval !== rightEval) {
      return leftEval - rightEval;
    }
    return left.id.localeCompare(right.id);
  });
  return runs;
}

async function extractPrompt(runDirectory) {
  const metadataCandidates = [
    path.join(runDirectory, 'eval_metadata.json'),
    path.join(path.dirname(runDirectory), 'eval_metadata.json'),
  ];

  for (const candidate of metadataCandidates) {
    const metadata = await readJsonIfExists(candidate);
    if (metadata?.prompt) {
      return {
        prompt: metadata.prompt,
        evalId: metadata.eval_id ?? null,
      };
    }
    if (metadata?.eval_id !== undefined) {
      return {
        prompt: '',
        evalId: metadata.eval_id,
      };
    }
  }

  const transcriptCandidates = [
    path.join(runDirectory, 'transcript.md'),
    path.join(runDirectory, 'outputs', 'transcript.md'),
  ];

  for (const candidate of transcriptCandidates) {
    if (!await pathExists(candidate)) {
      continue;
    }
    try {
      const content = await fs.readFile(candidate, 'utf8');
      const match = /## Eval Prompt\n\n([\s\S]*?)(?=\n##|$)/u.exec(content);
      if (match?.[1]) {
        return {
          prompt: match[1].trim(),
          evalId: null,
        };
      }
    }
    catch {
      // Ignore transcript parse failures.
    }
  }

  return {
    prompt: '(No prompt found)',
    evalId: null,
  };
}

async function embedFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const mime = getMimeType(filePath);

  if (TEXT_EXTENSIONS.has(extension)) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { name: fileName, type: 'text', content };
    }
    catch {
      return { name: fileName, type: 'error', content: '(Error reading file)' };
    }
  }

  try {
    const raw = await fs.readFile(filePath);
    const base64 = raw.toString('base64');
    if (IMAGE_EXTENSIONS.has(extension)) {
      return {
        name: fileName,
        type: 'image',
        mime,
        data_uri: `data:${mime};base64,${base64}`,
      };
    }
    if (extension === '.pdf') {
      return {
        name: fileName,
        type: 'pdf',
        data_uri: `data:${mime};base64,${base64}`,
      };
    }
    if (extension === '.xlsx') {
      return {
        name: fileName,
        type: 'xlsx',
        data_b64: base64,
      };
    }
    return {
      name: fileName,
      type: 'binary',
      mime,
      data_uri: `data:${mime};base64,${base64}`,
    };
  }
  catch {
    return { name: fileName, type: 'error', content: '(Error reading file)' };
  }
}

async function buildRun(rootPath, runDirectory) {
  const { prompt, evalId } = await extractPrompt(runDirectory);
  const runId = path.relative(rootPath, runDirectory).split(path.sep).join('-');
  const outputsDirectory = path.join(runDirectory, 'outputs');
  const outputs = [];
  if (await pathExists(outputsDirectory)) {
    const children = await fs.readdir(outputsDirectory, { withFileTypes: true }).catch(() => []);
    for (const child of children.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!child.isFile() || METADATA_FILES.has(child.name)) {
        continue;
      }
      outputs.push(await embedFile(path.join(outputsDirectory, child.name)));
    }
  }

  const gradingCandidates = [
    path.join(runDirectory, 'grading.json'),
    path.join(path.dirname(runDirectory), 'grading.json'),
  ];
  let grading = null;
  for (const candidate of gradingCandidates) {
    grading = await readJsonIfExists(candidate);
    if (grading) {
      break;
    }
  }

  return {
    id: runId,
    prompt,
    eval_id: evalId,
    outputs,
    grading,
  };
}

async function loadPreviousIteration(workspacePath) {
  const feedbackPath = path.join(workspacePath, 'feedback.json');
  const feedbackData = await readJsonIfExists(feedbackPath);
  const feedbackMap = new Map();
  for (const review of feedbackData?.reviews ?? []) {
    if (review?.run_id && String(review.feedback ?? '').trim()) {
      feedbackMap.set(review.run_id, review.feedback);
    }
  }

  const previousRuns = await findRuns(workspacePath);
  const result = {};
  for (const run of previousRuns) {
    result[run.id] = {
      feedback: feedbackMap.get(run.id) ?? '',
      outputs: run.outputs ?? [],
    };
  }

  for (const [runId, feedback] of feedbackMap.entries()) {
    if (!result[runId]) {
      result[runId] = { feedback, outputs: [] };
    }
  }

  return result;
}

export async function generateHtml(runs, skillName, previous = null, benchmark = null) {
  const templatePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'viewer.html');
  const template = await fs.readFile(templatePath, 'utf8');
  const previousFeedback = {};
  const previousOutputs = {};

  if (previous) {
    for (const [runId, data] of Object.entries(previous)) {
      if (data.feedback) {
        previousFeedback[runId] = data.feedback;
      }
      if (Array.isArray(data.outputs) && data.outputs.length > 0) {
        previousOutputs[runId] = data.outputs;
      }
    }
  }

  const embedded = {
    skill_name: skillName,
    runs,
    previous_feedback: previousFeedback,
    previous_outputs: previousOutputs,
  };
  if (benchmark) {
    embedded.benchmark = benchmark;
  }

  return template.replace('/*__EMBEDDED_DATA__*/', `const EMBEDDED_DATA = ${JSON.stringify(embedded)};`);
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'win32'
    ? ['cmd', ['/c', 'start', '', url]]
    : platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  const [binary, args] = command;
  const child = spawn(binary, args, { stdio: 'ignore', detached: true });
  child.unref();
}

function sendJson(response, statusCode, payload) {
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
  });
  response.end(body);
}

async function createServer({ workspacePath, skillName, feedbackPath, previous, benchmarkPath }) {
  return await new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');

        if (request.method === 'GET' && (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html')) {
          const runs = await findRuns(workspacePath);
          const benchmark = benchmarkPath ? await readJsonIfExists(benchmarkPath) : null;
          const html = await generateHtml(runs, skillName, previous, benchmark);
          const body = Buffer.from(html, 'utf8');
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': body.length,
          });
          response.end(body);
          return;
        }

        if (request.method === 'GET' && requestUrl.pathname === '/api/feedback') {
          const payload = await readJsonIfExists(feedbackPath) ?? {};
          sendJson(response, 200, payload);
          return;
        }

        if (request.method === 'POST' && requestUrl.pathname === '/api/feedback') {
          const chunks = [];
          for await (const chunk of request) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!payload || typeof payload !== 'object' || !Array.isArray(payload.reviews)) {
            throw new Error("Expected JSON object with 'reviews' key");
          }
          await fs.writeFile(feedbackPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
          sendJson(response, 200, { ok: true });
          return;
        }

        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not Found');
      }
      catch (error) {
        sendJson(response, 500, { error: error.message });
      }
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function listenOnPreferredPort(server, port) {
  if (port <= 0) {
    return server.address();
  }

  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });

  return await new Promise(resolve => {
    const onError = () => {
      server.off('listening', onListening);
      server.listen(0, '127.0.0.1');
    };
    const onListening = () => {
      server.off('error', onError);
      resolve(server.address());
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      port: { type: 'string', short: 'p' },
      'skill-name': { type: 'string', short: 'n' },
      'previous-workspace': { type: 'string' },
      benchmark: { type: 'string' },
      static: { type: 'string', short: 's' },
    },
  });

  if (positionals.length !== 1) {
    console.error('Usage: node generate_review.mjs <workspace-path> [--port PORT] [--skill-name NAME] [--previous-workspace PATH] [--benchmark PATH] [--static PATH]');
    process.exit(1);
  }

  const workspacePath = path.resolve(positionals[0]);
  const workspaceStats = await fs.stat(workspacePath).catch(() => null);
  if (!workspaceStats?.isDirectory()) {
    console.error(`Error: ${workspacePath} is not a directory`);
    process.exit(1);
  }

  const runs = await findRuns(workspacePath);
  if (runs.length === 0) {
    console.error(`No runs found in ${workspacePath}`);
    process.exit(1);
  }

  const skillName = values['skill-name'] ?? path.basename(workspacePath).replace(/-workspace$/u, '');
  const feedbackPath = path.join(workspacePath, 'feedback.json');
  const previousWorkspace = values['previous-workspace'] ? path.resolve(values['previous-workspace']) : null;
  const previous = previousWorkspace ? await loadPreviousIteration(previousWorkspace) : {};
  const benchmarkPath = values.benchmark ? path.resolve(values.benchmark) : null;
  const benchmark = benchmarkPath ? await readJsonIfExists(benchmarkPath) : null;

  if (values.static) {
    const outputPath = path.resolve(values.static);
    const html = await generateHtml(runs, skillName, previous, benchmark);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');
    console.log(`\n  Static viewer written to: ${outputPath}\n`);
    return;
  }

  const server = await createServer({
    workspacePath,
    skillName,
    feedbackPath,
    previous,
    benchmarkPath,
  });

  const preferredPort = Number.parseInt(values.port ?? '3117', 10);
  const address = await listenOnPreferredPort(server, Number.isFinite(preferredPort) ? preferredPort : 3117);
  const port = typeof address === 'object' && address ? address.port : 3117;
  const url = `http://localhost:${port}`;

  console.log('\n  Eval Viewer');
  console.log('  ─────────────────────────────────');
  console.log(`  URL:       ${url}`);
  console.log(`  Workspace: ${workspacePath}`);
  console.log(`  Feedback:  ${feedbackPath}`);
  if (previousWorkspace) {
    console.log(`  Previous:  ${previousWorkspace} (${Object.keys(previous).length} runs)`);
  }
  if (benchmarkPath) {
    console.log(`  Benchmark: ${benchmarkPath}`);
  }
  console.log('\n  Press Ctrl+C to stop.\n');

  openBrowser(url);
  process.on('SIGINT', () => {
    console.log('\nStopped.');
    server.close(() => process.exit(0));
  });
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
