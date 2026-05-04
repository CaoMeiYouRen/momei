import { flushPromises } from '@vue/test-utils'
import { ref, watch } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostTTSDialog from './post-tts-dialog.vue'

const mockAppFetch = vi.fn()
const mockResolveErrorMessage = vi.fn(() => 'fallback error')
const { mockGenerateAndUpload, directProgress, directError, directIsGenerating } = vi.hoisted(() => ({
    mockGenerateAndUpload: vi.fn(),
    directProgress: { value: 0 },
    directError: { value: null as string | null },
    directIsGenerating: { value: false },
}))

vi.mock('@vueuse/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@vueuse/core')>()

    return {
        ...actual,
        watchDebounced: watch,
    }
})

vi.mock('~/composables/use-tts-task', () => ({
    useTTSTask: () => ({
        status: ref('idle'),
        progress: ref(0),
        audioUrl: ref(''),
        error: ref<string | null>(null),
        startPolling: vi.fn(),
    }),
}))

vi.mock('~/composables/use-tts-volcengine-direct', () => ({
    useTTSVolcengineDirect: () => ({
        progress: directProgress,
        error: directError,
        isGenerating: directIsGenerating,
        generateAndUpload: mockGenerateAndUpload,
    }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('zh-CN'),
        }),
    }
})

vi.stubGlobal('$fetch', mockAppFetch)
vi.stubGlobal('useRequestFeedback', () => ({
    resolveErrorMessage: mockResolveErrorMessage,
}))

describe('PostTTSDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        directProgress.value = 0
        directError.value = null
        directIsGenerating.value = false
        mockGenerateAndUpload.mockResolvedValue({
            audioUrl: 'https://cdn.example.com/direct.mp3',
        })
        mockAppFetch.mockImplementation((url: string) => {
            if (url === '/api/ai/tts/config') {
                return Promise.resolve({
                    data: {
                        defaultProvider: 'openai',
                        availableProviders: ['openai'],
                        providerModes: { openai: ['speech'] },
                    },
                })
            }

            if (url === '/api/ai/tts/voices') {
                return Promise.resolve({
                    data: [{ id: 'alloy', name: 'Alloy' }],
                })
            }

            if (url === '/api/ai/tts/estimate') {
                return Promise.resolve({
                    data: {
                        providerCost: 0.42,
                        providerCurrency: 'USD',
                        displayCost: 12.345,
                        quotaUnits: 18,
                        costDisplay: {
                            currencyCode: 'CNY',
                            currencySymbol: '¥',
                            quotaUnitPrice: 0.1,
                        },
                    },
                })
            }

            return Promise.resolve({ data: {} })
        })
    })

    it('renders normalized estimated cost from estimate contract', async () => {
        const wrapper = await mountSuspended(PostTTSDialog, {
            props: {
                visible: false,
                postId: 'post-1',
                content: 'Hello from Momei',
                language: 'zh-CN',
                translationId: 'cluster-1',
            },
            global: {
                stubs: {
                    Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                    Button: { template: '<button :data-label="label" @click="$emit(\'click\')"><slot /></button>', props: ['label'], emits: ['click'] },
                    Select: { template: '<div />' },
                    RadioButton: { template: '<div />' },
                    ProgressBar: { template: '<div />' },
                    Message: { template: '<div><slot /></div>' },
                    Textarea: { template: '<textarea />' },
                },
            },
        })

        await wrapper.setProps({ visible: true })
        await flushPromises()
        await flushPromises()

        expect(mockAppFetch).toHaveBeenCalledWith('/api/ai/tts/estimate', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                mode: 'speech',
            }),
        }))
        expect(wrapper.text()).toContain('12.35')
        expect(wrapper.text()).toContain('¥')
        expect(wrapper.text()).toContain('CNY')
    })

    it('submits locale-aware task payload when generating audio', async () => {
        mockAppFetch.mockImplementation((url: string) => {
            if (url === '/api/ai/tts/config') {
                return Promise.resolve({
                    data: {
                        defaultProvider: 'openai',
                        availableProviders: ['openai'],
                        providerModes: { openai: ['speech'] },
                    },
                })
            }

            if (url === '/api/ai/tts/voices') {
                return Promise.resolve({
                    data: [{ id: 'alloy', name: 'Alloy' }],
                })
            }

            if (url === '/api/ai/tts/estimate') {
                return Promise.resolve({
                    data: {
                        providerCost: 0.42,
                        providerCurrency: 'USD',
                        displayCost: 12.345,
                        quotaUnits: 18,
                        costDisplay: {
                            currencyCode: 'CNY',
                            currencySymbol: '¥',
                            quotaUnitPrice: 0.1,
                        },
                    },
                })
            }

            if (url === '/api/ai/tts/task') {
                return Promise.resolve({
                    taskId: 'task-1',
                })
            }

            return Promise.resolve({ data: {} })
        })

        const wrapper = await mountSuspended(PostTTSDialog, {
            props: {
                visible: true,
                postId: 'post-1',
                content: 'Hello from Momei',
                language: 'en-US',
                translationId: 'cluster-1',
            },
            global: {
                stubs: {
                    Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                    Button: { template: '<button :data-label="label" @click="$emit(\'click\')"><slot /></button>', props: ['label'], emits: ['click'] },
                    Select: { template: '<div />' },
                    RadioButton: { template: '<div />' },
                    ProgressBar: { template: '<div />' },
                    Message: { template: '<div><slot /></div>' },
                    Textarea: { template: '<textarea />' },
                },
            },
        })

        await flushPromises()
        await flushPromises()

        await wrapper.get('button[data-label="pages.admin.posts.tts.start_generate"]').trigger('click')

        expect(mockAppFetch).toHaveBeenCalledWith('/api/ai/tts/task', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                postId: 'post-1',
                language: 'en-US',
                translationId: 'cluster-1',
            }),
        }))
    })

    it('uses the volcengine direct flow and emits completed payload after confirmation', async () => {
        mockAppFetch.mockImplementation((url: string) => {
            if (url === '/api/ai/tts/config') {
                return Promise.resolve({
                    data: {
                        defaultProvider: 'volcengine',
                        availableProviders: ['volcengine', 'openai'],
                        providerModes: {
                            volcengine: ['speech', 'podcast'],
                            openai: ['speech'],
                        },
                    },
                })
            }

            if (url === '/api/ai/tts/voices') {
                return Promise.resolve({
                    data: [{ id: 'BV001', name: 'Volc Voice' }],
                })
            }

            if (url === '/api/ai/tts/estimate') {
                return Promise.resolve({
                    data: {
                        providerCost: 0.2,
                        providerCurrency: 'USD',
                        displayCost: 2.5,
                        quotaUnits: 4,
                        costDisplay: {
                            currencyCode: 'CNY',
                            currencySymbol: '¥',
                            quotaUnitPrice: 0.1,
                        },
                    },
                })
            }

            return Promise.resolve({ data: {} })
        })

        const wrapper = await mountSuspended(PostTTSDialog, {
            props: {
                visible: true,
                postId: 'post-2',
                content: 'Direct generation content',
                language: 'zh-CN',
                translationId: 'cluster-direct',
            },
            global: {
                stubs: {
                    Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                    Button: { template: '<button :data-label="label" @click="$emit(\'click\')"><slot /></button>', props: ['label'], emits: ['click'] },
                    Select: { template: '<div />' },
                    RadioButton: { template: '<div />' },
                    ProgressBar: { template: '<div />' },
                    Message: { template: '<div><slot /></div>' },
                    Textarea: { template: '<textarea />' },
                },
            },
        })

        await flushPromises()
        await flushPromises()

        await wrapper.get('button[data-label="pages.admin.posts.tts.start_generate"]').trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('pages.admin.posts.tts.direct_hint')

        expect(mockGenerateAndUpload).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'speech',
            text: 'Direct generation content',
            voice: 'BV001',
            language: 'zh-CN',
            postId: 'post-2',
        }))
        expect(mockAppFetch).not.toHaveBeenCalledWith('/api/ai/tts/task', expect.anything())

        await wrapper.get('button[data-label="common.confirm"]').trigger('click')

        expect(wrapper.emitted('completed')).toEqual([
            [{
                audioUrl: 'https://cdn.example.com/direct.mp3',
                provider: 'volcengine',
                voice: 'BV001',
                mode: 'speech',
            }],
        ])
    })

})
