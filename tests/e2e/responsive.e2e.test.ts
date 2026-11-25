import { devices, expect, test } from '@playwright/test'
import { MOBILE_READING_FIXTURE_HTML } from '../helpers/mobile-reading-fixture'

test.use({ ...devices['iPhone 13'] })


/** 等客户端水合完成：ClientOnly 的搜索按钮从禁用态变为可用。 */
async function waitForHydration(page: import('@playwright/test').Page) {
    await page.waitForFunction(() => {
        const button = document.querySelector('#search-btn')
        return button !== null && !button.hasAttribute('disabled')
    }, { timeout: 15000 })
}

/** 点击汉堡按钮直到抽屉真正打开（兼容 SSR 首屏未水合的点击丢失）。 */
async function openMobileMenu(page: import('@playwright/test').Page) {
    const menuButton = page.locator('#mobile-menu-btn')
    const drawer = page.locator('.mobile-drawer')
    await expect(async () => {
        await menuButton.click()
        await expect(drawer).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15000 })
    return drawer
}

test.describe('Responsive Design E2E Tests', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
        await page.goto('/')
        await waitForHydration(page)

        // 桌面端导航应隐藏
        const desktopNav = page.locator('.app-header__nav.desktop-only')
        await expect(desktopNav).not.toBeVisible()

        // 移动端菜单按钮
        await expect(page.locator('#mobile-menu-btn')).toBeVisible()

        const drawer = await openMobileMenu(page)

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


    test('should close the mobile menu with Escape', async ({ page }) => {
        await page.goto('/')
        await waitForHydration(page)

        const drawer = await openMobileMenu(page)
        await page.keyboard.press('Escape')
        await expect(drawer).toBeHidden()
    })

    test('should open search from the mobile menu, return results and close', async ({ page }) => {
        await page.goto('/')
        await waitForHydration(page)

        const drawer = await openMobileMenu(page)
        await drawer.locator('#mobile-nav-search').click()

        /* 打开搜索后移动菜单应收起，避免抽屉叠加在对话框背后。 */
        await expect(drawer).toBeHidden()

        const searchDialog = page.locator('.app-search-dialog[role="dialog"]')
        await expect(searchDialog).toBeVisible()

        const input = searchDialog.locator('.app-search__input input, input.app-search__input').first()
        await expect(input).toBeVisible()
        await input.fill('Hello')

        const firstResult = searchDialog.locator('.app-search__result-item').first()
        await expect(firstResult).toBeVisible({ timeout: 10000 })
        await expect(firstResult).toContainText(/Hello/i)

        await page.keyboard.press('Escape')
        await expect(searchDialog).toBeHidden()
    })

    test('should expose the submit form entry on mobile', async ({ page }) => {
        await page.goto('/submit')
        await page.getByRole('heading', { name: '访客投稿', exact: true }).first().waitFor({ state: 'visible' })

        await expect(page.locator('#title')).toBeVisible()
        await expect(page.locator('#name')).toBeVisible()
        await expect(page.locator('#content')).toBeVisible()

        const submitButton = page.locator('.submit-form button[type="submit"]').first()
        await expect(submitButton).toBeVisible()
        await submitButton.scrollIntoViewIfNeeded()
        const box = await submitButton.boundingBox()
        expect(box?.height ?? 0).toBeGreaterThan(0)
    })


    test('should keep the posts index usable when the page is clamped to a single page', async ({ page }) => {
        await page.goto('/posts?page=2')
        await page.getByRole('heading', { name: '文章列表', exact: true }).first().waitFor({ state: 'visible' })

        /* 种子只有 1 篇文章：越界页返回空列表并渲染空态，且不渲染分页器、页面不横向溢出。 */
        await expect(page.locator('.app-empty-state')).toBeVisible()
        await expect(page.locator('.caomei-paginator')).toHaveCount(0)

        const metrics = await page.evaluate(() => ({
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
        }))
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth)
    })

    test('should open, navigate and close the mobile table of contents', async ({ page }) => {
        await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })

        /* 首屏 SSR 已渲染按钮，但水合完成前点击会被丢弃。 */
        await waitForHydration(page)

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
