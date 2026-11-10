#!/usr/bin/env node

/**
 * 原文级重复键扫描（`i18n:audit:raw-duplicates`）。
 *
 * 为什么需要：`JSON.parse` 对同一对象内的重复键**静默保留最后一个**，五语 key 漂移
 * 与合并冲突都可能留下 `"save": "...", "save": "..."` 形态；`i18n:check-sync` 只比较
 * 解析后的键集合，看不到被覆盖的那一条。本脚本直接扫描 JSON 原文，按对象栈检测同一
 * 对象内的重复键，并给出路径与行号。
 *
 * 边界：只检测「同一对象内重复」，不同对象复用同名 key 属正常结构；数组内对象以父键
 * 作为路径（不含下标）；key 按原文比较，`\u0061` 与 `a` 这类等价写法不归一。解析器只做
 * 最小 JSON 词法（字符串 / 转义 / 容器 / 逗号），不校验完整语法（`JSON.parse` 已负责）。
 *
 * 用法：
 * - `node scripts/i18n/audit-raw-duplicate-keys.mjs`（默认 warning 面，恒退出 0）
 * - `--mode=error` 有发现时退出 1；`--format=json` 输出机器可读结果。
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const DEFAULT_FORMAT = 'text'
const DEFAULT_MODE = 'warn'

function parseArguments(argv) {
    return parseCliOptions(argv, {
        defaults: {
            format: DEFAULT_FORMAT,
            mode: DEFAULT_MODE,
        },
        values: {
            '--format': {
                key: 'format',
                allowedValues: ['json', 'text'],
                invalidMessage: () => 'Unsupported format value',
                parse: (value) => value.trim() || DEFAULT_FORMAT,
            },
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: () => 'Unsupported mode value',
                parse: (value) => value.trim() || DEFAULT_MODE,
            },
        },
    })
}

/**
 * 扫描 JSON 原文中的同对象重复键。
 * @param {string} content
 * @returns {{ key: string, path: string, line: number, firstLine: number }[]}
 */
export function findRawDuplicateKeys(content) {
    const findings = []
    const stack = []
    let index = 0
    let line = 1
    let expectKey = false
    let pendingKey = null
    const length = content.length

    const readString = () => {
        // 调用方保证 content[index] === '"'
        index += 1
        let value = ''
        while (index < length) {
            const char = content[index]
            if (char === '\\') {
                value += content.slice(index, index + 2)
                index += 2
                continue
            }
            if (char === '"') {
                index += 1
                return value
            }
            if (char === '\n') {
                line += 1
            }
            value += char
            index += 1
        }
        return value
    }

    const currentPath = () => stack
        .map((frame) => frame.key)
        .filter((key) => typeof key === 'string' && key.length > 0)
        .join('.')

    while (index < length) {
        const char = content[index]

        if (char === '\n') {
            line += 1
            index += 1
            continue
        }
        if (char === ' ' || char === '\t' || char === '\r') {
            index += 1
            continue
        }
        if (char === '{') {
            stack.push({ type: 'object', keys: new Map(), key: pendingKey })
            pendingKey = null
            expectKey = true
            index += 1
            continue
        }
        if (char === '[') {
            stack.push({ type: 'array', key: pendingKey })
            pendingKey = null
            expectKey = false
            index += 1
            continue
        }
        if (char === '}' || char === ']') {
            stack.pop()
            pendingKey = null
            expectKey = false
            index += 1
            continue
        }
        if (char === ',') {
            pendingKey = null
            expectKey = stack[stack.length - 1]?.type === 'object'
            index += 1
            continue
        }
        if (char === ':') {
            index += 1
            continue
        }
        if (char === '"') {
            const keyLine = line
            const value = readString()
            if (expectKey) {
                let cursor = index
                while (cursor < length && /\s/.test(content[cursor])) {
                    if (content[cursor] === '\n') {
                        line += 1
                    }
                    cursor += 1
                }
                if (content[cursor] === ':') {
                    const frame = stack[stack.length - 1]
                    if (frame?.keys.has(value)) {
                        findings.push({
                            key: value,
                            path: currentPath(),
                            line: keyLine,
                            firstLine: frame.keys.get(value),
                        })
                    } else {
                        frame?.keys.set(value, keyLine)
                    }
                    pendingKey = value
                    expectKey = false
                    index = cursor + 1
                    continue
                }
            }
            continue
        }
        index += 1
    }

    return findings
}

async function collectLocaleFiles(root = LOCALE_ROOT) {
    const entries = await readdir(root, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
        const fullPath = join(root, entry.name)
        if (entry.isDirectory()) {
            files.push(...await collectLocaleFiles(fullPath))
        } else if (entry.name.endsWith('.json')) {
            files.push(fullPath)
        }
    }
    return files
}

export async function auditRawDuplicateKeys(root = LOCALE_ROOT) {
    const files = await collectLocaleFiles(root)
    const results = []
    for (const file of files) {
        const content = await readFile(file, 'utf8')
        const findings = findRawDuplicateKeys(content)
        if (findings.length > 0) {
            results.push({ file: relative(ROOT_DIR, file), findings })
        }
    }
    return { fileCount: files.length, results }
}

function renderText(report) {
    if (report.results.length === 0) {
        return `[i18n-raw-duplicates] OK：${report.fileCount} 个 JSON 文件未发现同对象重复键`
    }
    const lines = [`[i18n-raw-duplicates] 发现 ${report.results.length} 个文件存在同对象重复键：`]
    for (const result of report.results) {
        for (const finding of result.findings) {
            const location = finding.path ? `${finding.path}.${finding.key}` : finding.key
            lines.push(`- ${result.file}:${finding.line} 重复键 ${location}（首次出现在第 ${finding.firstLine} 行）`)
        }
    }
    return lines.join('\n')
}

async function main() {
    const options = parseArguments(process.argv.slice(2))
    const report = await auditRawDuplicateKeys()

    if (options.format === 'json') {
        console.info(JSON.stringify(report, null, 2))
    } else {
        console.info(renderText(report))
    }

    if (report.results.length > 0 && options.mode === 'error') {
        process.exitCode = 1
    }
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error('Failed to audit raw duplicate locale keys:', error)
        process.exitCode = 1
    })
}
