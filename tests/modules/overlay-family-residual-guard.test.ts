import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 浮层族整族迁出 PrimeVue 后的**全仓零残留**守卫。
 *
 * 与 `primevue-residual-guard.test.ts` 的分工：后者覆盖全仓组件 / 图标 / token / class /
 * 依赖 / 包引用；本守卫只盯浮层族的**调用面**（Dialog / Drawer / Popover / DropdownMenu / Menu /
 * ConfirmDialog / `useToast` / `useConfirm` / `v-tooltip`）——这些是运行时服务与指令，
 * 单靠包名扫描不足以发现回填。
 *
 * 不扫描 `*.test.ts`：测试里为验证 V1 兼容或迁移差异会显式引用旧形态。
 * `ConfirmDeleteDialog` 是 momei 自有共享壳（内部已用 `CaomeiDialog`），刻意保留，不计入残留。
 */

/**
 * 按标签名剥离 `<script>` / `<style>` 块（大小写不敏感，支持嵌套与未闭合残片）。
 * 手写扫描而非单次 `replace`：单次正则会被 `<scr<script>ipt>` 这类嵌套输入绕过。
 */
function isTagBoundary(char: string | undefined) {
    return char === undefined || char === '>' || char === '/' || /\s/u.test(char)
}

/** 查找标签起点：要求标签名后是空白 / `>` / `/`，避免 `<scripture>` 被当成 `<script>`。 */
function findTag(lower: string, token: string, from: number): number {
    let index = lower.indexOf(token, from)

    while (index !== -1) {
        if (isTagBoundary(lower[index + token.length])) {
            return index
        }
        index = lower.indexOf(token, index + 1)
    }

    return -1
}

function stripBlockTag(source: string, tagName: string): string {
    const lower = source.toLowerCase()
    const openToken = `<${tagName}`
    const closeToken = `</${tagName}`
    let cursor = 0
    let result = ''

    while (cursor < source.length) {
        const openIndex = findTag(lower, openToken, cursor)
        if (openIndex === -1) {
            result += source.slice(cursor)
            break
        }

        result += source.slice(cursor, openIndex)

        // 从开标签起按深度配对，避免嵌套块只剥掉内层
        let depth = 1
        let searchFrom = openIndex
        while (depth > 0) {
            const nextOpen = findTag(lower, openToken, searchFrom + 1)
            const nextClose = findTag(lower, closeToken, searchFrom + 1)

            if (nextClose === -1) {
                // 未闭合时保留剩余内容：守卫宁可多扫（可能误报）也不能吞掉后半文件
                return result + source.slice(openIndex)
            }

            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth += 1
                searchFrom = nextOpen
                continue
            }

            depth -= 1
            searchFrom = nextClose
        }

        const closeEnd = lower.indexOf('>', searchFrom)
        cursor = closeEnd === -1 ? source.length : closeEnd + 1
    }

    return result
}

function stripNonTemplateBlocks(source: string): string {
    return stripBlockTag(stripBlockTag(source, 'script'), 'style')
}

/** 组件标签匹配：`<Name` 后必须是空白 / `/` / `>`，避免 `<Button` 命中 `<ButtonGroup`。 */
function buildComponentTagPattern(name: string): RegExp {
    return new RegExp(`<${name}[\\s/>]`, 'u')
}

/** 剥离注释后再扫描（注释里引用旧标签名不算残留；大小写/变体闭合均覆盖）。 */
function stripHtmlComments(source: string): string {
    let cursor = 0
    let result = ''

    while (cursor < source.length) {
        const openIndex = source.indexOf('<!--', cursor)
        if (openIndex === -1) {
            result += source.slice(cursor)
            break
        }

        result += source.slice(cursor, openIndex)

        const standardEnd = source.indexOf('-->', openIndex + 4)
        const bangEnd = source.indexOf('--!>', openIndex + 4)
        const ends = [standardEnd, bangEnd].filter((index) => index !== -1)
        const closeEnd = ends.length > 0 ? Math.min(...ends) : -1

        if (closeEnd === -1) {
            result += source.slice(openIndex)
            break
        }

        const closeLength = source.startsWith('--!>', closeEnd) ? 4 : 3
        cursor = closeEnd + closeLength
    }

    return result
}

function stripBlockComments(source: string): string {
    let cursor = 0
    let result = ''

    while (cursor < source.length) {
        const openIndex = source.indexOf('/*', cursor)
        if (openIndex === -1) {
            result += source.slice(cursor)
            break
        }

        result += source.slice(cursor, openIndex)

        const closeIndex = source.indexOf('*/', openIndex + 2)
        if (closeIndex === -1) {
            result += source.slice(openIndex)
            break
        }

        cursor = closeIndex + 2
    }

    return result
}

function stripComments(source: string): string {
    return stripHtmlComments(stripBlockComments(source))
        .replace(/^\s*\/\/.*$/gmu, '')
}

const SCAN_ROOTS = ['components', 'pages', 'layouts', 'composables', 'plugins', 'utils', 'middleware', 'modules']

/** 根级入口文件：`app.vue` 是 provider 挂载点，PrimeVue 全局壳最容易在这里被回填。 */
const SCAN_ROOT_FILES = ['app.vue', 'error.vue']

/**
 * 本族只覆盖 `v-tooltip` 时代的 6 个组件名（浮层 / 菜单根组件）。
 * 其余 PrimeVue 组件与根桶导入由 `primevue-residual-guard.test.ts` 的全仓组件清单覆盖。
 */
const PRIMEVUE_OVERLAY_COMPONENTS = ['Dialog', 'Drawer', 'Popover', 'DropdownMenu', 'Menu', 'ConfirmDialog']

/** `v-tooltip` 指令：只匹配调用形态，注释里以反引号或空格提及不算。 */
const TOOLTIP_DIRECTIVE_PATTERN = /v-tooltip(?=[.:=\s>])/u

const SERVICE_RESIDUE_PATTERNS: readonly [string, RegExp][] = [
    ['primevue/useconfirm 导入', /from\s+['"]primevue\/useconfirm['"]/u],
    ['primevue/usetoast 导入', /from\s+['"]primevue\/usetoast['"]/u],
    ['toast.add(', /\btoast\.add\s*\(/u],
    ['confirm.require(', /\bconfirm\.require\s*\(/u],
]

async function listSourceFiles(directory: string): Promise<string[]> {
    const absolute = path.join(process.cwd(), directory)
    const entries = await readdir(absolute, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const relativePath = path.posix.join(directory, entry.name)

        if (entry.isDirectory()) {
            files.push(...await listSourceFiles(relativePath))
            continue
        }

        if (!/\.(?:vue|ts)$/u.test(entry.name) || /\.(?:test|spec)\.ts$/u.test(entry.name)) {
            continue
        }

        files.push(relativePath)
    }

    return files
}

const productionFiles = [
    ...(await Promise.all(SCAN_ROOTS.map(listSourceFiles))).flat(),
    ...SCAN_ROOT_FILES,
]

function templateOf(source: string): string {
    return stripComments(stripNonTemplateBlocks(source))
}

describe('浮层族：全仓零残留', () => {
    it('扫描面非空且包含根级入口（防止路径写错后守卫静默通过）', () => {
        expect(productionFiles.length).toBeGreaterThan(100)
        expect(productionFiles).toContain('app.vue')
    })

    it('不再使用 v-tooltip 指令（由 AppTooltip 桥接 CaomeiTooltip）', async () => {
        const offenders: string[] = []

        for (const file of productionFiles.filter((item) => item.endsWith('.vue'))) {
            const template = templateOf(await readFile(file, 'utf8'))

            if (TOOLTIP_DIRECTIVE_PATTERN.test(template)) {
                offenders.push(file)
            }
        }

        expect(offenders, `以下文件仍在使用 v-tooltip：${offenders.join(', ')}`).toEqual([])
    })

    it('不再出现浮层族的 PrimeVue 组件标签', async () => {
        const offenders: string[] = []

        for (const file of productionFiles.filter((item) => item.endsWith('.vue'))) {
            const template = templateOf(await readFile(file, 'utf8'))
            const names = PRIMEVUE_OVERLAY_COMPONENTS.filter((name) => buildComponentTagPattern(name).test(template))

            if (names.length > 0) {
                offenders.push(`${file}（${names.join(', ')}）`)
            }
        }

        expect(offenders, `以下文件仍残留在册族 PrimeVue 浮层组件：${offenders.join('; ')}`).toEqual([])
    })

    it('Toast / Confirm 只走 caomei-ui 服务层', async () => {
        const offenders: string[] = []

        for (const file of productionFiles) {
            const source = stripComments(await readFile(file, 'utf8'))

            for (const [label, pattern] of SERVICE_RESIDUE_PATTERNS) {
                if (pattern.test(source)) {
                    offenders.push(`${file}（${label}）`)
                }
            }
        }

        expect(offenders, `以下文件仍有 PrimeVue 服务层残留：${offenders.join('; ')}`).toEqual([])
    })
})

describe('守卫自身：剥离逻辑的嵌套与大小写边界', () => {
    it('大小写不敏感地剥离 script / style 块', () => {
        const source = '<template><Dialog /></template>\n<SCRIPT>const a = 1</SCRIPT>\n<Style>.a{}</STYLE>'

        const result = stripNonTemplateBlocks(source)

        expect(result).toContain('<Dialog />')
        expect(result.toLowerCase()).not.toContain('<script')
        expect(result.toLowerCase()).not.toContain('<style')
    })

    it('嵌套 script 块被完整剥离，不残留内层开标签', () => {
        const source = '<script>outer<script>inner</script>tail</script><template><Menu /></template>'

        const result = stripNonTemplateBlocks(source)

        expect(result).toBe('<template><Menu /></template>')
    })

    it('标签名边界：scripture / styles 等近似标签不被误剥', () => {
        const source = '<template><scripture>x</scripture><styles>y</styles></template>'

        expect(stripNonTemplateBlocks(source)).toBe(source)
    })

    it('剥离 HTML 注释（含 --!> 变体）与块注释', () => {
        const source = '<template><!-- <Dialog /> --><Menu /><!--! hidden --!><Popover /></template>\n/* <Drawer /> */\nconst a = 1'

        const result = stripComments(source)

        expect(result).toContain('<Menu />')
        expect(result).toContain('<Popover />')
        expect(result).not.toContain('Dialog')
        expect(result).not.toContain('Drawer')
        expect(result).toContain('const a = 1')
    })

    it('未闭合的块注释 / 标签保留剩余内容，避免吞掉后半文件', () => {
        const unclosedComment = '<template><Menu /></template>\n/* <Dialog />'
        expect(stripComments(unclosedComment)).toContain('<Dialog />')

        const unclosedScript = '<script>const a = 1<template><Dialog /></template>'
        expect(stripNonTemplateBlocks(unclosedScript)).toContain('<Dialog />')
    })

    it('glob 通配符等非注释片段不被当作块注释开头', () => {
        const source = '<template><input accept="image/*"><Dialog /></template>'

        const result = stripComments(source)

        expect(result).toContain('accept="image/*"')
        expect(result).toContain('<Dialog />')
    })

    it('近似闭合标签不被误判为闭合（</scriptx> 不结束 script 块）', () => {
        const source = '<script>1</scriptx><Dialog /></script><template><Menu /></template>'

        // 若把 </scriptx> 当作闭合，<Dialog /> 会残留在模板区；正确实现应一路剥到 </script>
        expect(stripNonTemplateBlocks(source)).toBe('<template><Menu /></template>')
    })

    it('未闭合的 HTML 注释保留后续模板内容', () => {
        const source = '<template><Menu /></template><!-- <Dialog />'

        expect(stripComments(source)).toContain('<Dialog />')
    })

    it('注释剥离后可继续用于零残留扫描（组合场景）', () => {
        const source = '<template><Menu /><!-- <Dialog /> --></template>\n<script>// v-tooltip\nconst a = 1</script>'

        const result = stripComments(stripNonTemplateBlocks(source))

        expect(result).toContain('<Menu />')
        expect(result).not.toContain('Dialog')
        expect(result).not.toContain('v-tooltip')
    })
})
