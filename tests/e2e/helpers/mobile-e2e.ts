import { expect, type Page } from '@playwright/test'

/**
 * 移动端 E2E 公共辅助。
 *
 * `waitForHydration`：SSR 首屏按钮可见但未水合时点击会被丢弃。ClientOnly 的搜索按钮
 * 只在客户端接管后才带 `id`（SSR fallback 没有 id），因此「出现且可用」即代表水合完成。
 *
 * `openMobileMenu`：兼容首屏未水合导致的首次点击丢失；菜单打开是幂等赋值，
 * 处理器整体失效时重试仍会失败，不会掩盖真实回归。
 */
export async function waitForHydration(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const button = document.querySelector('#search-btn')
        return button !== null && !button.hasAttribute('disabled')
    }, { timeout: 15000 })
}

export async function openMobileMenu(page: Page) {
    const menuButton = page.locator('#mobile-menu-btn')
    const drawer = page.locator('.mobile-drawer')
    await expect(async () => {
        await menuButton.click()
        await expect(drawer).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15000 })
    return drawer
}
