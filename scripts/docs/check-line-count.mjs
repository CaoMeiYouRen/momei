#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_PROFILE = 'default'
export const DEFAULT_MODE = 'error'

export const README_TARGETS = [
    'README.md',
    'README.en-US.md',
    'README.ja-JP.md',
    'README.ko-KR.md',
    'README.zh-TW.md',
].map((file) => ({
    file,
    warningLimit: 300,
    errorLimit: 400,
    rationale: '根目录 README 及其多语言镜像应保持门户摘要形态，避免继续膨胀成细节手册。',
}))

export const BASE_TARGETS = [
    ...README_TARGETS,
    {
        file: 'docs/plan/roadmap.md',
        warningLimit: 800,
        errorLimit: 900,
        rationale: '路线图主文档只保留近线阶段窗口与索引，超过 error 线前必须继续深度归档。',
    },
    {
        file: 'docs/plan/backlog.md',
        warningLimit: 500,
        errorLimit: 700,
        rationale: 'backlog 只保留候选摘要与主线卡片，详细设计与阶段正文应继续下沉到 design / plan 分片。',
    },
    {
        file: 'docs/plan/todo-archive.md',
        warningLimit: 500,
        errorLimit: 700,
        rationale: '待办归档主窗口只保留近线阶段窗口与归档索引；既然已经拆出深度归档，主文件阈值应同步收紧。',
    },
    {
        file: 'docs/reports/regression/current.md',
        warningLimit: 500,
        errorLimit: 700,
        rationale: '活动回归窗口应只保留最近 1 - 2 个阶段或近线记录；超过 warning 后尽快滚动归档，超过 error 线则视为阻断。',
    },
]

export const CANDIDATE_TARGETS = [
    {
        file: 'docs/guide/translation-governance.md',
        warningLimit: 180,
        errorLimit: 220,
        rationale: '翻译治理指南应保持执行口径与操作清单的紧凑形态，避免膨胀成重复规范正文。',
    },
    {
        file: 'docs/guide/deploy.md',
        warningLimit: 220,
        errorLimit: 260,
        rationale: '部署指南应聚焦部署路径与排障入口，细节应继续下沉到专项设计或平台文档。',
    },
    {
        file: 'docs/standards/planning.md',
        warningLimit: 320,
        errorLimit: 380,
        rationale: '规划规范只保留流程与门禁，阶段细节应继续回写到 roadmap / backlog / design 分片。',
    },
    {
        file: 'docs/standards/documentation.md',
        warningLimit: 240,
        errorLimit: 300,
        rationale: '文档规范应持续压缩为规则索引，不应重新承载逐阶段的治理历史。',
    },
]

export const LINE_COUNT_PROFILES = {
    candidate: [...BASE_TARGETS, ...CANDIDATE_TARGETS],
    default: [...BASE_TARGETS],
}

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            mode: DEFAULT_MODE,
            profile: DEFAULT_PROFILE,
        },
        values: {
            '--mode': {
                allowedValues: ['error', 'warn'],
                key: 'mode',
            },
            '--profile': {
                allowedValues: Object.keys(LINE_COUNT_PROFILES),
                key: 'profile',
            },
        },
    })
}

export function countLines(content) {
    if (content.length === 0) {
        return 0
    }

    return content.split(/\r?\n/u).length
}

export async function inspectTarget(target) {
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

export async function collectLineCountReport(options = {}) {
    const profile = options.profile ?? DEFAULT_PROFILE
    const targets = LINE_COUNT_PROFILES[profile] ?? LINE_COUNT_PROFILES.default
    const results = await Promise.all(targets.map(inspectTarget))
    const warnings = results.filter((item) => item.severity === 'warning')
    const errors = results.filter((item) => item.severity === 'error')

    return {
        errors,
        profile,
        results,
        warnings,
    }
}

export async function main(argv = process.argv) {
    const { mode, profile } = parseArgs(argv)
    const { errors, results, warnings } = await collectLineCountReport({ profile })

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
        const summaryLabel = mode === 'error' ? 'error summary' : 'candidate summary'
        const writer = mode === 'error' ? console.error : console.warn

        writer(`\n[docs-line-count] ${summaryLabel}:`)
        for (const error of errors) {
            writer(`- ${error.file}: ${error.lines} lines. ${error.rationale}`)
        }

        if (mode === 'error') {
            process.exitCode = 1
            return
        }

        console.warn('\n[docs-line-count] completed in warn mode: error-threshold breaches are reported for candidate review only.')
        return
    }

    console.info('\n[docs-line-count] passed: no document exceeded the error threshold.')
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
