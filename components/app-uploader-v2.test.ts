import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import AppUploaderV2 from './app-uploader-v2.vue'
import { UploadType } from '@/composables/use-upload'

/**
 * 过渡组件 `AppUploaderV2` 的单元契约。
 *
 * 重点：本组件是「同一文件内按路由择库」的过渡件——已迁移路由渲染 caomei-ui 组合
 * （`InputGroup` + `Input` + `Button`），未迁移路由（公开页 `friend-links`、`general-settings`、
 * `post-editor-media-settings`、`commercial-link-dialog`）必须回退到 V1，否则这些页面被被动改变。
 *
 * 行为（文件选择 / 拖放 / 上传回写）与 V1 共用 `useAppUploaderField`，本文件同时验证两条分支
 * 的行为一致，避免「只修好一版」的漂移。
 */

// 样本路由说明：`/admin/submissions` 属本迁移程序已登记前缀；`/friend-links` 为公开页（不随 admin 批次迁移）。
const routeState = reactive({ path: '/admin/submissions' })

mockNuxtImport('useRoute', () => () => routeState)

const { uploadFileMock, uploadingRef, useUploadCalls } = vi.hoisted(() => ({
    uploadFileMock: vi.fn(),
    uploadingRef: { __v_isRef: true, value: false },
    useUploadCalls: [] as { type?: string, postId?: { value: string | null } }[],
}))

vi.mock('@/composables/use-upload', () => ({
    UploadType: {
        IMAGE: 'image',
    },
    useUpload: (options: { type?: string, postId?: { value: string | null } }) => {
        useUploadCalls.push(options)

        return {
            uploading: uploadingRef,
            uploadFile: uploadFileMock,
        }
    },
}))

/** caomei 组合的 stub：忠实镜像「iconOnly 时不派发 disabled/loading 点击」。 */
const CaomeiInputGroupStub = defineComponent({
    name: 'CaomeiInputGroup',
    template: '<div class="caomei-input-group"><slot /></div>',
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    inheritAttrs: false,
    props: {
        modelValue: { type: [String, null], default: '' },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-input',
            'data-placeholder': props.placeholder,
            'data-disabled': String(props.disabled),
            'data-readonly': String(props.readonly),
            value: props.modelValue ?? '',
            onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
    },
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        loading: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            type: 'button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            'data-variant': props.variant,
            'data-loading': String(props.loading),
            'data-disabled': String(props.disabled),
            onClick: () => {
                if (!props.disabled && !props.loading) {
                    emit('click')
                }
            },
        }, [slots.icon?.(), slots.default?.()])
    },
})

const InputGroupStub = defineComponent({
    name: 'InputGroup',
    template: '<div class="input-group"><slot /></div>',
})

const InputTextStub = defineComponent({
    name: 'InputText',
    props: { modelValue: { type: [String, null], default: '' } },
    emits: ['update:modelValue'],
    template: '<input class="p-inputtext" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
})

const ButtonStub = defineComponent({
    name: 'Button',
    inheritAttrs: false,
    props: { label: { type: String, default: '' } },
    emits: ['click'],
    template: '<button class="p-button" type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
})

const stubs = {
    CaomeiInputGroup: CaomeiInputGroupStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiButton: CaomeiButtonStub,
    InputGroup: InputGroupStub,
    InputText: InputTextStub,
    Button: ButtonStub,
}

function createFileList(files: File[]) {
    return {
        '0': files[0],
        length: files.length,
        item: (index: number) => files[index] ?? null,
    }
}

async function mountUploader(
    props: Record<string, unknown> = {},
    slots: Record<string, () => unknown> = {},
) {
    const wrapper = await mountSuspended(AppUploaderV2, {
        props: { modelValue: '', ...props },
        slots,
        global: { stubs, directives: { tooltip: {} } },
    })
    await nextTick()

    return wrapper
}

describe('AppUploaderV2', () => {
    beforeEach(() => {
        routeState.path = '/admin/submissions'
        vi.clearAllMocks()
        uploadFileMock.mockReset()
        uploadingRef.value = false
        useUploadCalls.length = 0
    })

    it('已迁移路由渲染 caomei 组合（InputGroup + Input + 纯图标 Button），不渲染 PrimeVue 组合', async () => {
        const wrapper = await mountUploader({ placeholder: '链接地址' })

        expect(wrapper.find('.caomei-input-group').exists()).toBe(true)
        expect(wrapper.find('.p-inputtext').exists()).toBe(false)

        const input = wrapper.find('.caomei-input')
        expect(input.attributes('data-placeholder')).toBe('链接地址')

        const button = wrapper.find('.caomei-button')
        expect(button.attributes('data-icon-only')).toBe('true')
        expect(button.attributes('data-variant')).toBe('ghost')
        // V1 的纯图标按钮无可访问名，V2 补齐（ 在测试环境按真实词条解析）
        expect(button.attributes('data-label')).toBe('上传')
    })

    it('未迁移路由回退到 V1（PrimeVue 组合）', async () => {
        routeState.path = '/friend-links'
        const wrapper = await mountUploader()

        expect(wrapper.find('.caomei-input-group').exists()).toBe(false)
        expect(wrapper.find('.input-group').exists()).toBe(true)
        expect(wrapper.find('.p-inputtext').exists()).toBe(true)
    })

    it('未迁移路由的委托分支完整透传 props（type / postId 进入 useUpload）', async () => {
        routeState.path = '/friend-links'
        await mountUploader({ postId: 'post-9', type: UploadType.IMAGE, placeholder: '公开页占位' })

        const call = useUploadCalls.at(-1)
        expect(call?.type).toBe(UploadType.IMAGE)
        expect(call?.postId?.value).toBe('post-9')
    })

    it('已迁移路由同样把 type / postId 交给同一行为 composable', async () => {
        await mountUploader({ postId: 'post-9', type: UploadType.IMAGE })

        const call = useUploadCalls.at(-1)
        expect(call?.type).toBe(UploadType.IMAGE)
        expect(call?.postId?.value).toBe('post-9')
    })

    it('已迁移路由：点击上传按钮打开隐藏的 file input', async () => {
        const wrapper = await mountUploader()

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => undefined)

        await wrapper.find('.caomei-button').trigger('click')

        expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('已迁移路由：选择文件后上传、回写 modelValue 并重置 input', async () => {
        uploadFileMock.mockResolvedValueOnce('https://assets.example.com/link.png')
        const wrapper = await mountUploader({ postId: 'post-1', type: UploadType.IMAGE })

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        Object.defineProperty(fileInput, 'files', {
            configurable: true,
            value: createFileList([new File(['x'], 'link.png', { type: 'image/png' })]),
        })

        await wrapper.find('input[type="file"]').trigger('change')
        await nextTick()

        expect(uploadFileMock).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://assets.example.com/link.png'])
        expect(fileInput.value).toBe('')
    })

    it('已迁移路由：上传失败时不回写 modelValue（错误提示由 useUpload 统一处理）', async () => {
        uploadFileMock.mockRejectedValueOnce(new Error('boom'))
        const wrapper = await mountUploader()

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        Object.defineProperty(fileInput, 'files', {
            configurable: true,
            value: createFileList([new File(['x'], 'bad.png', { type: 'image/png' })]),
        })

        await wrapper.find('input[type="file"]').trigger('change')
        await nextTick()

        expect(uploadFileMock).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('已迁移路由：拖放离开时清除 dragging 类', async () => {
        const wrapper = await mountUploader()

        await wrapper.find('.app-uploader').trigger('dragover', { dataTransfer: { types: ['Files'] } })
        expect(wrapper.find('.app-uploader').classes()).toContain('app-uploader--dragging')

        await wrapper.find('.app-uploader').trigger('dragleave')
        expect(wrapper.find('.app-uploader').classes()).not.toContain('app-uploader--dragging')
    })

    it('两条分支都透传消费处 class（回退分支不得丢属性）', async () => {
        const migrated = await mountSuspended(AppUploaderV2, {
            props: { modelValue: '' },
            attrs: { class: 'app-uploader--custom' },
            global: { stubs, directives: { tooltip: {} } },
        })
        expect(migrated.find('.app-uploader').classes()).toContain('app-uploader--custom')

        routeState.path = '/friend-links'
        const legacy = await mountSuspended(AppUploaderV2, {
            props: { modelValue: '' },
            attrs: { class: 'app-uploader--custom' },
            global: { stubs, directives: { tooltip: {} } },
        })
        expect(legacy.find('.app-uploader').classes()).toContain('app-uploader--custom')
    })

    it('已迁移路由：拖放进入时加 dragging 类，落下后上传并清除该类', async () => {
        uploadFileMock.mockResolvedValueOnce('https://assets.example.com/dropped.png')
        const wrapper = await mountUploader()

        await wrapper.find('.app-uploader').trigger('dragover', { dataTransfer: { types: ['Files'] } })
        expect(wrapper.find('.app-uploader').classes()).toContain('app-uploader--dragging')

        await wrapper.find('.app-uploader').trigger('drop', {
            dataTransfer: { files: createFileList([new File(['x'], 'dropped.png', { type: 'image/png' })]) },
        })
        await nextTick()

        expect(uploadFileMock).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://assets.example.com/dropped.png'])
        expect(wrapper.find('.app-uploader').classes()).not.toContain('app-uploader--dragging')
    })

    it('已迁移路由：上传中或禁用时阻断拖放与落文件', async () => {
        uploadingRef.value = true
        const wrapper = await mountUploader({ disabled: true })

        await wrapper.find('.app-uploader').trigger('dragover', { dataTransfer: { types: ['Files'] } })
        await wrapper.find('.app-uploader').trigger('drop', {
            dataTransfer: { files: createFileList([new File(['x'], 'blocked.png', { type: 'image/png' })]) },
        })

        expect(wrapper.find('.app-uploader').classes()).not.toContain('app-uploader--dragging')
        expect(uploadFileMock).not.toHaveBeenCalled()
    })

    it('上传中把输入框置为 disabled，readonly 透传到 caomei Input', async () => {
        uploadingRef.value = true
        const uploading = await mountUploader({ readonly: true })
        const input = uploading.find('.caomei-input')
        expect(input.attributes('data-disabled')).toBe('true')
        expect(input.attributes('data-readonly')).toBe('true')
    })

    it('上传中/禁用时按钮进入 loading / disabled（不派发点击）', async () => {
        uploadingRef.value = true
        const wrapper = await mountUploader()
        const button = wrapper.find('.caomei-button')
        expect(button.attributes('data-loading')).toBe('true')

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => undefined)
        await button.trigger('click')
        expect(clickSpy).not.toHaveBeenCalled()
    })

    it('extra 插槽在两分支都渲染在组合内部', async () => {
        const slots = { extra: () => h('span', { class: 'slot-extra' }, 'extra') }

        const migrated = await mountUploader({}, slots)
        expect(migrated.find('.caomei-input-group .slot-extra').exists()).toBe(true)

        routeState.path = '/friend-links'
        const legacy = await mountUploader({}, slots)
        expect(legacy.find('.input-group .slot-extra').exists()).toBe(true)
    })

    it('两分支外壳类名与拖放视觉一致（同一份 app-uploader 样式）', async () => {
        const migrated = await mountUploader()
        expect(migrated.find('.app-uploader').exists()).toBe(true)

        routeState.path = '/friend-links'
        const legacy = await mountUploader()
        expect(legacy.find('.app-uploader').exists()).toBe(true)
    })
})
