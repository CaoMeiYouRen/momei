import { mount } from '@vue/test-utils'
import { caomeiLocales, provideLocale, registerLocale, useLocale } from 'caomei-ui'
import jaJP from 'caomei-ui/locale/ja-jp'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

/**
 * 注册时序契约：`registerLocale` 必须先于 `CaomeiConfigProvider` 首次求值。
 *
 * 这不是重复测试库实现，而是钉住本插件存在的前提——provider 的文案是 computed，
 * 只在语言标识变化时重算；若注册晚于首帧，该语言会一直显示默认文案，直到用户手动
 * 切走再切回。
 *
 * Nuxt 测试环境会自动加载插件（注册表已含 ja-JP），故用例先临时移除该语言模拟
 * 「未注册」，结束后按插件同样的方式恢复。
 *
 * 直接改写库的模块级注册表依赖 vitest 的文件级模块隔离；若后续改为 `isolate: false`，
 * 该用例需改为独立进程或改用 `vi.resetModules()` 隔离，避免跨文件污染。
 */
function mountProbe(locale: string) {
    const Consumer = defineComponent({
        setup() {
            const messages = useLocale()
            return () => h('div', messages.value.confirm.confirm)
        },
    })

    const Provider = defineComponent({
        setup() {
            provideLocale({ locale: ref(locale as never) })
            return () => h(Consumer)
        },
    })

    return mount(Provider)
}

describe('caomei locale 注册时序', () => {
    it('注册晚于 provider 首帧时不会追溯改写，已求值的 provider 保持回落文案', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        delete caomeiLocales['ja-JP']

        try {
            const before = mountProbe('ja-JP')
            expect(before.text()).toBe('确定')
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('未注册'))

            registerLocale('ja-JP', jaJP)

            // 已求值的 provider 不会因注册而重算（computed 依赖语言标识，而非注册表本身）。
            expect(before.text()).toBe('确定')

            // 注册完成后新挂载的 provider 才拿到对应语言文案。
            const after = mountProbe('ja-JP')
            expect(after.text()).toBe('確認')
        } finally {
            registerLocale('ja-JP', jaJP)
            warn.mockRestore()
        }
    })
})
