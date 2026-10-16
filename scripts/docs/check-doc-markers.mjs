#!/usr/bin/env node

/**
 * 检查文档标记完整性（`docs/` 下受版本控制的 `*.md`），覆盖三类已发生事故：
 * 1. **块级 HTML 注释未闭合**——VitePress 把 md 当 Vue SFC 编译，未闭合注释会
 *    直接以 `SyntaxError: Unexpected EOF in comment` 中断 `docs:build`
 *    （2026-10-16：3 处 `regression-window` 标记被截断，`lint:md` 与
 *    `docs:check:i18n / line-count / links` 全绿但站点构建失败）；
 * 2. **孤立注释尾行**（整行只剩 `-->`）——滚动归档迁出窗口时的残留，文档站会把
 *    它按正文渲染；
 * 3. **`regression-window` 标记不成对 / 形态非法**——同一文件内按栈配对：`end` 无
 *    `start`、`end` 的 id 与最近 `start` 不一致、文件结束仍有未闭合的 `start`，
 *    以及含标记 token 却解析不出的行（截断标记会在此处响亮失败）。
 *
 * 判据与 VitePress 编译语义**对齐而非凭空收紧**（用 `markdown-it` + `@vue/compiler-dom`
 * 实测校准，样本见 tests/scripts/check-doc-markers.test.ts）。规则 1 模拟 markdown-it
 * 的 HTML block type 2：命中块级 `<!--` 时，该行及其后续行会被**原样**输出，直到某行
 * 出现 `-->`（跨行闭合）或到达文件末尾；被原样输出的文本里只要残留未闭合的 `<!--`
 * （含「本行先闭合、行尾又开了一个」形态），Vue 解析即报错。据此**不拦**：
 * - 合法多行注释（`-->` 在后续行出现）与 HTML5 空注释（`<!-->` / `<!--->`）；
 * - 正文中段的行内 `<!--`（不构成块级开头）；
 * - 顶层缩进 ≥4 列、或位于 fenced code block 内的 `<!--`（缩进代码块 / 代码块会被转义）；
 * - 与容器边界对齐的 fence 判定：闭合 fence 需「同字符 + 不短于开启 fence + 同 blockquote
 *   深度」，更浅的行会提前终止 fence 并按普通 markdown 继续扫描（与 markdown-it 一致）。
 *
 * 扫描面与 `check-links` 不同：**包含 `archive` 目录**（归档分片正是事故现场，
 * 而 `check-links` 的 `EXCLUDED_DIRS` 把 `archive` 排除在扫描面外），仅排除
 * VitePress 构建产物与依赖目录。
 *
 * 已知边界（不追求与 VitePress 完全等价，均为当前语料 0 命中的窄形态）：
 * - 列表项 / 嵌套列表内**缩进 ≥4 列**的块级开头按缩进代码块跳过，而 markdown-it 按
 *   列表内容缩进判定为列表内块级开头（漏报侧）；
 * - 顶层**缩进 ≥4 列的 fence**（markdown-it 视其为缩进代码块）仍按 fence 跳过，其后的
 *   块级开头因此不被检查（漏报侧；该写法在本仓语料 0 命中，而列表内缩进的 fence 有
 *   真实用例，故按后者优先）；
 * - 只有整行以 `-->` 起始才按规则 2 报残留，正文中以普通符号出现的 `-->` 不报错
 *   （宁可漏报也不引入假阳性）；
 * - 其余两条同为 0 命中的窄形态：① 某行「先闭合、行尾又开 `<!--`」而由**后续块**的
 *   `-->` 跨块闭合时会被误报（未建模跨块拼接）；② 列表项内开启、随后被转义或裁断的
 *   块级注释会漏报；③ `blockquoteDepth` 对「标记间 ≥2 空格」的嵌套引用欠计一层
 *   （开启 / 闭合同风格时两侧抵消，未观测到判定偏差）。
 *
 * 说明：
 * - 本检查是「构建阻断类」门禁，已接入 `docs:build` / `docs:dev`，只读、无副作用；
 * - 用法：`node scripts/docs/check-doc-markers.mjs`（或 `pnpm docs:check:markers`）。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDirectExecution } from '../shared/cli.mjs'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DOC_ROOT_DIR_NAME = 'docs'
// VitePress 构建产物目录（即使被 .gitignore 排除也显式跳过，兼容非 git 环境的目录遍历）
export const BUILD_OUTPUT_DIR = join(DOC_ROOT_DIR_NAME, '.vitepress', 'dist')

// 目录遍历兜底（非 git 环境）时的排除清单：依赖与生成物目录。
// 注意：**不排除 `archive`**——归档分片是本检查的重点扫描面。
export const EXCLUDED_DIRS = new Set([
    'node_modules',
    '.git',
    '.nuxt',
    '.output',
    '.data',
    '.nitro',
    '.cache',
    'dist',
    'coverage',
    'logs',
    'tmp',
    'artifacts',
    'opc-doc',
    '.session',
    'research-output',
    '.vitepress',
    '.agents',
    '.claude',
    'playwright-report',
    'test-results',
    '.lighthouseci',
    '.playwright-mcp',
    '.vercel',
    '.vscode',
])

const FENCE_RE = /^\s*(?:>[ \t]?)*([`~]{3,})/
const INLINE_CODE_RE = /`[^`]*`/g
const ORPHAN_CLOSE_RE = /^-->(\s|$)/
// blockquote（`>`）与列表标记（`- ` / `1. ` 等）可重复嵌套；每个标记只吞掉**至多一个**
// 空白（多出的空白属内容缩进，交由缩进上限判定），块级注释开头判定前先剥离
const BLOCK_MARKER_RE = /^(?:\s*(?:>[ \t]?|[-*+][ \t]|\d+[.)][ \t]))+/
// markdown-it 的 html_block 缩进上限：≥4 列属缩进代码块（会被转义），Tab 计 4 列
const INDENT_CODE_WIDTH = 4
const TAB_WIDTH = 4
// 标记 token 大小写不敏感（`regression-window:Start` 等变体不应静默漏过配对判定）
const WINDOW_MARKER_TOKEN_RE = /regression-window:(?:start|end)/i
// id 允许包含空格（既有记账口径为 `<slug>:<标题>:<日期>`，标题含空格，如
// `hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21`）
const WINDOW_START_RE = /<!--\s*regression-window:start:(.+?)\s*-->/gi
const WINDOW_END_RE = /<!--\s*regression-window:end:(.+?)\s*-->/gi

// 目录遍历（非 git 环境兜底），返回 md 文件绝对路径列表
export function walk(root, out = []) {
    for (const entry of readdirSync(root)) {
        if (EXCLUDED_DIRS.has(entry)) {
            continue
        }
        const full = join(root, entry)
        if (statSync(full).isDirectory()) {
            walk(full, out)
        } else if (entry.endsWith('.md')) {
            out.push(full)
        }
    }
    return out
}

// 收集 `docs/` 下受版本控制的 md 文件；非 git 环境回退到目录遍历
export function collectDocFiles(root = projectRoot) {
    try {
        const output = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '*.md'], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        })
        const prefix = `${DOC_ROOT_DIR_NAME}/`
        const files = output
            .split('\0')
            .filter(Boolean)
            .filter((file) => file.startsWith(prefix) && !file.startsWith(`${BUILD_OUTPUT_DIR}/`))
            .map((file) => join(root, ...file.split('/')))
        if (files.length > 0) {
            return files.sort()
        }
    } catch {
        // 非 git 环境（如单元测试临时目录）走目录遍历兜底
    }
    const docRoot = join(root, DOC_ROOT_DIR_NAME)
    return existsSync(docRoot) ? walk(docRoot) : []
}

// 剥离行内代码段：`<!--` 出现在行内代码里会被 markdown-it 转义，不影响构建，
// 不应被本检查误判
export function stripInlineCode(line) {
    return line.replace(INLINE_CODE_RE, '')
}

// 前导空白宽度（Tab 计 4 列），用于缩进代码块判定
export function leadingIndentWidth(line) {
    let width = 0
    for (const char of line) {
        if (char === ' ') {
            width += 1
        } else if (char === '\t') {
            width += TAB_WIDTH
        } else {
            break
        }
    }
    return width
}

// 行首的 blockquote 容器深度（`>` 标记个数）；fence 的容器边界与之绑定
export function blockquoteDepth(line) {
    const marker = line.match(/^\s*(?:>[ \t]?)*/)[0]
    return (marker.match(/>/g) ?? []).length
}

// 块级注释开头判定（markdown-it HTML block type 2）：先排除顶层缩进代码块（≥4 列，含 Tab），
// 再剥离 blockquote / 列表标记，要求剩余缩进 < 4 列且以 `<!--` 起始
export function startsBlockComment(line) {
    if (leadingIndentWidth(line) >= INDENT_CODE_WIDTH) {
        return false
    }
    const content = line.replace(BLOCK_MARKER_RE, '')
    return leadingIndentWidth(content) < INDENT_CODE_WIDTH && content.trimStart().startsWith('<!--')
}

// 跳过 fenced code block（返回可继续扫描的行下标；未闭合则返回行数）。
// 闭合条件与 markdown-it 对齐：① 同字符且长度不短于开启 fence（CommonMark）；
// ② 与开启 fence **同容器深度**（引用边界会提前终止 fence，故更浅的行不算 fence 内容）。
export function skipFencedBlock(lines, startIndex) {
    const opener = lines[startIndex]
    const fence = opener.match(FENCE_RE)[1]
    const openerDepth = blockquoteDepth(opener)
    const closingFenceRe = new RegExp(`^\\s*(?:>[ \\t]?)*${fence[0]}{${fence.length},}`)
    let cursor = startIndex + 1
    while (cursor < lines.length) {
        const depth = blockquoteDepth(lines[cursor])
        if (depth < openerDepth) {
            // 容器提前结束：fence 在此终止，该行需按普通 markdown 继续扫描
            return cursor
        }
        if (depth === openerDepth && closingFenceRe.test(lines[cursor])) {
            return cursor + 1
        }
        cursor += 1
    }
    return cursor
}

// 标记 fenced code block 覆盖的行号（1 基），供规则 2 / 3 豁免（与规则 1 同一套 fence 口径）
export function collectFencedLineNumbers(lines) {
    const fenced = new Set()
    let index = 0
    while (index < lines.length) {
        if (FENCE_RE.test(lines[index])) {
            const nextIndex = skipFencedBlock(lines, index)
            for (let line = index; line < nextIndex; line += 1) {
                fenced.add(line + 1)
            }
            index = nextIndex
            continue
        }
        index += 1
    }
    return fenced
}

// 在「原样输出的注释区块」内定位未闭合 `<!--` 所在行（1 基）；全部闭合返回 null。
// 状态机按字符顺序处理，支持「本行先闭合、行尾又开一个」「跨行闭合」与 HTML5 空注释
// （`<!-->` / `<!--->`：闭合符与开启符重叠，故闭合搜索从开启符后 2 个字符起）
export function findUnclosedCommentLine(region, firstLineNumber) {
    let open = false
    let openLine = null

    region.forEach((line, offset) => {
        let cursor = 0
        while (cursor < line.length) {
            const nextOpen = line.indexOf('<!--', cursor)
            const nextClose = line.indexOf('-->', cursor)

            if (!open) {
                if (nextOpen === -1) {
                    return
                }
                open = true
                openLine = firstLineNumber + offset
                cursor = nextOpen + 2
                continue
            }

            if (nextClose === -1) {
                return
            }
            open = false
            cursor = nextClose + 3
        }
    })

    return open ? openLine : null
}

// 找出会让 VitePress 报 `Unexpected EOF in comment` 的行号（1 基）。
// 模拟 markdown-it HTML block type 2：块级 `<!--` 起始后，本行及后续行被原样输出，
// 直到出现 `-->` 或到达文件末尾。
export function findUnterminatedCommentLines(lines) {
    const findings = []
    let index = 0

    while (index < lines.length) {
        if (FENCE_RE.test(lines[index])) {
            index = skipFencedBlock(lines, index)
            continue
        }
        if (!startsBlockComment(lines[index])) {
            index += 1
            continue
        }

        // 命中块级注释开头：原样吞并后续行，直到某行出现 `-->`
        const region = [lines[index]]
        let cursor = index
        while (!region.at(-1).includes('-->') && cursor + 1 < lines.length) {
            cursor += 1
            region.push(lines[cursor])
        }

        const openLine = findUnclosedCommentLine(region, index + 1)
        if (openLine !== null) {
            findings.push(openLine)
        }
        index = cursor + 1
    }

    return findings
}

// 检查单个 md 文件，返回 { line, message } 列表（line 为 1 基行号）
export function checkDocFile(file) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const findings = []
    const openWindows = []
    const unterminatedCommentLines = new Set(findUnterminatedCommentLines(lines))
    const fencedLines = collectFencedLineNumbers(lines)

    lines.forEach((rawLine, index) => {
        const lineNumber = index + 1
        if (fencedLines.has(lineNumber)) {
            return
        }

        const line = stripInlineCode(rawLine)

        if (unterminatedCommentLines.has(lineNumber)) {
            findings.push({
                line: lineNumber,
                message: '块级 HTML 注释未闭合（`<!--` 之后到文件末尾/区块结束都没有 `-->`），会让 VitePress 以 `Unexpected EOF in comment` 中断构建',
            })
        }

        if (!line.includes('<!--') && ORPHAN_CLOSE_RE.test(line.trimStart())) {
            findings.push({
                line: lineNumber,
                message: '孤立注释尾行（整行只剩 `-->`），疑似归档迁出窗口时的残留',
            })
        }

        let matched = false
        for (const match of line.matchAll(WINDOW_START_RE)) {
            matched = true
            openWindows.push({ id: match[1], line: lineNumber })
        }
        for (const match of line.matchAll(WINDOW_END_RE)) {
            matched = true
            const closed = openWindows.pop()
            if (!closed) {
                findings.push({
                    line: lineNumber,
                    message: `\`regression-window:end\` 标记（id=${match[1]}）没有对应的 \`regression-window:start\` 标记`,
                })
                continue
            }
            if (closed.id !== match[1]) {
                findings.push({
                    line: lineNumber,
                    message: `\`regression-window:end\` 标记（id=${match[1]}）与最近的 \`regression-window:start\` 标记（id=${closed.id}，第 ${closed.line} 行）不一致`,
                })
            }
        }

        if (!matched && WINDOW_MARKER_TOKEN_RE.test(line)) {
            findings.push({
                line: lineNumber,
                message: '回归窗口标记格式不合法，应形如 `<!-- regression-window:start:<id> -->` / `<!-- regression-window:end:<id> -->`（含完整 id 与闭合符 `-->`）',
            })
        }
    })

    for (const window of openWindows) {
        findings.push({
            line: window.line,
            message: `\`regression-window:start\` 标记（id=${window.id}）缺少对应的 \`regression-window:end\` 标记`,
        })
    }

    return findings
}

// 聚合检查：返回 { errors, findings, files }，errors 为 `相对路径:行号 问题` 形式的字符串
export function runCheckDocMarkers(options = {}) {
    const root = options.root ?? projectRoot
    const files = options.files ?? collectDocFiles(root)
    const errors = []
    const findings = []

    for (const file of files) {
        const rel = relative(root, file).replaceAll('\\', '/')
        for (const finding of checkDocFile(file)) {
            findings.push({ file: rel, ...finding })
            errors.push(`${rel}:${finding.line} ${finding.message}`)
        }
    }

    return { errors, findings, files }
}

export function main() {
    const { errors, files } = runCheckDocMarkers()

    if (errors.length > 0) {
        console.error(`[docs-check-markers] ${errors.length} 个标记问题:`)
        for (const error of errors) {
            console.error(`  - ${error}`)
        }
        process.exitCode = 1
        return
    }
    console.log(`[docs-check-markers] OK：${files.length} 个 md 文件的注释与回归窗口标记完整`)
}

if (isDirectExecution(import.meta.url)) {
    main()
}
