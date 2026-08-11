#!/usr/bin/env node

/**
 * 检查仓库内所有 .md 文件的本地链接：
 * 1. 相对路径指向的文件必须存在；
 * 2. 锚点（#xxx）必须对应目标文件中的某个标题——按"宽松规范化"比较
 *    （小写 + 移除标点/符号（含 emoji）/空白），兼容 GitHub / VS Code / VitePress
 *    三种 slug 规则差异，只抓真实断链与假锚点。
 * 3. 拒绝本地绝对路径（POSIX `/xxx` 或 Windows `C:/xxx` / `\\server`）；
 * 4. 拒绝路径穿越（`../..` 解析结果超出仓库根目录）。
 * 5. 正文文本（含行内代码，跳过 fenced code block）中拒绝个人机器路径
 *    （Windows 盘符 `C:\xxx` / `C:/xxx`、UNC `\\server\share`）——仅高特征模式，
 *    不扫描 POSIX `/xxx` 概念路径（`/etc`、`/tmp` 等教学示例普遍，易误报）。
 *
 * 文件范围：默认通过 `git ls-files` 取受版本控制的 *.md，与 CI checkout 状态一致，
 * 自动排除 node_modules / artifacts / opc-doc / research-output 等被 .gitignore
 * 忽略的生成物目录；非 git 环境（如单元测试临时目录）回退到目录遍历，
 * 遍历时按 EXCLUDED_DIRS 排除生成物与依赖目录。
 *
 * 说明：
 * - 跨平台锚点 slug 规则不一致（GitHub 移除全角标点，VS Code / VitePress 保留，
 *   且对 `.` 等字符转 '-' 的策略也不同），因此不做精确 slug 匹配；
 * - 含全角标点的标题锚点在部分平台仍可能失效，由文档规范约束（标题避免全角标点）。
 * - 用法：node scripts/docs/check-links.mjs（或 pnpm docs:check:links）
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDirectExecution } from '../shared/cli.mjs'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// 目录遍历兜底时的排除清单：依赖、构建/测试产物与被 .gitignore 忽略的目录
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
    'archive',
    '.agents',
    '.claude',
    'playwright-report',
    'test-results',
    '.lighthouseci',
    '.playwright-mcp',
    '.vercel',
    '.vscode',
])

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g
// 本地绝对路径：POSIX（/xxx）、Windows 盘符（C:/xxx / C:\xxx）、UNC（\\server）
const ABS_PATH_RE = /^(?:[a-zA-Z]:[\\/]|\\\\|\/)/
// 正文中的个人机器路径（高特征）：Windows 盘符 + 分隔符、UNC 双反斜杠前缀；
// 盘符分支加字母负向断言，排除 URL scheme 末尾（https:// 的 s:/）被误判为盘符；
// UNC 分支要求 `\\` 后首字符为字母/数字，避免 markdown 表格转义（\|）与
// 反斜杠开头的符号文本（\\.map、\\*）被误判为 UNC 路径；
// 排除空白/括号/引号/反引号/中文标点等路径边界字符，避免把相邻文本一并吞入
const BODY_ABS_PATH_RE = /(?<![a-zA-Z])(?:[a-zA-Z]:[\\/][^\s`)'"，。；：！？、`]+|\\\\[A-Za-z0-9][^\s`)'"，。；：！？、`]+)/g

// 目录遍历（非 git 环境兜底），返回 .md 文件绝对路径列表
export function walk(root, out = []) {
    for (const entry of readdirSync(root)) {
        if (EXCLUDED_DIRS.has(entry)) {
            continue
        }
        const full = join(root, entry)
        const st = statSync(full)
        if (st.isDirectory()) {
            walk(full, out)
        } else if (entry.endsWith('.md')) {
            out.push(full)
        }
    }
    return out
}

// 宽松规范化：小写 + 移除标点/符号（含 emoji）/空白，用于跨平台锚点比较
export function looseNorm(str) {
    return str.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '')
}

// 判断相对路径（POSIX 分隔符）是否位于被排除的目录下（任意路径段命中即排除，
// 与目录遍历的 EXCLUDED_DIRS 语义一致：archive / dist 等归档或生成物目录不校验）
export function isExcludedPath(relativePath) {
    return relativePath.split('/').some((segment) => EXCLUDED_DIRS.has(segment))
}

// 提取文件的标题集合（跳过 fenced code block），返回宽松规范化后的形式
export function collectTitles(file) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const titles = new Set()
    let inCode = false
    for (const line of lines) {
        if (/^\s*```/.test(line)) {
            inCode = !inCode
            continue
        }
        if (inCode) {
            continue
        }
        const m = line.match(/^(#{1,6})\s+(.+)$/)
        if (!m) {
            continue
        }
        const title = m[2]
            .replace(/`[^`]*`/g, '')
            .replace(/\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/[#*_~]/g, '')
            .trim()
        titles.add(looseNorm(title))
    }
    return titles
}

// 锚点规范化：兼容原文与 URL 编码两种写法
export function normAnchor(anchor) {
    try {
        return looseNorm(decodeURIComponent(anchor))
    } catch {
        return looseNorm(anchor)
    }
}

// GitHub 行号锚点（如 #L215），指向代码文件的具体行，属于合法用法
const GITHUB_LINE_ANCHOR_RE = /^L\d+$/

// 判断锚点是否指向代码文件行号（#L123 形态），是则跳过标题匹配
export function isLineAnchor(anchor) {
    return GITHUB_LINE_ANCHOR_RE.test(anchor)
}

// 收集受版本控制的 *.md 文件；非 git 环境回退目录遍历。
// git ls-files 返回扁平相对路径，按路径段应用 EXCLUDED_DIRS 过滤，
// 使"归档/生成物目录不校验"的语义与目录遍历一致。
export function collectMdFiles(root = projectRoot) {
    try {
        const output = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '*.md'], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        })
        const files = output
            .split('\0')
            .filter(Boolean)
            .filter((file) => !isExcludedPath(file))
            .map((file) => join(root, ...file.split('/')))
        if (files.length > 0) {
            return files
        }
    } catch {
        // 非 git 环境（如单元测试的临时目录）走目录遍历兜底
    }
    return walk(root)
}

// 检查单个 md 文件，返回错误消息列表（消息格式：相对路径:行号 问题描述）
export function checkFile(file, root = projectRoot) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const selfTitles = collectTitles(file)
    const errors = []
    const rel = relative(root, file).replaceAll('\\', '/')
    let inCode = false

    lines.forEach((line, idx) => {
        if (/^\s*```/.test(line)) {
            inCode = !inCode
            return
        }
        if (inCode) {
            return
        }
        // 去掉行内代码段，避免误匹配代码里的链接
        const clean = line.replace(/`[^`]*`/g, '')
        for (const m of clean.matchAll(LINK_RE)) {
            const target = m[2]
            if (!target || /^(https?:|mailto:|tel:|www\.|<)/.test(target)) {
                continue
            }
            const [pathPart, anchor] = target.split('#')

            if (!pathPart) {
                // 站内锚点：验证当前文件标题
                if (anchor && !selfTitles.has(normAnchor(anchor))) {
                    errors.push(`${rel}:${idx + 1} 站内锚点 "#${anchor}" 在文件中找不到对应标题`)
                }
                continue
            }

            // 本地绝对路径拒绝：md 中的本地链接必须使用相对路径
            // （绝对路径随仓库迁移/平台差异失效，且可能指向项目外文件）
            if (ABS_PATH_RE.test(pathPart)) {
                errors.push(`${rel}:${idx + 1} 链接目标为本地绝对路径，应使用相对路径: ${pathPart}`)
                continue
            }

            const targetFile = resolve(dirname(file), pathPart)

            // 路径穿越拒绝：解析结果不得超出仓库根目录
            // （relative 返回 `..` 开头或跨盘绝对路径均表示越界；
            // 精确匹配 `..` + 分隔符，避免误伤 `..hidden` 类目录名）
            const relTarget = relative(root, targetFile)
            const sep = relTarget.includes('\\') ? '\\' : '/'
            if (relTarget === '..' || relTarget.startsWith(`..${sep}`) || isAbsolute(relTarget)) {
                errors.push(`${rel}:${idx + 1} 链接目标超出项目范围（路径穿越）: ${pathPart}`)
                continue
            }

            // VitePress 支持省略 .md 扩展名的裸路径链接（`./blog` -> `blog.md`），
            // 文件不存在时回退尝试补 .md 扩展名，命中则视为有效
            let resolvedTarget = targetFile
            if (!existsSync(targetFile) && !pathPart.endsWith('.md')) {
                const targetWithMd = resolve(dirname(file), `${pathPart}.md`)
                if (existsSync(targetWithMd)) {
                    resolvedTarget = targetWithMd
                }
            }

            if (!existsSync(resolvedTarget)) {
                errors.push(`${rel}:${idx + 1} 链接目标不存在: ${pathPart}`)
                continue
            }
            if (anchor) {
                // GitHub 行号锚点（#L123）不参与标题匹配
                if (!isLineAnchor(anchor)) {
                    const titles = collectTitles(resolvedTarget)
                    if (!titles.has(normAnchor(anchor))) {
                        errors.push(`${rel}:${idx + 1} 锚点 "#${anchor}" 在 ${pathPart} 中找不到对应标题`)
                    }
                }
            }
        }

        // 正文个人机器路径拒绝：扫描原始行（含行内代码），跳过 fenced code block
        // （上方已处理）；先移除链接语法部分，避免与链接绝对路径检查重复报错
        const linkless = line.replace(LINK_RE, '')
        for (const m of linkless.matchAll(BODY_ABS_PATH_RE)) {
            errors.push(`${rel}:${idx + 1} 正文包含本地绝对路径（个人机器路径），应使用项目相对路径或 <repo-root>/ 占位符: ${m[0]}`)
        }
    })
    return errors
}

// 聚合检查：返回 { errors, files }，files 为实际检查的 md 文件绝对路径列表
export function runCheckLinks(options = {}) {
    const root = options.root ?? projectRoot
    const files = options.files ?? collectMdFiles(root)
    const errors = []
    for (const file of files) {
        errors.push(...checkFile(file, root))
    }
    return { errors, files }
}

export function main() {
    const { errors, files } = runCheckLinks()

    if (errors.length > 0) {
        console.error(`[docs-check-links] ${errors.length} 个链接问题:`)
        for (const error of errors) {
            console.error(`  - ${error}`)
        }
        process.exitCode = 1
        return
    }
    console.log(`[docs-check-links] OK：${files.length} 个 md 文件的本地链接全部有效`)
}

if (isDirectExecution(import.meta.url)) {
    main()
}
