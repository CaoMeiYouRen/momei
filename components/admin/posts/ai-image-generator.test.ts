import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AIImageGenerator from './ai-image-generator.vue'
import { getVisualAssetPreset } from '@/utils/shared/ai-visual-asset'

enableAutoUnmount(afterEach)

const { toastShow, fetchMock } = vi.hoisted(() => ({
    toastShow: vi.fn(),
    fetchMock: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useToast: () => ({ show: toastShow }),
    }
})

const stubs = {
    CaomeiDialog: {
        props: ['open', 'title'],
        emits: ['update:open'],
        template: '<div v-if="open" class="dialog-stub"><slot /></div>',
    },
    CaomeiSelectButton: {
        props: ['modelValue', 'options'],
        emits: ['update:modelValue'],
        template: '<button class="select-stub" @click="$emit(\'update:modelValue\', options?.[1]?.value)" />',
    },
    CaomeiInput: {
        props: ['modelValue', 'id'],
        emits: ['update:modelValue'],
        template: '<input class="input-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    CaomeiTextarea: {
        props: ['modelValue'],
        template: '<textarea class="textarea-stub" :value="modelValue" readonly />',
    },
    CaomeiButton: {
        props: ['loading'],
        emits: ['click'],
        template: '<button class="button-stub" @click="$emit(\'click\')"><slot /><slot name="icon" /></button>',
    },
    CaomeiProgressSpinner: { template: '<div class="spinner-stub" />' },
    CaomeiImage: {
        props: ['src', 'alt'],
        template: '<img class="image-stub" :src="src" :alt="alt">',
    },
    AppTooltip: { template: '<span><slot /></span>' },
}

function mountGenerator(props: Record<string, unknown> = {}) {
    return mountSuspended(AIImageGenerator, {
        props: {
            visible: true,
            articleTitle: '墨梅',
            articleSummary: '摘要',
            articleContent: '正文',
            language: 'zh-CN',
            ...props,
        },
        global: { stubs },
    })
}

describe('AIImageGenerator', () => {
    beforeEach(() => {
        toastShow.mockReset()
        fetchMock.mockReset()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('渲染尺寸字段、Prompt 预览与数量选项', async () => {
        const wrapper = await mountGenerator()

        expect(wrapper.findAll('.input-stub')).toHaveLength(5)
        expect((wrapper.get('.textarea-stub').element as HTMLTextAreaElement).value).toContain('墨梅')
        expect(wrapper.find('.ai-generator__section-hint').exists()).toBe(true)
    })

    it('切换 usage 更新 currentAssetUsage，并在 assetUsage 变更时重置 preset', async () => {
        const wrapper = await mountGenerator({ allowUsageSelection: true, allowedUsages: ['post-cover', 'topic-hero'] })
        const vm = wrapper.vm as any

        expect(wrapper.find('.select-stub').exists()).toBe(true)
        vm.onAssetUsageChange('topic-hero')
        await wrapper.vm.$nextTick()
        expect(vm.currentAssetUsage).toBe('topic-hero')

        await wrapper.setProps({ assetUsage: 'topic-hero' })
        expect(vm.resolution).toBe(getVisualAssetPreset('topic-hero').size)
    })

    it('缺少素材时智能联想给出警告且不发请求', async () => {
        const wrapper = await mountGenerator({ articleTitle: '', articleSummary: '', articleContent: '' })
        await (wrapper.vm as any).generateMagicPrompt()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ tone: 'warning' }))
    })

    it('智能联想成功时写回 dimensions，失败时提示错误', async () => {
        const wrapper = await mountGenerator()
        const vm = wrapper.vm as any
        fetchMock.mockResolvedValueOnce({ data: { dimensions: { type: '3D 渲染' } } })
        await vm.generateMagicPrompt()
        expect(vm.promptDimensions.type).toBe('3D 渲染')

        fetchMock.mockRejectedValueOnce({ data: { message: 'boom' } })
        await vm.generateMagicPrompt()
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }))
        expect(vm.magicLoading).toBe(false)
    })

    it('生成任务成功后轮询状态并展示图片', async () => {
        const wrapper = await mountGenerator({ postId: 'p1' })
        const vm = wrapper.vm as any

        vi.useFakeTimers()
        fetchMock
            .mockResolvedValueOnce({ data: { taskId: 'task-1' } })
            .mockResolvedValueOnce({ data: { status: 'completed', result: { images: [{ url: 'https://img.test/a.png' }] } } })

        await vm.generateImage()
        expect(vm.generating).toBe(true)
        expect(fetchMock).toHaveBeenCalledWith('/api/ai/image/generate', expect.objectContaining({ method: 'POST' }))

        await vi.advanceTimersByTimeAsync(10_000)
        await wrapper.vm.$nextTick()

        expect(vm.generatedImages).toHaveLength(1)
        expect(vm.generating).toBe(false)
        expect(wrapper.findAll('.image-stub')).toHaveLength(1)
    })

    it('生成任务缺少 taskId 与轮询失败时提示错误', async () => {
        const wrapper = await mountGenerator()
        const vm = wrapper.vm as any

        fetchMock.mockResolvedValueOnce({ data: {} })
        await vm.generateImage()
        expect(vm.generating).toBe(false)
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }))

        vi.useFakeTimers()
        fetchMock
            .mockResolvedValueOnce({ data: { taskId: 'task-2' } })
            .mockResolvedValueOnce({ data: { status: 'failed', error: 'bad' } })
        await vm.generateImage()
        await vi.advanceTimersByTimeAsync(10_000)
        expect(vm.generating).toBe(false)
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }))
    })

    it('应用选中的图片时发出 generated 并关闭对话框', async () => {
        const wrapper = await mountGenerator()
        const vm = wrapper.vm as any
        vm.generatedImages = [{ url: 'https://img.test/a.png' }, { url: 'https://img.test/b.png' }]
        vm.selectedImageIndex = 1

        vm.applyImage()
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('generated')?.[0]?.[0]).toMatchObject({ url: 'https://img.test/b.png', assetUsage: 'post-cover' })
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
        expect(vm.generatedImages).toEqual([])
    })

    it('关闭对话框且未生成时重置状态与 Prompt 尺寸', async () => {
        const wrapper = await mountGenerator()
        const vm = wrapper.vm as any
        vm.promptDimensions.type = '自定义'
        await wrapper.setProps({ visible: false })
        await wrapper.vm.$nextTick()
        expect(vm.promptDimensions.type).not.toBe('自定义')
    })
})
