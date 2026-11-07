import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 过渡组件收口守卫。
 *
 * 第七十一阶段条目 3 把最后一批 V1 消费者（`/posts/[id]`、`/friend-links`、编辑器媒体设置）
 * 切到 caomei 实现后，并存期的过渡组件（`*-v2.vue`）已无存在理由：
 * - `app-avatar` / `app-uploader` 不再按路由择库，收敛为单一 caomei 实现；
 * - `content-language-switcher` 与 posts 三件套同步去掉 `-v2` 后缀；
 * - `AppAvatarV2` / `AppUploaderV2` / `AdminContentLanguageSwitcherV2` 等标识符零残留。
 *
 * 本守卫锁住收口后容易回退的两件事：
 * 1. **版本标记文件不得再出现**（`*-v2.vue` / `*_v2.vue` / `*V2.vue` 等），避免无声明地重建并存机制；
 * 2. **三个共享壳不得重新引入路由择库**（`@/lib/ui-library` 的 `resolveUiLibraryForRoute*`），
 *    否则会在单一实现上悄悄恢复「按路由回退 V1」的第二套事实源。
 */

const SCAN_ROOTS = ['components', 'pages', 'layouts'] as const
const VERSION_MARK_PATTERN = /v\d/iu

async function collectVersionMarkedFiles(dir: string): Promise<string[]> {
    let entries

    try {
        entries = await readdir(dir, { withFileTypes: true })
    } catch {
        return []
    }

    const found: string[] = []
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            found.push(...await collectVersionMarkedFiles(fullPath))
            continue
        }

        if (entry.isFile() && entry.name.endsWith('.vue') && VERSION_MARK_PATTERN.test(entry.name)) {
            found.push(path.relative(process.cwd(), fullPath))
        }
    }

    return found
}

describe('过渡组件收口', () => {
    it('不得再存在带版本标记的过渡组件文件', async () => {
        const roots = SCAN_ROOTS.map((root) => path.join(process.cwd(), root))
        const found = (await Promise.all(roots.map((root) => collectVersionMarkedFiles(root)))).flat().sort()

        expect(found, `发现未收口的过渡组件：${found.join(', ')}`).toEqual([])
    })

    for (const relativePath of [
        'components/app-avatar.vue',
        'components/app-uploader.vue',
        'components/admin/content-language-switcher.vue',
    ]) {
        it(`${relativePath}：收敛为单一实现，不得再引用路由择库事实源`, async () => {
            const source = await readFile(path.join(process.cwd(), relativePath), 'utf8')

            expect(source).not.toMatch(/@\/lib\/ui-library/u)
            expect(source).not.toMatch(/resolveUiLibraryForRoute/u)
            expect(source).not.toMatch(/<AppAvatar\b|<AppUploader\b/u)
        })
    }
})
