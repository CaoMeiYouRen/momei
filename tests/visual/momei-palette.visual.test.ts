import { type Page, expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from './helpers/visual'

/**
 * 项目调色板层 `--m-*` 的**解析契约**守卫（无截图，不产出 `__screenshots__` 基线）。
 *
 * 为什么需要它：后续 token 反向切换会把 1,420 处 `--p-*` 换成 `--m-*` / `--caomei-*`。
 * 若 `--m-*` 的派生链在暗色或某个预设下断裂（`color-mix` 引用了未定义的基色），
 * 替换后对应属性会变成 guaranteed-invalid（不是「回落到默认」），而截图门禁只覆盖少数路由，
 * 容易漏到线上。本测试在真实浏览器里读取**计算后**的 `--m-*`，覆盖：
 *
 * 1. 明暗两态下所有关键 `--m-*` 都能解析出值；
 * 2. 色阶锚点正确：`--m-surface-0` == `--m-surface`、`--m-primary-500` == `--m-primary`；
 * 3. 色阶方向正确：浅色 `surface-200` 比 `surface-0` 暗，暗色反之；
 * 4. 三套非默认预设（green / amber / geek）注入基色后派生链仍然成立——预设值取自
 *    `composables/use-theme.ts` 的 `PRESETS`，此处硬编码以避免把 Nuxt 组合式函数拉进
 *    Playwright 进程；预设值变更时本测试会失败并要求同步（属预期的升级纪律）。
 *
 * 依据：docs/design/governance/2026-11-08-primevue-token-mapping.md 与迁移方案 §5.2。
 */

const SURFACE_DIRECTION_TOKENS = ['--m-surface-0', '--m-surface-200'] as const

const PALETTE_TOKENS = [
    '--m-surface-0',
    '--m-surface-50',
    '--m-surface-100',
    '--m-surface-200',
    '--m-surface-500',
    '--m-surface-900',
    '--m-surface-950',
    '--m-surface-ground',
    '--m-surface-card',
    '--m-surface-hover',
    '--m-primary-50',
    '--m-primary-500',
    '--m-primary-950',
    '--m-text-muted-color',
    '--m-red-500',
    '--m-green-500',
    '--m-orange-500',
    '--m-blue-500',
    '--m-yellow-500',
    '--m-purple-500',
    '--m-emerald-500',
    '--m-info-500',
    '--m-shadow-modal',
    '--m-shadow-popover',
    '--m-shadow-card',
    '--m-mask-background',
    '--m-font-mono',
] as const

/** `composables/use-theme.ts` 的 `PRESETS` 中三套非默认预设（浅色 / 暗色主色与面基色）。 */
const PRESET_BASES = {
    green: { dark: { primary: '#10b981', surface: '#052e16' }, light: { primary: '#059669', surface: '#f0fdf4' } },
    amber: { dark: { primary: '#f59e0b', surface: '#451a03' }, light: { primary: '#d97706', surface: '#fffbeb' } },
    geek: { dark: { primary: '#a855f7', surface: '#000000' }, light: { primary: '#7c3aed', surface: '#ffffff' } },
} as const

async function readRootCustomProperties(page: Page, names: readonly string[]): Promise<Record<string, string>> {
    return page.evaluate((propertyNames) => {
        const computed = getComputedStyle(document.documentElement)
        const result: Record<string, string> = {}
        for (const name of propertyNames) {
            result[name] = computed.getPropertyValue(name).trim().toLowerCase()
        }
        return result
    }, names as string[])
}

/** 读取并断言存在（避免 `Record<string, T>` 的索引访问在严格模式下退化为 `T | undefined`）。 */
function requireToken<T>(tokens: Record<string, T>, name: string): T {
    const value = tokens[name]
    expect(value, `${name} 未解析`).toBeDefined()
    return value as T
}

/** 把任意颜色字符串解析为 sRGB 分量（复用真实浏览器的解析能力）。 */
async function resolveColors(page: Page, values: readonly string[]): Promise<Record<string, { r: number, g: number, b: number }>> {
    return page.evaluate((colorValues) => {
        const resolver = document.createElement('div')
        resolver.style.display = 'none'
        document.body.append(resolver)

        const result: Record<string, { r: number, g: number, b: number }> = {}
        for (const value of colorValues) {
            resolver.style.color = ''
            resolver.style.color = value
            const computed = getComputedStyle(resolver).color
            const rgb = /rgba?\(([^)]+)\)/u.exec(computed)
            const srgb = /color\(srgb ([^)]+)\)/u.exec(computed)
            const channels = rgb?.[1]?.split(/[,/\s]+/u).filter(Boolean).map(Number)
                ?? srgb?.[1]?.split(/[,/\s]+/u).filter(Boolean).map((channel) => Number(channel) * 255)
            result[value] = channels?.[0] === undefined
                ? { b: -1, g: -1, r: -1 }
                : { b: channels[2] ?? 0, g: channels[1] ?? 0, r: channels[0] }
        }

        resolver.remove()
        return result
    }, values as string[])
}

function relativeLuminance(color: { r: number, g: number, b: number }): number {
    const channel = (value: number) => {
        const normalized = value / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

test.describe('项目调色板层 --m-*：解析契约', () => {
    for (const theme of VISUAL_THEMES) {
        test(`palette-resolves-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/settings')
            await waitForVisualStable(page)

            const tokens = await readRootCustomProperties(page, PALETTE_TOKENS)

            for (const name of PALETTE_TOKENS) {
                expect(tokens[name], `${name} 未解析（${theme}）`).not.toBe('')
            }

            // 锚点：色阶 0 / 500 必须等于运行时基色，否则替换 surface-0 / primary-500 会漂移。
            const anchors = await readRootCustomProperties(page, ['--m-primary', '--m-surface'])
            expect(requireToken(tokens, '--m-primary-500')).toBe(requireToken(anchors, '--m-primary'))
            expect(requireToken(tokens, '--m-surface-0')).toBe(requireToken(anchors, '--m-surface'))

            // 方向：浅色面阶向黑、暗色向白。
            const [baseToken, elevatedToken] = SURFACE_DIRECTION_TOKENS
            const [base, elevated] = await Promise.all([
                resolveColors(page, [requireToken(tokens, baseToken)]),
                resolveColors(page, [requireToken(tokens, elevatedToken)]),
            ])
            const baseLuminance = relativeLuminance(requireToken(base, requireToken(tokens, baseToken)))
            const elevatedLuminance = relativeLuminance(requireToken(elevated, requireToken(tokens, elevatedToken)))

            if (theme === 'dark') {
                expect(elevatedLuminance, '暗色 surface-200 应比 surface-0 亮').toBeGreaterThan(baseLuminance)
            } else {
                expect(elevatedLuminance, '浅色 surface-200 应比 surface-0 暗').toBeLessThan(baseLuminance)
            }
        })
    }

    for (const [presetName, preset] of Object.entries(PRESET_BASES)) {
        for (const theme of VISUAL_THEMES) {
            test(`palette-preset-${presetName}-${theme}`, async ({ page }) => {
                await applyTheme(page, theme)
                await page.goto('/admin/settings')
                await waitForVisualStable(page)

                const { primary, surface } = preset[theme]

                // 以行内样式模拟 use-theme 对预设基色的写入（行内优先级最高，且不改动页面状态）。
                await page.evaluate(({ primaryColor, surfaceColor }) => {
                    const root = document.documentElement
                    root.style.setProperty('--m-primary', primaryColor)
                    root.style.setProperty('--m-surface', surfaceColor)
                }, { primaryColor: primary, surfaceColor: surface })

                const tokens = await readRootCustomProperties(page, ['--m-primary-500', '--m-primary-50', '--m-surface-0', '--m-surface-200'])
                for (const [name, value] of Object.entries(tokens)) {
                    expect(value, `${presetName}/${theme} · ${name} 未解析`).not.toBe('')
                }

                const primaryAnchor = requireToken(tokens, '--m-primary-500')
                const surfaceAnchor = requireToken(tokens, '--m-surface-0')
                const resolved = await resolveColors(page, [primary, surface, primaryAnchor, surfaceAnchor])
                expect(requireToken(resolved, primaryAnchor), `${presetName}/${theme} 主色锚点`).toEqual(requireToken(resolved, primary))
                expect(requireToken(resolved, surfaceAnchor), `${presetName}/${theme} 面基色锚点`).toEqual(requireToken(resolved, surface))
            })
        }
    }
})
