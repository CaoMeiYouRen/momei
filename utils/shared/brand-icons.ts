import { defineComponent, h, markRaw, type Component } from 'vue'

/**
 * 品牌图标与字体图标组件工厂。
 *
 * 迁移背景：数据驱动的图标配置不能再返回 PrimeVue 的图标类名，统一改为返回组件。
 * - 品牌图标优先使用 `@mdi/font` 的类名（项目已在 `nuxt.config.ts` 全局加载）。
 * - 当前 `@mdi/font` 发行包未收录 TikTok / Discord / PayPal 三个品牌，
 *   改为内联 Simple Icons（CC0）路径，保持品牌外观一致。
 * - iconfont / mdi 既有类名通过 `createClassIcon` 包装成组件，渲染结果与原 `<i class="...">` 相同。
 */

const classIconNames = new WeakMap<Component, string>()

/**
 * 把字体图标类名包装成渲染 `<i class="...">` 的最小 Vue 组件。
 *
 * `size` 与 lucide 组件保持同名契约（数字按 px、字符串原样），映射到内联 `font-size`：
 * 字体图标只能靠字号缩放，若不转换，`size` 会作为无意义属性落到 `<i>` 上（品牌图标因此偏大/偏小）。
 */
export function createClassIcon(className: string): Component {
    const component = markRaw(defineComponent({
        name: 'FontIcon',
        inheritAttrs: false,
        props: {
            size: {
                type: [Number, String],
                default: undefined,
            },
        },
        setup(props, { attrs }) {
            const resolveFontSize = () => {
                if (props.size === undefined) {
                    return undefined
                }

                return typeof props.size === 'number' ? `${props.size}px` : props.size
            }

            return () => {
                const fontSize = resolveFontSize()

                return h('i', {
                    ...attrs,
                    class: [className, attrs.class],
                    style: fontSize ? [{ fontSize }, attrs.style] : attrs.style,
                })
            }
        },
    }))

    classIconNames.set(component, className)

    return component
}

/**
 * 读取字体图标组件对应的类名。
 *
 * 仅用于测试与调试断言；品牌 SVG 组件返回 `undefined`。
 */
export function resolveClassIconName(icon: Component): string | undefined {
    return classIconNames.get(icon)
}

function createSvgIcon(name: string, path: string): Component {
    return markRaw(defineComponent({
        name,
        inheritAttrs: false,
        props: {
            size: {
                type: [Number, String],
                default: '1em',
            },
        },
        setup(props, { attrs }) {
            return () => h('svg', {
                ...attrs,
                viewBox: '0 0 24 24',
                fill: 'currentColor',
                width: props.size,
                height: props.size,
            }, [h('path', { d: path })])
        },
    }))
}

/** 标记为 raw，避免组件对象被放入 `reactive` / `computed` 后产生响应式代理告警。 */
export function rawIcon(icon: Component): Component {
    return markRaw(icon)
}

/** Simple Icons 路径（CC0），补齐 `@mdi/font` 未收录的品牌。 */
const TIKTOK_PATH = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-1.43.08-2.86-.31-4.08-1.03c-2.02-1.19-3.44-3.37-3.65-5.71c-.02-.5-.03-1-.01-1.49c.18-1.9 1.12-3.72 2.58-4.96c1.66-1.44 3.98-2.13 6.15-1.72c.02 1.48-.04 2.96-.04 4.44c-.99-.32-2.15-.23-3.02.37c-.63.41-1.11 1.04-1.36 1.75c-.21.51-.15 1.07-.14 1.61c.24 1.64 1.82 3.02 3.5 2.87c1.12-.01 2.19-.66 2.77-1.61c.19-.33.4-.67.41-1.06c.1-1.79.06-3.57.07-5.36c.01-4.03-.01-8.05.02-12.07'

const DISCORD_PATH = 'M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0a13 13 0 0 0-.617-1.25a.08.08 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.1.1 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.08.08 0 0 0 .084-.028a14 14 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13 13 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10 10 0 0 0 .372-.292a.07.07 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .078.01q.181.149.373.292a.077.077 0 0 1-.006.127a12.3 12.3 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028a19.8 19.8 0 0 0 6.002-3.03a.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418'

const PAYPAL_PATH = 'M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513c-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541c-.195 2.741-2.655 5.483-6.441 5.483H8.714Z'

/** 品牌图标集合：mdi 类名优先，缺失品牌使用内联 SVG。 */
export const BRAND_ICONS = {
    github: createClassIcon('mdi mdi-github'),
    google: createClassIcon('mdi mdi-google'),
    twitter: createClassIcon('mdi mdi-twitter'),
    linkedin: createClassIcon('mdi mdi-linkedin'),
    youtube: createClassIcon('mdi mdi-youtube'),
    twitch: createClassIcon('mdi mdi-twitch'),
    instagram: createClassIcon('mdi mdi-instagram'),
    facebook: createClassIcon('mdi mdi-facebook'),
    tiktok: createSvgIcon('TikTokIcon', TIKTOK_PATH),
    discord: createSvgIcon('DiscordIcon', DISCORD_PATH),
    paypal: createSvgIcon('PayPalIcon', PAYPAL_PATH),
} as const

export type BrandIconName = keyof typeof BRAND_ICONS
