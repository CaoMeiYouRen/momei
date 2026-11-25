import { devices, expect, test } from '@playwright/test'
import { waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'] })

test.describe('移动端表单体验', () => {
    test('should keep login inputs readable and actionable on mobile', async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('heading', { name: '欢迎回来，请登录', exact: true }).first().waitFor({ state: 'visible' })
        await waitForHydration(page)

        const email = page.locator('#email')
        const password = page.locator('.login-form .caomei-password input').first()

        const emailMetrics = await email.evaluate((element) => {
            const style = getComputedStyle(element)
            return {
                fontSize: Number.parseFloat(style.fontSize),
                inputMode: element.getAttribute('inputmode'),
                autocomplete: element.getAttribute('autocomplete'),
                enterKeyHint: element.getAttribute('enterkeyhint'),
            }
        })
        expect(emailMetrics.fontSize).toBeGreaterThanOrEqual(16)
        expect(emailMetrics.inputMode).toBe('email')
        expect(emailMetrics.autocomplete).toBe('email')
        expect(emailMetrics.enterKeyHint).toBe('next')

        const passwordFontSize = await password.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
        expect(passwordFontSize).toBeGreaterThanOrEqual(16)

        const toggle = page.locator('.caomei-password__toggle').first()
        const toggleBox = await toggle.boundingBox()
        expect(toggleBox?.width ?? 0).toBeGreaterThanOrEqual(44)
        expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44)

        /* 模拟键盘弹出后的可视高度收缩：滚动到提交按钮后，它应完整落在收缩后的视口内。 */
        const submit = page.locator('.login-form__submit-btn')
        await page.setViewportSize({ width: 390, height: 420 })
        await submit.scrollIntoViewIfNeeded()
        const submitBox = await submit.boundingBox()
        expect(submitBox).not.toBeNull()
        expect(submitBox?.y ?? -1).toBeGreaterThanOrEqual(0)
        expect((submitBox?.y ?? 0) + (submitBox?.height ?? 0)).toBeLessThanOrEqual(420)

        /* 空表单提交：错误文案可见且焦点落到首个错误字段。 */
        await page.setViewportSize({ width: 390, height: 844 })
        await submit.click()
        await expect(page.locator('.login-form__field .caomei-message').first()).toBeVisible()
        await expect.poll(async () => page.evaluate(() => document.activeElement?.id ?? '')).toBe('email')
    })

    test('should expose form attributes and focus the first error on the submit page', async ({ page }) => {
        await page.goto('/submit')
        await page.getByRole('heading', { name: '访客投稿', exact: true }).first().waitFor({ state: 'visible' })

        const email = page.locator('#email')
        const url = page.locator('#url')
        await expect(email).toHaveAttribute('inputmode', 'email')
        await expect(email).toHaveAttribute('autocomplete', 'email')
        await expect(url).toHaveAttribute('type', 'url')
        await expect(url).toHaveAttribute('inputmode', 'url')

        const titleFontSize = await page.locator('#title').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
        expect(titleFontSize).toBeGreaterThanOrEqual(16)
        const contentFontSize = await page.locator('#content').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
        expect(contentFontSize).toBeGreaterThanOrEqual(16)

        /* 键盘遮挡近似：收缩视口后仍能滚动到提交区，且提交区完整落在视口内。 */
        const actions = page.locator('.submit-form__actions')
        await page.setViewportSize({ width: 390, height: 420 })
        await actions.scrollIntoViewIfNeeded()
        const actionsBox = await actions.boundingBox()
        expect(actionsBox).not.toBeNull()
        expect((actionsBox?.y ?? 0) + (actionsBox?.height ?? 0)).toBeLessThanOrEqual(420)
        await page.setViewportSize({ width: 390, height: 844 })

        await page.locator('.submit-btn').click()
        await expect(page.locator('.submit-form__field .caomei-message').first()).toBeVisible()
        await expect.poll(async () => page.evaluate(() => document.activeElement?.id ?? '')).toBe('title')
    })
})
