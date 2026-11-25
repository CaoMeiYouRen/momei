import type { Page } from '@playwright/test'
import { dynamicMask } from '../helpers/visual'

/**
 * 移动端视觉基线的公共辅助。
 *
 * 与桌面层复用同一套 `applyTheme` / 快照阈值；这里只处理移动端的两处差异：
 * 1. 第三方资源（CDN 字体 / 统计脚本）在移动 UA 下更容易长期挂起，
 *    `document.fonts.ready` 可能永不 resolve（实测文章详情页）。稳定等待必须有界，
 *    否则会把「外部资源不可达」伪装成用例超时。
 * 2. 公开页存在两处运行时会变化、但尚未标记 `[data-visual-mask]` 的动态文本：
 *    文章卡片元信息（作者 / 日期 / 阅读量）与文章详情元信息（含每次访问自增的阅读量）。
 *    移动基线是「本次生成、CI 复比」，必须显式遮蔽，否则阅读量自增会制造假红灯。
 *    待后续在组件上补 `data-visual-mask` 后可收窄（需同步重采桌面 parity 参考态）。
 */

/** 阻断跨源请求：外部字体 / 统计脚本在离线或 CI 网络抖动下会长期挂起，
 * Playwright 截图前的「等待字体加载」会因此超时；显式阻断使本地与 CI 渲染条件一致。 */
export async function blockExternalRequests(page: Page): Promise<void> {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/u, (route) => route.abort())
}

/** 有界稳定等待：网络空闲（有界）→ 字体就绪（有界，最多 3s）→ 短稳定窗口。 */
export async function waitForMobileStable(page: Page, options: { lenient?: boolean, settleMs?: number } = {}): Promise<void> {
    const { lenient = false, settleMs = 800 } = options

    try {
        await page.waitForLoadState('networkidle', { timeout: lenient ? 10000 : 15000 })
    } catch {
        // 该路由存在持续网络活动（SSE / 外部资源），放弃 networkidle。
    }

    await page.evaluate(async () => {
        await Promise.race([
            document.fonts?.ready ?? Promise.resolve(),
            new Promise((resolve) => {
                setTimeout(resolve, 3000)
            }),
        ])
    })

    await page.waitForTimeout(settleMs)
}

/** 截图前的遮蔽集合：全局约定掩码 + 公开页动态元信息。 */
export function mobileMask(page: Page) {
    // lean: 按整块元信息遮蔽，保留静态作者 / 日期的像素守卫需先在组件补 data-visual-mask
    return [
        ...dynamicMask(page),
        page.locator('.article-card__meta'),
        page.locator('.post-detail__meta'),
    ]
}
