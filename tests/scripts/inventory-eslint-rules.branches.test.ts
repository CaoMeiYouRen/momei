import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DEFAULT_BASELINE_PATH,
    DEFAULT_OUTPUT_PATH,
    buildDirectoryBuckets,
    collectCandidateRuleTable,
    collectEslintRulesInventory,
    collectExplicitExemptions,
    collectExplicitExemptionsFromContent,
    collectRuleInventory,
    collectSourceFiles,
    computeLineNumber,
    evaluateBaselineDelta,
    isIgnoredByPatterns,
    loadJsonIfExists,
    main,
    normalizeRuleMessages,
    normalizeSeverity,
    parseArgs,
    pathExists,
    renderMarkdownReport,
    resolveConfiguredSeverities,
    resolveMarkdownPath,
    toPosixPath,
    unique,
    uniqueBy,
    writeArtifacts,
} from '../../scripts/governance/inventory-eslint-rules.mjs'
import { DISABLED_TS_RULES, ESLINT_DEBT_RULE_SLICES } from '../../scripts/governance/eslint-debt-targets.mjs'

// mjs 的 JSDoc 推断把 artifactPath 收窄为 null | undefined，测试需传入字符串覆盖产物路径分支。
const renderReport = renderMarkdownReport as (report: unknown, artifactPath?: string | null) => string

interface FakeLintMessage {
    column?: number | null
    line?: number | null
    message: string
    ruleId?: string | null
    severity?: number
}

interface FakeLintResult {
    fatalErrorCount?: number
    filePath: string
    messages: FakeLintMessage[]
}

interface FakeEslintOptions {
    overrideConfig?: unknown
}

const eslintMock = vi.hoisted(() => {
    interface HoistedConfig {
        rules?: Record<string, unknown>
    }

    const state = {
        calculateConfigForFile: async (_filePath: string): Promise<HoistedConfig> => ({ rules: {} }),
        configCalls: [] as string[],
        lintCalls: [] as { options: { overrideConfig?: unknown }, patterns: string[] }[],
        lintFiles: async (_patterns: string[], _options: { overrideConfig?: unknown }): Promise<FakeLintResult[]> => [],
        reset() {
            state.configCalls = []
            state.lintCalls = []
            state.calculateConfigForFile = async () => ({ rules: {} })
            state.lintFiles = async () => []
        },
    }

    return state
})

// 只替换 ESLint 类，保留 eslint 包的其余导出，避免影响 typescript-eslint 的运行时依赖。
vi.mock('eslint', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()

    return {
        ...actual,
        ESLint: class FakeESLint {
            options: FakeEslintOptions

            constructor(options: FakeEslintOptions = {}) {
                this.options = options
            }

            async calculateConfigForFile(filePath: string) {
                eslintMock.configCalls.push(filePath)
                return eslintMock.calculateConfigForFile(filePath)
            }

            async lintFiles(patterns: string[]) {
                eslintMock.lintCalls.push({ options: this.options, patterns })
                return eslintMock.lintFiles(patterns, this.options)
            }
        },
    }
})

async function withTempDir(run: (root: string) => Promise<void>) {
    const root = await mkdtemp(path.join(tmpdir(), 'eslint-rules-branches-'))

    try {
        await run(root)
    } finally {
        await rm(root, { force: true, recursive: true })
    }
}

async function writeProjectFile(root: string, relativePath: string, content: string) {
    const absolutePath = path.join(root, relativePath)

    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')

    return absolutePath
}

function createReportFixture() {
    return {
        baseline: {
            delta: {
                hasBaseline: true,
                rules: [{ previousWarningCount: 1, ruleId: '@typescript-eslint/no-explicit-any', warningCountDelta: 1 }],
            },
            exists: true,
            path: 'baseline.json',
        },
        candidateRules: [
            { configuredSeverity: 0, directoryBuckets: [], effectiveSeverity: 0, filesWithHits: 2, hitCount: 3, isCandidate: true, ruleId: '@typescript-eslint/no-extraneous-class', scope: 'no-extraneous-class', topDirectory: null },
            { configuredSeverity: 1, directoryBuckets: [], effectiveSeverity: 2, filesWithHits: 1, hitCount: 1, isCandidate: false, ruleId: '@typescript-eslint/no-unnecessary-condition', scope: 'no-unnecessary-condition', topDirectory: 'types' },
        ],
        generatedAt: '2026-11-15T00:00:00.000Z',
        rules: [
            {
                configuredSeverity: 0,
                directoryBuckets: [{ clearedCount: 1, directory: 'types', hitCount: 2, warningBaseline: 2 }],
                effectiveSeverity: 0,
                explicitExemptionCount: 1,
                explicitExemptions: [{ filePath: 'types/a.ts', line: 9, text: 'eslint-disable-next-line @typescript-eslint/no-explicit-any' }],
                filesWithWarnings: 1,
                residualWarnings: [
                    { column: 5, filePath: 'types/a.ts', line: 3, message: 'first', severity: 'error' },
                    { column: 7, filePath: 'types/a.ts', line: 4, message: 'second', severity: 'warning' },
                ],
                ruleId: '@typescript-eslint/no-explicit-any',
                scope: 'no-explicit-any',
                warningCount: 2,
            },
            { configuredSeverity: 0, directoryBuckets: [], effectiveSeverity: 0, explicitExemptionCount: 0, explicitExemptions: [], filesWithWarnings: 0, residualWarnings: [], ruleId: '@typescript-eslint/ban-ts-comment', scope: 'ban-ts-comment', warningCount: 0 },
        ],
        summary: { candidateRuleCount: 1, explicitExemptionCount: 1, filesWithWarnings: 1, ruleCount: 2, warningCount: 2 },
    }
}

beforeEach(() => {
    eslintMock.reset()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('inventory-eslint-rules - parseArgs', () => {
    it('无参数时套用默认 baseline / output', () => {
        expect(parseArgs([])).toEqual({
            baseline: DEFAULT_BASELINE_PATH,
            output: DEFAULT_OUTPUT_PATH,
        })
    })

    it('--baseline / --output 覆盖默认值', () => {
        expect(parseArgs(['--baseline=custom/baseline.json', '--output=artifacts/out.json'])).toEqual({
            baseline: 'custom/baseline.json',
            output: 'artifacts/out.json',
        })
    })

    it('带 node / script 前缀的 argv 会跳过前两项，未提供的选项保留默认值', () => {
        expect(parseArgs(['node', 'scripts/governance/inventory-eslint-rules.mjs', '--output=cli.json'])).toEqual({
            baseline: DEFAULT_BASELINE_PATH,
            output: 'cli.json',
        })
    })

    it('缺少取值或未知参数时抛错', () => {
        expect(() => parseArgs(['--baseline'])).toThrow('Unsupported argument: --baseline')
        expect(() => parseArgs(['node', 'script.mjs', '--baseline=a.json', 'plain-value']))
            .toThrow('Unsupported argument: plain-value')
    })
})

describe('inventory-eslint-rules - pathExists / toPosixPath', () => {
    it('pathExists 区分存在与不存在的路径', async () => {
        await withTempDir(async (root) => {
            const filePath = await writeProjectFile(root, 'types/a.ts', 'export {}\n')

            await expect(pathExists(filePath)).resolves.toBe(true)
            await expect(pathExists(root)).resolves.toBe(true)
            await expect(pathExists(path.join(root, 'missing'))).resolves.toBe(false)
        })
    })

    it('toPosixPath 转为相对 posix 路径，root 自身回落为 "."', async () => {
        await withTempDir(async (root) => {
            expect(toPosixPath(path.join(root, 'types', 'a.ts'), root)).toBe('types/a.ts')
            expect(toPosixPath(root, root)).toBe('.')
            expect(toPosixPath(path.join(root, 'dir\\file.ts'), root)).toBe('dir/file.ts')
        })
    })
})

describe('inventory-eslint-rules - normalizeSeverity 兜底', () => {
    it('未知字符串级别按 0 处理', () => {
        expect(normalizeSeverity('unknown-level')).toBe(0)
        expect(normalizeSeverity([null])).toBe(0)
    })
})

describe('inventory-eslint-rules - collectSourceFiles', () => {
    it('递归收集受支持的源码扩展名并排序', async () => {
        await withTempDir(async (root) => {
            const tsFile = await writeProjectFile(root, 'types/b.ts', 'export {}\n')
            const vueFile = await writeProjectFile(root, 'components/a.vue', '<template />\n')
            const jsFile = await writeProjectFile(root, 'utils/c.js', 'export {}\n')
            const mjsFile = await writeProjectFile(root, 'utils/d.mjs', 'export {}\n')
            const cjsFile = await writeProjectFile(root, 'utils/e.cjs', 'export {}\n')
            const tsxFile = await writeProjectFile(root, 'utils/f.tsx', 'export {}\n')
            await writeProjectFile(root, 'utils/nested/g.ts', 'export {}\n')
            await writeProjectFile(root, 'utils/readme.md', '# docs\n')
            await writeProjectFile(root, 'utils/data.json', '{}\n')

            const files = await collectSourceFiles(root)
            const relativeFiles = files.map((filePath: string) => toPosixPath(filePath, root))

            expect(relativeFiles).toEqual([
                'components/a.vue',
                'types/b.ts',
                'utils/c.js',
                'utils/d.mjs',
                'utils/e.cjs',
                'utils/f.tsx',
                'utils/nested/g.ts',
            ])
            expect(files).toEqual([...files].sort())
            for (const expected of [tsFile, vueFile, jsFile, mjsFile, cjsFile, tsxFile]) {
                expect(files).toContain(expected)
            }
        })
    })

    it('不存在的路径返回空数组', async () => {
        await withTempDir(async (root) => {
            await expect(collectSourceFiles(path.join(root, 'missing'))).resolves.toEqual([])
        })
    })

    it('单文件路径：受支持扩展名原样返回，其它扩展名返回空数组', async () => {
        await withTempDir(async (root) => {
            const tsFile = await writeProjectFile(root, 'types/single.ts', 'export {}\n')
            const mdFile = await writeProjectFile(root, 'types/notes.md', '# notes\n')

            await expect(collectSourceFiles(tsFile)).resolves.toEqual([tsFile])
            await expect(collectSourceFiles(mdFile)).resolves.toEqual([])
        })
    })
})

describe('inventory-eslint-rules - unique / uniqueBy / computeLineNumber', () => {
    it('unique 去重并排序，空输入返回空数组', () => {
        expect(unique(['b', 'a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
        expect(unique([])).toEqual([])
    })

    it('uniqueBy 按 key 保留首次出现顺序，空输入返回空数组', () => {
        const items = [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 1, name: 'c' },
        ]

        expect(uniqueBy(items, (item) => item.id)).toEqual([
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
        ])
        expect(uniqueBy([], (item) => item)).toEqual([])
    })

    it('computeLineNumber 按索引换算 1 基行号', () => {
        const content = 'line-1\nline-2\nline-3'

        expect(computeLineNumber(content, 0)).toBe(1)
        expect(computeLineNumber(content, content.indexOf('line-2'))).toBe(2)
        expect(computeLineNumber(content, content.indexOf('line-3'))).toBe(3)
    })
})

describe('inventory-eslint-rules - collectExplicitExemptionsFromContent', () => {
    const ruleId = '@typescript-eslint/no-explicit-any'

    it('识别 disable / disable-next-line / disable-line 且只保留命中规则', () => {
        const content = [
            '/* eslint-disable @typescript-eslint/no-explicit-any, no-console */',
            'const a = 1',
            '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
            'const b = 2 // eslint-disable-line no-unused-vars',
        ].join('\n')

        expect(collectExplicitExemptionsFromContent(content, ruleId)).toEqual([
            {
                line: 1,
                text: 'eslint-disable @typescript-eslint/no-explicit-any, no-console',
            },
            {
                line: 3,
                text: 'eslint-disable-next-line @typescript-eslint/no-explicit-any',
            },
        ])
    })

    it('命中 disable-line 形态，未命中时返回空数组', () => {
        const content = 'const c = 3 // eslint-disable-line @typescript-eslint/no-explicit-any'

        expect(collectExplicitExemptionsFromContent(content, ruleId)).toEqual([
            { line: 1, text: 'eslint-disable-line @typescript-eslint/no-explicit-any' },
        ])
        expect(collectExplicitExemptionsFromContent('const d = 4', ruleId)).toEqual([])
        expect(collectExplicitExemptionsFromContent('const e = 5 // eslint-disable-line no-console', ruleId)).toEqual([])
    })
})

describe('inventory-eslint-rules - normalizeRuleMessages', () => {
    it('只保留目标规则、归一化严重度并转换相对路径', async () => {
        await withTempDir(async (root) => {
            const results = [
                {
                    filePath: path.join(root, 'types', 'a.ts'),
                    messages: [
                        { column: 5, line: 3, message: 'first', ruleId: 'rule-a', severity: 2 },
                        { column: null, line: null, message: 'second', ruleId: 'rule-a', severity: 1 },
                        { column: 1, line: 1, message: 'other', ruleId: 'rule-b', severity: 2 },
                    ],
                },
                { filePath: path.join(root, 'types', 'b.ts'), messages: [] },
            ]

            expect(normalizeRuleMessages(results, 'rule-a', root)).toEqual([
                { column: 5, filePath: 'types/a.ts', line: 3, message: 'first', severity: 'error' },
                { column: 0, filePath: 'types/a.ts', line: 0, message: 'second', severity: 'warning' },
            ])
            expect(normalizeRuleMessages(results, 'rule-missing', root)).toEqual([])
        })
    })
})

describe('inventory-eslint-rules - buildDirectoryBuckets', () => {
    it('按目录聚合，count 降序、同 count 按目录名排序', () => {
        expect(buildDirectoryBuckets([
            { filePath: 'types/a.ts' },
            { filePath: 'types/b.ts' },
            { filePath: 'utils/c.ts' },
            { filePath: 'a.ts' },
        ])).toEqual([
            { count: 2, directory: 'types' },
            { count: 1, directory: '.' },
            { count: 1, directory: 'utils' },
        ])
        expect(buildDirectoryBuckets([])).toEqual([])
    })
})

describe('inventory-eslint-rules - isIgnoredByPatterns', () => {
    it('按 glob 判定忽略，空模式表不忽略', () => {
        const patterns = ['tests/**', '**/*.spec.ts']

        expect(isIgnoredByPatterns('tests/a.ts', patterns)).toBe(true)
        expect(isIgnoredByPatterns('types/a.spec.ts', patterns)).toBe(true)
        expect(isIgnoredByPatterns('types/a.ts', patterns)).toBe(false)
        expect(isIgnoredByPatterns('types/a.ts', [])).toBe(false)
    })
})

describe('inventory-eslint-rules - resolveConfiguredSeverities', () => {
    it('优先取 .test.ts 样本文件，归一化数组 / 字符串 / 数字配置', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/plain.ts', 'export {}\n')
            const sampleFile = await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')
            const calculateConfigForFile = vi.fn(async () => ({
                rules: {
                    '@typescript-eslint/no-explicit-any': [2],
                    '@typescript-eslint/no-inferrable-types': 'warn',
                    '@typescript-eslint/explicit-function-return-type': 'off',
                    '@typescript-eslint/prefer-nullish-coalescing': 1,
                },
            }))
            const severities = await resolveConfiguredSeverities({ calculateConfigForFile }, root)

            expect(calculateConfigForFile).toHaveBeenCalledWith(sampleFile)
            expect(severities.size).toBe(DISABLED_TS_RULES.length)
            expect(severities.get('@typescript-eslint/no-explicit-any')).toBe(2)
            expect(severities.get('@typescript-eslint/no-inferrable-types')).toBe(1)
            expect(severities.get('@typescript-eslint/explicit-function-return-type')).toBe(0)
            expect(severities.get('@typescript-eslint/prefer-nullish-coalescing')).toBe(1)
            expect(severities.get('@typescript-eslint/no-unnecessary-condition')).toBe(0)
        })
    })

    it('没有 .test.ts 时回落到首个源码文件', async () => {
        await withTempDir(async (root) => {
            const plainFile = await writeProjectFile(root, 'tests/plain.ts', 'export {}\n')
            const calculateConfigForFile = vi.fn(async () => ({}))

            await resolveConfiguredSeverities({ calculateConfigForFile }, root)

            expect(calculateConfigForFile).toHaveBeenCalledWith(plainFile)
        })
    })

    it('tests 作用域为空时全部按 0 处理且不调用 ESLint', async () => {
        await withTempDir(async (root) => {
            const calculateConfigForFile = vi.fn(async () => ({}))

            const severities = await resolveConfiguredSeverities({ calculateConfigForFile }, root)

            expect(calculateConfigForFile).not.toHaveBeenCalled()
            expect([...severities.values()].every((value) => value === 0)).toBe(true)
        })
    })
})

describe('inventory-eslint-rules - collectCandidateRuleTable', () => {
    it('汇总 configured / effective 严重度、命中数与目录分布', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')
            const typeFile = await writeProjectFile(root, 'types/a.ts', 'export {}\n')
            const utilFile = await writeProjectFile(root, 'utils/b.ts', 'export {}\n')

            eslintMock.calculateConfigForFile = async (filePath) => {
                if (filePath.endsWith(path.join('tests', 'sample.test.ts'))) {
                    return { rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-inferrable-types': 'error' } }
                }

                if (filePath === typeFile) {
                    return { rules: { '@typescript-eslint/no-explicit-any': 1, '@typescript-eslint/no-unnecessary-condition': 'warn' } }
                }

                if (filePath === utilFile) {
                    return { rules: { '@typescript-eslint/no-explicit-any': [2] } }
                }

                return { rules: {} }
            }
            eslintMock.lintFiles = async (_patterns, options) => {
                if (!options.overrideConfig) {
                    return []
                }

                return [
                    {
                        fatalErrorCount: 0,
                        filePath: typeFile,
                        messages: [
                            { column: 5, line: 3, message: 'first', ruleId: '@typescript-eslint/no-explicit-any' },
                            { column: null, line: 9, message: 'second', ruleId: '@typescript-eslint/no-explicit-any' },
                            { line: 1, message: 'other rule', ruleId: '@typescript-eslint/no-unnecessary-condition' },
                            { line: 1, message: 'no rule id', ruleId: null },
                        ],
                    },
                    {
                        fatalErrorCount: 0,
                        filePath: utilFile,
                        messages: [
                            { column: 2, line: 1, message: 'third', ruleId: '@typescript-eslint/no-explicit-any' },
                            { column: 3, line: 2, message: 'non-candidate', ruleId: 'no-console' },
                        ],
                    },
                ]
            }

            const table = await collectCandidateRuleTable(root)
            const byRule = new Map(table.map((rule: { ruleId: string }) => [rule.ruleId, rule]))

            expect(table).toHaveLength(DISABLED_TS_RULES.length)
            expect(byRule.get('@typescript-eslint/no-explicit-any')).toEqual({
                configuredSeverity: 0,
                directoryBuckets: [
                    { directory: 'types', hitCount: 2 },
                    { directory: 'utils', hitCount: 1 },
                ],
                effectiveSeverity: 2,
                filesWithHits: 2,
                hitCount: 3,
                isCandidate: false,
                ruleId: '@typescript-eslint/no-explicit-any',
                scope: 'no-explicit-any',
                topDirectory: 'types',
            })
            expect(byRule.get('@typescript-eslint/no-inferrable-types')).toMatchObject({
                configuredSeverity: 2,
                effectiveSeverity: 0,
                hitCount: 0,
                isCandidate: false,
                topDirectory: null,
            })
            expect(byRule.get('@typescript-eslint/no-unnecessary-condition')).toMatchObject({
                configuredSeverity: 0,
                effectiveSeverity: 1,
                hitCount: 1,
                isCandidate: false,
            })
            expect(byRule.get('@typescript-eslint/no-extraneous-class')).toMatchObject({
                configuredSeverity: 0,
                effectiveSeverity: 0,
                hitCount: 0,
                isCandidate: true,
                topDirectory: null,
            })
            expect(eslintMock.lintCalls.some((call) => Boolean(call.options.overrideConfig))).toBe(true)
        })
    })

    it('出现解析失败文件时拒绝输出报告', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')
            const typeFile = await writeProjectFile(root, 'types/broken.ts', 'export {\n')

            eslintMock.lintFiles = async (_patterns, options) => (options.overrideConfig
                ? [{ fatalErrorCount: 1, filePath: typeFile, messages: [] }]
                : [])

            await expect(collectCandidateRuleTable(root))
                .rejects.toThrow('候选规则扫描出现 1 个解析失败文件（首个: types/broken.ts）')
        })
    })
})

describe('inventory-eslint-rules - evaluateBaselineDelta', () => {
    it('缺少 baseline 或 rules 非数组时标记 hasBaseline=false', () => {
        expect(evaluateBaselineDelta({ rules: [] }, null)).toEqual({ hasBaseline: false, rules: [] })
        expect(evaluateBaselineDelta({ rules: [] }, { rules: 'invalid' })).toEqual({ hasBaseline: false, rules: [] })
    })

    it('按 ruleId 计算正负与缺省 delta', () => {
        const report = {
            rules: [
                { ruleId: 'rule-a', warningCount: 5 },
                { ruleId: 'rule-b', warningCount: 1 },
                { ruleId: 'rule-c', warningCount: 0 },
            ],
        }
        const baseline = {
            rules: [
                { ruleId: 'rule-a', warningCount: 2 },
                { ruleId: 'rule-b', warningCount: 4 },
            ],
        }

        expect(evaluateBaselineDelta(report, baseline)).toEqual({
            hasBaseline: true,
            rules: [
                { previousWarningCount: 2, ruleId: 'rule-a', warningCountDelta: 3 },
                { previousWarningCount: 4, ruleId: 'rule-b', warningCountDelta: -3 },
                { previousWarningCount: 0, ruleId: 'rule-c', warningCountDelta: 0 },
            ],
        })
    })
})

describe('inventory-eslint-rules - loadJsonIfExists', () => {
    it('读取存在的 JSON，缺失文件返回 null', async () => {
        await withTempDir(async (root) => {
            const filePath = await writeProjectFile(root, 'baseline.json', JSON.stringify({ rules: [{ ruleId: 'rule-a' }] }))

            await expect(loadJsonIfExists(filePath)).resolves.toEqual({ rules: [{ ruleId: 'rule-a' }] })
            await expect(loadJsonIfExists(path.join(root, 'missing.json'))).resolves.toBeNull()
        })
    })

    it('非法 JSON 与非 ENOENT 错误原样抛出', async () => {
        await withTempDir(async (root) => {
            const invalidPath = await writeProjectFile(root, 'invalid.json', '{not-json')

            await expect(loadJsonIfExists(invalidPath)).rejects.toThrow(SyntaxError)
            await expect(loadJsonIfExists(root)).rejects.toThrow()
        })
    })
})

describe('inventory-eslint-rules - collectExplicitExemptions', () => {
    it('跨默认扫描根收集显式豁免并转换相对路径', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'utils/a.ts', [
                'const a = 1',
                '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
                'const b = 2',
            ].join('\n'))
            await writeProjectFile(root, 'utils/nested/deep.ts', [
                '// eslint-disable-line @typescript-eslint/no-explicit-any',
            ].join('\n'))
            await writeProjectFile(root, 'types/c.ts', [
                '// eslint-disable-next-line @typescript-eslint/ban-ts-comment',
            ].join('\n'))

            expect(await collectExplicitExemptions('@typescript-eslint/no-explicit-any', root)).toEqual([
                {
                    filePath: 'utils/a.ts',
                    line: 2,
                    text: 'eslint-disable-next-line @typescript-eslint/no-explicit-any',
                },
                {
                    filePath: 'utils/nested/deep.ts',
                    line: 1,
                    text: 'eslint-disable-line @typescript-eslint/no-explicit-any',
                },
            ])
            expect(await collectExplicitExemptions('@typescript-eslint/no-unnecessary-condition', root)).toEqual([])
        })
    })
})

describe('inventory-eslint-rules - collectRuleInventory', () => {
    it('过滤 ignore、聚合 warning / 豁免 / 目录桶并透传候选严重度', async () => {
        await withTempDir(async (root) => {
            const typeFile = await writeProjectFile(root, 'types/a.ts', [
                '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
                'const a = 1',
            ].join('\n'))
            const ignoredFile = await writeProjectFile(root, 'types/skip.ts', [
                '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
                'const b = 2',
            ].join('\n'))
            const utilFile = await writeProjectFile(root, 'utils/b.ts', [
                '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
                'const c = 3',
            ].join('\n'))

            eslintMock.lintFiles = async () => [
                {
                    filePath: typeFile,
                    messages: [
                        { column: 3, line: 2, message: 'first', ruleId: '@typescript-eslint/no-explicit-any', severity: 2 },
                        { column: null, line: 10, message: 'second', ruleId: '@typescript-eslint/no-explicit-any', severity: 1 },
                        { column: 1, line: 1, message: 'other', ruleId: 'no-console', severity: 2 },
                        { column: 1, line: 1, message: 'no rule', ruleId: null, severity: 1 },
                    ],
                },
                {
                    filePath: ignoredFile,
                    messages: [
                        { column: 1, line: 2, message: 'ignored', ruleId: '@typescript-eslint/no-explicit-any', severity: 2 },
                    ],
                },
                {
                    filePath: utilFile,
                    messages: [
                        { column: 4, line: 3, message: 'third', ruleId: '@typescript-eslint/no-explicit-any', severity: 1 },
                    ],
                },
            ]

            const inventory = await collectRuleInventory(
                { lintFiles: eslintMock.lintFiles },
                {
                    files: ['types/**/*.ts', 'utils/**/*.ts'],
                    ignores: ['types/skip.ts'],
                    ruleId: '@typescript-eslint/no-explicit-any',
                    scope: 'no-explicit-any',
                },
                root,
                new Map([['@typescript-eslint/no-explicit-any', { configuredSeverity: 2, effectiveSeverity: 2 }]]),
            )

            expect(inventory).toMatchObject({
                configuredSeverity: 2,
                directoryBuckets: [
                    { clearedCount: 1, directory: 'types', hitCount: 2, warningBaseline: 2 },
                    { clearedCount: 1, directory: 'utils', hitCount: 1, warningBaseline: 1 },
                ],
                effectiveSeverity: 2,
                explicitExemptionCount: 2,
                filesWithWarnings: 2,
                ruleId: '@typescript-eslint/no-explicit-any',
                scope: 'no-explicit-any',
                warningCount: 3,
            })
            expect(inventory.residualWarnings).toEqual([
                { column: 3, filePath: 'types/a.ts', line: 2, message: 'first', severity: 'error' },
                { column: 0, filePath: 'types/a.ts', line: 10, message: 'second', severity: 'warning' },
                { column: 4, filePath: 'utils/b.ts', line: 3, message: 'third', severity: 'warning' },
            ])
            expect(inventory.explicitExemptions).toEqual([
                {
                    filePath: 'types/a.ts',
                    line: 1,
                    text: 'eslint-disable-next-line @typescript-eslint/no-explicit-any',
                },
                {
                    filePath: 'utils/b.ts',
                    line: 1,
                    text: 'eslint-disable-next-line @typescript-eslint/no-explicit-any',
                },
            ])
        })
    })

    it('没有候选信息且没有 ignore 时按 0 严重度输出', async () => {
        await withTempDir(async (root) => {
            const typeFile = await writeProjectFile(root, 'types/a.ts', 'const a = 1\n')

            eslintMock.lintFiles = async () => [{ filePath: typeFile, messages: [] }]

            const inventory = await collectRuleInventory(
                { lintFiles: eslintMock.lintFiles },
                {
                    files: ['types/**/*.ts'],
                    ruleId: '@typescript-eslint/no-explicit-any',
                    scope: 'no-explicit-any',
                },
                root,
            )

            expect(inventory).toMatchObject({
                configuredSeverity: 0,
                directoryBuckets: [],
                effectiveSeverity: 0,
                explicitExemptionCount: 0,
                filesWithWarnings: 0,
                warningCount: 0,
            })
            expect(inventory.explicitExemptions).toEqual([])
        })
    })
})

describe('inventory-eslint-rules - collectEslintRulesInventory', () => {
    it('聚合候选表与各规则切片，缺省 baseline 标记为未建立', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')
            const typeFile = await writeProjectFile(root, 'types/a.ts', [
                '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
                'const a = 1',
            ].join('\n'))
            const utilFile = await writeProjectFile(root, 'utils/b.ts', 'const b = 2\n')

            eslintMock.calculateConfigForFile = async (filePath) => {
                if (filePath === typeFile) {
                    return { rules: { '@typescript-eslint/no-explicit-any': 1 } }
                }

                if (filePath.endsWith(path.join('tests', 'sample.test.ts'))) {
                    return { rules: { '@typescript-eslint/no-explicit-any': 'off' } }
                }

                return { rules: {} }
            }
            eslintMock.lintFiles = async (_patterns, options) => (options.overrideConfig
                ? [
                    {
                        filePath: typeFile,
                        messages: [{ column: 4, line: 2, message: 'any', ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }],
                    },
                    {
                        filePath: utilFile,
                        messages: [{ column: 1, line: 1, message: 'any', ruleId: '@typescript-eslint/no-explicit-any', severity: 1 }],
                    },
                ]
                : [
                    {
                        filePath: typeFile,
                        messages: [{ column: 4, line: 2, message: 'residual', ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }],
                    },
                ])

            const report = await collectEslintRulesInventory({ baseline: 'missing-baseline.json', projectRoot: root })
            const byRule = new Map(report.rules.map((rule: { ruleId: string }) => [rule.ruleId, rule]))

            expect(report.rules).toHaveLength(ESLINT_DEBT_RULE_SLICES.length)
            expect(report.summary).toEqual({
                candidateRuleCount: report.candidateRules.filter((rule: { isCandidate: boolean }) => rule.isCandidate).length,
                explicitExemptionCount: 1,
                filesWithWarnings: 1,
                ruleCount: ESLINT_DEBT_RULE_SLICES.length,
                warningCount: 1,
            })
            expect(report.baseline).toEqual({
                delta: { hasBaseline: false, rules: [] },
                exists: false,
                path: 'missing-baseline.json',
            })
            expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u)
            expect(byRule.get('@typescript-eslint/no-explicit-any')).toMatchObject({
                configuredSeverity: 0,
                directoryBuckets: [
                    { clearedCount: 1, directory: 'types', hitCount: 1, warningBaseline: 1 },
                ],
                effectiveSeverity: 1,
                explicitExemptionCount: 1,
                filesWithWarnings: 1,
                warningCount: 1,
            })
            expect(byRule.get('@typescript-eslint/ban-ts-comment')).toMatchObject({
                configuredSeverity: 0,
                effectiveSeverity: 0,
                explicitExemptionCount: 0,
            })
        })
    })

    it('未传 baseline 时使用仓库默认相对路径', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')

            const report = await collectEslintRulesInventory({ projectRoot: root })

            expect(report.baseline).toEqual({
                delta: { hasBaseline: false, rules: [] },
                exists: false,
                path: DEFAULT_BASELINE_PATH,
            })
        })
    })

    it('baseline 存在时按绝对路径读取并计算 delta', async () => {
        await withTempDir(async (root) => {
            await writeProjectFile(root, 'tests/sample.test.ts', 'export {}\n')
            const baselinePath = await writeProjectFile(root, 'baseline.json', JSON.stringify({
                rules: [
                    { ruleId: '@typescript-eslint/no-explicit-any', warningCount: 3 },
                    { ruleId: '@typescript-eslint/unknown-rule', warningCount: 9 },
                ],
            }))

            const report = await collectEslintRulesInventory({ baseline: baselinePath, projectRoot: root })
            const deltaByRule = new Map(report.baseline.delta.rules.map((rule: { ruleId: string }) => [rule.ruleId, rule]))

            expect(report.baseline.exists).toBe(true)
            expect(report.baseline.path).toBe('baseline.json')
            expect(report.baseline.delta.hasBaseline).toBe(true)
            expect(report.baseline.delta.rules).toHaveLength(ESLINT_DEBT_RULE_SLICES.length)
            expect(deltaByRule.get('@typescript-eslint/no-explicit-any')).toEqual({
                previousWarningCount: 3,
                ruleId: '@typescript-eslint/no-explicit-any',
                warningCountDelta: -3,
            })
            expect(deltaByRule.get('@typescript-eslint/ban-ts-comment')).toEqual({
                previousWarningCount: 0,
                ruleId: '@typescript-eslint/ban-ts-comment',
                warningCountDelta: 0,
            })
            expect(deltaByRule.has('@typescript-eslint/unknown-rule')).toBe(false)
        })
    })
})

describe('inventory-eslint-rules - renderMarkdownReport', () => {
    it('输出摘要、候选表、delta 与空段落占位', () => {
        const report = createReportFixture()
        const markdown = renderReport(report, 'artifacts/governance/report.md')

        expect(markdown.startsWith('# ESLint Rules Inventory')).toBe(true)
        expect(markdown).toContain('- 生成时间: 2026-11-15T00:00:00.000Z')
        expect(markdown).toContain('- 产物路径: artifacts/governance/report.md')
        expect(markdown).toContain('- 基线路径: baseline.json')
        expect(markdown).toContain('- 规则数: 2')
        expect(markdown).toContain('- warning 总数: 2')
        expect(markdown).toContain('- 显式豁免总数: 1')
        expect(markdown).toContain('- 命中文件数: 1')
        expect(markdown).toContain('- 基线状态: 已检测到 baseline')
        expect(markdown).toContain('| @typescript-eslint/no-extraneous-class | yes | 0 | 0 | 3 | 2 | - |')
        expect(markdown).toContain('| @typescript-eslint/no-unnecessary-condition | no | 1 | 2 | 1 | 1 | types |')
        expect(markdown).toContain('## no-explicit-any')
        expect(markdown).toContain('- warning delta: +1')
        expect(markdown).toContain('- warning 数: 2')
        expect(markdown).toContain('- types: 命中 2, 清零 1, warning 基线 2')
        expect(markdown).toContain('- types/a.ts:3:5 first')
        expect(markdown).toContain('- types/a.ts:9 eslint-disable-next-line @typescript-eslint/no-explicit-any')
        expect(markdown).toContain('## ban-ts-comment')
        expect(markdown).not.toContain('- warning delta: 0')
    })

    it('无产物路径、无 baseline 且空明细时使用回退文案', () => {
        const report = createReportFixture()
        report.baseline.exists = false
        report.baseline.delta.rules[0]!.warningCountDelta = -2
        const markdown = renderReport(report)

        expect(markdown).not.toContain('- 产物路径:')
        expect(markdown).toContain('- 基线状态: 尚未建立 baseline')
        expect(markdown).toContain('- warning delta: -2')
        expect(markdown.match(/- 无/gu)).toHaveLength(3)
    })

    it('缺少 candidateRules 时只输出候选表表头', () => {
        const report = createReportFixture()
        const markdown = renderReport({ ...report, candidateRules: undefined })

        expect(markdown).toContain('| rule | candidate | configured | effective | hitCount | filesWithHits | topDirectory |')
        expect(markdown).not.toContain('| @typescript-eslint/no-extraneous-class |')
        expect(markdown).not.toContain('| @typescript-eslint/no-unnecessary-condition |')
    })

    it('目录桶 / warning / 豁免分别截断到 15 / 20 / 20 条', () => {
        const report = createReportFixture()
        const rule = report.rules[0]!

        rule.directoryBuckets = Array.from({ length: 16 }, (_, index) => ({
            clearedCount: index,
            directory: `dir-${String(index).padStart(2, '0')}`,
            hitCount: 1,
            warningBaseline: 1,
        }))
        rule.residualWarnings = Array.from({ length: 21 }, (_, index) => ({
            column: index,
            filePath: `types/file-${index}.ts`,
            line: index,
            message: `warning-${index}`,
            severity: 'warning',
        }))
        rule.explicitExemptions = Array.from({ length: 21 }, (_, index) => ({
            filePath: `types/file-${index}.ts`,
            line: index,
            text: `exemption-${index}`,
        }))

        const markdown = renderReport(report)

        expect(markdown).toContain('- dir-14: 命中 1')
        expect(markdown).not.toContain('- dir-15: 命中 1')
        expect(markdown).toContain('- types/file-19.ts:19:19 warning-19')
        expect(markdown).not.toContain('- types/file-20.ts:20:20 warning-20')
        expect(markdown).toContain('- types/file-19.ts:19 exemption-19')
        expect(markdown).not.toContain('- types/file-20.ts:20 exemption-20')
    })
})

describe('inventory-eslint-rules - resolveMarkdownPath / writeArtifacts', () => {
    it('json 产物替换扩展名，其它扩展名追加 .md', () => {
        expect(resolveMarkdownPath('artifacts/report.json')).toBe('artifacts/report.md')
        expect(resolveMarkdownPath('artifacts/report.txt')).toBe('artifacts/report.txt.md')
    })

    it('相对输出路径按 projectRoot 解析并写出 JSON + Markdown', async () => {
        await withTempDir(async (root) => {
            const report = createReportFixture()
            const artifacts = await writeArtifacts(report, 'artifacts/governance/report.json', root)

            expect(artifacts).toEqual({
                jsonPath: path.join(root, 'artifacts', 'governance', 'report.json'),
                markdownPath: path.join(root, 'artifacts', 'governance', 'report.md'),
            })
            await expect(access(artifacts.jsonPath)).resolves.toBeUndefined()
            expect(JSON.parse(await readFile(artifacts.jsonPath, 'utf8'))).toEqual(report)
            const markdown = await readFile(artifacts.markdownPath, 'utf8')

            expect(markdown.startsWith('# ESLint Rules Inventory')).toBe(true)
            expect(markdown.endsWith('\n')).toBe(true)
            expect(markdown).toContain('- 产物路径: artifacts/governance/report.md')
        })
    })

    it('绝对输出路径原样使用', async () => {
        await withTempDir(async (root) => {
            const report = createReportFixture()
            const absolutePath = path.join(root, 'nested', 'report.json')
            const artifacts = await writeArtifacts(report, absolutePath, path.join(root, 'ignored-root'))

            expect(artifacts.jsonPath).toBe(absolutePath)
            await expect(access(absolutePath)).resolves.toBeUndefined()
        })
    })
})

describe('inventory-eslint-rules - main', () => {
    it('解析 CLI 参数后写出产物并打印摘要', async () => {
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
        await withTempDir(async (root) => {
            const outputPath = path.join(root, 'out', 'nested', 'report.json')
            const baselinePath = path.join(root, 'missing-baseline.json')

            const report = await main([`--baseline=${baselinePath}`, `--output=${outputPath}`])

            expect(report.summary.ruleCount).toBe(ESLINT_DEBT_RULE_SLICES.length)
            expect(report.baseline.exists).toBe(false)
            await expect(access(outputPath)).resolves.toBeUndefined()
            await expect(access(path.join(root, 'out', 'nested', 'report.md'))).resolves.toBeUndefined()

            const messages = infoSpy.mock.calls.map((call) => String(call[0]))
            expect(report.summary.warningCount).toBe(0)
            expect(messages).toHaveLength(5)
            expect(messages[0]).toBe('ESLint rules inventory completed.')
            expect(messages[1]).toBe('- warning 总数: 0')
            expect(messages[2]).toBe(`- 显式豁免总数: ${report.summary.explicitExemptionCount}`)
            expect(messages[3]).toMatch(/^- JSON: .+/u)
            expect(messages[4]).toMatch(/^- Markdown: .+/u)
        })
    })
})
