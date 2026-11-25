import { devices, expect, test } from '@playwright/test'
import { openMobileMenu, waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'] })

test.describe('移动端壳层可访问性与触控', () => {
    test('should expose correct aria state, focus and scroll lock for the mobile menu', async ({ page }) => {
        await page.goto('/')
        await waitForHydration(page)

        const trigger = page.locator('#mobile-menu-btn')
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')

        const drawer = await openMobileMenu(page)
        await expect(trigger).toHaveAttribute('aria-expanded', 'true')
        await expect.poll(async () => page.evaluate(() => Boolean(document.querySelector('.mobile-drawer')?.contains(document.activeElement)))).toBe(true)
        await expect.poll(async () => page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')

        await page.keyboard.press('Escape')
        await expect(drawer).toBeHidden()
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
        await expect.poll(async () => page.evaluate(() => document.activeElement?.id ?? '')).toBe('mobile-menu-btn')
        await expect.poll(async () => page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
    })

    test('should meet 44px touch targets and provide non-hover focus feedback', async ({ page }) => {
        await page.goto('/posts')
        await page.getByRole('heading', { name: '文章列表', exact: true }).first().waitFor({ state: 'visible' })

        const measured: { selector: string, height: number, width: number }[] = []
        const measure = async (locator: import('@playwright/test').Locator, selector: string) => {
            const count = await locator.count()
            for (let index = 0; index < count; index++) {
                const box = await locator.nth(index).boundingBox()
                if (box) {
                    measured.push({ selector, height: Math.round(box.height), width: Math.round(box.width) })
                }
            }
        }

        await measure(page.locator('.app-header__actions button:visible'), 'header-button')
        await measure(page.locator('.feedback-entry-button__action:visible'), 'feedback')
        await measure(page.locator('.footer__link:visible'), 'footer-link')
        await measure(page.locator('a.app-logo:visible'), 'logo')

        const drawer = await openMobileMenu(page)
        await measure(drawer.locator('.mobile-nav-link'), 'mobile-nav-link')
        await measure(drawer.locator('.caomei-drawer__close'), 'drawer-close')
        await measure(drawer.locator('.travellings-link'), 'travellings')
        await page.keyboard.press('Escape')
        await expect(drawer).toBeHidden()

        expect(measured.length).toBeGreaterThanOrEqual(20)
        /* 高度 44px 为硬指标；宽度对独立目标取 24px（WCAG 2.5.8），避免把行内文字链接误判。 */
        expect(measured.filter((item) => item.height < 44)).toEqual([])
        expect(measured.filter((item) => item.width < 24)).toEqual([])

        /* hover-only 交互替代：键盘聚焦时应有可见焦点环（触屏用 :active 反馈）。 */
        await page.locator('#mobile-menu-btn').focus()
        const outlineWidth = await page.locator('#mobile-menu-btn').evaluate((element) => getComputedStyle(element).outlineWidth)
        expect(outlineWidth).not.toBe('0px')
    })

    test('should respect safe-area padding and dynamic viewport height', async ({ page }) => {
        await page.goto('/')
        await waitForHydration(page)

        const metrics = await page.evaluate(() => {
            const header = document.querySelector('.app-header')
            const layout = document.querySelector('.layout-default')
            return {
                headerPaddingLeft: header ? getComputedStyle(header).paddingLeft : null,
                headerPaddingRight: header ? getComputedStyle(header).paddingRight : null,
                layoutMinHeight: layout ? Number.parseFloat(getComputedStyle(layout).minHeight) : null,
                innerHeight: window.innerHeight,
                supportsDvh: CSS.supports('height', '100dvh'),
            }
        })

        expect(metrics.headerPaddingLeft).toBe('0px')
        expect(metrics.headerPaddingRight).toBe('0px')
        expect(metrics.layoutMinHeight).not.toBeNull()
        expect(metrics.layoutMinHeight ?? 0).toBeGreaterThanOrEqual(metrics.innerHeight)
        if (metrics.supportsDvh) {
            expect(Math.round(metrics.layoutMinHeight ?? 0)).toBe(metrics.innerHeight)
        }
    })
})
