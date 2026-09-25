import { type Page, expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from './helpers/visual'

/**
 * caomei-ui 语义 token 桥接的**级联契约**守卫（无截图，故不产出 `__screenshots__` 基线）。
 *
 * 为什么需要它：截图层只能证明「未迁移页面像素无差异」，而桥接的目标是「让 caomei-ui 组件读到
 * momei 的主题」。在 0.2.0 的加载形态下（`caomei-ui/theme.css` 未分层且排在 `styles/main.scss`
 * 之后，见迁移方案 §5.7），若把桥接误写回 `@layer momei-base`，它会**静默失效**——像素仍无差异、
 * 构建仍通过，直到 B2 试点页才暴露。本测试以真实浏览器读取**计算后**的自定义属性值，
 * 断言桥接胜过 caomei-ui 基础层的 `:root` 默认值。
 *
 * 断言覆盖：
 * 1. 全部桥接 token 的计算值非空——原始色板（`--p-red-500` 等）由库的 `primitive-variables`
 *    样式表产出，一旦上游移除，`var()` 会以 guaranteed-invalid 覆盖库默认（比「回落到默认」更差），
 *    非空断言即针对该静默失效路径；
 * 2. 直连映射的计算值等于其来源 `--p-*`；
 * 3. 反向对照：主色不得等于 caomei-ui 基础层默认值（否则桥接未生效）。
 *
 * 维护提示：`CAOMEI_BASE_DEFAULT_PRIMARY` 取自 caomei-ui 0.2.0 的基础层。按迁移方案 §5.6 的升级纪律，
 * 每次升级 caomei-ui 都须复核该常量，否则若库默认值与 momei 主色重合，反向断言会静默失效。
 *
 * 落点说明：需要真实 CSS 级联（层叠层 / var 替换 / color-mix），jsdom 无法提供，故复用视觉回归
 * 工程既有的构建 + 浏览器前置（独立 config / project，不影响 `pnpm test:e2e*` 的断言语义）。
 *
 * 依据见 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §5.2 / §5.7。
 */

/**
 * 桥接中「直连」映射：`--caomei-*` 应与同名语义来源 `--p-*` 取到同一计算值。
 *
 * 区分力注：断言比较的是 `getComputedStyle()` 返回的**计算后字符串**（不归一化单位 / 十六进制），
 * 故仅当「caomei-ui 基础层默认值字符串」恰好等于「源 `--p-*` 字符串」时，该映射的相等断言对
 * 「桥接失效」不具区分力（如 `--caomei-color-success-solid` 的 `#15803d`、浅色
 * `--caomei-color-primary-foreground` 的 `#fff`）；`--caomei-radius-md`（`8px` vs `0.5rem`）与
 * 浅色 `--caomei-color-bg`（`#fff` vs `#ffffff`）序列化不同，仍具区分力。整体区分力主要由
 * `--caomei-color-primary`（两主题下均不同于库默认，见下方反向对照）承担；非空断言覆盖变量链断裂。
 */
const DIRECT_BRIDGE_PAIRS: readonly (readonly [string, string])[] = [
    ['--caomei-color-primary', '--p-primary-color'],
    ['--caomei-color-primary-foreground', '--p-primary-contrast-color'],
    ['--caomei-color-primary-solid', '--p-primary-700'],
    ['--caomei-color-danger', '--p-red-500'],
    ['--caomei-color-danger-solid', '--p-red-700'],
    ['--caomei-color-success', '--p-green-500'],
    ['--caomei-color-success-solid', '--p-green-700'],
    ['--caomei-color-warning', '--p-orange-500'],
    ['--caomei-color-warning-solid', '--p-orange-700'],
    ['--caomei-color-bg', '--p-surface-card'],
    ['--caomei-color-text', '--p-text-color'],
    ['--caomei-color-text-muted', '--p-text-muted-color'],
    ['--caomei-color-border', '--p-content-border-color'],
    ['--caomei-color-mask', '--p-mask-background'],
    ['--caomei-radius-md', '--p-content-border-radius'],
]

/** 派生档位（`color-mix()` / `calc()`）：只断言非空与来源可解析，不断言字面值。 */
const DERIVED_BRIDGE_TOKENS: readonly string[] = [
    '--caomei-color-bg-elevated',
    '--caomei-radius-sm',
    '--caomei-radius-lg',
    '--caomei-font-sans',
]

/**
 * caomei-ui 基础层 `:root` 的默认主色（0.2.0，`dist/styles/index.css`）。
 * 桥接生效时**必须**与它不同——这正是「未分层 + 高特异性」要解决的问题。
 */
const CAOMEI_BASE_DEFAULT_PRIMARY: Record<string, string> = {
    light: '#2563eb',
    dark: '#60a5fa',
}

async function readRootCustomProperties(page: Page, names: string[]): Promise<Record<string, string>> {
    return page.evaluate((propertyNames) => {
        const computed = getComputedStyle(document.documentElement)
        const result: Record<string, string> = {}
        for (const name of propertyNames) {
            result[name] = computed.getPropertyValue(name).trim().toLowerCase()
        }
        return result
    }, names)
}

test.describe('caomei-ui token 桥接：级联契约', () => {
    for (const theme of VISUAL_THEMES) {
        test(`bridge-wins-cascade-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            // 复用截图层已验证稳定的路由（token 声明在 `:root`，与具体路由无关）。
            await page.goto('/admin/settings')
            await waitForVisualStable(page)

            const names = [
                ...new Set([...DIRECT_BRIDGE_PAIRS.flat(), ...DERIVED_BRIDGE_TOKENS]),
            ]
            const tokens = await readRootCustomProperties(page, names)

            // 全部桥接 token 都必须解析出计算值（空值 = 变量链断裂 / 上游 token 被移除）。
            for (const name of names) {
                expect(tokens[name], `${name} 未解析`).not.toBe('')
            }

            // 直连映射必须取到同一个计算值。
            for (const [caomeiToken, momeiToken] of DIRECT_BRIDGE_PAIRS) {
                expect(tokens[caomeiToken], `${caomeiToken} 应等于 ${momeiToken}`).toBe(tokens[momeiToken])
            }

            // 反向对照：桥接必须压过 caomei-ui 基础层的静态默认主色（否则即静默失效）。
            expect(tokens['--caomei-color-primary']).not.toBe(CAOMEI_BASE_DEFAULT_PRIMARY[theme])
        })
    }
})
