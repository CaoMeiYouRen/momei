import { type Page, expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from './helpers/visual'

/**
 * caomei-ui 语义 token 桥接的**级联契约**守卫（无截图，故不产出 `__screenshots__` 基线）。
 *
 * 为什么需要它：截图层只能证明「未迁移页面像素无差异」，而桥接的目标是「让 caomei-ui 组件读到
 * momei 的主题」。在 caomei-ui 的逐模块样式加载形态下（`caomei-ui/theme.css` 未分层且排在 `styles/main.scss`
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
 * 维护提示：`CAOMEI_BASE_DEFAULT_PRIMARY` / `CAOMEI_BASE_DEFAULT_CONTROL_BORDER` 取自
 * caomei-ui 1.0.0-rc.1 的基础层。按迁移方案 §5.6 的升级纪律，每次升级 caomei-ui 都须复核这两个
 * 常量，否则若库默认值与 momei 主色重合，反向断言会静默失效。
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

/**
 * 状态「文字 / 边框」角色（caomei-ui 1.0.0-rc.1 新增）的**模式感知**映射：浅色取深档
 * （`primary` / `danger` 为 `-700`，`success` / `warning` 为 `-800`）、暗色取 `-400` 提亮档。与 `DIRECT_BRIDGE_PAIRS` 分开维护，因为它对同一 token 在不同主题下
 * 有不同来源——合并进直连表会让暗色断言必然失败。
 *
 * 区分力注：`-text` 的库默认值（浅色 `#1d4ed8` 等）与 `--p-*-700` 不同，故相等断言对「桥接失效」
 * 具区分力。`primary` 一项还有静态蓝的风险（默认主色恰为近似 Aura 蓝，等值断言无法识别写死），
 * 其防线是 `styles/main.scss` 的注释与迁移方案 §3.10 的口径——本测试保证**来源 token 一致**。
 */
const TEXT_ROLE_BRIDGE: readonly { readonly token: string, readonly light: string, readonly dark: string }[] = [
    { token: '--caomei-color-primary-text', light: '--p-primary-700', dark: '--p-primary-400' },
    /* danger 浅色的库默认值恰为 `#b91c1c`（与 `--p-red-700` 同值），故该角色的等值断言对「桥接失效」
     * 不具区分力——实际由下方对比度契约与 `main.scss` 注释兜底。 */
    { token: '--caomei-color-danger-text', light: '--p-red-700', dark: '--p-red-400' },
    /* success / warning 浅色取 `-800`（上游口径）：8% soft 底上 `-700` 仅约 4.68 / 4.78，落到
     * `bg-elevated` 即跌破 4.5。`--p-green-800` 由 PrimeVue 运行期注入：静态产物中无定义、只有 `var()` 引用，故只能以运行期计算值断言。 */
    { token: '--caomei-color-success-text', light: '--p-green-800', dark: '--p-green-400' },
    { token: '--caomei-color-warning-text', light: '--p-orange-800', dark: '--p-orange-400' },
]

/**
 * 中性状态文字：**不能**等于 neutral 的 tone（`--caomei-color-text-muted`）。
 *
 * rc.1 把「tone（soft 底基准）」与「text（文字 / 边框）」拆成两个角色，正因二者同值时
 * 8% soft 底上的对比度不足（实测约 4.26）。故本断言只要求「非空且与 tone 不同」，
 * 具体取值由下方对比度断言把关（`--caomei-color-neutral-text` 现取「文本色 → 卡片色」派生）。
 */
const NEUTRAL_TEXT_TOKEN = '--caomei-color-neutral-text'
const NEUTRAL_TONE_TOKEN = '--caomei-color-text-muted'

/** 派生档位（`color-mix()` / `calc()`）：只断言非空与来源可解析，不断言字面值。 */
const DERIVED_BRIDGE_TOKENS: readonly string[] = [
    '--caomei-color-bg-elevated',
    '--caomei-radius-sm',
    '--caomei-radius-lg',
    '--caomei-font-sans',
]

/**
 * caomei-ui 基础层 `:root` 的默认主色（1.0.0-rc.1，`dist/styles/index.css`；与 0.2.0 同值，升级时须复核）。
 * 桥接生效时**必须**与它不同——这正是「未分层 + 高特异性」要解决的问题。
 */
const CAOMEI_BASE_DEFAULT_PRIMARY: Record<string, string> = {
    light: '#2563eb',
    dark: '#60a5fa',
}

/**
 * caomei-ui 基础层**未桥接**的 `--caomei-color-control-border` 默认值（1.0.0-rc.1）。
 *
 * 该角色有意不桥接：上游为控件边界单取了满足 WCAG 1.4.11（3:1）的值，并把「控件边界」与
 * 「装饰边框」（`-color-border`）分离；momei 采用上游默认并登记为有意偏差。断言等值等于把
 * 「上游默认」钉成契约——升级 caomei-ui 时若上游改值，本测试会失败并要求同步登记/归因。
 */
const CAOMEI_BASE_DEFAULT_CONTROL_BORDER: Record<string, string> = {
    light: '#8a8b8d',
    dark: '#67676a',
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
                ...new Set([
                    ...DIRECT_BRIDGE_PAIRS.flat(),
                    ...DERIVED_BRIDGE_TOKENS,
                    ...TEXT_ROLE_BRIDGE.flatMap(({ token, light, dark }) => [token, light, dark]),
                    NEUTRAL_TEXT_TOKEN,
                    NEUTRAL_TONE_TOKEN,
                    '--caomei-color-control-border',
                ]),
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

            // 状态文字角色：暗色档由 html:root.dark 覆盖，若缺失会回落浅色档而被判失败。
            for (const { token, light, dark } of TEXT_ROLE_BRIDGE) {
                const expectedSource = theme === 'dark' ? dark : light
                expect(tokens[token], `${token} 应等于 ${expectedSource}（${theme}）`).toBe(tokens[expectedSource])
            }

            // 中性状态文字：必须与 neutral 的 tone 拉开（同值即 rc.1 要消除的形态，对比度不足）。
            expect(tokens[NEUTRAL_TEXT_TOKEN], `${NEUTRAL_TEXT_TOKEN} 不应等于 tone ${NEUTRAL_TONE_TOKEN}`).not.toBe(tokens[NEUTRAL_TONE_TOKEN])

            // 控件边界采用上游默认（有意不桥接）：值必须等于基础层默认值，而不是 momei 的装饰边框色。
            expect(tokens['--caomei-color-control-border'], '控件边界应采用上游默认值').toBe(CAOMEI_BASE_DEFAULT_CONTROL_BORDER[theme])

            // 反向对照：桥接必须压过 caomei-ui 基础层的静态默认主色（否则即静默失效）。
            expect(tokens['--caomei-color-primary']).not.toBe(CAOMEI_BASE_DEFAULT_PRIMARY[theme])
        })
    }
})

/**
 * 状态色正文可读性的**对比度契约**（替代一次性人工实测）。
 *
 * 覆盖 5 个 `-text` 角色 × 2 个承载面（内容面 `bg` / 次级面 `bg-elevated`）× 明暗两态
 * （按 tag / badge 的 8% soft 底建模；`CaomeiMessage` 默认 4% 混合，故本断言对其更严）：
 * 断言「`-text` 文字叠在 `color-mix(tone 8%, 承载面)` 上」的 WCAG 对比度 ≥ 4.5。
 *
 * 为什么不能只断言 token 计算值：rc.1 的 token 角色只保证「文字与 tone 分离」，具体取值由下游
 * 桥接决定；momei 用 Aura 色板覆盖后，上游「6 预设 × 明暗 ≥ 4.5」的保证不再自动继承。
 * 本断言把失败前移到契约层——例如把 `neutral-text` 误接成 tone 同值时，浅色比值约 4.26，
 * 会在此直接失败。
 */
const CONTRAST_ROLES: readonly { readonly role: string, readonly tone: string, readonly text: string }[] = [
    { role: 'primary', tone: '--caomei-color-primary', text: '--caomei-color-primary-text' },
    { role: 'success', tone: '--caomei-color-success', text: '--caomei-color-success-text' },
    { role: 'warning', tone: '--caomei-color-warning', text: '--caomei-color-warning-text' },
    { role: 'danger', tone: '--caomei-color-danger', text: '--caomei-color-danger-text' },
    { role: 'neutral', tone: '--caomei-color-text-muted', text: '--caomei-color-neutral-text' },
]

const CONTRAST_BACKGROUNDS: readonly string[] = ['--caomei-color-bg', '--caomei-color-bg-elevated']

const MIN_TEXT_CONTRAST = 4.5

test.describe('caomei-ui token 桥接：状态文字对比度契约', () => {
    for (const theme of VISUAL_THEMES) {
        test(`text-role-contrast-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/settings')
            await waitForVisualStable(page)

            const rows = await page.evaluate(({ roles, backgrounds }) => {
                const resolver = document.createElement('div')
                resolver.style.display = 'none'
                document.body.append(resolver)

                const resolve = (value: string): { r: number, g: number, b: number } | null => {
                    resolver.style.color = ''
                    resolver.style.color = value
                    const computed = getComputedStyle(resolver).color
                    const rgb = /rgba?\(([^)]+)\)/u.exec(computed)
                    if (rgb?.[1]) {
                        const [r = 0, g = 0, b = 0] = rgb[1].split(/[,/\s]+/u).filter(Boolean).map(Number)
                        return { r, g, b }
                    }
                    const srgb = /color\(srgb ([^)]+)\)/u.exec(computed)
                    if (srgb?.[1]) {
                        const [r = 0, g = 0, b = 0] = srgb[1].split(/[,/\s]+/u).filter(Boolean).map(Number)
                        return { r: r * 255, g: g * 255, b: b * 255 }
                    }
                    return null
                }

                const luminance = (c: { r: number, g: number, b: number }) => {
                    const channel = (v: number) => {
                        const s = v / 255
                        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
                    }
                    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
                }

                const ratio = (a: { r: number, g: number, b: number }, b: { r: number, g: number, b: number }) => {
                    const la = luminance(a)
                    const lb = luminance(b)
                    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
                }

                const computedStyle = getComputedStyle(document.documentElement)
                const read = (name: string) => computedStyle.getPropertyValue(name).trim()

                const result: { role: string, background: string, ratio: number }[] = []
                for (const { role, tone, text } of roles) {
                    const toneColor = resolve(read(tone))
                    const textColor = resolve(read(text))
                    for (const background of backgrounds) {
                        const surface = resolve(read(background))
                        if (!toneColor || !textColor || !surface) {
                            result.push({ role, background, ratio: -1 })
                            continue
                        }
                        // soft 底：`color-mix(in srgb, tone 8%, transparent)` 叠在承载面上
                        const soft = {
                            r: toneColor.r * 0.08 + surface.r * 0.92,
                            g: toneColor.g * 0.08 + surface.g * 0.92,
                            b: toneColor.b * 0.08 + surface.b * 0.92,
                        }
                        result.push({ role, background, ratio: Number(ratio(textColor, soft).toFixed(2)) })
                    }
                }
                resolver.remove()
                return result
            }, { roles: CONTRAST_ROLES, backgrounds: CONTRAST_BACKGROUNDS })

            for (const row of rows) {
                expect(
                    row.ratio,
                    `${theme} · ${row.role} 在 ${row.background} 的 soft 8% 底上对比度应 ≥ ${MIN_TEXT_CONTRAST}`,
                ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
            }
        })
    }
})
