import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    collectReferenceWarnings,
    collectScriptReferenceWarnings,
    loadExternalSkillRegistry,
    main,
    validateAgentOrDocLinks,
    validateExternalSkillRegistryDoc,
    validateSkillFile,
    validateSkillReferences,
} from '@/scripts/ai/check-governance.mjs'

interface Issue {
    type: string
    filePath: string
    message: string
    severity: string
}

interface RegistryEntry {
    id: string
    displayName: string
    sourceType: string
    sourcePath: string
    syncAddress: string
    updateCadence: string
    failurePolicy: string
    internalizationThreshold: string
    adoptedFor: string
}

let tempRoot = ''
let previousExitCode: number | undefined

function p(...segments: string[]) {
    return path.join(tempRoot, ...segments)
}

async function writeRepoFile(relativePath: string, content: string) {
    const absolutePath = p(relativePath)

    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function validSkillMarkdown(name: string, referenceNames: string[] = []) {
    return [
        '---',
        `name: ${name}`,
        `description: ${name} 的内部技能`,
        'metadata:',
        '    internal: true',
        '---',
        '',
        `# ${name}`,
        '',
        ...referenceNames.map((reference) => `- [${reference}](./references/${reference}.md)`),
        '',
    ].join('\n')
}

const validEntry: RegistryEntry = {
    id: 'demo-skill',
    displayName: 'Demo Skill',
    sourceType: 'github',
    sourcePath: 'external/demo-skill',
    syncAddress: 'https://github.com/example/demo-skill',
    updateCadence: 'monthly',
    failurePolicy: '只读快照，失败即回退上一版本',
    internalizationThreshold: '复用超过 3 次',
    adoptedFor: '文档整理',
}

function registryDocContent(entries: RegistryEntry[], overrides: Record<string, string> = {}) {
    return [
        '# 外部 skill 准入说明',
        '',
        '| id | adoptedFor | sourcePath | syncAddress | updateCadence | failurePolicy | internalizationThreshold |',
        '| --- | --- | --- | --- | --- | --- | --- |',
        ...entries.map((entry) => {
            const row = { ...entry, ...overrides }

            return `| \`${row.id}\` | ${row.adoptedFor} | \`${row.sourcePath}\` | \`${row.syncAddress}\` | ${row.updateCadence} | ${row.failurePolicy} | ${row.internalizationThreshold} |`
        }),
        '',
    ].join('\n')
}

const agentMarkdown = '# alpha\n\n- [skill](../skills/skill-a/SKILL.md)\n'

/**
 * 构造一份可完全通过校验的最小假仓库：主定义 + 三个平台镜像 + 治理文档 + 外部 skill 准入清单。
 */
async function buildCleanRepo() {
    const skillContent = validSkillMarkdown('skill-a', ['guide'])
    const referenceContent = '# guide\n'

    await writeRepoFile('.github/skills/skill-a/SKILL.md', skillContent)
    await writeRepoFile('.github/skills/skill-a/references/guide.md', referenceContent)
    await writeRepoFile('.github/agents/alpha.agent.md', agentMarkdown)

    for (const platform of ['claude', 'opencode']) {
        await writeRepoFile(`.${platform}/skills/skill-a/SKILL.md`, skillContent)
        await writeRepoFile(`.${platform}/skills/skill-a/references/guide.md`, referenceContent)
        await writeRepoFile(`.${platform}/agents/alpha.agent.md`, agentMarkdown)
    }

    await writeRepoFile('.agents/skills/skill-a/SKILL.md', skillContent)
    await writeRepoFile('.agents/skills/skill-a/references/guide.md', referenceContent)

    await writeRepoFile('.github/external-skills-registry.json', JSON.stringify([validEntry], null, 2))
    await writeRepoFile('docs/standards/external-skills-intake.md', registryDocContent([validEntry]))

    await writeRepoFile('AGENTS.md', '# AGENTS\n\n- skill-a\n- alpha.agent.md\n')
    await writeRepoFile('CLAUDE.md', '# CLAUDE\n')
    await writeRepoFile('.github/copilot-instructions.md', '# copilot\n')
    await writeRepoFile('.cursor/rules/momei-governance.mdc', '# cursor\n')
    await writeRepoFile('docs/guide/ai-development.md', '# guide\n')
    await writeRepoFile('docs/standards/ai-governance.md', '# governance\n')
    await writeRepoFile('docs/standards/development.md', '# development\n')
    await writeRepoFile('package.json', JSON.stringify({ name: 'fake-repo', private: true }, null, 2))
}

function governanceOverrides(extra: Record<string, unknown> = {}) {
    const roots = {
        githubAgents: p('.github', 'agents'),
        claudeAgents: p('.claude', 'agents'),
        githubSkills: p('.github', 'skills'),
        claudeSkills: p('.claude', 'skills'),
        opencodeAgents: p('.opencode', 'agents'),
        opencodeSkills: p('.opencode', 'skills'),
        agentsSkills: p('.agents', 'skills'),
    }

    return {
        projectRoot: tempRoot,
        roots,
        mirrorGroups: [
            { name: 'claude', agentRoot: roots.claudeAgents, skillRoot: roots.claudeSkills },
            { name: 'opencode', agentRoot: roots.opencodeAgents, skillRoot: roots.opencodeSkills },
            { name: 'agents', agentRoot: null, skillRoot: roots.agentsSkills },
        ],
        docs: [
            p('AGENTS.md'),
            p('CLAUDE.md'),
            p('.github', 'copilot-instructions.md'),
            p('.cursor', 'rules', 'momei-governance.mdc'),
            p('docs', 'guide', 'ai-development.md'),
            p('docs', 'standards', 'ai-governance.md'),
            p('docs', 'standards', 'development.md'),
        ],
        registryPath: p('.github', 'external-skills-registry.json'),
        registryDocPath: p('docs', 'standards', 'external-skills-intake.md'),
        scriptSearchRoots: [p('package.json'), p('AGENTS.md')],
        ...extra,
    }
}

function captureConsoleInfo() {
    const lines: string[] = []
    const spy = vi.spyOn(console, 'info').mockImplementation((...args: unknown[]) => {
        lines.push(args.map((arg) => String(arg)).join(' '))
    })

    return {
        lines,
        restore: () => spy.mockRestore(),
    }
}

beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), 'governance-branches-'))
    previousExitCode = process.exitCode ?? undefined
    process.exitCode = undefined
})

afterEach(async () => {
    process.exitCode = previousExitCode
    await rm(tempRoot, { force: true, recursive: true })
})

describe('validateSkillFile 校验分支', () => {
    it('缺少 frontmatter 时报告 missing-frontmatter', async () => {
        const skillFile = p('skills', 'skill-x', 'SKILL.md')

        await writeRepoFile('skills/skill-x/SKILL.md', '# no frontmatter\n')

        const issues: Issue[] = []
        await validateSkillFile(skillFile, issues, { projectRoot: tempRoot })

        expect(issues).toEqual([
            {
                type: 'missing-frontmatter',
                filePath: 'skills/skill-x/SKILL.md',
                message: '缺少 frontmatter。',
                severity: 'error',
            },
        ])
    })

    it('缺少 name 字段时报告 missing-name', async () => {
        const skillFile = p('skills', 'no-name', 'SKILL.md')

        await writeRepoFile('skills/no-name/SKILL.md', [
            '---',
            'description: 只有描述',
            'metadata:',
            '    internal: true',
            '---',
        ].join('\n'))

        const issues: Issue[] = []
        await validateSkillFile(skillFile, issues, { projectRoot: tempRoot })

        expect(issues.map((issue) => issue.type)).toEqual(['missing-name'])
        expect(issues[0]!.filePath).toBe('skills/no-name/SKILL.md')
    })

    it('缺少 description、YAML 非对象与内部声明缺失会同时报告', async () => {
        const skillFile = p('skills', 'skill-y', 'SKILL.md')

        await writeRepoFile('skills/skill-y/SKILL.md', '---\nname: [\n---\n# broken\n')

        const issues: Issue[] = []
        await validateSkillFile(skillFile, issues, { projectRoot: tempRoot })

        expect(issues.map((issue) => issue.type)).toEqual([
            'missing-description',
            'invalid-frontmatter-yaml',
            'skill-internal-mismatch',
            'skill-name-mismatch',
        ])
        expect(issues.every((issue) => issue.filePath === 'skills/skill-y/SKILL.md')).toBe(true)
    })

    it('不支持的 frontmatter 键、name 与目录名不一致都会报告', async () => {
        const skillFile = p('skills', 'target-skill', 'SKILL.md')

        await writeRepoFile('skills/target-skill/SKILL.md', [
            '---',
            'name: other-name',
            'description: 描述',
            'allowed-tools: Bash',
            '---',
            '# body',
        ].join('\n'))

        const issues: Issue[] = []
        await validateSkillFile(skillFile, issues, { projectRoot: tempRoot })

        expect(issues.map((issue) => issue.type)).toEqual([
            'unsupported-skill-frontmatter',
            'skill-internal-mismatch',
            'skill-name-mismatch',
        ])
        expect(issues[0]!.message).toContain('allowed-tools')
        expect(issues[2]!.message).toContain('other-name != target-skill')
    })

    it('metadata.internal 为 false 时报告内部声明不一致', async () => {
        const skillFile = p('skills', 'skill-z', 'SKILL.md')

        await writeRepoFile('skills/skill-z/SKILL.md', [
            '---',
            'name: skill-z',
            'description: 描述',
            'metadata:',
            '    internal: false',
            '---',
        ].join('\n'))

        const issues: Issue[] = []
        await validateSkillFile(skillFile, issues, { projectRoot: tempRoot })

        expect(issues.map((issue) => issue.type)).toEqual(['skill-internal-mismatch'])
    })

    it('合法 skill 无问题，链接锚点与失效目标分别报告', async () => {
        const validFile = p('skills', 'skill-a', 'SKILL.md')
        const linkFile = p('skills', 'skill-link', 'SKILL.md')

        await writeRepoFile('skills/skill-a/SKILL.md', validSkillMarkdown('skill-a', ['guide']))
        await writeRepoFile('skills/skill-a/references/guide.md', '# guide\n')
        await writeRepoFile('skills/skill-link/SKILL.md', [
            validSkillMarkdown('skill-link'),
            '- [ok](./references/guide.md)',
            '- [anchor](./references/guide.md#sec)',
            '- [missing](./references/none.md)',
            '- [external](https://example.com/x.md)',
            '- [hash](#section)',
            '- [blank](   )',
        ].join('\n'))
        await writeRepoFile('skills/skill-link/references/guide.md', '# guide\n')

        const validIssues: Issue[] = []
        await validateSkillFile(validFile, validIssues, { projectRoot: tempRoot })
        expect(validIssues).toEqual([])

        const linkIssues: Issue[] = []
        await validateSkillFile(linkFile, linkIssues, { projectRoot: tempRoot })

        expect(linkIssues.map((issue) => issue.type)).toEqual([
            'skill-anchor-link',
            'missing-link-target',
        ])
        expect(linkIssues[0]!.message).toContain('./references/guide.md#sec')
        expect(linkIssues[1]!.message).toContain('./references/none.md')
    })
})

describe('validateSkillReferences 边界分支', () => {
    it('缺少 references 目录与 references 为空时都不产出 issue', async () => {
        await writeRepoFile('skills/without-refs/SKILL.md', validSkillMarkdown('without-refs'))
        await writeRepoFile('skills/empty-refs/SKILL.md', validSkillMarkdown('empty-refs'))
        await mkdir(p('skills', 'empty-refs', 'references'), { recursive: true })

        const issues: Issue[] = []
        await validateSkillReferences(
            [p('skills', 'without-refs', 'SKILL.md'), p('skills', 'empty-refs', 'SKILL.md')],
            [],
            issues,
            { projectRoot: tempRoot },
        )

        expect(issues).toEqual([])
    })

    it('未被同名 agent 或入口索引的 references 报告相对路径', async () => {
        await writeRepoFile('skills/skill-a/SKILL.md', validSkillMarkdown('skill-a'))
        await writeRepoFile('skills/skill-a/references/orphan.md', '# orphan\n')
        await writeRepoFile('agents/skill-a.agent.md', '# agent without links\n')

        const issues: Issue[] = []
        await validateSkillReferences(
            [p('skills', 'skill-a', 'SKILL.md')],
            [p('agents', 'skill-a.agent.md')],
            issues,
            { projectRoot: tempRoot },
        )

        expect(issues.map((issue) => issue.type)).toEqual(['unindexed-skill-reference'])
        expect(issues[0]!.filePath).toBe('skills/skill-a/references/orphan.md')
    })
})

describe('loadExternalSkillRegistry 校验分支', () => {
    it('清单缺失时报告 missing-external-skill-registry', async () => {
        const issues: Issue[] = []
        const entries = await loadExternalSkillRegistry(issues, {
            projectRoot: tempRoot,
            registryPath: p('.github', 'external-skills-registry.json'),
        })

        expect(entries).toEqual([])
        expect(issues.map((issue) => issue.type)).toEqual(['missing-external-skill-registry'])
        expect(issues[0]!.filePath).toBe('.github/external-skills-registry.json')
    })

    it('非法 JSON 与非数组结构都报告 invalid-external-skill-registry', async () => {
        const registryPath = p('.github', 'external-skills-registry.json')

        await writeRepoFile('.github/external-skills-registry.json', 'not json')
        const invalidJsonIssues: Issue[] = []
        await loadExternalSkillRegistry(invalidJsonIssues, { projectRoot: tempRoot, registryPath })
        expect(invalidJsonIssues.map((issue) => issue.type)).toEqual(['invalid-external-skill-registry'])
        expect(invalidJsonIssues[0]!.message).toContain('不是合法 JSON')

        await writeRepoFile('.github/external-skills-registry.json', JSON.stringify({ id: 'demo-skill' }))
        const nonArrayIssues: Issue[] = []
        await loadExternalSkillRegistry(nonArrayIssues, { projectRoot: tempRoot, registryPath })
        expect(nonArrayIssues.map((issue) => issue.type)).toEqual(['invalid-external-skill-registry'])
        expect(nonArrayIssues[0]!.message).toContain('必须是数组')
    })

    it('非对象条目、缺字段、重复 id 与内部路径都报告，并返回原始数组', async () => {
        const registryPath = p('.github', 'external-skills-registry.json')

        await writeRepoFile('.github/external-skills-registry.json', JSON.stringify([
            null,
            { id: 'only-id' },
            { ...validEntry, id: 'dup-skill' },
            { ...validEntry, id: 'dup-skill' },
            { ...validEntry, id: 'local-skill', sourcePath: '.github/skills/skill-a' },
            validEntry,
        ]))

        const issues: Issue[] = []
        const entries = await loadExternalSkillRegistry(issues, { projectRoot: tempRoot, registryPath })
        const types = new Set(issues.map((issue) => issue.type))

        expect(entries).toHaveLength(6)
        expect(types).toEqual(new Set([
            'invalid-external-skill-entry',
            'duplicate-external-skill-id',
            'invalid-external-skill-source',
        ]))
        expect(issues.some((issue) => issue.message.includes('缺少必填字段: displayName'))).toBe(true)
        expect(issues.some((issue) => issue.message.includes('外部 skill 条目重复: dup-skill'))).toBe(true)
        expect(issues.some((issue) => issue.message.includes('.github/skills/skill-a'))).toBe(true)
        expect(issues.every((issue) => issue.filePath === '.github/external-skills-registry.json')).toBe(true)
    })

    it('合法清单返回条目且不产生 issue', async () => {
        const registryPath = p('.github', 'external-skills-registry.json')

        await writeRepoFile('.github/external-skills-registry.json', JSON.stringify([validEntry]))

        const issues: Issue[] = []
        const entries = await loadExternalSkillRegistry(issues, { projectRoot: tempRoot, registryPath })

        expect(issues).toEqual([])
        expect(entries).toEqual([validEntry])
    })
})

describe('validateExternalSkillRegistryDoc 校验分支', () => {
    it('文档缺失时报告 missing-external-skill-doc', async () => {
        const issues: Issue[] = []
        await validateExternalSkillRegistryDoc([], issues, {
            projectRoot: tempRoot,
            docPath: p('docs', 'standards', 'external-skills-intake.md'),
        })

        expect(issues.map((issue) => issue.type)).toEqual(['missing-external-skill-doc'])
        expect(issues[0]!.filePath).toBe('docs/standards/external-skills-intake.md')
    })

    it('文档与事实源一致时不产生 issue', async () => {
        await writeRepoFile('docs/standards/external-skills-intake.md', registryDocContent([validEntry]))

        const issues: Issue[] = []
        await validateExternalSkillRegistryDoc([validEntry], issues, {
            projectRoot: tempRoot,
            docPath: p('docs', 'standards', 'external-skills-intake.md'),
        })

        expect(issues).toEqual([])
    })

    it('重复条目与未登记条目都报告 external-skill-doc-drift', async () => {
        await writeRepoFile('docs/standards/external-skills-intake.md', [
            registryDocContent([validEntry]),
            `| \`${validEntry.id}\` | ${validEntry.adoptedFor} | \`${validEntry.sourcePath}\` | \`${validEntry.syncAddress}\` | ${validEntry.updateCadence} | ${validEntry.failurePolicy} | ${validEntry.internalizationThreshold} |`,
            '| `ghost-skill` | 未登记用途 | `external/ghost` | `https://example.com/ghost` | yearly | 失败即停用 | 一次即内化 |',
            '',
        ].join('\n'))

        const issues: Issue[] = []
        await validateExternalSkillRegistryDoc([validEntry], issues, {
            projectRoot: tempRoot,
            docPath: p('docs', 'standards', 'external-skills-intake.md'),
        })

        expect(issues.map((issue) => issue.type)).toEqual([
            'external-skill-doc-drift',
            'external-skill-doc-drift',
        ])
        expect(issues[0]!.message).toContain(`文档存在重复外部 skill 条目: ${validEntry.id}`)
        expect(issues[1]!.message).toContain('文档存在未登记到事实源的外部 skill 条目: ghost-skill')
    })

    it('文档缺条目与字段不一致都报告 external-skill-doc-drift', async () => {
        await writeRepoFile('docs/standards/external-skills-intake.md', registryDocContent([validEntry], {
            adoptedFor: '其他用途',
        }))

        const otherEntry: RegistryEntry = { ...validEntry, id: 'second-skill' }

        const issues: Issue[] = []
        await validateExternalSkillRegistryDoc([validEntry, otherEntry], issues, {
            projectRoot: tempRoot,
            docPath: p('docs', 'standards', 'external-skills-intake.md'),
        })

        expect(issues.map((issue) => issue.message)).toEqual([
            expect.stringContaining('文档与事实源不一致: demo-skill -> adoptedFor'),
            expect.stringContaining('文档缺少外部 skill 条目: second-skill'),
        ])
    })
})

describe('validateAgentOrDocLinks 校验分支', () => {
    it('过滤外部链接与纯锚点，并报告缺失目标', async () => {
        await writeRepoFile('docs/standards/development.md', '# development\n')
        await writeRepoFile('agents/beta.agent.md', [
            '# beta',
            '- [ok](../docs/standards/development.md)',
            '- [external](https://example.com/missing.md)',
            '- [hash](#local)',
            '- [blank](   )',
            '- [dead](../docs/standards/missing.md)',
        ].join('\n'))

        const issues: Issue[] = []
        await validateAgentOrDocLinks(p('agents', 'beta.agent.md'), issues, { projectRoot: tempRoot })

        expect(issues.map((issue) => issue.type)).toEqual(['missing-link-target'])
        expect(issues[0]!.filePath).toBe('agents/beta.agent.md')
        expect(issues[0]!.message).toContain('../docs/standards/missing.md')
    })
})

describe('collectReferenceWarnings 校验分支', () => {
    it('未被其他治理文件提及的 skill 与 agent 产出 warning', async () => {
        await writeRepoFile('AGENTS.md', '# AGENTS\n\n- linked-skill\n- gamma.agent.md\n')
        await writeRepoFile('skills/linked-skill/SKILL.md', validSkillMarkdown('linked-skill'))
        await writeRepoFile('skills/lonely-skill/SKILL.md', validSkillMarkdown('lonely-skill'))
        await writeRepoFile('agents/gamma.agent.md', '# gamma\n')
        await writeRepoFile('agents/beta.agent.md', '# beta\n')

        const warnings = await collectReferenceWarnings(
            [p('skills', 'linked-skill', 'SKILL.md'), p('skills', 'lonely-skill', 'SKILL.md')],
            [p('agents', 'gamma.agent.md'), p('agents', 'beta.agent.md')],
            { projectRoot: tempRoot, docs: [p('AGENTS.md')] },
        )

        expect(warnings).toEqual([
            expect.objectContaining({
                type: 'unreferenced-skill',
                filePath: 'skills/lonely-skill/SKILL.md',
                severity: 'warning',
            }),
            expect.objectContaining({
                type: 'unreferenced-agent',
                filePath: 'agents/beta.agent.md',
                severity: 'warning',
            }),
        ])
    })

    it('全部被引用时不产出 warning', async () => {
        await writeRepoFile('AGENTS.md', '# AGENTS\n\n- only-skill\n- only.agent.md\n')
        await writeRepoFile('skills/only-skill/SKILL.md', validSkillMarkdown('only-skill'))
        await writeRepoFile('agents/only.agent.md', '# only\n')

        const warnings = await collectReferenceWarnings(
            [p('skills', 'only-skill', 'SKILL.md')],
            [p('agents', 'only.agent.md')],
            { projectRoot: tempRoot, docs: [p('AGENTS.md')] },
        )

        expect(warnings).toEqual([])
    })
})

describe('collectScriptReferenceWarnings 校验分支', () => {
    it('把脚本治理 finding 映射为 issue，并只保留被跟踪的脚本', async () => {
        await writeRepoFile('package.json', JSON.stringify({
            scripts: {
                'check:local': 'node scripts/local/stable.mjs',
            },
        }, null, 2))
        await writeRepoFile('scripts/temp/one-off.mjs', 'export {}\n')
        await writeRepoFile('scripts/local/stable.mjs', 'export {}\n')
        await writeRepoFile('scripts/local/untracked.mjs', 'export {}\n')

        const issues = await collectScriptReferenceWarnings(
            [p('scripts', 'temp', 'one-off.mjs'), p('scripts', 'local', 'stable.mjs')],
            { projectRoot: tempRoot, searchRoots: [p('package.json')] },
        )

        expect(issues).toEqual([
            expect.objectContaining({
                type: 'temporary-script-residue',
                filePath: 'scripts/temp/one-off.mjs',
                severity: 'warning',
            }),
        ])
    })
})

describe('main 全流程分支', () => {
    it('干净的假仓库整体通过', async () => {
        await buildCleanRepo()

        const output = captureConsoleInfo()

        try {
            await main(governanceOverrides())
        } finally {
            output.restore()
        }

        const text = output.lines.join('\n')

        expect(text).toContain('AI governance check passed.')
        expect(text).toContain('问题清单:')
        expect(text).toContain('- 无')
        expect(text).not.toContain('可延后事项:\n- [')
        expect(process.exitCode).not.toBe(1)
    })

    it('存在阻断问题时输出建议、清单并设置失败退出码', async () => {
        await buildCleanRepo()

        await writeRepoFile('.github/skills/skill-bad/SKILL.md', [
            '---',
            'name: skill-other',
            'description: 坏技能',
            'allowed-tools: Bash',
            '---',
            '# bad',
            '- [anchor](./missing.md#section)',
            '- [dead](./missing.md)',
        ].join('\n'))
        await writeRepoFile('.github/skills/skill-a/references/orphan.md', '# orphan\n')
        await writeRepoFile('AGENTS.md', '# AGENTS\n\n- skill-a\n- alpha.agent.md\n- [dead](./missing-doc.md)\n')
        await writeRepoFile('.github/external-skills-registry.json', 'not json')
        await writeRepoFile('scripts/local/orphan.mjs', 'export {}\n')

        await writeFile(p('.claude', 'skills', 'skill-a', 'SKILL.md'), '# drifted\n', 'utf8')
        await writeFile(p('.claude', 'skills', 'extra.md'), '# extra\n', 'utf8')
        await mkdir(p('.claude', 'skills', 'ghost'), { recursive: true })
        await writeFile(p('.claude', 'agents', 'extra.agent.md'), '# extra agent\n', 'utf8')
        await mkdir(p('.claude', 'agents', 'ghost-agent'), { recursive: true })
        await rm(p('.claude', 'agents', 'alpha.agent.md'))

        const output = captureConsoleInfo()

        try {
            await main(governanceOverrides())
        } finally {
            output.restore()
        }

        const text = output.lines.join('\n')

        expect(text).toContain('AI governance check failed.')
        expect(text).toContain('[unsupported-skill-frontmatter] .github/skills/skill-bad/SKILL.md')
        expect(text).toContain('[skill-anchor-link] .github/skills/skill-bad/SKILL.md')
        expect(text).toContain('[missing-link-target] .github/skills/skill-bad/SKILL.md')
        expect(text).toContain('[unindexed-skill-reference] .github/skills/skill-a/references/orphan.md')
        expect(text).toContain('[invalid-external-skill-registry] .github/external-skills-registry.json')
        expect(text).toContain('[mirror-drift] .github/skills/skill-a/SKILL.md')
        expect(text).toContain('[extra-mirror-directory] .claude/skills/ghost')
        expect(text).toContain('[extra-mirror-file] .claude/agents/extra.agent.md')
        expect(text).toContain('[extra-mirror-directory] .claude/agents/ghost-agent')
        expect(text).toContain('[missing-mirror-file] .github/agents/alpha.agent.md')
        expect(text).toContain('[unreferenced-script] scripts/local/orphan.mjs')
        expect(text).toContain('修复建议:')
        expect(text).toContain('以 .github 作为主定义')
        expect(process.exitCode).toBe(1)
    })
})
