#!/usr/bin/env node

/**
 * 归档目录失效相对链接扫描（报告模式，不修改文件、不阻断流程）。
 *
 * 口径：
 * 1. 扫描面为 `docs/plan/archive/`、`docs/reports/regression/archive/` 与
 *    `docs/design/governance/`（后者按申报口径含按日期治理记录，不只 `archive/` 子目录）；
 * 2. 与 `docs:check:links` 不同，本脚本**包含 fenced code block 与行内代码内的链接文本**，
 *    以便完整复现历史写法；报告同时给出「门禁可见」与「仅扫描口径可见」的拆分；
 * 3. **只做存在性判定**，不校验锚点、不校验路径穿越与正文机器路径——锚点与绝对路径由
 *    `docs:check:links` 负责；
 * 4. 判定为失效：目标路径（去掉 `#anchor`）解析后文件不存在，且补 `.md` 扩展名后仍不存在；
 *    本地绝对路径（盘符 / UNC / POSIX 绝对路径）同样计为失效。
 *
 * 快照语义：默认扫描工作区（存在性取文件系统，与门禁一致，因此依赖本机 gitignored 产物）；
 * `--ref=<commit>` 扫描该提交的树（存在性取 `git ls-tree` 成员集）。两种模式对同一提交
 * 可能因未跟踪产物得到不同计数，比较时须使用同一模式。
 *
 * 用法：
 * - `pnpm docs:scan:archive-links`：扫描当前工作区；
 * - `pnpm docs:scan:archive-links --ref=<commit>`：扫描指定提交；
 * - `pnpm docs:scan:archive-links --json=<path>`：明细落盘。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * 扫描目录 → 报告分组键。`governance` 按申报口径覆盖整个治理目录（含按日期记录），
 * 因此报告会额外给出 `archive` 子目录的文件计数。
 */
export const SCAN_ROOTS = {
    plan: 'docs/plan/archive/',
    regression: 'docs/reports/regression/archive/',
    governance: 'docs/design/governance/',
}

/** 立项申报基数（自写存在性口径）与当时的分类拆分。申报值取自立项工作区快照，未入库。 */
export const DECLARED_BASELINE = {
    total: 791,
    byGroup: { plan: 231, regression: 421, governance: 139 },
    byClass: { siblingJump: 124, movedOrDeleted: 180, codePath: 445, other: 42 },
}

export const CLASS_LABELS = {
    siblingJump: '同级上跳',
    movedOrDeleted: '已迁移或已删除',
    codePath: '代码路径',
    other: '其余',
    absolute: '本地绝对路径',
}

// 与 scripts/docs/check-links.mjs 的 LINK_RE 保持同一形态：两处口径必须同步，
// 否则「门禁可见 / 仅扫描口径可见」的拆分失去对照意义。已知边界：两者都不剥离
// 链接 title（`[x](./a.md "t")`），带 title 的归档链接会被判为失效。
const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g
const ABS_PATH_RE = /^(?:[a-zA-Z]:[\\/]|\\\\|\/)/
const EXTERNAL_RE = /^(https?:|mailto:|tel:|www\.|<)/
const BODY_ABS_PATH_RE = /(?<![a-zA-Z])(?:[a-zA-Z]:[\\/][^\s`)'"，。；：！？、`]+|\\\\[A-Za-z0-9][^\s`)'"，。；：！？、`]+)/g

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: { ref: null, json: null },
        values: {
            '--ref': { key: 'ref' },
            '--json': { key: 'json' },
        },
    })
}

export function groupOf(file) {
    for (const [key, prefix] of Object.entries(SCAN_ROOTS)) {
        if (file.startsWith(prefix)) {
            return key
        }
    }
    return null
}

function runGit(args, root = projectRoot) {
    return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    })
}

function walkMarkdownFiles(dir, base = dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (entry === '.git' || entry === 'node_modules' || entry === '.nuxt' || entry === '.output') {
            continue
        }
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
            walkMarkdownFiles(full, base, out)
        } else if (entry.endsWith('.md')) {
            out.push(relative(base, full).replaceAll('\\', '/'))
        }
    }
    return out
}

export function listSnapshotFiles(ref, root = projectRoot) {
    try {
        const args = ref ? ['ls-tree', '-r', '-z', '--name-only', ref] : ['ls-files', '-z']
        return runGit(args, root).split('\0').filter(Boolean)
    } catch (error) {
        if (ref) {
            throw new Error(`[archive-links] 无法读取提交快照: ${ref}（${error.status ?? 'unknown'}）`)
        }
        return walkMarkdownFiles(root)
    }
}

function readAtRef(ref, root, file) {
    if (!ref) {
        return readFileSync(join(root, ...file.split('/')), 'utf8')
    }
    try {
        return runGit(['show', `${ref}:${file}`], root)
    } catch (error) {
        throw new Error(`[archive-links] 无法读取 ${ref}:${file}（${error.status ?? 'unknown'}）`)
    }
}

/**
 * 快照内存在性判定：工作区取文件系统（与门禁一致），指定提交取树成员（含目录前缀）。
 */
export function createExistenceProbe(ref = null, root = projectRoot) {
    if (!ref) {
        return (relPath) => existsSync(join(root, ...relPath.split('/')))
    }
    const files = new Set(listSnapshotFiles(ref, root))
    const dirs = new Set()
    for (const file of files) {
        let dir = file
        while (dir.includes('/')) {
            dir = dir.slice(0, dir.lastIndexOf('/'))
            dirs.add(dir)
        }
    }
    return (relPath) => files.has(relPath) || dirs.has(relPath)
}

function toRepoRelative(absolutePath, root = projectRoot) {
    const rel = relative(root, resolve(absolutePath)).replaceAll('\\', '/')
    if (!rel || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) {
        return null
    }
    return rel
}

function resolveTarget(file, pathPart, root = projectRoot) {
    const absolute = resolve(join(root, ...file.split('/')), '..', pathPart)
    return toRepoRelative(absolute, root)
}

/** 行内代码区间，用于标记「门禁不可见」的链接文本。 */
function inlineCodeRanges(line) {
    const ranges = []
    let index = 0
    while (index < line.length) {
        if (line[index] !== '`') {
            index++
            continue
        }
        const end = line.indexOf('`', index + 1)
        if (end < 0) {
            break
        }
        ranges.push([index, end])
        index = end + 1
    }
    return ranges
}

/**
 * 分类单条失效链接，供差量归因使用：
 * - `siblingJump`：`./x` 形态但同名文件在同级上一跳（`../x`）存在；
 * - `movedOrDeleted`：`.md` 目标缺失，但同名文件在仓库其他位置存在（已迁移或已删除映射）；
 * - `codePath`：目标不是 `.md`（代码 / 产物路径）；
 * - `other`：其余。
 */
export function classifyBrokenLink({ file, pathPart, candidates, exists }) {
    if (!pathPart.endsWith('.md')) {
        return 'codePath'
    }
    if (!pathPart.includes('../')) {
        const parent = file.split('/').slice(0, -1)
        const upTarget = [...parent.slice(0, -1), pathPart.replace(/^\.\//, '')].join('/')
        if (exists(upTarget)) {
            return 'siblingJump'
        }
    }
    return candidates.length > 0 ? 'movedOrDeleted' : 'other'
}

export function scanArchiveLinks(options = {}) {
    const { ref = null, root = projectRoot } = options
    const files = options.files ?? listSnapshotFiles(ref, root)
    const exists = options.exists ?? createExistenceProbe(ref, root)
    const read = options.read ?? ((file) => readAtRef(ref, root, file))
    const archiveFiles = files.filter((file) => groupOf(file) && file.endsWith('.md'))
    const basenameIndex = new Map()
    for (const file of files) {
        const name = basename(file)
        if (!basenameIndex.has(name)) {
            basenameIndex.set(name, [])
        }
        basenameIndex.get(name).push(file)
    }

    const items = []
    for (const file of archiveFiles) {
        const lines = read(file).split('\n')
        let inFence = false
        for (const [lineIndex, line] of lines.entries()) {
            if (/^\s*```/.test(line)) {
                inFence = !inFence
                continue
            }
            const codeRanges = inlineCodeRanges(line)
            for (const match of line.matchAll(LINK_RE)) {
                const target = match[2]
                if (!target || EXTERNAL_RE.test(target)) {
                    continue
                }
                const [pathPart] = target.split('#')
                if (!pathPart) {
                    continue
                }
                const insideInlineCode = codeRanges.some(([start, end]) => match.index > start && match.index < end)
                const gateVisible = !inFence && !insideInlineCode
                if (ABS_PATH_RE.test(pathPart)) {
                    items.push({
                        file,
                        group: groupOf(file),
                        line: lineIndex + 1,
                        target: pathPart,
                        label: match[1],
                        class: 'absolute',
                        gateVisible,
                    })
                    continue
                }
                const resolved = resolveTarget(file, pathPart, root)
                if (resolved && exists(resolved)) {
                    continue
                }
                if (resolved && !pathPart.endsWith('.md') && exists(`${resolved}.md`)) {
                    continue
                }
                const candidates = basenameIndex.get(basename(pathPart)) ?? []
                items.push({
                    file,
                    group: groupOf(file),
                    line: lineIndex + 1,
                    target: pathPart,
                    label: match[1],
                    class: classifyBrokenLink({ file, pathPart, candidates, exists }),
                    gateVisible,
                })
            }
            if (inFence) {
                continue
            }
            const linkless = line.replace(LINK_RE, '')
            for (const match of linkless.matchAll(BODY_ABS_PATH_RE)) {
                items.push({
                    file,
                    group: groupOf(file),
                    line: lineIndex + 1,
                    target: match[0],
                    label: '',
                    class: 'bodyPath',
                    gateVisible: true,
                })
            }
        }
    }

    const byGroup = {}
    const byClass = {}
    const byFile = {}
    const filesByGroup = {}
    let archiveFileCount = 0
    for (const file of archiveFiles) {
        const group = groupOf(file)
        filesByGroup[group] = (filesByGroup[group] ?? 0) + 1
        if (file.includes('/archive/')) {
            archiveFileCount++
        }
    }
    for (const item of items) {
        byClass[item.class] = (byClass[item.class] ?? 0) + 1
    }
    const linkItems = items.filter((item) => item.class !== 'bodyPath')
    for (const item of linkItems) {
        byGroup[item.group] = (byGroup[item.group] ?? 0) + 1
        byFile[item.file] = (byFile[item.file] ?? 0) + 1
    }
    const scanOnly = items.filter((item) => !item.gateVisible)

    return {
        ref: ref ?? 'worktree',
        scannedFileCount: archiveFiles.length,
        archiveFileCount,
        filesByGroup,
        brokenCount: linkItems.length,
        bodyPathCount: items.length - linkItems.length,
        brokenFileCount: Object.keys(byFile).length,
        gateVisibleCount: linkItems.length - scanOnly.length,
        scanOnlyCount: scanOnly.length,
        byGroup,
        byClass,
        byFile,
        items,
    }
}

function renderDeltaTable(report) {
    const lines = [
        '| 目录 | 申报基数 | 实测 | 差 |',
        '| :--- | ---: | ---: | ---: |',
    ]
    for (const key of Object.keys(SCAN_ROOTS)) {
        const actual = report.byGroup[key] ?? 0
        lines.push(`| ${key} | ${DECLARED_BASELINE.byGroup[key]} | ${actual} | ${actual - DECLARED_BASELINE.byGroup[key]} |`)
    }
    lines.push(`| **合计** | ${DECLARED_BASELINE.total} | ${report.brokenCount} | ${report.brokenCount - DECLARED_BASELINE.total} |`)
    return lines
}

function renderClassTable(report) {
    const lines = ['| 分类 | 申报基数 | 实测 |', '| :--- | ---: | ---: |']
    for (const key of ['siblingJump', 'movedOrDeleted', 'codePath', 'other']) {
        lines.push(`| ${CLASS_LABELS[key]} | ${DECLARED_BASELINE.byClass[key]} | ${report.byClass[key] ?? 0} |`)
    }
    for (const key of ['absolute', 'bodyPath']) {
        const actual = report.byClass[key] ?? 0
        if (actual > 0) {
            lines.push(`| ${key === 'absolute' ? CLASS_LABELS.absolute : '正文机器路径'} | - | ${actual} |`)
        }
    }
    return lines
}

export function renderReport(report) {
    return [
        `[archive-links] 扫描目录：${Object.keys(SCAN_ROOTS).join(' / ')}（快照：${report.ref}）`,
        `[archive-links] 扫描 md ${report.scannedFileCount} 个（其中 archive 子目录 ${report.archiveFileCount} 个；`
        + `plan ${report.filesByGroup.plan ?? 0} / regression ${report.filesByGroup.regression ?? 0} / governance ${report.filesByGroup.governance ?? 0}），`
        + `失效 ${report.brokenCount} 处 / ${report.brokenFileCount} 个文件`,
        `[archive-links] 门禁可见 ${report.gateVisibleCount} 处，仅扫描口径可见（fenced / 行内代码）${report.scanOnlyCount} 处，正文机器路径 ${report.bodyPathCount} 处`,
        '',
        '## 与申报基数差量（负值 = 当前快照失效更少；申报值取自立项工作区快照，未入库）',
        ...renderDeltaTable(report),
        '',
        '## 分类差量',
        ...renderClassTable(report),
    ].join('\n')
}

export function main(argv = process.argv) {
    const { ref, json } = parseArgs(argv)
    let report
    try {
        report = scanArchiveLinks({ ref })
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
        return null
    }
    console.log(renderReport(report))
    if (json) {
        const outputPath = resolve(projectRoot, json)
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
        console.log(`[archive-links] 明细已写入 ${json}`)
    }
    return report
}

if (isDirectExecution(import.meta.url)) {
    main()
}
