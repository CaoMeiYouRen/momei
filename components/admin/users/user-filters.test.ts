import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UserFilters from './user-filters.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/users` 路由自有筛选组件的迁移后契约。
 *
 * 该组件随 host 路由整路由迁移（方案 §5.5「路由自有」），`Toolbar` 不在在册族内保持 PrimeVue；
 * 在册族部分为 `IconField` + `InputIcon` + `InputText` → `CaomeiInput`（`#prefix`）、
 * `Select` ×2 → `CaomeiSelect`（对象选项 `option-label` / `option-value`）。
 */

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
        return () => h('span', { class: 'caomei-input', 'data-placeholder': props.placeholder }, [
            slots.prefix?.(),
            h('input', {
                value: props.modelValue,
                onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
            }),
        ])
    },
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: [String, Number, Object], default: undefined },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: '' },
        optionValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const options = () => props.options as { value: unknown }[]
        // 明确处理未知类型，避免 `String(value)` 对对象产生 `[object Object]`（ESLint `no-base-to-string`）
        const toText = (value: unknown) => {
            if (value === null || value === undefined) {
                return ''
            }

            return typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
        }
        return () => h('span', {
            class: 'caomei-select',
            'data-placeholder': props.placeholder,
            'data-model': toText(props.modelValue),
            'data-options': options().map((option) => toText(option.value)).join(','),
            'data-option-label': props.optionLabel,
            'data-option-value': props.optionValue,
        }, [
            // 首项（「全部」哨兵项）
            h('button', {
                class: 'select-option-first',
                onClick: () => emit('update:modelValue', toText(options()[0]?.value)),
            }),
            // 具名项（admin / active）
            h('button', {
                class: 'select-option-named',
                onClick: () => emit('update:modelValue', 'admin'),
            }),
        ])
    },
})

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))

const stubs = {
    Toolbar: defineComponent({
        name: 'Toolbar',
        setup: (_, { slots }) => () => h('div', { class: 'toolbar-stub' }, slots.start?.()),
    }),
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
}

async function mountComponent(filters = { searchValue: '', role: null as string | null, status: null as string | null }) {
    const wrapper = await mountSuspended(UserFilters, {
        props: { filters },
        global: { stubs, mocks: { $t: (key: string) => key } },
    })
    await nextTick()

    return wrapper
}

describe('UserFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('筛选行迁移为 CaomeiInput（#prefix 图标）与两个 CaomeiSelect', async () => {
        const wrapper = await mountComponent()

        const input = wrapper.find('.caomei-input')
        expect(input.exists()).toBe(true)
        expect(input.attributes('data-placeholder')).toBe('pages.admin.users.search_placeholder')
        expect(input.find('svg, i').exists()).toBe(true)

        const selects = wrapper.findAll('.caomei-select')
        expect(selects).toHaveLength(2)
        expect(selects.map((select) => select.attributes('data-placeholder'))).toEqual([
            'pages.admin.users.filter_role',
            'pages.admin.users.filter_status',
        ])
    })

    it('对象选项沿用 PrimeVue 的 option-label / option-value 契约，「全部」以哨兵值承载', async () => {
        const wrapper = await mountComponent()

        const roleSelect = wrapper.findAll('.caomei-select')[0]!
        expect(roleSelect.attributes('data-option-label')).toBe('label')
        expect(roleSelect.attributes('data-option-value')).toBe('value')
        // caomei `optionValue` 不渲染 `null` 值选项（上游 §1.2），故「所有角色」用哨兵值
        expect(roleSelect.attributes('data-options')).toBe('__all__,admin,author,user')
        expect(wrapper.findAll('.caomei-select')[1]!.attributes('data-options')).toBe('__all__,active,banned')
    })

    it('哨兵值与筛选模型（null = 全部）在边界双向转换', async () => {
        // 模型为 null（全部）时，选择器显示哨兵项
        const wrapper = await mountComponent({ searchValue: '', role: null, status: null })
        expect(wrapper.findAll('.caomei-select')[0]!.attributes('data-model')).toBe('__all__')

        // 从具体角色切回「全部」哨兵项时，对外模型仍还原为 null（父组件与 API 契约不变）
        const wrapper2 = await mountComponent({ searchValue: '', role: 'author', status: null })
        expect(wrapper2.findAll('.caomei-select')[0]!.attributes('data-model')).toBe('author')
        await wrapper2.findAll('.caomei-select')[0]!.find('.select-option-first').trigger('click')
        await nextTick()
        expect(wrapper2.emitted()['update:filters']!.at(-1)![0]).toMatchObject({ role: null })
    })

    it('宽度类保留在筛选字段上（迁移前 PrimeVue 的 16rem / 10rem 约束）', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.user-filters__search').exists()).toBe(true)
        expect(wrapper.findAll('.user-filters__dropdown')).toHaveLength(2)
    })

    it('内部筛选变更同时抛出 update:filters 与 change', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.caomei-input input').setValue('ada')
        await nextTick()

        const emitted = wrapper.emitted()
        expect(emitted['update:filters']).toBeTruthy()
        expect(emitted.change).toBeTruthy()
        expect(emitted['update:filters']!.at(-1)![0]).toMatchObject({ searchValue: 'ada' })
    })

    it('选择器变更同样触发筛选事件', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.caomei-select')[0]!.find('.select-option-named').trigger('click')
        await nextTick()

        expect(wrapper.emitted().change).toBeTruthy()
        expect(wrapper.emitted()['update:filters']!.at(-1)![0]).toMatchObject({ role: 'admin' })
    })
})
