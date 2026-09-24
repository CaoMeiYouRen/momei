import { type Locator, type Page, expect } from '@playwright/test'

/**
 * 视觉回归（截图识别层）公共辅助。
 *
 * 依据 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §8.2：
 * - 主题以确定性方式注入，不依赖系统 `prefers-color-scheme`（避免 CI 与本地默认色偏好差异）；
 * - 动态区域统一以 `[data-visual-mask]` 显式遮蔽，不得依赖像素容差兜底。
 */

export type VisualTheme = 'light' | 'dark'

/** 覆盖的浅色 / 深色两套主题（§8.2 要求覆盖两套主题）。 */
export const VISUAL_THEMES: readonly VisualTheme[] = ['light', 'dark']

/**
 * 以确定性方式设置主题。
 *
 * 应用主题由 `composables/use-theme-mode.ts` 的 `useDark`（selector `html`、class `dark`、
 * storageKey `theme`）驱动；此处直接写入同一 storageKey，覆盖系统色偏好。
 * 必须在 `page.goto` 之前调用，确保初始化脚本先于应用启动执行。
 */
export async function applyTheme(page: Page, theme: VisualTheme): Promise<void> {
    await page.addInitScript((value) => {
        window.localStorage.setItem('theme', value)
    }, theme)
}

/**
 * 等待页面渲染稳定：网络空闲 + 字体就绪。
 *
 * 迁移方案 §8.2 的「环境必须可复现」包含渲染时序稳定；动画由配置层 `animations: 'disabled'` 关闭。
 */
export async function waitForVisualStable(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle')
    await page.evaluate(async () => {
        await document.fonts?.ready
    })
}

/** 动态区域掩码：所有标记了 `data-visual-mask` 的元素（时间戳、头像、随机封面等）。 */
export function dynamicMask(page: Page): Locator[] {
    return [page.locator('[data-visual-mask]')]
}

/** 对整页（viewport）截图并比对，自动应用动态区域掩码。 */
export async function expectPageScreenshot(page: Page, name: string): Promise<void> {
    await expect(page).toHaveScreenshot(name, { mask: dynamicMask(page) })
}

/** 对单个元素（如浮层容器）截图并比对。 */
export async function expectLocatorScreenshot(locator: Locator, name: string): Promise<void> {
    await expect(locator).toHaveScreenshot(name)
}
