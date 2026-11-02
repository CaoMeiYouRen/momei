import { mount } from '@vue/test-utils'
import { caomeiLocales, PRE_REGISTERED_LOCALES, provideLocale, useLocale, useLocaleCode, type CaomeiLocale } from 'caomei-ui'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

/**
 * caomei-ui 内建文案接线。
 *
 * 覆盖三件事：
 * 1. 插件注册了三种**非预注册**语言（`zh-TW` / `ja-JP` / `ko-KR`），预注册集合未被重复注册；
 * 2. `<CaomeiConfigProvider>` 的等价路径（`provideLocale`）在语言切换时返回对应文案；
 * 3. 未注册语言回落到默认语言，并在非生产环境给出可操作告警。
 */

/** `provide` 不会注入到同一组件，故 provider 与消费者必须分属父子组件。 */
function mountLocaleProbe(locale: Ref<CaomeiLocale>) {
    const Consumer = defineComponent({
        setup() {
            const messages = useLocale()
            const code = useLocaleCode()

            return () => h('div', {
                'data-code': code.value,
                'data-date-label': messages.value.datePicker.label,
                'data-pagination-label': messages.value.pagination.label,
                'data-table-empty': messages.value.table.empty,
            }, messages.value.confirm.confirm)
        },
    })

    const Provider = defineComponent({
        setup() {
            provideLocale({ locale })
            return () => h(Consumer)
        },
    })

    return mount(Provider)
}

describe('caomei-ui locale 接线', () => {
    it('注册三门非预注册语言，且预注册集合保持由包根提供', async () => {
        await import('@/plugins/caomei-locale')

        // 字面量断言是有意的升级绊线：预注册集合变化时，本插件的注册清单需要同步复核。
        expect(PRE_REGISTERED_LOCALES).toEqual(['zh-CN', 'en-US'])
        expect(caomeiLocales['zh-TW']).toBeTruthy()
        expect(caomeiLocales['ja-JP']).toBeTruthy()
        expect(caomeiLocales['ko-KR']).toBeTruthy()
        expect(caomeiLocales['zh-CN']).toBeTruthy()
        expect(caomeiLocales['en-US']).toBeTruthy()
    })

    it('provider 使用已注册语言的内建文案，并随语言切换更新', async () => {
        await import('@/plugins/caomei-locale')

        const locale = ref<CaomeiLocale>('zh-CN')
        const wrapper = mountLocaleProbe(locale)

        expect(wrapper.attributes('data-code')).toBe('zh-CN')
        expect(wrapper.text()).toBe('确定')

        locale.value = 'zh-TW'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-code')).toBe('zh-TW')
        expect(wrapper.attributes('data-date-label')).toBe('日期')
        expect(wrapper.attributes('data-pagination-label')).toBe('分頁')
        expect(wrapper.text()).toBe('確定')

        locale.value = 'ja-JP'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-code')).toBe('ja-JP')
        expect(wrapper.attributes('data-date-label')).toBe('日付')
        expect(wrapper.text()).toBe('確認')

        locale.value = 'ko-KR'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-code')).toBe('ko-KR')
        expect(wrapper.text()).not.toBe('確定')

        locale.value = 'en-US'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-code')).toBe('en-US')
        expect(wrapper.text()).toBe('Confirm')
    })

    it('未注册语言回落到默认语言并给出非生产告警', async () => {
        await import('@/plugins/caomei-locale')

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const locale = ref<CaomeiLocale>('fr-FR')
        const wrapper = mountLocaleProbe(locale)

        expect(wrapper.attributes('data-code')).toBe('zh-CN')
        expect(wrapper.text()).toBe('确定')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('未注册'))

        warn.mockRestore()
    })
})

describe('caomei-ui 组件内建文案', () => {
    /**
     * DataTable 空态、分页、DatePicker 的文案都来自同一份 `useLocale()` 文案对象；
     * 浏览器侧已实测 Paginator 的 `aria-label` 与「上一页」按钮在 5 个语种下跟随语言
     * （见 `docs/reports/regression/current.md` 的「第六十九阶段条目 3」窗口）。
     * 这里断言键值接线，避免为泛型组件在 jsdom 里重复搭渲染环境。
     */
    it('表格空态 / 分页 / 日期面板文案随语言切换', async () => {
        await import('@/plugins/caomei-locale')

        const locale = ref<CaomeiLocale>('zh-CN')
        const wrapper = mountLocaleProbe(locale)

        expect(wrapper.attributes('data-table-empty')).toBe('暂无数据')
        expect(wrapper.attributes('data-pagination-label')).toBe('分页')
        expect(wrapper.attributes('data-date-label')).toBe('日期')

        locale.value = 'ko-KR'
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('data-table-empty')).toBe('데이터 없음')
        expect(wrapper.attributes('data-pagination-label')).toBe('페이지네이션')
        expect(wrapper.attributes('data-date-label')).toBe('날짜')
    })
})
