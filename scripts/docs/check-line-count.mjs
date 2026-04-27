#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

const TARGETS = [
    {
        file: 'README.md',
        warningLimit: 300,
        errorLimit: 400,
        rationale: '根目录 README 应保持门户摘要形态，避免继续膨胀成细节手册。',
    },
    {
        file: 'docs/plan/roadmap.md',
        warningLimit: 800,
        errorLimit: 900,
        rationale: '路线图主文档只保留近线阶段窗口与索引，超过 error 线前必须继续深度归档。',
    },
    {
        file: 'docs/plan/todo-archive.md',
        warningLimit: 1800,
        errorLimit: 2200,
        rationale: '待办归档主窗口只保留最近若干阶段，超过 error 线前必须继续区间分片。',
    },
    {
        file: 'docs/reports/regression/current.md',
        warningLimit: 300,
        errorLimit: 400,
        rationale: '活动回归窗口应只保留最近 1 - 2 个阶段或近线记录，超限前先滚动归档。',
    },
]

function countLines(content) {
    if (content.length === 0) {
        return 0
    }

    return content.split(/\r?\n/u).length
}

async function inspectTarget(target) {
    const absolutePath = path.join(projectRoot, target.file)
    const content = await readFile(absolutePath, 'utf8')
    const lines = countLines(content)

    if (lines > target.errorLimit) {
        return {
            ...target,
            lines,
            severity: 'error',
        }
    }

    if (lines > target.warningLimit) {
        return {
            ...target,
            lines,
            severity: 'warning',
        }
    }

    return {
        ...target,
        lines,
        severity: 'pass',
    }
}

async function main() {
    const results = await Promise.all(TARGETS.map(inspectTarget))
    const warnings = results.filter((item) => item.severity === 'warning')
    const errors = results.filter((item) => item.severity === 'error')

    for (const result of results) {
        let prefix = '[docs-line-count] ok'

        if (result.severity === 'error') {
            prefix = '[docs-line-count] error'
        } else if (result.severity === 'warning') {
            prefix = '[docs-line-count] warning'
        }

        console.info(`${prefix}: ${result.file} -> ${result.lines} lines (warn>${result.warningLimit}, error>${result.errorLimit})`)
    }

    if (warnings.length > 0) {
        console.warn('\n[docs-line-count] warning summary:')
        for (const warning of warnings) {
            console.warn(`- ${warning.file}: ${warning.lines} lines. ${warning.rationale}`)
        }
    }

    if (errors.length > 0) {
        console.error('\n[docs-line-count] error summary:')
        for (const error of errors) {
            console.error(`- ${error.file}: ${error.lines} lines. ${error.rationale}`)
        }

        process.exitCode = 1
        return
    }

    console.info('\n[docs-line-count] passed: no document exceeded the error threshold.')
}

await main()
