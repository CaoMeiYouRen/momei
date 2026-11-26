import { devices, expect, test } from '@playwright/test'
import { waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'] })

const TOUCH_AUDIT_PAGES = [
    { name: 'home', path: '/' },
    { name: 'post-detail', path: '/posts/hello-momei-test' },
    { name: 'tags', path: '/tags' },
    { name: 'archives', path: '/archives' },
    { name: 'friend-links', path: '/friend-links' },
    { name: 'about', path: '/about' },
    { name: 'login', path: '/login' },
]

interface TouchTarget {
    tag: string
    text: string
    width: number
    height: number
    inlineText: boolean
}

test.describe('移动端触控与 hover 兜底', () => {
    test('should keep public clickable targets at least 44px or inline-link sized', async ({ page }) => {
        const collected: TouchTarget[] = []

        for (const entry of TOUCH_AUDIT_PAGES) {
            const response = await page.goto(entry.path, { waitUntil: 'domcontentloaded' })
            expect(response?.ok(), `${entry.path} 响应异常`).toBeTruthy()
            await waitForHydration(page)

            const targets = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll<HTMLElement>('a, button, [role="button"], input[type="submit"], select'))
                return elements
                    .filter((element) => {
                        // 复选框 / 单选框的命中区由 label 承担，单独断言，不按 18px 控件本体计。
                        if (['checkbox', 'radio'].includes(element.getAttribute('role') ?? '')) {
                            return false
                        }
                        const style = getComputedStyle(element)
                        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                            return false
                        }
                        const rect = element.getBoundingClientRect()
                        return rect.width > 0 && rect.height > 0
                    })
                    .map((element) => {
                        const rect = element.getBoundingClientRect()
                        const tag = element.tagName.toLowerCase()
                        return {
                            tag,
                            text: (element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 40),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            inlineText: tag === 'a',
                        }
                    })
            })

            for (const target of targets) {
                collected.push(target)
                if (target.inlineText) {
                    // 行内文字链按 24px 最小命中宽度登记；低于 24px 视为不可点击。
                    expect(target.width, `${entry.name}: 行内链接「${target.text}」命中宽度不足 24px`).toBeGreaterThanOrEqual(24)
                    continue
                }

                expect(target.width, `${entry.name}: ${target.tag}「${target.text}」宽度不足 44px`).toBeGreaterThanOrEqual(44)
                expect(target.height, `${entry.name}: ${target.tag}「${target.text}」高度不足 44px`).toBeGreaterThanOrEqual(44)
            }
        }

        expect(collected.length, '触控审计样本不足 20 个').toBeGreaterThanOrEqual(20)

        const qualified = collected.filter((target) => target.width >= 44 && target.height >= 44)
        expect(qualified.length, '≥44×44 的公开控件不足 20 个').toBeGreaterThanOrEqual(20)

        /* 复选框的真实可点目标由 label 承担，单独断言标签命中区。 */
        await page.goto('/login', { waitUntil: 'domcontentloaded' })
        const rememberLabel = page.locator('label[for="rememberMe"]')
        const labelBox = await rememberLabel.boundingBox()
        expect(labelBox?.height ?? 0).toBeGreaterThanOrEqual(44)
        expect(labelBox?.width ?? 0).toBeGreaterThanOrEqual(44)
    })

    test('should expose touch-visible alternatives for hover-only affordances', async ({ page }) => {
        await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })
        await waitForHydration(page)

        /* 1. 代码复制按钮：桌面 hover 才显示，触屏常显且 44px。 */
        await page.evaluate(() => {
            document.querySelector('#touch-fixture-host')?.remove()
            const host = document.createElement('div')
            host.id = 'touch-fixture-host'
            host.className = 'markdown-body'
            host.innerHTML = '<pre style="width:320px;min-height:80px"><div class="copy-code-wrapper"><button type="button" class="copy-code-button" aria-label="复制代码">copy</button></div></pre>'
            document.body.appendChild(host)
        })

        const copyButton = page.locator('#touch-fixture-host .copy-code-button')
        const copyWrapper = page.locator('#touch-fixture-host .copy-code-wrapper')
        await expect(copyWrapper).toHaveCSS('opacity', '1')
        const copySize = await copyButton.evaluate((element) => {
            const style = getComputedStyle(element)
            return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) }
        })
        expect(copySize.width).toBeGreaterThanOrEqual(44)
        expect(copySize.height).toBeGreaterThanOrEqual(44)

        /* 2. 沉浸阅读入口：触屏显示可见文字入口，点击可启用并展开设置面板。 */
        const touchHint = page.locator('.reader-controls__touch-hint')
        await expect(touchHint).toBeVisible()
        await expect(touchHint).not.toHaveText('')
        const hintBox = await touchHint.boundingBox()
        expect(hintBox?.height ?? 0).toBeGreaterThanOrEqual(44)
        await touchHint.tap()
        await expect(touchHint).toHaveText('阅读排版设置')
        await touchHint.tap()
        await expect(page.locator('.reader-controls__panel')).toBeVisible()
    })
})
