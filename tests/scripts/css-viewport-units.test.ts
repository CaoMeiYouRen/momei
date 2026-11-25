import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 公开面视口单位守卫：每个 `dvh` 声明前必须有一行同属性的 `vh` 回退。
 *
 * 为什么需要：`dvh` 在旧浏览器不可用，缺少回退会退化成 `min-height: auto`，
 * 粘性 / 全屏布局直接塌陷；这类问题在 Playwright（现代内核）里看不出来。
 * 后台页面（`pages/admin/**`、`components/admin/**`）不在本阶段范围，跳过。
 */

const roots = ['components', 'pages', 'layouts', 'styles']
const ignoredSegments = [`${path.sep}admin${path.sep}`, '/admin/']
const sourceExtensions = new Set(['.scss', '.css', '.vue'])

function walk(directory: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            if (ignoredSegments.some((segment) => fullPath.includes(segment)) || fullPath.includes('node_modules')) {
                continue
            }
            walk(fullPath, files)
            continue
        }
        if (sourceExtensions.has(path.extname(entry.name))) {
            files.push(fullPath)
        }
    }
    return files
}

function isCommentLine(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('<!--')
}

/**
 * 找出缺少回退的 `dvh` 声明。
 *
 * 判定要求：同一规则块内，紧邻的上一行必须是同属性的 `vh` 声明。
 * 用花括号深度定位规则块，避免「上一行恰好是另一个选择器的 vh」被误判为回退。
 */
export function findDvhWithoutFallback(source: string): string[] {
    const lines = source.split('\n')
    const failures: string[] = []
    let depth = 0

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? ''
        const dvhCount = (line.match(/dvh/g) ?? []).length

        if (dvhCount > 0 && !isCommentLine(line)) {
            const depthBefore = depth
            const declarations = line.split(';').map((part) => part.trim()).filter((part) => part.includes('dvh'))

            for (const declaration of declarations) {
                const property = declaration.split(':')[0]?.trim() ?? ''
                let previousIndex = index - 1
                while (previousIndex >= 0 && (lines[previousIndex] ?? '').trim() === '') {
                    previousIndex--
                }
                const previousLine = lines[previousIndex] ?? ''
                const sameBlock = !previousLine.includes('}') && !previousLine.includes('{')
                const hasFallback = sameBlock
                    && !isCommentLine(previousLine)
                    && previousLine.includes('vh')
                    && !previousLine.includes('dvh')
                    && previousLine.trim().split(':')[0]?.trim() === property

                if (!hasFallback || depthBefore <= 0) {
                    failures.push(`line ${index + 1}: ${property}`)
                }
            }
        }

        for (const char of line) {
            if (char === '{') {
                depth++
            } else if (char === '}') {
                depth--
            }
        }
    }

    return failures
}

describe('公开面视口单位', () => {
    const files = roots.flatMap((root) => walk(path.resolve(process.cwd(), root)))
    const failures = files.flatMap((file) => findDvhWithoutFallback(fs.readFileSync(file, 'utf8')).map((item) => `${path.relative(process.cwd(), file)} ${item}`))
    const dvhCount = files.reduce((count, file) => count + (fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.includes('dvh') && !isCommentLine(line)).length), 0)

    it('至少存在 6 处 dvh 声明（守卫非空转）', () => {
        expect(dvhCount).toBeGreaterThanOrEqual(6)
    })

    it('每处 dvh 都有同属性 vh 回退', () => {
        expect(failures).toEqual([])
    })

    it('跨规则块的「回退」不算回退（判别性自测）', () => {
        const source = `.a {\n    min-height: 100vh;\n}\n.b {\n    min-height: 100dvh;\n}`
        expect(findDvhWithoutFallback(source)).toHaveLength(1)
    })

    it('注释中的 dvh 不参与判定', () => {
        const source = `/* min-height: 100dvh 说明 */\n.a {\n    min-height: 100vh;\n    min-height: 100dvh;\n}`
        expect(findDvhWithoutFallback(source)).toEqual([])
    })
})
