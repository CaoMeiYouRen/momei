#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { formatTitleFromSkillName, isExecutedDirectly } from './utils.mjs';

const SKILL_TEMPLATE = `---
name: {skill_name}
description: "[TODO: Write a keyword-rich description. Include: (1) core capability in first sentence, (2) 5+ action verbs users might say, (3) 5+ object nouns, (4) natural language trigger phrases. See references/description-guide.md for examples. ALL trigger info goes HERE, not in the body.]"
---

# {skill_title}

[TODO: Write your Iron Law here. Ask: "What is the ONE mistake the model will most likely make?" Then write an unbreakable rule to prevent it.]

IRON LAW: [TODO: e.g., "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST."]

## Workflow

Copy this checklist and check off items as you complete them:



{skill_title} Progress:

- [ ] Step 1: [TODO: First step] ⚠️ REQUIRED
  - [ ] 1.1 [TODO: Sub-step]
  - [ ] 1.2 [TODO: Sub-step]
- [ ] Step 2: Confirm with user ⚠️ REQUIRED
- [ ] Step 3: [TODO: Core operation]
- [ ] Step 4: [TODO: Output / delivery]



## Step 1: [TODO: First Step]

[TODO: Use question-style instructions, not vague directives.
Instead of "Check for problems", write "Ask: What happens if this value is null?"]

## Step 2: Confirm ⚠️ REQUIRED

[TODO: Present findings/plan to user before proceeding. Options:]
- Proceed with all?
- Only high-priority items?
- Select specific items?
- View only, no changes?

⚠️ Do NOT proceed without user confirmation.

## Step 3: [TODO: Core Operation]

[TODO: The main work of the skill. Load references as needed:]
- Load references/[TODO].md for [specific purpose]

## Step 4: [TODO: Output]

[TODO: Define output format and structure]

## Anti-Patterns

[TODO: List what the model should NOT do. Ask: "What would Claude's lazy default look like?"]
- [TODO: e.g., Don't use purple/blue gradients by default]
- [TODO: e.g., Don't add unnecessary try-catch blocks]

## Pre-Delivery Checklist

[TODO: Add concrete, verifiable checks — not "ensure quality" but specific items]
- [ ] [TODO: e.g., No placeholder text remaining (TODO, FIXME)]
- [ ] [TODO: e.g., All generated code runs without errors]
- [ ] [TODO: e.g., Output matches requested format]
`;

export async function initSkill(skillName, targetPath) {
  const skillDirectory = path.resolve(targetPath, skillName);

  try {
    await fs.access(skillDirectory);
    console.log(`Error: Skill directory already exists: ${skillDirectory}`);
    return null;
  }
  catch {
    // Directory does not exist, continue.
  }

  try {
    await fs.mkdir(skillDirectory, { recursive: false });
    console.log(`Created skill directory: ${skillDirectory}`);
  }
  catch (error) {
    console.log(`Error creating directory: ${error.message}`);
    return null;
  }

  const skillTitle = formatTitleFromSkillName(skillName);
  const skillContent = SKILL_TEMPLATE
    .replaceAll('{skill_name}', skillName)
    .replaceAll('{skill_title}', skillTitle)
    .trimStart();

  try {
    await fs.writeFile(path.join(skillDirectory, 'SKILL.md'), skillContent, 'utf8');
    console.log('Created SKILL.md');
  }
  catch (error) {
    console.log(`Error creating SKILL.md: ${error.message}`);
    return null;
  }

  for (const directoryName of ['scripts', 'references', 'assets']) {
    await fs.mkdir(path.join(skillDirectory, directoryName), { recursive: true });
    console.log(`Created ${directoryName}/`);
  }

  console.log(`\nSkill '${skillName}' initialized at ${skillDirectory}`);
  console.log('\nNext steps:');
  console.log('1. Fill in all [TODO] items in SKILL.md');
  console.log('2. Write your description using the keyword bombing technique');
  console.log('3. Add scripts/, references/, assets/ as needed');
  console.log('4. Delete any empty resource directories you do not need');
  console.log('5. Run package_skill.mjs when ready');

  return skillDirectory;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      path: {
        type: 'string',
      },
    },
  });

  if (positionals.length !== 1 || !values.path) {
    console.log('Usage: node init_skill.mjs <skill-name> --path <path>');
    console.log();
    console.log('Skill name requirements:');
    console.log("  - Hyphen-case (e.g., 'data-analyzer')");
    console.log('  - Lowercase letters, digits, and hyphens only');
    console.log('  - Max 64 characters');
    console.log();
    console.log('Examples:');
    console.log('  node init_skill.mjs my-skill --path ./skills');
    console.log('  node init_skill.mjs code-reviewer --path /custom/location');
    process.exit(1);
  }

  const skillName = positionals[0];
  console.log(`Initializing skill: ${skillName}`);
  console.log(`Location: ${values.path}`);
  console.log();

  const result = await initSkill(skillName, values.path);
  process.exit(result ? 0 : 1);
}

if (isExecutedDirectly(import.meta.url)) {
  await main();
}
