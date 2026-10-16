import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 认证状态文件路径
const authFile = path.join(__dirname, '.auth', 'admin.json')

// 检查认证状态文件是否存在
function hasStoredAuth(): boolean {
    try {
        return fs.existsSync(authFile)
    } catch {
        return false
    }
}

async function gotoAdminRoute(page: import('@playwright/test').Page, routePath: string) {
    const retryableNavigationErrors = [
        'interrupted by another navigation',
        'NS_BINDING_ABORTED',
        'frame was detached',
    ]

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await page.goto(routePath, { waitUntil: 'domcontentloaded' })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (!retryableNavigationErrors.some((fragment) => message.includes(fragment))) {
                throw error
            }
        }

        try {
            await expect(page).toHaveURL(new RegExp(`${routePath}(?:\\?|$)`), { timeout: 10000 })
            return
        } catch (error) {
            if (attempt === 1) {
                throw error
            }
        }
    }
}

/** 取元素边框盒（几何断言用；元素不可见时抛错，避免静默通过）。 */
async function wrapperBoxOf(locator: { boundingBox: () => Promise<{ width: number, height: number } | null> }) {
    const box = await locator.boundingBox()

    if (!box) {
        throw new Error('无法取得元素边框盒（元素不可见或未渲染）')
    }

    return box
}

test.describe('Admin E2E Tests', () => {
    // 如果全局设置已保存认证状态，使用它；否则尝试登录
    test.use({
        storageState: hasStoredAuth() ? authFile : undefined,
    })

    test.beforeEach(async ({ page }) => {
        const auth = new AuthHelper(page)
        try {
            await auth.ensureAdminSession()
        } catch {
            // 登录失败，跳过测试
            test.skip()
        }
    })

    test('should load admin dashboard/posts', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/posts')
        // 增加超时时间以应对慢速渲染
        await expect(page.locator('h1, .admin-page-header').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin settings', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/settings')
        await expect(page.locator('form, .settings-content, .p-card').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load extended admin management pages', async ({ page }) => {
        /* 该用例是单函数内的多路由串行矩阵（每条一次导航 + 可见性等待），随迁移路由逐批增长，
         * 已贴默认 30s 预算；显式抬高超时，使「新增路由」不再挤压既有等待余量
         * （历史审计提示：8 → 9 行后隔离复跑最高 24.7s ≈ 82% 预算；
         * 组件型目标首路由批次：原「should load admin categories and tags」单测折入本矩阵，
         * 11 → 13 行，避免同一路由两次导航挤占预算；行数增加后隔离复跑实测 45.3s（本机负载较高时），
         * 故超时同步抬到 90s 以保留余量）。 */
        test.setTimeout(90000)

        const routeMatrix = [
            ['/admin/users', '.caomei-data-table, .user-management'],
            ['/admin/comments', '.caomei-data-table, .admin-page-container'],
            ['/admin/submissions', '.caomei-data-table, .admin-page-container'],
            ['/admin/friend-links', '.caomei-data-table, .admin-friend-links'],
            ['/admin/external-links', '.caomei-data-table, .admin-page-container'],
            ['/admin/waitlist', '.caomei-data-table, .admin-page-container'],
            ['/admin/ad/campaigns', '.caomei-data-table, .admin-page-container'],
            ['/admin/ad/placements', '.caomei-data-table, .admin-page-container'],
            ['/admin/migrations/link-governance', '.caomei-data-table, .admin-link-governance'],
            ['/admin/subscribers', '.caomei-data-table, .admin-subscribers'],
            ['/admin/posts', '.caomei-data-table, .admin-page-container'],
            ['/admin/categories', '.caomei-data-table'],
            ['/admin/tags', '.caomei-data-table'],
            ['/admin/ai', '.caomei-tabs'],
            ['/admin/marketing', '.caomei-data-table'],
        ] as const

        for (const [routePath, readySelector] of routeMatrix) {
            await gotoAdminRoute(page, routePath)
            await expect(page.locator(readySelector).first()).toBeVisible({ timeout: 15000 })
        }
    })

    test('should support category search and aggregate toggle interactions', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/categories')
        await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 15000 })

        const searchInput = page.getByRole('textbox', { name: '搜索分类...' })
        await expect(searchInput).toBeVisible({ timeout: 10000 })
        await searchInput.fill('tech')
        await expect(searchInput).toHaveValue('tech')

        /* 迁移期几何还原断言（把此前只靠人工探针核对的「结构性还原」升级为门禁项）：
         * ① 搜索字段宽度按迁移前实测固有宽显式约束为 261px（caomei 字段默认 `width: 100%`，
         *    不约束会在 flex 行内撑满容器）；② 分页器水平居中由 `--caomei-data-table-pagination-justify`
         *    承载（caomei 默认右对齐）。 */
        const searchBox = await wrapperBoxOf(page.locator('.admin-filters__search').first())
        expect(Math.round(searchBox.width), '搜索字段宽度应还原为迁移前实测值 261px').toBe(261)
        const paginationJustify = await page.locator('.caomei-data-table__pagination').first().evaluate(
            (element) => getComputedStyle(element as HTMLElement).justifyContent,
        )
        expect(paginationJustify, '分页器应水平居中（迁移前 PrimeVue 默认）').toContain('center')

        const aggregateSwitch = page.getByRole('switch', { name: '聚合翻译版本' })
        await expect(aggregateSwitch).toBeVisible({ timeout: 10000 })
        await aggregateSwitch.click()

        await expect(page.locator('.caomei-data-table').first()).toBeVisible({ timeout: 10000 })
    })

    test('should load admin marketing page', async ({ page }) => {
        // 同上：含弹窗打开重试（内层 `toPass` 20s），串行下需显式抬高超时。
        test.setTimeout(60000)

        await gotoAdminRoute(page, '/admin/marketing')
        // 本页根容器为 `.admin-marketing`（不含通用的 `.admin-page-container`）。
        await expect(page.locator('.admin-marketing')).toBeVisible({ timeout: 15000 })

        /* 列表（本批迁移面）就绪；刷新入口在表格之上（caomei `DataTable` 无 `#header` 插槽）。 */
        await expect(page.locator('.caomei-data-table').first()).toBeVisible({ timeout: 15000 })

        /* 弹窗本体仍为 PrimeVue `Dialog`（浮层豁免），其内表单控件已迁移：断言打开后出现 caomei 字段。
         * 用 `toPass` 重试「点击 → 断言」以规避 SSR 未水合的静默失效（同 `/admin/ai` 页的口径）。 */
        await expect(async () => {
            await page.getByRole('button', { name: '创建推送' }).click()
            await expect(page.locator('[role="dialog"] .caomei-select').first()).toBeVisible({ timeout: 5000 })
        }).toPass({ timeout: 20000 })
    })

    test('should load notification management with translated delivery log copy', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/notifications')

        await expect(page.getByRole('heading', { name: '通知管理' })).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('heading', { level: 3, name: '通知投递审计' })).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('button', { name: '刷新' })).toBeVisible({ timeout: 15000 })
        await expect(page.locator('body')).not.toContainText('pages.admin.notifications.delivery_logs')
        await expect(page.locator('body')).not.toContainText('pages.admin.settings.system.notifications.delivery_logs')
    })

    test('should load admin ai page', async ({ page }) => {
        // 本用例含「就绪等待 + 页签点击重试」（内层 `toPass` 20s），默认 30s 在整文件串行下会被挤爆。
        test.setTimeout(60000)

        await gotoAdminRoute(page, '/admin/ai')
        await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 15000 })

        /* 默认页签为「使用统计」；「任务记录」页签承载本批主要迁移面（任务列表），
         * 故断言其可激活并渲染 caomei 表格（Tabs 族 + 表格同页签内一体迁移）。
         *
         * 用 `toPass` 重试「点击 → 断言」：SSR 首屏可见但水合未完成时，单次点击会静默失效
         * （实测：单次点击后页签仍停在「使用统计」）——重试整段才能既避开水合竞态、又不引入固定延时。 */
        const tasksTab = page.getByRole('tab', { name: '任务记录' })
        const tasksTable = page.locator('.caomei-data-table').first()

        await expect(async () => {
            await tasksTab.click()
            await expect(tasksTable).toBeVisible({ timeout: 5000 })
        }).toPass({ timeout: 20000 })
        await expect(page.getByRole('tab', { name: /统计|Stats/i })).toBeVisible({ timeout: 15000 })
    })
})
