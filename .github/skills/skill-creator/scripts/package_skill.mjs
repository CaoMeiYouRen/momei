#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { validateSkill } from './quick_validate.mjs';
import { isExecutedDirectly, toPosixPath } from './utils.mjs';
import { writeZipArchive } from './zip.mjs';

const EXCLUDE_DIRS = new Set(['__pycache__', 'node_modules']);
const EXCLUDE_GLOBS = [/.*\.pyc$/u];
const EXCLUDE_FILES = new Set(['.DS_Store']);
const ROOT_EXCLUDE_DIRS = new Set(['evals']);

function shouldExclude(relativePath) {
  const parts = relativePath.split('/');
  if (parts.some(part => EXCLUDE_DIRS.has(part))) {
    return true;
  }

  if (parts.length > 1 && ROOT_EXCLUDE_DIRS.has(parts[1])) {
    return true;
  }

  const name = parts.at(-1) ?? '';
  if (EXCLUDE_FILES.has(name)) {
    return true;
  }

  return EXCLUDE_GLOBS.some(pattern => pattern.test(name));
}

async function collectFiles(rootDirectory) {
  const entries = [];

  async function visit(directory) {
    const directoryEntries = await fs.readdir(directory, { withFileTypes: true });
    for (const directoryEntry of directoryEntries) {
      const absolutePath = path.join(directory, directoryEntry.name);
      if (directoryEntry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!directoryEntry.isFile()) {
        continue;
      }
      entries.push(absolutePath);
    }
  }

  await visit(rootDirectory);
  return entries;
}

export async function packageSkill(skillPath, outputDirectory = null) {
  const resolvedSkillPath = path.resolve(skillPath);

  try {
    const stats = await fs.stat(resolvedSkillPath);
    if (!stats.isDirectory()) {
      console.log(`❌ Error: Path is not a directory: ${resolvedSkillPath}`);
      return null;
    }
  }
  catch {
    console.log(`❌ Error: Skill folder not found: ${resolvedSkillPath}`);
    return null;
  }

  const skillMdPath = path.join(resolvedSkillPath, 'SKILL.md');
  try {
    await fs.access(skillMdPath);
  }
  catch {
    console.log(`❌ Error: SKILL.md not found in ${resolvedSkillPath}`);
    return null;
  }

  console.log('🔍 Validating skill...');
  const [isValid, message] = await validateSkill(resolvedSkillPath);
  if (!isValid) {
    console.log(`❌ Validation failed: ${message}`);
    console.log('   Please fix the validation errors before packaging.');
    return null;
  }
  console.log(`✅ ${message}\n`);

  const targetDirectory = outputDirectory ? path.resolve(outputDirectory) : process.cwd();
  await fs.mkdir(targetDirectory, { recursive: true });

  const skillName = path.basename(resolvedSkillPath);
  const outputPath = path.join(targetDirectory, `${skillName}.skill`);
  const rootDirectory = path.dirname(resolvedSkillPath);
  const files = await collectFiles(resolvedSkillPath);
  const archiveEntries = [];

  for (const filePath of files) {
    const archiveName = toPosixPath(path.relative(rootDirectory, filePath));
    if (shouldExclude(archiveName)) {
      console.log(`  Skipped: ${archiveName}`);
      continue;
    }

    const [data, stats] = await Promise.all([
      fs.readFile(filePath),
      fs.stat(filePath),
    ]);
    archiveEntries.push({
      name: archiveName,
      data,
      mtime: stats.mtime,
    });
    console.log(`  Added: ${archiveName}`);
  }

  try {
    await writeZipArchive(outputPath, archiveEntries);
    console.log(`\n✅ Successfully packaged skill to: ${outputPath}`);
    return outputPath;
  }
  catch (error) {
    console.log(`❌ Error creating .skill file: ${error.message}`);
    return null;
  }
}

async function main() {
  const { positionals } = parseArgs({
    allowPositionals: true,
    options: {},
  });

  if (positionals.length < 1 || positionals.length > 2) {
    console.log('Usage: node package_skill.mjs <path/to/skill-folder> [output-directory]');
    console.log('\nExample:');
    console.log('  node package_skill.mjs skills/public/my-skill');
    console.log('  node package_skill.mjs skills/public/my-skill ./dist');
    process.exit(1);
  }

  const [skillPath, outputDirectory] = positionals;
  console.log(`📦 Packaging skill: ${skillPath}`);
  if (outputDirectory) {
    console.log(`   Output directory: ${outputDirectory}`);
  }
  console.log();

  const result = await packageSkill(skillPath, outputDirectory);
  process.exit(result ? 0 : 1);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
