import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildDuplicateGroups,
    buildReport,
    computeGroupId,
    ensureRequestedLocales,
    ensureRequestedModules,
    flattenMessageEntries,
    formatMarkdownReport,
    formatTextReport,
    getLocaleMessageMaps,
    getSharedKeys,
    getTargetLocales,
    getVisibleGroups,
    main,
    parseArguments,
    parseListArgument,
    parseNumberArgument,
    renderReport,
} from '../../scripts/i18n/audit-duplicate-messages.mjs'

interface FakeMessageEntry {
    moduleName: string
    value: string
}

interface FakeGroup {
    crossModule: boolean
    keyCount: number
    keys: { key: string, moduleName: string }[]
    modules: string[]
    values: Record<string, string>
}

async function writeLocaleFile(localeRoot: string, localeCode: string, moduleName: string, content: string) {
    const filePath = join(localeRoot, localeCode, `${moduleName}.json`)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf8')
}

async function withTempDir(run: (directory: string) => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), 'dup-audit-branches-'))

    try {
        await run(directory)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
}

/**
 * 写入 main() 用的双 locale 夹具：
 * - `common.a` / `nav.home` 在两种 locale 下同值 → 跨模块重复组；
 * - `common.d` / `common.e` 同值 → 单模块重复组；
 * - `common.c` 值不同 → 不成组；
 * - `common.f` 只存在于 en-US → 计入 incompleteKeyCount。
 */
async function writeProjectFixture(rootDir: string) {
    const localeRoot = join(rootDir, 'i18n', 'locales')

    await writeLocaleFile(localeRoot, 'en-US', 'common', JSON.stringify({
        a: 'Shared A',
        b: 'Shared B',
        c: 'Only EN',
        d: 'Group D',
        e: 'Group D',
        f: 'EN only key',
    }))
    await writeLocaleFile(localeRoot, 'en-US', 'nav', JSON.stringify({ home: 'Shared A' }))
    await writeLocaleFile(localeRoot, 'zh-CN', 'common', JSON.stringify({
        a: 'Shared A',
        b: 'Shared B',
        c: 'Only ZH',
        d: 'Group D',
        e: 'Group D',
    }))
    await writeLocaleFile(localeRoot, 'zh-CN', 'nav', JSON.stringify({ home: 'Shared A' }))

    return localeRoot
}

function createGroup(
    keys: { key: string, moduleName: string }[],
    values: Record<string, string> = { 'en-US': 'same', 'zh-CN': 'same' },
): FakeGroup {
    const modules = [...new Set(keys.map((item) => item.moduleName))].sort()

    return {
        crossModule: modules.length > 1,
        keyCount: keys.length,
        keys,
        modules,
        values,
    }
}

function createFixtureMaps() {
    const enMap = new Map<string, FakeMessageEntry>()
    const zhMap = new Map<string, FakeMessageEntry>()
    const add = (key: string, moduleName: string, value: string) => {
        enMap.set(key, { moduleName, value })
        zhMap.set(key, { moduleName, value })
    }

    // 跨模块 / 3 个模块 / 3 个 key
    add('m1.delta', 'm1', 'triple')
    add('m2.delta', 'm2', 'triple')
    add('m3.delta', 'm3', 'triple')
    // 跨模块 / 2 个模块 / 3 个 key
    add('m1.eta', 'm1', 'triple2')
    add('m1.theta', 'm1', 'triple2')
    add('m2.eta', 'm2', 'triple2')
    // 跨模块 / 2 个模块 / 2 个 key
    add('m1.alpha', 'm1', 'shared')
    add('m2.alpha', 'm2', 'shared')
    // 单模块 / 2 个 key（两个组，用于 keys[0] 排序兜底）
    add('m1.beta', 'm1', 'same-module')
    add('m1.gamma', 'm1', 'same-module')
    add('m1.aaa', 'm1', 'another-pair')
    add('m1.zzz', 'm1', 'another-pair')
    // 单模块 / 1 个 key（被 minGroupSize 过滤）
    add('m1.solo', 'm1', 'solo')

    return new Map([
        ['en-US', { messageMap: enMap, moduleNames: ['m1', 'm2', 'm3'] }],
        ['zh-CN', { messageMap: zhMap, moduleNames: ['m1', 'm2', 'm3'] }],
    ])
}

describe('audit-duplicate-messages - 参数解析', () => {
    it('parseListArgument 拆分、裁剪并丢弃空项与空入参', () => {
        expect(parseListArgument('zh-CN, en-US ,,')).toEqual(['zh-CN', 'en-US'])
        expect(parseListArgument('')).toEqual([])
        expect(parseListArgument(undefined)).toEqual([])
    })

    it('parseNumberArgument 接受非负整数，空串按 0 处理', () => {
        expect(parseNumberArgument('12', 50)).toBe(12)
        expect(parseNumberArgument(' 7 ', 50)).toBe(7)
        expect(parseNumberArgument('', 50)).toBe(0)
        expect(parseNumberArgument('0', 50)).toBe(0)
    })

    it('parseNumberArgument 拒绝负数、小数与非数字', () => {
        expect(() => parseNumberArgument('abc', 50)).toThrow('Expected a non-negative integer, received: abc')
        expect(() => parseNumberArgument('-3', 50)).toThrow('Expected a non-negative integer, received: -3')
        expect(() => parseNumberArgument('1.5', 50)).toThrow('Expected a non-negative integer, received: 1.5')
    })

    it('parseArguments 无参数时套用全部默认值', () => {
        expect(parseArguments([])).toEqual({
            allowlist: 'scripts/i18n/duplicate-group-allowlist.json',
            crossModuleOnly: false,
            format: 'text',
            limit: 50,
            locales: [],
            maxGroups: 74,
            minGroupSize: 2,
            modules: [],
        })
    })

    it('parseArguments 对 locale / module 去重排序并识别布尔 flag', () => {
        const options = parseArguments([
            '--locale=zh-CN,en-US',
            '--locale=en-US,ja-JP',
            '--module=pages,common',
            '--module=common,admin',
            '--format=   ',
            '--cross-module-only',
            '--gate',
        ])

        expect(options.locales).toEqual(['en-US', 'ja-JP', 'zh-CN'])
        expect(options.modules).toEqual(['admin', 'common', 'pages'])
        expect(options.format).toBe('text')
        expect(options.crossModuleOnly).toBe(true)
        expect(options.gate).toBe(true)
    })

    it('parseArguments 对非法数值、非法格式与过小 min-group-size 抛错', () => {
        expect(() => parseArguments(['--limit=abc'])).toThrow('Expected a non-negative integer, received: abc')
        expect(() => parseArguments(['--limit=-3'])).toThrow('Expected a non-negative integer, received: -3')
        expect(() => parseArguments(['--max-groups=2.5'])).toThrow('Expected a non-negative integer, received: 2.5')
        expect(() => parseArguments(['--min-group-size=1'])).toThrow('--min-group-size must be at least 2')
        expect(() => parseArguments(['--min-group-size=abc'])).toThrow('Expected a non-negative integer, received: abc')
        expect(() => parseArguments(['--format=yaml'])).toThrow('Unsupported format value')
    })

    it('parseArguments 接受合法的 min-group-size 与数值参数', () => {
        const options = parseArguments(['--min-group-size=3', '--max-groups=12', '--limit=4'])

        expect(options.minGroupSize).toBe(3)
        expect(options.maxGroups).toBe(12)
        expect(options.limit).toBe(4)
    })

    it('parseArguments 支持 allowlist 空值回退默认路径与 output 裁剪', () => {
        expect(parseArguments(['--allowlist=']).allowlist).toBe('scripts/i18n/duplicate-group-allowlist.json')

        const options = parseArguments([
            '--allowlist=tmp/list.json',
            '--output=  report.json  ',
            '--limit=0',
            '--max-groups=0',
        ])

        expect(options.allowlist).toBe('tmp/list.json')
        expect(options.outputPath).toBe('report.json')
        expect(options.limit).toBe(0)
        expect(options.maxGroups).toBe(0)
    })
})

describe('audit-duplicate-messages - flattenMessageEntries', () => {
    it('展开嵌套对象与数组，过滤空白串与非字符串值', () => {
        expect(flattenMessageEntries({
            title: '标题',
            blank: '   ',
            nested: { deep: { label: '深层' } },
            list: ['一', '', '二'],
            objects: [{ name: 'X' }, { inner: ['Y'] }],
            emptyList: ['  '],
            count: 0,
            flag: false,
            nothing: null,
        })).toEqual([
            { key: 'title', value: '标题' },
            { key: 'nested.deep.label', value: '深层' },
            { key: 'list[0]', value: '一' },
            { key: 'list[2]', value: '二' },
            { key: 'objects[0].name', value: 'X' },
            { key: 'objects[1].inner[0]', value: 'Y' },
        ])
    })

    it('数组根节点保留索引 key 并跳过空值与空串', () => {
        expect(flattenMessageEntries([null, '值', { label: '标签' }, '  '])).toEqual([
            { key: '[1]', value: '值' },
            { key: '[2].label', value: '标签' },
        ])
    })

    it('标量根节点只在带前缀且非空时产出一条记录', () => {
        expect(flattenMessageEntries('纯文本', 'prefix.key')).toEqual([{ key: 'prefix.key', value: '纯文本' }])
        expect(flattenMessageEntries('纯文本')).toEqual([])
        expect(flattenMessageEntries('   ', 'prefix.key')).toEqual([])
        expect(flattenMessageEntries(null, 'prefix.key')).toEqual([])
    })
})

describe('audit-duplicate-messages - getLocaleMessageMaps', () => {
    it('读取 locale 目录并跳过非目录、非 json 与嵌套目录', async () => {
        await withTempDir(async (directory) => {
            const localeRoot = join(directory, 'locales')

            await writeLocaleFile(localeRoot, 'en-US', 'common', JSON.stringify({
                title: 'Hello',
                nested: { label: 'Deep' },
                list: ['One', '  ', 3],
            }))
            await writeLocaleFile(localeRoot, 'en-US', 'nav', JSON.stringify({ home: 'Home' }))
            await writeLocaleFile(localeRoot, 'zh-CN', 'common', JSON.stringify({ title: '你好' }))
            await writeFile(join(localeRoot, 'README.md'), '# locales', 'utf8')
            await writeFile(join(localeRoot, 'en-US', 'notes.txt'), 'ignored', 'utf8')
            await mkdir(join(localeRoot, 'en-US', 'nested-dir'), { recursive: true })

            const maps = await getLocaleMessageMaps([], localeRoot)

            expect([...maps.keys()]).toEqual(['en-US', 'zh-CN'])
            expect(maps.get('en-US').moduleNames).toEqual(['common', 'nav'])
            expect(maps.get('en-US').messageMap.get('title')).toEqual({ moduleName: 'common', value: 'Hello' })
            expect(maps.get('en-US').messageMap.get('nested.label')).toEqual({ moduleName: 'common', value: 'Deep' })
            expect(maps.get('en-US').messageMap.has('list[1]')).toBe(false)
            expect(maps.get('en-US').messageMap.has('list[2]')).toBe(false)
            expect(maps.get('en-US').messageMap.get('list[0]')).toEqual({ moduleName: 'common', value: 'One' })
            expect(maps.get('en-US').messageMap.get('home')).toEqual({ moduleName: 'nav', value: 'Home' })
            expect(maps.get('zh-CN').moduleNames).toEqual(['common'])
            expect(maps.get('zh-CN').messageMap.has('home')).toBe(false)
        })
    })

    it('requestedModules 只保留命中的模块名', async () => {
        await withTempDir(async (directory) => {
            const localeRoot = join(directory, 'locales')

            await writeLocaleFile(localeRoot, 'en-US', 'common', JSON.stringify({ title: 'Hello' }))
            await writeLocaleFile(localeRoot, 'en-US', 'nav', JSON.stringify({ home: 'Home' }))
            await writeLocaleFile(localeRoot, 'zh-CN', 'nav', JSON.stringify({ home: '首页' }))

            const maps = await getLocaleMessageMaps(['nav'], localeRoot)

            expect(maps.get('en-US').moduleNames).toEqual(['nav'])
            expect(maps.get('en-US').messageMap.has('title')).toBe(false)
            expect(maps.get('en-US').messageMap.get('home')).toEqual({ moduleName: 'nav', value: 'Home' })
            expect(maps.get('zh-CN').messageMap.get('home')).toEqual({ moduleName: 'nav', value: '首页' })
        })
    })
})

describe('audit-duplicate-messages - 选择器校验与目标 locale', () => {
    const maps = new Map([
        ['en-US', { messageMap: new Map(), moduleNames: ['common', 'nav'] }],
        ['zh-CN', { messageMap: new Map(), moduleNames: ['common'] }],
    ])

    it('空选择器直接早返回，目标 locale 取排序后的全部 locale', () => {
        expect(() => ensureRequestedLocales(maps, [])).not.toThrow()
        expect(() => ensureRequestedModules(maps, [])).not.toThrow()
        expect(getTargetLocales(maps, [])).toEqual(['en-US', 'zh-CN'])
    })

    it('未知 locale 选择器抛错并列出全部缺失项', () => {
        expect(() => ensureRequestedLocales(maps, ['en-US', 'fr-FR', 'de-DE']))
            .toThrow('Unknown locale selector(s): fr-FR, de-DE')
    })

    it('模块校验按所有 locale 的并集判定，未知模块抛错', () => {
        expect(() => ensureRequestedModules(maps, ['nav'])).not.toThrow()
        expect(() => ensureRequestedModules(maps, ['common', 'admin']))
            .toThrow('Unknown module selector(s): admin')
    })

    it('显式 locale 选择器原样返回', () => {
        expect(getTargetLocales(maps, ['zh-CN', 'en-US'])).toEqual(['zh-CN', 'en-US'])
    })
})

describe('audit-duplicate-messages - getSharedKeys', () => {
    const maps = new Map([
        ['en-US', {
            messageMap: new Map([
                ['common.a', { moduleName: 'common', value: 'A' }],
                ['common.b', { moduleName: 'common', value: 'B' }],
            ]),
            moduleNames: ['common'],
        }],
        ['zh-CN', {
            messageMap: new Map([
                ['common.a', { moduleName: 'common', value: 'A' }],
                ['nav.c', { moduleName: 'nav', value: 'C' }],
            ]),
            moduleNames: ['common', 'nav'],
        }],
    ])

    it('统计交集、并集与未在每个 locale 出现的 key 数', () => {
        expect(getSharedKeys(['en-US', 'zh-CN'], maps)).toEqual({
            incompleteKeyCount: 2,
            sharedKeys: ['common.a'],
            totalDistinctKeys: 3,
        })
    })

    it('locale 缺失时按空集合处理', () => {
        expect(getSharedKeys(['en-US', 'fr-FR'], maps)).toEqual({
            incompleteKeyCount: 2,
            sharedKeys: [],
            totalDistinctKeys: 2,
        })
    })

    it('空 locale 列表返回全零统计', () => {
        expect(getSharedKeys([], maps)).toEqual({
            incompleteKeyCount: 0,
            sharedKeys: [],
            totalDistinctKeys: 0,
        })
    })
})

describe('audit-duplicate-messages - buildDuplicateGroups', () => {
    const maps = createFixtureMaps()
    const sharedKeys = [...(maps.get('en-US') as { messageMap: Map<string, FakeMessageEntry> }).messageMap.keys()].sort()

    it('按 minGroupSize 过滤并按跨模块、模块数、keyCount、首 key 排序', () => {
        const groups = buildDuplicateGroups(['en-US', 'zh-CN'], maps, sharedKeys, 2)

        expect(groups.map((group) => group.keys.map((item) => item.key))).toEqual([
            ['m1.delta', 'm2.delta', 'm3.delta'],
            ['m1.eta', 'm1.theta', 'm2.eta'],
            ['m1.alpha', 'm2.alpha'],
            ['m1.aaa', 'm1.zzz'],
            ['m1.beta', 'm1.gamma'],
        ])
        expect(groups.map((group) => group.crossModule)).toEqual([true, true, true, false, false])
        expect(groups.map((group) => group.keyCount)).toEqual([3, 3, 2, 2, 2])
        expect(groups[0]?.modules).toEqual(['m1', 'm2', 'm3'])
        expect(groups[2]?.modules).toEqual(['m1', 'm2'])
        expect(groups[2]?.values).toEqual({ 'en-US': 'shared', 'zh-CN': 'shared' })
    })

    it('minGroupSize 提高到 3 时只剩三个 key 的组', () => {
        const groups = buildDuplicateGroups(['en-US', 'zh-CN'], maps, sharedKeys, 3)

        expect(groups.map((group) => group.keyCount)).toEqual([3, 3])
        expect(groups.some((group) => group.keys.some((item) => item.key === 'm1.solo'))).toBe(false)
    })

    it('minGroupSize 为 1 时单 key 组也会保留', () => {
        const groups = buildDuplicateGroups(['en-US', 'zh-CN'], maps, sharedKeys, 1)

        expect(groups).toHaveLength(6)
        expect(groups.at(-1)?.keys).toEqual([{ key: 'm1.solo', moduleName: 'm1' }])
    })
})

describe('audit-duplicate-messages - getVisibleGroups / buildReport', () => {
    const crossGroup = createGroup([
        { key: 'a', moduleName: 'm1' },
        { key: 'home', moduleName: 'm2' },
    ], { 'en-US': 'Shared A', 'zh-CN': '共享 A' })
    const singleGroup = createGroup([
        { key: 'd', moduleName: 'm1' },
        { key: 'e', moduleName: 'm1' },
    ], { 'en-US': 'Group D', 'zh-CN': '组 D' })
    const groups: FakeGroup[] = [crossGroup, singleGroup]

    it('limit=0 返回全部组，limit>0 截断', () => {
        expect(getVisibleGroups(groups, 0, false)).toEqual(groups)
        expect(getVisibleGroups(groups, 1, false)).toEqual([crossGroup])
    })

    it('crossModuleOnly 只保留跨模块组', () => {
        expect(getVisibleGroups(groups, 0, true)).toEqual([crossGroup])
        expect(getVisibleGroups(groups, 1, true)).toEqual([crossGroup])
    })

    it('buildReport 汇总过滤条件与统计字段', () => {
        const options = {
            crossModuleOnly: false,
            limit: 1,
            minGroupSize: 2,
            modules: ['common'],
        }
        const report = buildReport(options, groups, {
            incompleteKeyCount: 4,
            localeCodes: ['en-US', 'zh-CN'],
            sharedKeyCount: 10,
            totalDistinctKeys: 14,
        })

        expect(report.filters).toEqual(options)
        expect(report.groups).toEqual([crossGroup])
        expect(report.summary).toEqual({
            crossModuleGroupCount: 1,
            duplicateGroupCount: 2,
            incompleteKeyCount: 4,
            locales: ['en-US', 'zh-CN'],
            sharedKeyCount: 10,
            shownGroupCount: 1,
            totalDistinctKeyCount: 14,
            totalKeysInGroups: 4,
        })
    })
})

describe('audit-duplicate-messages - 报告格式化', () => {
    const crossGroup = createGroup([
        { key: 'a', moduleName: 'm1' },
        { key: 'home', moduleName: 'm2' },
    ], { 'en-US': 'Shared A', 'zh-CN': '共享 A' })
    const singleGroup = createGroup([
        { key: 'd', moduleName: 'm1' },
        { key: 'e', moduleName: 'm1' },
    ], { 'en-US': 'Group D', 'zh-CN': '组 D' })

    function createReport(overrides: {
        crossModuleOnly?: boolean
        groups?: FakeGroup[]
        incompleteKeyCount?: number
    } = {}) {
        const groups = overrides.groups ?? [crossGroup, singleGroup]

        return buildReport(
            {
                crossModuleOnly: overrides.crossModuleOnly ?? false,
                limit: 0,
                minGroupSize: 2,
                modules: [],
            },
            groups,
            {
                incompleteKeyCount: overrides.incompleteKeyCount ?? 3,
                localeCodes: ['en-US', 'zh-CN'],
                sharedKeyCount: 8,
                totalDistinctKeys: 11,
            },
        )
    }

    it('text 报告输出摘要、组头、模块、key 与值明细', () => {
        const text = formatTextReport(createReport())

        expect(text).toContain('Scanned 2 locale(s): en-US, zh-CN')
        expect(text).toContain('Shared non-empty string keys: 8 / 11 total distinct keys')
        expect(text).toContain('Duplicate groups that match in every locale: 2 (4 keys involved, 1 cross-module)')
        expect(text).toContain('Groups shown: 2')
        expect(text).toContain('Keys excluded because they are not present in every scanned locale: 3')
        expect(text).toContain('1. 2 keys across 2 modules (cross-module)')
        expect(text).toContain('2. 2 keys across m1 module')
        expect(text).toContain('   modules: m1, m2')
        expect(text).toContain('      - a [m1]')
        expect(text).toContain('      - home [m2]')
        expect(text).toContain('      - en-US: Shared A')
        expect(text).toContain('      - zh-CN: 共享 A')
    })

    it('text 报告在无匹配组时不打印组明细', () => {
        const text = formatTextReport(createReport({ groups: [] }))

        expect(text).toContain('Duplicate groups that match in every locale: 0 (0 keys involved, 0 cross-module)')
        expect(text).toContain('Groups shown: 0')
        expect(text).toContain('No duplicate groups matched the current filters.')
        expect(text).not.toContain('1. ')
    })

    it('text 报告在 incompleteKeyCount 为 0 时省略排除说明，并标注 cross-module only', () => {
        const report = createReport({ incompleteKeyCount: 0, crossModuleOnly: true })
        const text = formatTextReport(report)

        expect(text).not.toContain('Keys excluded because they are not present in every scanned locale')
        expect(text).toContain('Groups shown: 1 (cross-module only)')
    })

    it('markdown 报告输出标题、摘要与候选组明细', () => {
        const markdown = formatMarkdownReport(createReport())

        expect(markdown.startsWith('# Duplicate Message Audit')).toBe(true)
        expect(markdown).toContain('- Locales: en-US, zh-CN')
        expect(markdown).toContain('- Shared non-empty string keys: 8 / 11')
        expect(markdown).toContain('- Duplicate groups that match in every locale: 2')
        expect(markdown).toContain('- Cross-module groups: 1')
        expect(markdown).toContain('- Keys involved in duplicate groups: 4')
        expect(markdown).toContain('- Groups shown: 2')
        expect(markdown).toContain('- Keys excluded because they are not present in every scanned locale: 3')
        expect(markdown).toContain('## Candidate Groups')
        expect(markdown).toContain('### 1. 2 keys across 2 modules (cross-module)')
        expect(markdown).toContain('  - a [m1]')
        expect(markdown).toContain('  - zh-CN: 共享 A')
    })

    it('markdown 报告在无匹配组时输出 Result 段落', () => {
        const markdown = formatMarkdownReport(createReport({ groups: [], incompleteKeyCount: 0 }))

        expect(markdown).toContain('## Result')
        expect(markdown).toContain('No duplicate groups matched the current filters.')
        expect(markdown).not.toContain('## Candidate Groups')
        expect(markdown).toContain('- Keys excluded because they are not present in every scanned locale: 0')
    })

    it('renderReport 按 format 选择 json / markdown / text，未知格式回落 text', () => {
        const report = createReport()

        expect(JSON.parse(renderReport(report, 'json'))).toEqual(report)
        expect(renderReport(report, 'markdown')).toBe(formatMarkdownReport(report))
        expect(renderReport(report, 'text')).toBe(formatTextReport(report))
        expect(renderReport(report, 'xml')).toBe(formatTextReport(report))
    })
})

describe('audit-duplicate-messages - main', () => {
    let originalExitCode: typeof process.exitCode
    let errorSpy: ReturnType<typeof vi.spyOn>
    let infoSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        originalExitCode = process.exitCode
        process.exitCode = undefined
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    })

    afterEach(() => {
        process.exitCode = originalExitCode
        vi.restoreAllMocks()
    })

    const errorMessages = () => errorSpy.mock.calls.map((call) => String(call[0]))
    const infoMessages = () => infoSpy.mock.calls.map((call) => String(call[0]))

    it('以 json 写出报告文件并打印写入路径', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main(['--format=json', '--output=report.json'], { localeRoot, rootDir })

            const report = JSON.parse(await readFile(join(rootDir, 'report.json'), 'utf8'))

            expect(report.summary).toEqual({
                crossModuleGroupCount: 1,
                duplicateGroupCount: 2,
                incompleteKeyCount: 1,
                locales: ['en-US', 'zh-CN'],
                sharedKeyCount: 6,
                shownGroupCount: 2,
                totalDistinctKeyCount: 7,
                totalKeysInGroups: 4,
            })
            expect(report.groups.map((group: FakeGroup) => group.keys.map((item) => item.key))).toEqual([
                ['a', 'home'],
                ['d', 'e'],
            ])
            expect(infoMessages()).toEqual([`Wrote duplicate message audit to ${join(rootDir, 'report.json')}`])
            expect(errorMessages()).toEqual([])
            expect(process.exitCode).toBeUndefined()
        })
    })

    it('默认 text 报告直接打印到 console', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main([], { localeRoot, rootDir })

            const [printed] = infoMessages()
            expect(printed).toContain('Scanned 2 locale(s): en-US, zh-CN')
            expect(printed).toContain('Groups shown: 2')
            expect(printed).toContain('1. 2 keys across 2 modules (cross-module)')
        })
    })

    it('markdown + limit + cross-module-only 组合直接打印到 console', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main(['--format=markdown', '--limit=1', '--cross-module-only'], { localeRoot, rootDir })

            const [printed] = infoMessages()
            expect(printed?.startsWith('# Duplicate Message Audit')).toBe(true)
            expect(printed).toContain('- Groups shown: 1 (cross-module only)')
            expect(printed).toContain('### 1. 2 keys across 2 modules (cross-module)')
        })
    })

    it('locale 不足两个时抛错', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await expect(main(['--locale=en-US'], { localeRoot, rootDir }))
                .rejects.toThrow('At least two locales are required to audit duplicate messages')
        })
    })

    it('未知 locale / module 选择器经 main 抛错', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await expect(main(['--locale=fr-FR'], { localeRoot, rootDir }))
                .rejects.toThrow('Unknown locale selector(s): fr-FR')
            await expect(main(['--module=admin'], { localeRoot, rootDir }))
                .rejects.toThrow('Unknown module selector(s): admin')
        })
    })

    it('gate 无法读取 allowlist 时置 exitCode=1', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main(['--gate'], { localeRoot, rootDir })

            expect(process.exitCode).toBe(1)
            expect(errorMessages()).toEqual([
                `Duplicate message gate failed: cannot read allowlist scripts/i18n/duplicate-group-allowlist.json (ENOENT: no such file or directory, open '${join(rootDir, 'scripts/i18n/duplicate-group-allowlist.json')}')`,
            ])
            expect(infoMessages()).toEqual([])
        })
    })

    it('gate 在 allowlist 未登记任何组时列出 unlisted 条目', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)
            await writeFile(join(rootDir, 'allowlist.json'), JSON.stringify({ groups: [] }), 'utf8')

            await main(['--gate', '--allowlist=allowlist.json'], { localeRoot, rootDir })

            expect(process.exitCode).toBe(1)
            const messages = errorMessages()

            expect(messages[0]).toBe('Duplicate message gate failed:')
            expect(messages.some((line) => line.startsWith('- unlisted duplicate groups: g-'))).toBe(true)
            expect(messages.filter((line) => line.includes('  unlisted '))).toHaveLength(2)
            expect(messages.some((line) => line.includes('a, home'))).toBe(true)
            expect(messages.some((line) => line.includes('d, e'))).toBe(true)
        })
    })

    it('gate 在超预算且 allowlist 存在多类问题时逐条报错', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main(['--format=json', '--output=report.json'], { localeRoot, rootDir })
            const report = JSON.parse(await readFile(join(rootDir, 'report.json'), 'utf8'))
            const [firstGroup, secondGroup] = report.groups as FakeGroup[]
            const firstId = computeGroupId(firstGroup)

            await writeFile(join(rootDir, 'allowlist.json'), JSON.stringify({
                groups: [
                    {
                        id: firstId,
                        keys: firstGroup!.keys.map((item) => item.key),
                        reason: '已评估',
                        reviewAt: '2020-01-01',
                    },
                    {
                        id: computeGroupId(secondGroup),
                        keys: secondGroup!.keys.map((item) => item.key),
                        reviewAt: '2027-05-12',
                    },
                    {
                        id: 'g-deadbeefcafe',
                        keys: ['common.removed'],
                        reason: '历史条目',
                        reviewAt: '2027-05-12',
                    },
                    {
                        id: firstId,
                        keys: ['common.drifted'],
                        reason: '漂移条目',
                        reviewAt: '2027-05-12',
                    },
                ],
            }), 'utf8')

            await main(['--gate', '--max-groups=1', '--allowlist=allowlist.json'], { localeRoot, rootDir })

            expect(process.exitCode).toBe(1)
            const messages = errorMessages()

            expect(messages[0]).toBe('Duplicate message gate failed:')
            expect(messages).toContain('- duplicate groups 2 exceed budget 1')
            expect(messages).toContain('- stale allowlist entries: g-deadbeefcafe')
            expect(messages).toContain(`- duplicate allowlist ids: ${firstId}`)
            expect(messages).toContain(`- allowlist entries missing reason/reviewAt: ${computeGroupId(secondGroup)}`)
            expect(messages).toContain(`- allowlist entries past reviewAt: ${firstId}`)
            expect(messages).toContain(`- allowlist keys drifted from live groups: ${firstId}`)
            expect(messages).toContain('  stale g-deadbeefcafe: common.removed')
        })
    })

    it('gate 在预算内且 allowlist 完全对齐时打印通过信息', async () => {
        await withTempDir(async (rootDir) => {
            const localeRoot = await writeProjectFixture(rootDir)

            await main(['--format=json', '--output=report.json'], { localeRoot, rootDir })
            const report = JSON.parse(await readFile(join(rootDir, 'report.json'), 'utf8'))
            const entries = (report.groups as FakeGroup[]).map((group) => ({
                id: computeGroupId(group),
                keys: group.keys.map((item) => item.key),
                reason: '已人工评估并保留',
                reviewAt: '2027-05-12',
            }))

            await writeFile(join(rootDir, 'allowlist.json'), JSON.stringify({ groups: entries }), 'utf8')
            infoSpy.mockClear()

            await main(['--gate', '--max-groups=5', '--allowlist=allowlist.json'], { localeRoot, rootDir })

            expect(process.exitCode).toBeUndefined()
            expect(errorMessages()).toEqual([])
            expect(infoMessages()).toEqual([
                'Duplicate message gate passed: 2 groups within budget 5, allowlist coverage complete.',
            ])
        })
    })
})
