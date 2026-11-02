import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { validateSkillReferences } from '@/scripts/ai/check-governance.mjs'

interface ReferenceIssue {
    type: string
    filePath: string
    message: string
    severity: string
}

describe('check-governance references index', () => {
    let tempRoot
    let skillFile
    let agentFile
    let referencesDir

    beforeEach(async () => {
        tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-ai-references-'))
        const skillDir = path.join(tempRoot, 'skills', 'demo')
        referencesDir = path.join(skillDir, 'references')
        await mkdir(referencesDir, { recursive: true })
        await mkdir(path.join(tempRoot, 'agents'), { recursive: true })

        skillFile = path.join(skillDir, 'SKILL.md')
        agentFile = path.join(tempRoot, 'agents', 'demo.agent.md')

        await writeFile(skillFile, [
            '# demo',
            '',
            '- [a](./references/a.md)',
            '- [c](../other/references/c.md)',
        ].join('\n'), 'utf8')
        await writeFile(agentFile, [
            '# demo agent',
            '',
            '- [b](../skills/demo/references/b.md)',
        ].join('\n'), 'utf8')
        await writeFile(path.join(referencesDir, 'a.md'), '# a\n', 'utf8')
        await writeFile(path.join(referencesDir, 'b.md'), '# b\n', 'utf8')
        await writeFile(path.join(referencesDir, 'c.md'), '# c\n', 'utf8')
    })

    afterEach(async () => {
        await rm(tempRoot, { force: true, recursive: true })
    })

    it('indexes references from the skill entry and same-name agent only', async () => {
        const issues: ReferenceIssue[] = []

        await validateSkillReferences([skillFile], [agentFile], issues)

        expect(issues).toHaveLength(1)
        expect(issues[0]).toMatchObject({
            filePath: expect.stringContaining('references/c.md'),
            type: 'unindexed-skill-reference',
        })
    })

    it('does not let another skill path index a local reference', async () => {
        await writeFile(skillFile, '# demo\n', 'utf8')
        const issues: ReferenceIssue[] = []

        await validateSkillReferences([skillFile], [], issues)

        expect(issues.map((issue) => issue.type)).toEqual([
            'unindexed-skill-reference',
            'unindexed-skill-reference',
            'unindexed-skill-reference',
        ])
    })
})
