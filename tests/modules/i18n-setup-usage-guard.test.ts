import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `useI18n()` 调用位置守卫。
 *
 * `useI18n()` 依赖 Vue 组件实例，只能在 `setup()` 顶层调用。写在回调 / 事件处理 / `computed` 工厂里
 * 会在运行期拿不到实例（历史缺陷：`snippet-aggregate-dialog` 与 `creator-stats-panel` 曾在
 * 弹窗回调与指标格式化函数内调用）。组合式函数（`composables/**`）里的调用由调用方在 setup 中执行，
 * 属合法用法，不在扫描面内。
 *
 * 判定口径：只扫 `.vue` 的 `<script setup>` 块——其函数体在文件里是**顶格**的，
 * 因此任何**缩进**的 `useI18n()` 都落在内部函数里。注释先剥离，避免说明文字误报。
 */

const SCAN_ROOTS = ['components', 'pages', 'layouts'] as const
const SCRIPT_SETUP = /<script\b[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/gu
const INDENTED_USE_I18N = /^[ \t]+.*\buseI18n\s*\(/mu

async function collectVueFiles(directory: string): Promise<string[]> {
    let entries

    try {
        entries = await readdir(path.join(process.cwd(), directory), { withFileTypes: true, recursive: true })
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []
        }

        throw error
    }

    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.vue'))
        .map((entry) => path.join(entry.parentPath ?? path.dirname(path.join(process.cwd(), directory)), entry.name))
}

function stripComments(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//gu, '')
        .replace(/(^|[^:])\/\/.*$/gmu, '$1')
}

describe('i18n：useI18n() 只能在 setup 顶层调用', () => {
    it('组件 / 页面 / 布局的 <script setup> 内不存在缩进（函数体内）的 useI18n() 调用', async () => {
        const files = (await Promise.all(SCAN_ROOTS.map((root) => collectVueFiles(root)))).flat()
        const offenders: string[] = []

        for (const file of files) {
            const source = await readFile(file, 'utf8')

            for (const match of source.matchAll(SCRIPT_SETUP)) {
                if (INDENTED_USE_I18N.test(stripComments(match[1] ?? ''))) {
                    offenders.push(path.relative(process.cwd(), file))
                    break
                }
            }
        }

        expect(offenders, `以下文件在 setup 内的函数体中调用了 useI18n()：${offenders.join(', ')}`).toEqual([])
    })
})
