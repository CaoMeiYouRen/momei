import { devices, expect, test } from '@playwright/test'
import { waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'] })

test.describe('移动端表单体验', () => {
    test('should keep login inputs readable and actionable on mobile', async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('heading', { name: '欢迎回来，请登录', exact: true }).first().waitFor({ state: 'visible' })
        await waitForHydration(page)

        const email = page.locator('#email')
        const password = page.locator('.login-form__field .caomei-password input').first()

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

    test('should keep the public comment form readable and actionable on mobile', async ({ page }) => {
        await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })
        await waitForHydration(page)

        const form = page.locator('.comment-form').first()
        await form.scrollIntoViewIfNeeded()
        await expect(form).toBeVisible()

        const nickname = form.locator('#nickname')
        const email = form.locator('#email')
        const website = form.locator('#website')
        const content = form.locator('.comment-form__content textarea')

        await expect(nickname).toHaveAttribute('autocomplete', 'nickname')
        await expect(nickname).toHaveAttribute('enterkeyhint', 'next')
        await expect(email).toHaveAttribute('autocomplete', 'email')
        await expect(email).toHaveAttribute('inputmode', 'email')
        await expect(email).toHaveAttribute('enterkeyhint', 'next')
        await expect(website).toHaveAttribute('autocomplete', 'url')
        await expect(website).toHaveAttribute('inputmode', 'url')
        await expect(content).toHaveAttribute('enterkeyhint', 'enter')

        // 评论框的样式按路由 chunk 异步加载；等待计算字号收敛到 16px，避免读到 caomei 默认 14px。
        for (const locator of [nickname, email, website, content]) {
            await expect.poll(async () => locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
                .toBeGreaterThanOrEqual(16)
        }

        const submit = form.locator('.comment-form__submit')
        await expect.poll(async () => (await submit.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

        /* 键盘遮挡近似：收缩视口后仍能滚动到提交按钮，且按钮完整落在视口内。 */
        await page.setViewportSize({ width: 390, height: 420 })
        await submit.scrollIntoViewIfNeeded()
        const compactBox = await submit.boundingBox()
        expect(compactBox).not.toBeNull()
        expect((compactBox?.y ?? 0) + (compactBox?.height ?? 0)).toBeLessThanOrEqual(420)
    })

    test('should keep friend-links and subscriber inputs readable on mobile', async ({ page }) => {
        await page.goto('/friend-links')
        await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

        const contactEmail = page.locator('#contactEmail')
        await contactEmail.scrollIntoViewIfNeeded()
        await expect(contactEmail).toHaveAttribute('autocomplete', 'email')
        await expect(contactEmail).toHaveAttribute('enterkeyhint', 'next')
        await expect(page.locator('#name')).toHaveAttribute('autocomplete', 'organization')
        await expect(page.locator('#message')).toHaveAttribute('enterkeyhint', 'enter')

        for (const locator of [page.locator('#name'), contactEmail, page.locator('#message')]) {
            await expect.poll(async () => locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
                .toBeGreaterThanOrEqual(16)
        }

        const submit = page.locator('.links-page__submit')
        await expect.poll(async () => (await submit.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

        /* 订阅表单同样属于公开表单：首页与文章页复用同一组件。 */
        await page.goto('/')
        const subscriber = page.locator('.subscriber-form input').first()
        await subscriber.scrollIntoViewIfNeeded()
        await expect(subscriber).toHaveAttribute('autocomplete', 'email')
        await expect(subscriber).toHaveAttribute('enterkeyhint', 'send')
        await expect.poll(async () => subscriber.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
            .toBeGreaterThanOrEqual(16)
        await expect.poll(async () => (await page.locator('.subscriber-form__submit').boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    })

    test('should expose autocomplete hints on the benefits form', async ({ page }) => {
        await page.goto('/benefits')
        await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

        const name = page.locator('#benefits-name')
        const email = page.locator('#benefits-email')
        await name.scrollIntoViewIfNeeded()

        await expect(name).toHaveAttribute('autocomplete', 'name')
        await expect(name).toHaveAttribute('enterkeyhint', 'next')
        await expect(email).toHaveAttribute('autocomplete', 'email')
        await expect(email).toHaveAttribute('enterkeyhint', 'send')

        for (const locator of [name, email]) {
            await expect.poll(async () => locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
                .toBeGreaterThanOrEqual(16)
        }

        await expect.poll(async () => (await page.locator('.cta-form__btn').boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    })
})
