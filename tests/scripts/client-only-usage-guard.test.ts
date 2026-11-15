import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 「会话驱动型 `ClientOnly` 不得扩散」守卫。
 *
 * 背景：`/settings` 的头像曾用 `ClientOnly` 兜底，因为 SSR 期间拿不到会话（服务端未种
 * `auth:route-session:*`）。这会带来两个问题：首帧缺内容、且在带 hydration mismatch 的
 * patch 里触发 Reka `insertBefore` 运行时错误。会话 SSR 种子落地后，这类兜底不再有理由存在。
 *
 * 规则：
 * 1. 每个 `<ClientOnly>`（含 kebab-case `<client-only>` 写法）必须登记在 allowlist 中，
 *    `file` + `ord`（文件内出现序号）+ `tag` 三者对齐；
 * 2. 登记类目只能是「非会话原因」：`client-only-lib` / `browser-api` / `client-storage` / `cache-isolation`；
 * 3. 显式的 `session` 类目计数必须为 0 —— 以「SSR 拿不到会话」为由新增 `ClientOnly` 直接判红；
 * 4. allowlist 不得残留失效条目（已删除或已去 ClientOnly 的登记必须同步清理）。
 *
 * `cache-isolation` 是「共享 HTML 缓存」约束（`/` 走 SWR 1h、`/posts/:id` 走 ISR 10min），
 * 与「会话不可用」不同：这些页面的 SSR HTML 会被多用户复用，渲染登录态会串号。
 */
const projectRoot = path.resolve(__dirname, '..', '..')
const allowlistPath = path.join(projectRoot, 'scripts/governance/data/client-only-usage-allowlist.json')
const scanRoots = ['components', 'pages', 'layouts']
const scanRootFiles = ['app.vue', 'error.vue']
const allowedCategories = new Set(['browser-api', 'cache-isolation', 'client-only-lib', 'client-storage'])
/** 大小写与 kebab 写法都要覆盖：Vue 内建组件允许 `<client-only>`，只认 PascalCase 会被绕过。 */
const OPEN_TAG_PATTERN = /<client-?only(?:\s[^>]*)?>/gi
const FIRST_INNER_TAG_PATTERN = /^\s*<([A-Za-z][\w.-]*)/

interface ClientOnlyUsage {
    file: string
    ord: number
    tag: string
}

interface AllowlistEntry {
    file: string
    ord: number
    tag: string
    category: string
    reason: string
}

export function collectClientOnlyUsages(content: string, file: string): ClientOnlyUsage[] {
    const usages: ClientOnlyUsage[] = []

    for (const match of content.matchAll(OPEN_TAG_PATTERN)) {
        const rest = content.slice((match.index ?? 0) + match[0].length)
        const tag = FIRST_INNER_TAG_PATTERN.exec(rest)?.[1] ?? '(unknown)'

        usages.push({ file, ord: usages.length + 1, tag })
    }

    return usages
}

function keyOf(entry: { file: string, ord: number }) {
    return `${entry.file}#${entry.ord}`
}

export function findUnregisteredUsages(usages: ClientOnlyUsage[], allowlist: AllowlistEntry[]) {
    const registered = new Set(allowlist.map((entry) => keyOf(entry)))

    return usages.filter((usage) => !registered.has(keyOf(usage)))
}

export function findStaleEntries(usages: ClientOnlyUsage[], allowlist: AllowlistEntry[]) {
    const actual = new Map(usages.map((usage) => [keyOf(usage), usage]))

    return allowlist.filter((entry) => actual.get(keyOf(entry))?.tag !== entry.tag)
}

function collectVueFiles(root: string): string[] {
    const absolute = path.join(projectRoot, root)

    if (!existsSync(absolute)) {
        return []
    }

    const files: string[] = []

    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        const relativePath = path.posix.join(root, entry.name)

        if (entry.isDirectory()) {
            files.push(...collectVueFiles(relativePath))
            continue
        }

        if (entry.isFile() && entry.name.endsWith('.vue')) {
            files.push(relativePath)
        }
    }

    return files
}

function loadAllowlist(): AllowlistEntry[] {
    const parsed = JSON.parse(readFileSync(allowlistPath, 'utf8')) as { entries?: AllowlistEntry[] }

    return parsed.entries ?? []
}

const scannedFiles = [
    ...scanRootFiles.filter((file) => existsSync(path.join(projectRoot, file))),
    ...scanRoots.flatMap((root) => collectVueFiles(root)).sort(),
]
const usages = scannedFiles.flatMap((file) => collectClientOnlyUsages(readFileSync(path.join(projectRoot, file), 'utf8'), file))
const allowlist = loadAllowlist()

describe('client-only usage guard', () => {
    it('扫描到预期的 ClientOnly 用法（防扫描面退化）', () => {
        expect(usages.length).toBeGreaterThan(0)
        expect(statSync(path.join(projectRoot, 'components')).isDirectory()).toBe(true)
    })

    it('每个 ClientOnly 都必须在 allowlist 登记', () => {
        expect(findUnregisteredUsages(usages, allowlist).map((usage) => `${usage.file}#${usage.ord}<${usage.tag}>`)).toEqual([])
    })

    it('allowlist 不得残留失效条目', () => {
        expect(findStaleEntries(usages, allowlist).map((entry) => `${entry.file}#${entry.ord}`)).toEqual([])
    })

    it('仅允许非会话原因，且每条都写明理由', () => {
        const invalid = allowlist.filter((entry) => !allowedCategories.has(entry.category) || !entry.reason?.trim())

        expect(invalid.map((entry) => `${entry.file}#${entry.ord}(${entry.category})`)).toEqual([])
    })

    it('会话驱动型 ClientOnly 计数必须为 0', () => {
        expect(allowlist.filter((entry) => entry.category === 'session')).toEqual([])
    })
})

describe('client-only usage guard - 守卫本身可判红（负向用例）', () => {
    const fixtureAllowlist: AllowlistEntry[] = [
        { category: 'client-only-lib', file: 'components/a.vue', ord: 1, reason: '示例', tag: 'AdminMavonEditorClient' },
    ]

    it('识别 kebab-case 与带属性的写法', () => {
        const fixtureUsages = collectClientOnlyUsages([
            '<client-only><Foo /></client-only>',
            '<ClientOnly :fallback="null"><Bar /></ClientOnly>',
            '<CLIENT-ONLY><Baz /></CLIENT-ONLY>',
        ].join('\n'), 'components/b.vue')

        expect(fixtureUsages.map((usage) => usage.tag)).toEqual(['Foo', 'Bar', 'Baz'])
        expect(fixtureUsages.map((usage) => usage.ord)).toEqual([1, 2, 3])
    })

    it('新增未登记用法会被判红', () => {
        const fixtureUsages = collectClientOnlyUsages('<ClientOnly><Foo /></ClientOnly>', 'components/b.vue')

        expect(findUnregisteredUsages(fixtureUsages, fixtureAllowlist)).toEqual([{ file: 'components/b.vue', ord: 1, tag: 'Foo' }])
    })

    it('同文件内 ord 漂移（前面插入新用法）会被判红', () => {
        const fixtureUsages = collectClientOnlyUsages([
            '<ClientOnly><NewThing /></ClientOnly>',
            '<ClientOnly><AdminMavonEditorClient /></ClientOnly>',
        ].join('\n'), 'components/a.vue')

        // ord 漂移后：新增的第 2 处未登记；原登记位置的 tag 不再匹配，由失效检查判红。
        expect(findUnregisteredUsages(fixtureUsages, fixtureAllowlist)).toEqual([
            { file: 'components/a.vue', ord: 2, tag: 'AdminMavonEditorClient' },
        ])
        expect(findStaleEntries(fixtureUsages, fixtureAllowlist)).toEqual([fixtureAllowlist[0]])
    })

    it('tag 换名会被判红（防止用旧登记掩盖新用途）', () => {
        const fixtureUsages = collectClientOnlyUsages('<ClientOnly><AnotherWidget /></ClientOnly>', 'components/a.vue')

        expect(findStaleEntries(fixtureUsages, fixtureAllowlist)).toEqual([fixtureAllowlist[0]])
    })

    it('已删除文件中的登记会被判红', () => {
        expect(findStaleEntries([], fixtureAllowlist)).toEqual([fixtureAllowlist[0]])
    })
})
