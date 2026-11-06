import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SnippetEditDialog from './snippet-edit-dialog.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：片段编辑弹窗的渲染与提交契约。
 *
 * 覆盖：CaomeiTextarea / CaomeiSelect / CaomeiImage / CaomeiButton 的接线、
 * 状态选项数量、保存时提交的载荷。真实浮层行为由 E2E 承担。
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

vi.mock('@/composables/use-upload', () => ({
    UploadType: { IMAGE: 'image' },
    useUpload: () => ({ uploadFile: vi.fn(), uploading: false }),
}))

vi.stubGlobal('$fetch', fetchMock)
mockNuxtImport('$fetch', () => fetchMock)

const CaomeiDialogStub = defineComponent({
    name: 'CaomeiDialog',
    props: {
        open: Boolean,
        title: String,
        modal: Boolean,
        breakpoints: { type: Object, default: () => ({}) },
    },
    setup: (props, { slots }) => () => (props.open
        ? h('div', { class: 'dialog-stub', 'data-title': props.title }, [slots.default?.(), slots.footer?.()])
        : null),
})

const CaomeiTextareaStub = defineComponent({
    name: 'CaomeiTextarea',
    props: { modelValue: { type: String, default: '' }, rows: { type: Number, default: 0 } },
    emits: ['update:modelValue'],
    setup: (props, { emit }) => () => h('textarea', {
        class: 'caomei-textarea',
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    }),
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
    setup: (props) => () => h('span', { class: 'caomei-select', 'data-options': String((props.options as unknown[]).length), 'data-value': props.modelValue }),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' }, loading: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const stubs = {
    CaomeiDialog: CaomeiDialogStub,
    CaomeiTextarea: CaomeiTextareaStub,
    CaomeiSelect: CaomeiSelectStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiImage: defineComponent({
        name: 'CaomeiImage',
        props: { src: { type: String, default: '' } },
        setup: (props) => () => h('span', { class: 'caomei-image', 'data-src': props.src }),
    }),
    AppVoiceInputTrigger: defineComponent({
        name: 'AppVoiceInputTrigger',
        props: {
            modelValue: { type: String, default: '' },
            targetRef: { type: [Object, null], default: null },
            language: { type: String, default: '' },
            insertStrategy: { type: String, default: '' },
            showRefineAction: { type: Boolean, default: false },
            buttonSize: { type: String, default: '' },
            buttonClass: { type: String, default: '' },
        },
        setup: () => () => h('span', { class: 'voice-trigger' }),
    }),
}

const snippet = {
    id: 's-1',
    content: 'original content',
    status: 'inbox',
    source: 'web',
    createdAt: '2026-11-06T00:00:00.000Z',
    media: ['https://example.com/a.png'],
    post: null,
}

const mountDialog = () => mountSuspended(SnippetEditDialog, {
    props: { visible: true, snippet: snippet as never },
    global: { stubs },
})

describe('snippet-edit-dialog 迁移契约', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        fetchMock.mockResolvedValue({})
    })

    it('按片段初始值渲染表单与三个状态选项', async () => {
        const wrapper = await mountDialog()

        expect((wrapper.find('.caomei-textarea').element as HTMLTextAreaElement).value).toBe('original content')
        expect(wrapper.find('.caomei-select').attributes('data-options')).toBe('3')
        expect(wrapper.find('.caomei-select').attributes('data-value')).toBe('inbox')
        expect(wrapper.findAll('.caomei-image')).toHaveLength(1)
    })

    it('保存时提交 content / status / media 到片段接口', async () => {
        const wrapper = await mountDialog()
        const footerButtons = wrapper.find('.edit-dialog-footer').findAll('.caomei-button')

        expect(footerButtons).toHaveLength(2)
        await footerButtons[1]!.trigger('click')
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/snippets/s-1', expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ content: 'original content', status: 'inbox' }),
        }))
    })

    it('存在取消按钮与语音 / 上传入口', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.findAll('.caomei-button').length).toBeGreaterThanOrEqual(4)
        expect(wrapper.find('.voice-trigger').exists()).toBe(true)
        expect(wrapper.find('.edit-media-manager').exists()).toBe(true)
    })
})
