import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Ref, defineComponent, h, nextTick } from 'vue'
import ContentLanguageSwitcherV2 from './content-language-switcher-v2.vue'

/**
 * 过渡组件 `AdminContentLanguageSwitcherV2`（caomei-ui 版）的单元契约。
 *
 * 重点：caomei `Select` 的 `optionValue` 只接受 `string` / `number`（`null` 值的选项不渲染），
 * 而共享状态 `contentLanguage` 以 `null` 表示「全部语言」。本组件须在边界做哨兵映射，
 * 且**不得改变**共享状态语义（否则未迁移路由的 V1 消费者会读到 `''` 等异常值）。
 */

const holder = vi.hoisted(() => ({ lang: null as unknown }))

mockNuxtImport('useAdminI18n', async () => {
    const vue = await import('vue')

    return () => {
        holder.lang ??= vue.ref<string | null>(null)

        return {
            contentLanguage: holder.lang,
            availableLocales: vue.ref([
                { label: '全部语言', value: null },
                { label: '简体中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
            ]),
        }
    }
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: [String, Number], default: null },
        options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as { label: string, value: unknown }[]).map((option) => h('option', {
            value: String(option.value),
        }, option.label)))
    },
})

const stubs = { CaomeiSelect: CaomeiSelectStub }

function langRef() {
    return holder.lang as Ref<string | null>
}

// mock 工厂在首次挂载时才执行，故 `holder.lang` 在此之前为 `null`；`beforeEach` 只做有值时的重置。
beforeEach(() => {
    if (holder.lang) {
        langRef().value = null
    }
})

describe('AdminContentLanguageSwitcherV2', () => {
    it('「全部语言」（共享状态 null）以哨兵承载并成为当前值', async () => {
        const wrapper = await mountSuspended(ContentLanguageSwitcherV2, { global: { stubs } })

        const select = wrapper.find('select')
        expect(select.element.value).toBe('__all__')
        // 哨兵不得泄漏到共享状态
        expect(langRef().value).toBeNull()
    })

    it('选项值中的 null 被映射为哨兵（否则该选项不会被渲染）', async () => {
        const wrapper = await mountSuspended(ContentLanguageSwitcherV2, { global: { stubs } })

        const values = wrapper.findAll('option').map((option) => option.element.value)
        expect(values).toEqual(['__all__', 'zh-CN', 'en-US'])
    })

    it('选择具体语言写回共享状态', async () => {
        const wrapper = await mountSuspended(ContentLanguageSwitcherV2, { global: { stubs } })

        await wrapper.find('select').setValue('zh-CN')

        expect(langRef().value).toBe('zh-CN')
    })

    it('选择「全部语言」时还原为 null', async () => {
        const wrapper = await mountSuspended(ContentLanguageSwitcherV2, { global: { stubs } })

        langRef().value = 'en-US'
        await nextTick()
        expect(wrapper.find('select').element.value).toBe('en-US')

        await wrapper.find('select').setValue('__all__')

        expect(langRef().value).toBeNull()
    })
})
