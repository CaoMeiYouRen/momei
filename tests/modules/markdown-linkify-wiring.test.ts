import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT_DIR = join(__dirname, '../..')

/**
 * 启用 `linkify: true` 的渲染器清单。
 *
 * markdown-it 15 的 linkify-it 6 默认关闭 `fuzzyLink` / `urlAuth`，这些入口必须调用
 * `applyMarkdownLinkifyCompatibility` 才能保持既有渲染语义；新增渲染器时在此登记，
 * 否则本守卫不会覆盖到它。
 */
const LINKIFY_RENDERER_FILES = [
    'utils/shared/markdown.ts',
    'server/utils/feed.ts',
    'server/utils/fed/mapper.ts',
    'server/routes/fed/outbox/[username].ts',
    'server/api/admin/marketing/campaigns/test.post.ts',
]

/** 去掉注释后再做形态匹配，避免注释里提到函数名就把断言蒙过去。 */
function stripComments(source: string) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function readSourceWithoutComments(relativePath: string) {
    return stripComments(readFileSync(join(ROOT_DIR, relativePath), 'utf-8'))
}

describe('markdown linkify 兼容层接线守卫', () => {
    it.each(LINKIFY_RENDERER_FILES)('%s 实际调用 applyMarkdownLinkifyCompatibility(md)', (relativePath) => {
        const source = readSourceWithoutComments(relativePath)

        expect(source).toMatch(/applyMarkdownLinkifyCompatibility\(\s*md\s*\)/)
    })

    it.each(LINKIFY_RENDERER_FILES.slice(1))('%s 从共享兼容层引入 helper', (relativePath) => {
        const source = readSourceWithoutComments(relativePath)

        expect(source).toMatch(/from '@\/utils\/shared\/markdown-linkify'/)
    })
})
