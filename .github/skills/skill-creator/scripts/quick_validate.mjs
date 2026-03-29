#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { extractFrontmatter, isExecutedDirectly, parseFrontmatter } from './utils.mjs';

const ALLOWED_PROPERTIES = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility',
  'argument-hint',
]);

export async function validateSkill(skillPath) {
  const resolvedSkillPath = path.resolve(skillPath);
  const skillMdPath = path.join(resolvedSkillPath, 'SKILL.md');

  try {
    await fs.access(skillMdPath);
  }
  catch {
    return [false, 'SKILL.md not found'];
  }

  let content = '';
  try {
    content = await fs.readFile(skillMdPath, 'utf8');
  }
  catch (error) {
    return [false, `Unable to read SKILL.md: ${error.message}`];
  }

  let frontmatterText = '';
  try {
    ({ frontmatterText } = extractFrontmatter(content));
  }
  catch (error) {
    return [false, error.message];
  }

  let frontmatter = {};
  try {
    frontmatter = parseFrontmatter(frontmatterText);
  }
  catch (error) {
    return [false, `Invalid frontmatter format: ${error.message}`];
  }

  const unexpectedKeys = Object.keys(frontmatter).filter(key => !ALLOWED_PROPERTIES.has(key));
  if (unexpectedKeys.length > 0) {
    return [
      false,
      `Unexpected key(s) in SKILL.md frontmatter: ${unexpectedKeys.sort().join(', ')}. Allowed properties are: ${[...ALLOWED_PROPERTIES].sort().join(', ')}`,
    ];
  }

  if (!Object.hasOwn(frontmatter, 'name')) {
    return [false, "Missing 'name' in frontmatter"];
  }

  if (!Object.hasOwn(frontmatter, 'description')) {
    return [false, "Missing 'description' in frontmatter"];
  }

  const name = frontmatter.name;
  if (typeof name !== 'string') {
    return [false, `Name must be a string, got ${typeof name}`];
  }

  const trimmedName = name.trim();
  if (trimmedName !== '') {
    if (!/^[a-z0-9-]+$/.test(trimmedName)) {
      return [false, `Name '${trimmedName}' should be kebab-case (lowercase letters, digits, and hyphens only)`];
    }
    if (trimmedName.startsWith('-') || trimmedName.endsWith('-') || trimmedName.includes('--')) {
      return [false, `Name '${trimmedName}' cannot start/end with hyphen or contain consecutive hyphens`];
    }
    if (trimmedName.length > 64) {
      return [false, `Name is too long (${trimmedName.length} characters). Maximum is 64 characters.`];
    }
  }

  const description = frontmatter.description;
  if (typeof description !== 'string') {
    return [false, `Description must be a string, got ${typeof description}`];
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.includes('<') || trimmedDescription.includes('>')) {
    return [false, 'Description cannot contain angle brackets (< or >)'];
  }
  if (trimmedDescription.length > 1024) {
    return [false, `Description is too long (${trimmedDescription.length} characters). Maximum is 1024 characters.`];
  }

  if (Object.hasOwn(frontmatter, 'compatibility') && typeof frontmatter.compatibility !== 'string' && frontmatter.compatibility !== '') {
    return [false, `Compatibility must be a string, got ${typeof frontmatter.compatibility}`];
  }

  if (typeof frontmatter.compatibility === 'string' && frontmatter.compatibility.length > 500) {
    return [false, `Compatibility is too long (${frontmatter.compatibility.length} characters). Maximum is 500 characters.`];
  }

  return [true, 'Skill is valid!'];
}

async function main() {
  const { positionals } = parseArgs({
    allowPositionals: true,
    options: {},
  });

  if (positionals.length !== 1) {
    console.log('Usage: node quick_validate.mjs <skill_directory>');
    process.exit(1);
  }

  const [isValid, message] = await validateSkill(positionals[0]);
  console.log(message);
  process.exit(isValid ? 0 : 1);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
