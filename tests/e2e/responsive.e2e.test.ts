import { devices, expect, test } from '@playwright/test'
import { MOBILE_READING_FIXTURE_HTML } from '../helpers/mobile-reading-fixture'

test.use({ ...devices['iPhone 13'] })

test.describe('Responsive Design E2E Tests', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
        await page.goto('/')
        // 等待页面完全加载
        await page.waitForLoadState('networkidle')

        // 桌面端导航应隐藏
        const desktopNav = page.locator('.app-header__nav.desktop-only')
        await expect(desktopNav).not.toBeVisible()

        // 移动端菜单按钮
        const menuBtn = page.locator('#mobile-menu-btn')
        await expect(menuBtn).toBeVisible()

        // 点击按钮
        await menuBtn.click()

        // 抽屉菜单应可见 (PrimeVue Drawer 组件)
        const drawer = page.locator('.mobile-drawer')
        await expect(drawer).toBeVisible({ timeout: 10000 })

        // 检查移动端导航链接 (Articles/文章)
        await expect(drawer.getByRole('link', { name: /Articles|文章/ })).toBeVisible()
    })

    test('should keep article content inside the viewport on narrow screens', async ({ page }) => {
        await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })

        /* 夹具挂在正文容器之外（复用 `.markdown-body` 样式）：正文由 v-html 渲染，
         * 水合与阅读量自增都会重渲染并覆盖注入内容，挂在 Vue 管理节点内会造成假失败。
         * 「表格包装 / 复制写入剪贴板」由 `components/article-content.test.ts` 与
         * `utils/web/rendered-markdown.test.ts` 覆盖；这里验证窄屏 CSS 契约与触控可见性。 */
        await page.evaluate((html) => {
            document.querySelector('#reading-fixture-host')?.remove()
            const host = document.createElement('div')
            host.id = 'reading-fixture-host'
            host.className = 'markdown-body'
            host.style.padding = '0 1rem'
            host.innerHTML = html
            document.body.appendChild(host)
        }, MOBILE_READING_FIXTURE_HTML)

        const host = page.locator('#reading-fixture-host')
        await expect(host).toBeVisible()

        /* 覆盖验收区间 360–430px：宽表 / 长 URL / 长行内代码都不得撑破页面。 */
        for (const width of [360, 390, 430]) {
            await page.setViewportSize({ width, height: 800 })
            const metrics = await page.evaluate(() => ({
                innerWidth: window.innerWidth,
                scrollWidth: document.documentElement.scrollWidth,
            }))
            expect(metrics.scrollWidth, `页面级横向滚动出现在 ${width}px`).toBeLessThanOrEqual(metrics.innerWidth)
        }

        const tableRegion = host.locator('.table-scroll')
        await expect(tableRegion).toHaveAttribute('tabindex', '0')
        await expect(tableRegion).toHaveAttribute('role', 'region')

        const overflowX = await tableRegion.evaluate((element) => getComputedStyle(element).overflowX)
        expect(['auto', 'scroll']).toContain(overflowX)

        /* 键盘可达：聚焦容器后方向键应能横向浏览（不要求鼠标 / 触摸）。 */
        await page.setViewportSize({ width: 360, height: 800 })
        await tableRegion.focus()
        for (let index = 0; index < 8; index++) {
            await page.keyboard.press('ArrowRight')
        }
        await expect.poll(async () => tableRegion.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)

        /* 粗指针设备没有 hover 过程，复制按钮必须常显且达到触控尺寸。 */
        const copyWrapper = host.locator('.copy-code-wrapper')
        await expect(copyWrapper).toBeVisible()
        expect(await copyWrapper.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')

        const copyButton = host.locator('.copy-code-button')
        const box = await copyButton.boundingBox()
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    })

    test('should open, navigate and close the mobile table of contents', async ({ page }) => {
        await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })

        /* 首屏 SSR 已渲染按钮，但水合完成前点击会被丢弃；以 ClientOnly 搜索按钮转为可用作为水合完成信号。 */
        await page.waitForFunction(() => {
            const button = document.querySelector('#search-btn')
            return button !== null && !button.hasAttribute('disabled')
        }, { timeout: 15000 })

        const trigger = page.locator('.post-detail__toc-trigger')
        await expect(trigger).toBeVisible()
        const triggerBox = await trigger.boundingBox()
        expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44)

        const drawer = page.locator('.post-detail__toc-drawer[role="dialog"]')
        /* SSR 首屏按钮可见但可能尚未水合：重试点击直到抽屉真正打开，避免「点了没反应」的假失败。 */
        await expect(async () => {
            await trigger.click()
            await expect(drawer).toBeVisible({ timeout: 1000 })
        }).toPass({ timeout: 15000 })

        const firstTocLink = drawer.locator('.toc__link').first()
        await expect(firstTocLink).toBeVisible()
        await firstTocLink.click()

        /* 点击目录后抽屉应关闭，并滚动到对应标题附近。 */
        await expect(drawer).toBeHidden()
        await expect.poll(async () => page.evaluate(() => {
            const heading = document.getElementById('section-1')
            return heading ? Math.abs(heading.getBoundingClientRect().top) : Number.POSITIVE_INFINITY
        }), { message: '目录跳转后标题未进入视口' }).toBeLessThan(200)

        /* 关闭后不得残留滚动锁（body overflow / data-scroll-locked 都要恢复）。 */
        const lockState = await page.evaluate(() => ({
            bodyOverflow: getComputedStyle(document.body).overflow,
            inlineOverflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight,
        }))
        expect(lockState.bodyOverflow).not.toBe('hidden')
        expect(lockState.inlineOverflow).not.toBe('hidden')
        expect(lockState.paddingRight).toBe('')

        /* 作者元信息在窄屏可换行，分享按钮达到 44px 触控尺寸。 */
        const authorWhiteSpace = await page.locator('.post-detail__author').first().evaluate((element) => getComputedStyle(element).whiteSpace)
        expect(authorWhiteSpace).not.toBe('nowrap')

        const shareButton = page.getByTestId('article-share-primary')
        await shareButton.scrollIntoViewIfNeeded()
        const shareBox = await shareButton.boundingBox()
        expect(shareBox?.height ?? 0).toBeGreaterThanOrEqual(44)

        const copyLinkButton = page.getByTestId('article-share-copy-link')
        const copyLinkBox = await copyLinkButton.boundingBox()
        expect(copyLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    })

    test.skip('should handle post reading on mobile', async ({ page }) => {
        // 需要数据库数据，待实现测试数据设置
        await page.goto('/posts/hello-momei-test')
    })
})
