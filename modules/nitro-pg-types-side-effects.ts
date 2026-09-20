import { defineNuxtModule } from 'nuxt/kit'

/**
 * 需要强制保留顶层副作用的包名。
 *
 * `pg-types` 的默认类型解析器并不在模块导出里体现，而是由模块顶层的
 * `textParsers.init(...)` / `binaryParsers.init(...)` 注册进闭包内的 `typeParsers` 表。
 * Nitro 2.x 的 Rollup 配置使用 `treeshake.moduleSideEffects` 白名单
 * （见 nitropack `dist/rollup/index.mjs`），不在白名单内的模块一律视为无副作用；
 * 于是这两个 `init` 调用会被摇树，`getTypeParser` 永久回退到 `noParse`，
 * 使 PostgreSQL 的 `bool` / `int4` / `json` 等全部以原始文本返回
 * （表现为 `isPinned: 'f'`、`views: '0'`、`metadata` 为 JSON 字符串）。
 *
 * 前端 `data.isPinned ? 是 : 否` 依赖真值判断，非空字符串 `'f'` 恒为真，
 * 因此会退化为「所有文章都显示置顶」。
 */
export const PG_TYPES_MODULE_SIDE_EFFECT = 'pg-types'

/**
 * Nitro 内置的默认副作用白名单。
 *
 * 正常情况下 `nitro.options.moduleSideEffects` 已包含这些条目；此处仅在数组缺失时
 * 兜底，避免 `||= []` 静默丢掉 `unenv` / `node-fetch-native` 的 polyfill 副作用。
 */
export const NITRO_DEFAULT_MODULE_SIDE_EFFECTS = [
    'unenv/polyfill/',
    'node-fetch-native/polyfill',
    'node-fetch-native/dist/polyfill',
]

/** 最小化的 Nitro 配置结构（仅本模块需要读写的字段）。 */
export interface NitroLike {
    options: {
        moduleSideEffects?: string[]
    }
}

/** 最小化的 Nuxt 钩子注册接口，便于单测注入假实现。 */
export interface NuxtHookHost {
    hook: (name: string, handler: (payload: unknown) => void) => void
}

/**
 * 就地确保 `pg-types` 位于副作用白名单中。
 *
 * 抽为纯函数以便单测；返回是否发生了改动，供调用方判断注入是否真的生效。
 *
 * @param moduleSideEffects Nitro 的 `options.moduleSideEffects` 数组（原地修改）。
 * @returns 追加了 `pg-types` 时返回 `true`，已存在时返回 `false`。
 */
export function ensureModuleSideEffects(moduleSideEffects: string[]): boolean {
    if (moduleSideEffects.includes(PG_TYPES_MODULE_SIDE_EFFECT)) {
        return false
    }

    moduleSideEffects.push(PG_TYPES_MODULE_SIDE_EFFECT)
    return true
}

/**
 * 校验副作用白名单确实包含 `pg-types`，否则直接失败。
 *
 * @param moduleSideEffects Nitro 的 `options.moduleSideEffects`。
 */
export function assertModuleSideEffectsPresent(moduleSideEffects: string[] | undefined): void {
    if (!moduleSideEffects?.includes(PG_TYPES_MODULE_SIDE_EFFECT)) {
        throw new Error(
            '[momei-nitro-pg-types-side-effects] 未能把 pg-types 注入 Nitro 副作用白名单，'
            + 'PostgreSQL 的布尔/整型/JSON 字段会退化为字符串。'
            + '请确认 nitro:init 钩子仍被触发，且 Nitro 仍支持 options.moduleSideEffects。',
        )
    }
}

/**
 * 把 `pg-types` 注入 Nitro 副作用白名单，并对注入结果加护栏。
 *
 * 抽为独立函数以便用假 Nuxt 钩子宿主验证注册与护栏行为。
 */
export function registerPgTypesSideEffects(nuxt: NuxtHookHost): void {
    nuxt.hook('nitro:init', (payload) => {
        const nitro = payload as NitroLike
        nitro.options.moduleSideEffects ||= [...NITRO_DEFAULT_MODULE_SIDE_EFFECTS]
        ensureModuleSideEffects(nitro.options.moduleSideEffects)
    })

    nuxt.hook('nitro:build:before', (payload) => {
        const nitro = payload as NitroLike
        assertModuleSideEffectsPresent(nitro.options.moduleSideEffects)
    })
}

/**
 * 修复 Nitro/Rollup 摇树导致 `pg-types` 默认解析器丢失的 Nuxt 模块。
 *
 * 在 `nitro:init` 阶段把 `pg-types` 追加进副作用白名单（此时 Nitro 默认值已应用，
 * 无需覆盖 `unenv` / `node-fetch-native` 等既有条目），并用 `nitro:build:before`
 * 护栏在注入失效时直接失败，避免退化成静默的类型错误。
 */
export default defineNuxtModule({
    meta: {
        name: 'momei-nitro-pg-types-side-effects',
    },
    setup(_options, nuxt) {
        registerPgTypesSideEffects(nuxt as unknown as NuxtHookHost)
    },
})
