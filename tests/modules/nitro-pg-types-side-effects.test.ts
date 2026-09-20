import { describe, expect, it } from 'vitest'
import {
    NITRO_DEFAULT_MODULE_SIDE_EFFECTS,
    PG_TYPES_MODULE_SIDE_EFFECT,
    assertModuleSideEffectsPresent,
    ensureModuleSideEffects,
    registerPgTypesSideEffects,
    type NitroLike,
    type NuxtHookHost,
} from '../../modules/nitro-pg-types-side-effects'

function createHookHost() {
    const handlers = new Map<string, (payload: unknown) => void>()

    const hookHost: NuxtHookHost = {
        hook: (name, handler) => {
            handlers.set(name, handler)
        },
    }

    return {
        hookHost,
        run: (name: string, payload: unknown) => handlers.get(name)?.(payload),
        has: (name: string) => handlers.has(name),
    }
}

describe('ensureModuleSideEffects', () => {
    it('在缺少 pg-types 时追加并返回 true', () => {
        const moduleSideEffects = ['unenv/polyfill/', 'node-fetch-native/polyfill']

        expect(ensureModuleSideEffects(moduleSideEffects)).toBe(true)
        expect(moduleSideEffects).toEqual([
            'unenv/polyfill/',
            'node-fetch-native/polyfill',
            'pg-types',
        ])
    })

    it('已存在时保持幂等且不重复追加', () => {
        const moduleSideEffects = ['unenv/polyfill/', 'pg-types']

        expect(ensureModuleSideEffects(moduleSideEffects)).toBe(false)
        expect(moduleSideEffects).toEqual(['unenv/polyfill/', 'pg-types'])
    })

    it('空数组时只追加 pg-types', () => {
        const moduleSideEffects: string[] = []

        expect(ensureModuleSideEffects(moduleSideEffects)).toBe(true)
        expect(moduleSideEffects).toEqual(['pg-types'])
    })

    it('副作用白名单常量覆盖实际包名', () => {
        expect(PG_TYPES_MODULE_SIDE_EFFECT).toBe('pg-types')
    })
})

describe('assertModuleSideEffectsPresent', () => {
    it('缺失 pg-types 时抛错', () => {
        expect(() => assertModuleSideEffectsPresent(undefined)).toThrow(/pg-types/)
        expect(() => assertModuleSideEffectsPresent([])).toThrow(/pg-types/)
    })

    it('包含 pg-types 时放行', () => {
        expect(() => assertModuleSideEffectsPresent(['pg-types'])).not.toThrow()
    })
})

describe('registerPgTypesSideEffects', () => {
    it('nitro:init 注入 pg-types 且保留 Nitro 既有条目', () => {
        const { hookHost, run, has } = createHookHost()

        registerPgTypesSideEffects(hookHost)
        expect(has('nitro:init')).toBe(true)
        expect(has('nitro:build:before')).toBe(true)

        const nitro: NitroLike = { options: { moduleSideEffects: ['unenv/polyfill/'] } }
        run('nitro:init', nitro)

        expect(nitro.options.moduleSideEffects).toEqual(['unenv/polyfill/', 'pg-types'])
    })

    it('nitro:init 在选项缺失时用 Nitro 默认条目兜底', () => {
        const { hookHost, run } = createHookHost()
        registerPgTypesSideEffects(hookHost)

        const nitro: NitroLike = { options: {} }
        run('nitro:init', nitro)

        expect(nitro.options.moduleSideEffects).toEqual([
            ...NITRO_DEFAULT_MODULE_SIDE_EFFECTS,
            'pg-types',
        ])
    })

    it('nitro:build:before 在注入生效时放行、失效时抛错', () => {
        const { hookHost, run } = createHookHost()
        registerPgTypesSideEffects(hookHost)

        const injected: NitroLike = { options: {} }
        run('nitro:init', injected)
        expect(() => run('nitro:build:before', injected)).not.toThrow()

        expect(() => run('nitro:build:before', { options: { moduleSideEffects: [] } })).toThrow(/pg-types/)
    })
})
