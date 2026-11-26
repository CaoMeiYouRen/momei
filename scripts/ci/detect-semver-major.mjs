#!/usr/bin/env node
import process from 'node:process'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

/**
 * Dependabot PR 语义化版本升级检测。
 *
 * 目标：只把 major 升级识别出来阻止自动合并，minor / patch 维持既有自动合并。
 * 标题样本：
 * - `Bump lodash from 4.17.20 to 4.17.21` → patch
 * - `Bump nuxt from 4.5.2 to 4.6.0` → minor
 * - `Bump vue from 3.4.0 to 4.0.0` → major
 * - `Bump actions/checkout from 4 to 5` → major（github-actions 生态常见两段式）
 * - `Bump @scope/pkg from 1.2.3 to 2.0.0-beta.1` → major（预发布不改变主版本判定）
 * - `Bump the nuxt-runtime group with 4 updates` → none（分组只收 minor / patch，见 dependabot.yml）
 * - `Update foo requirement from ^1.0.0 to ^2.0.0` → none（range 不是精确版本对）
 */

const VERSION_PAIR_PATTERN = /from\s+v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+][0-9A-Za-z.-]+)?\s+to\s+v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+][0-9A-Za-z.-]+)?/i

function toComparableParts(major, minor, patch) {
    return [Number(major), Number(minor ?? 0), Number(patch ?? 0)]
}

function formatVersion(major, minor, patch) {
    return [major, minor, patch].filter((part) => part !== undefined).join('.')
}

/**
 * 解析 PR 标题中的 `from x.y.z to a.b.c` 版本对（minor / patch 段可省略）。
 * @param {string} title PR 标题
 * @returns {{ from: string, to: string, bump: 'major' | 'minor' | 'patch' | 'none' } | null}
 */
export function parseSemverBump(title) {
    if (typeof title !== 'string' || title.trim() === '') {
        return null
    }

    const match = VERSION_PAIR_PATTERN.exec(title)
    if (!match) {
        return null
    }

    const fromParts = toComparableParts(match[1], match[2], match[3])
    const toParts = toComparableParts(match[4], match[5], match[6])

    let bump
    if (toParts[0] !== fromParts[0]) {
        // 降级同样按 major 变更处理：不允许依赖 PR 静默把主版本退回去。
        bump = 'major'
    } else if (toParts[1] !== fromParts[1]) {
        bump = 'minor'
    } else if (toParts[2] !== fromParts[2]) {
        bump = 'patch'
    } else {
        bump = 'none'
    }

    return {
        from: formatVersion(match[1], match[2], match[3]),
        to: formatVersion(match[4], match[5], match[6]),
        bump,
    }
}

/**
 * 输出升级类型，用于 workflow 判定与标签。
 * @param {string} title PR 标题
 * @returns {'major' | 'minor' | 'patch' | 'none'}
 */
export function classifySemverBump(title) {
    return parseSemverBump(title)?.bump ?? 'none'
}

function main() {
    const options = parseCliOptions(process.argv, {
        defaults: { title: '' },
        values: {
            '--title': { key: 'title' },
        },
    })
    const title = options.title || process.env.PR_TITLE || ''

    process.stdout.write(`${classifySemverBump(title)}\n`)
}

if (isDirectExecution(import.meta.url)) {
    main()
}
