import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SnippetAggregateDialog from './snippet-aggregate-dialog.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：AI 聚合弹窗的渲染与请求契约。
 *
 * 覆盖：模式切换（片段 / 主题）、SelectButton / InputNumber / Checkbox 接线、
 * 生成请求的 URL 与载荷。真实浮层与像素由 E2E / parity 承担。
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)
vi.stubGlobal('$fetch', fetchMock)

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

vi.stubGlobal('navigateTo', vi.fn())

const CaomeiDialogStub = defineComponent({
    name: 'CaomeiDialog',
    props: { open: Boolean, title: String, modal: Boolean, breakpoints: { type: Object, default: () => ({}) } },
    setup: (props, { slots }) => () => (props.open
        ? h('div', { class: 'dialog-stub', 'data-title': props.title }, [slots.default?.(), slots.footer?.()])
        : null),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' }, loading: { type: Boolean, default: false }, disabled: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiSelectButtonStub = defineComponent({
    name: 'CaomeiSelectButton',
    props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('div', { class: 'caomei-select-button', 'data-options': String((props.options as unknown[]).length), 'data-value': props.modelValue }, (props.options as { label: string, value: string }[]).map((option) =>
            h('button', { class: 'select-button-option', 'data-value': option.value, onClick: () => emit('update:modelValue', option.value) }, option.label),
        ))
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup: (props, { emit }) => () => h('input', {
        class: 'caomei-input',
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
    }),
})

const stubs = {
    CaomeiDialog: CaomeiDialogStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiSelectButton: CaomeiSelectButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiInputNumber: defineComponent({
        name: 'CaomeiInputNumber',
        props: { modelValue: { type: Number, default: 3 }, controls: { type: Boolean, default: true } },
        setup: (props) => () => h('span', { class: 'caomei-input-number', 'data-controls': String(props.controls) }),
    }),
    CaomeiCheckbox: defineComponent({
        name: 'CaomeiCheckbox',
        props: { modelValue: { type: Boolean, default: false } },
        setup: (props) => () => h('input', { type: 'checkbox', class: 'caomei-checkbox', checked: props.modelValue }),
    }),
    CaomeiSelect: defineComponent({
        name: 'CaomeiSelect',
        props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
        setup: (props) => () => h('span', { class: 'caomei-select', 'data-options': String((props.options as unknown[]).length) }),
    }),
    CaomeiDivider: defineComponent({ name: 'CaomeiDivider', setup: () => () => h('hr', { class: 'caomei-divider' }) }),
    CaomeiProgressSpinner: defineComponent({ name: 'CaomeiProgressSpinner', setup: () => () => h('span', { class: 'caomei-spinner' }) }),
}

const mountDialog = (selectedSnippetIds: string[] = ['s-1']) => mountSuspended(SnippetAggregateDialog, {
    props: { visible: true, selectedSnippetIds },
    global: { stubs },
})

describe('snippet-aggregate-dialog 迁移契约', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        fetchMock.mockResolvedValue({ code: 0, data: { scaffold: '# scaffold', metadata: {} } })
    })

    it('默认片段模式渲染 SelectButton / InputNumber / Checkbox', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.find('.caomei-select-button').attributes('data-options')).toBe('2')
        expect(wrapper.find('.caomei-select-button').attributes('data-value')).toBe('snippets')
        expect(wrapper.find('.caomei-input-number').attributes('data-controls')).toBe('true')
        expect(wrapper.find('.caomei-checkbox').exists()).toBe(true)
    })

    it('切换到主题模式后渲染主题输入框', async () => {
        const wrapper = await mountDialog()

        await wrapper.find('.select-button-option[data-value="topic"]').trigger('click')
        await nextTick()

        expect(wrapper.find('.caomei-input').exists()).toBe(true)
        expect(wrapper.find('.info-alert').exists()).toBe(false)
    })

    it('生成按钮按片段模式提交 selectedSnippetIds', async () => {
        const wrapper = await mountDialog(['s-1', 's-2'])
        const buttons = wrapper.findAll('.caomei-button')
        const generate = buttons[buttons.length - 1]!

        await generate!.trigger('click')
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/ai/scaffold/generate', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ snippetIds: ['s-1', 's-2'] }),
        }))
    })
})
