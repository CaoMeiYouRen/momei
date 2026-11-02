import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

/**
 * `app.vue` 的 caomei locale 接线。
 *
 * 这一层是「库注册」与「页面语言」之间唯一的粘合点：注册表再完整，只要 provider 没挂上、
 * 或把原始 `locale` 直接传给 provider，`zh-TW` / `ja-JP` / `ko-KR` 的内建文案都会静默回落
 * 到 `zh-CN`。因此除归一化单测外，另加一条结构断言锁住 `app.vue` 的接线形态。
 */

const localeHolder = vi.hoisted(() => ({ current: undefined as Ref<string> | undefined }))

mockNuxtImport('useI18n', () => () => {
    localeHolder.current ??= ref('zh-CN')
    return {
        locale: localeHolder.current,
        t: (key: string) => key,
    }
})

const locale = (): Ref<string> => {
    if (!localeHolder.current) {
        localeHolder.current = ref('zh-CN')
    }

    return localeHolder.current
}

const { resolveCaomeiLocale, useCaomeiLocale } = await import('@/composables/use-caomei-locale')

describe('useCaomeiLocale', () => {
    it('已知语言直接映射为 caomei 标识', () => {
        expect(resolveCaomeiLocale('zh-CN')).toBe('zh-CN')
        expect(resolveCaomeiLocale('en-US')).toBe('en-US')
        expect(resolveCaomeiLocale('zh-TW')).toBe('zh-TW')
        expect(resolveCaomeiLocale('ja-JP')).toBe('ja-JP')
        expect(resolveCaomeiLocale('ko-KR')).toBe('ko-KR')
    })

    it('历史 / 小写写法先经 registry 归一化', () => {
        expect(resolveCaomeiLocale('zh-hant')).toBe('zh-TW')
        expect(resolveCaomeiLocale('ja')).toBe('ja-JP')
        expect(resolveCaomeiLocale('ko')).toBe('ko-KR')
    })

    it('未知或缺失语言回落到默认语言', () => {
        expect(resolveCaomeiLocale('fr-FR')).toBe('zh-CN')
        expect(resolveCaomeiLocale('')).toBe('zh-CN')
        expect(resolveCaomeiLocale(null)).toBe('zh-CN')
        expect(resolveCaomeiLocale(undefined)).toBe('zh-CN')
    })

    it('跟随 useI18n 的 locale 响应式变化', async () => {
        locale().value = 'zh-CN'

        const Probe = defineComponent({
            setup() {
                const caomeiLocale = useCaomeiLocale()
                return () => h('div', { 'data-locale': caomeiLocale.value })
            },
        })

        const wrapper = await mountSuspended(Probe)
        expect(wrapper.attributes('data-locale')).toBe('zh-CN')

        locale().value = 'ja-JP'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-locale')).toBe('ja-JP')

        locale().value = 'zh-hant'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-locale')).toBe('zh-TW')
    })
})

describe('app.vue 的 provider 接线', () => {
    it('用 useCaomeiLocale 的结果绑定 CaomeiConfigProvider', async () => {
        const source = await readFile(path.join(process.cwd(), 'app.vue'), 'utf8')

        expect(source).toContain('<CaomeiConfigProvider :locale="caomeiLocale">')
        expect(source).toContain('import { useCaomeiLocale } from \'@/composables/use-caomei-locale\'')
        expect(source).toContain('const caomeiLocale = useCaomeiLocale()')
        // locale provider 必须在 toast / confirm 之外，否则两套全局壳拿不到当前语言文案。
        expect(source.indexOf('<CaomeiConfigProvider')).toBeLessThan(source.indexOf('<CaomeiToastProvider'))
        expect(source.indexOf('<CaomeiConfigProvider')).toBeLessThan(source.indexOf('<CaomeiConfirmDialog'))
    })
})
