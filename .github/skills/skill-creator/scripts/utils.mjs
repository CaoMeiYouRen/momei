import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FRONTMATTER_BOUNDARY = '---';
const BLOCK_SCALARS = new Set(['|', '>', '|-', '>-']);

function stripQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function parseInlineValue(rawValue) {
  const value = rawValue.trim();
  if (value === '') {
    return '';
  }

  if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    }
    catch {
      return stripQuotes(value);
    }
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (value === 'null') {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return stripQuotes(value);
}

function consumeIndentedBlock(lines, startIndex) {
  const collected = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith('  ') || line.startsWith('\t')) {
      collected.push(line.replace(/^(  |\t)/, ''));
      index += 1;
      continue;
    }
    if (line.trim() === '') {
      collected.push('');
      index += 1;
      continue;
    }
    break;
  }

  return { lines: collected, nextIndex: index };
}

export function extractFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== FRONTMATTER_BOUNDARY) {
    throw new Error('SKILL.md missing frontmatter (no opening ---)');
  }

  let endIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === FRONTMATTER_BOUNDARY) {
      endIndex = index;
      break;
    }
  }

  if (endIndex === -1) {
    throw new Error('SKILL.md missing frontmatter (no closing ---)');
  }

  return {
    frontmatterText: lines.slice(1, endIndex).join('\n'),
    body: lines.slice(endIndex + 1).join('\n'),
  };
}

export function parseFrontmatter(frontmatterText) {
  const lines = frontmatterText.replace(/\r\n/g, '\n').split('\n');
  const frontmatter = {};

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const [, key, rawValue] = match;
    const trimmedValue = rawValue.trim();

    if (BLOCK_SCALARS.has(trimmedValue)) {
      const block = consumeIndentedBlock(lines, index + 1);
      frontmatter[key] = trimmedValue.startsWith('>')
        ? block.lines.map(lineValue => lineValue.trim()).join(' ').trim()
        : block.lines.join('\n').trimEnd();
      index = block.nextIndex;
      continue;
    }

    if (trimmedValue === '') {
      const block = consumeIndentedBlock(lines, index + 1);
      frontmatter[key] = block.lines.length > 0 ? block.lines.join('\n') : '';
      index = block.nextIndex;
      continue;
    }

    frontmatter[key] = parseInlineValue(trimmedValue);
    index += 1;
  }

  return frontmatter;
}

export async function parseSkillMd(skillPath) {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const content = await fs.readFile(skillMdPath, 'utf8');
  const { frontmatterText } = extractFrontmatter(content);
  const frontmatter = parseFrontmatter(frontmatterText);
  return {
    name: typeof frontmatter.name === 'string' ? frontmatter.name : '',
    description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
    content,
    frontmatter,
  };
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function findProjectRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    const marker = path.join(current, '.claude');
    try {
      const stats = await fs.stat(marker);
      if (stats) {
        return current;
      }
    }
    catch {
      // Ignore missing directories and keep walking.
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

export function formatTitleFromSkillName(skillName) {
  return skillName
    .split('-')
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let state = value;
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed(items, seed = 42) {
  const random = createSeededRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }
  return result;
}

export function formatSignedNumber(value, digits = 0) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}`;
}

export function isExecutedDirectly(importMetaUrl) {
  if (!process.argv[1]) {
    return false;
  }
  return importMetaUrl === pathToFileURL(path.resolve(process.argv[1])).href;
}
