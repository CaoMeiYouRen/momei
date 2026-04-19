import { defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppVoiceInputTrigger from './app-voice-input-trigger.vue'

const {
    isListeningRef,
    isSupportedRef,
    interimTranscriptRef,
    finalTranscriptRef,
    errorRef,
    modeRef,
    isLoadingModelRef,
    modelProgressRef,
    isModelReadyRef,
    cloudConfigRef,
    startListeningMock,
    stopListeningMock,
    resetVoiceMock,
    insertVoiceTextMock,
    fetchMock,
    overlayShowMock,
    overlayHideMock,
} = vi.hoisted(() => ({
    isListeningRef: { __v_isRef: true, value: false },
    isSupportedRef: { __v_isRef: true, value: true },
    interimTranscriptRef: { __v_isRef: true, value: '' },
    finalTranscriptRef: { __v_isRef: true, value: '' },
    errorRef: { __v_isRef: true, value: '' },
    modeRef: { __v_isRef: true, value: 'web-speech' },
    isLoadingModelRef: { __v_isRef: true, value: false },
    modelProgressRef: { __v_isRef: true, value: 0 },
    isModelReadyRef: { __v_isRef: true, value: true },
    cloudConfigRef: { __v_isRef: true, value: { enabled: true, siliconflow: true, volcengine: true } },
    startListeningMock: vi.fn(),
    stopListeningMock: vi.fn(),
    resetVoiceMock: vi.fn(),
    insertVoiceTextMock: vi.fn(),
    fetchMock: vi.fn(),
    overlayShowMock: vi.fn(),
    overlayHideMock: vi.fn(),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useI18n: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('@/composables/use-voice-input', () => ({
    useVoiceInput: () => ({
        isListening: isListeningRef,
        isSupported: isSupportedRef,
        interimTranscript: interimTranscriptRef,
        finalTranscript: finalTranscriptRef,
        error: errorRef,
        mode: modeRef,
        isLoadingModel: isLoadingModelRef,
        modelProgress: modelProgressRef,
        isModelReady: isModelReadyRef,
        cloudConfig: cloudConfigRef,
        startListening: startListeningMock,
        stopListening: stopListeningMock,
        reset: resetVoiceMock,
    }),
}))

vi.mock('@/utils/web/voice-text', () => ({
    insertVoiceText: insertVoiceTextMock,
}))

vi.stubGlobal('$fetch', fetchMock)

const ButtonStub = defineComponent({
    inheritAttrs: false,
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
})

const ClientOnlyStub = defineComponent({
    setup(_, { slots }) {
        return () => slots.default?.()
    },
})

const OverlayStub = defineComponent({
    inheritAttrs: false,
    emits: ['start', 'stop', 'retry', 'insert', 'refine', 'hide', 'update:mode'],
    setup(_, { slots, expose }) {
        expose({
            show: overlayShowMock,
            hide: overlayHideMock,
        })

        return () => h('div', { 'data-testid': 'voice-overlay' }, slots.default?.())
    },
})

describe('AppVoiceInputTrigger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        isListeningRef.value = false
        isSupportedRef.value = true
        interimTranscriptRef.value = ''
        finalTranscriptRef.value = ''
        errorRef.value = ''
        modeRef.value = 'web-speech'
        isLoadingModelRef.value = false
        modelProgressRef.value = 0
        isModelReadyRef.value = true
        cloudConfigRef.value = { enabled: true, siliconflow: true, volcengine: true }
        insertVoiceTextMock.mockReturnValue({
            value: 'updated content',
            caret: 14,
        })
        fetchMock.mockResolvedValue({ data: 'refined content' })
    })

    it('opens the overlay when starting voice input and stops immediately when already listening', async () => {
        const wrapper = await mountSuspended(AppVoiceInputTrigger, {
            props: {
                modelValue: 'Draft',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    ClientOnly: ClientOnlyStub,
                    AppVoiceInputOverlay: OverlayStub,
                },
            },
        })

        await wrapper.find('button').trigger('click')
        expect(overlayShowMock).toHaveBeenCalledTimes(1)

        isListeningRef.value = true
        await wrapper.find('button').trigger('click')
        expect(stopListeningMock).toHaveBeenCalledTimes(1)
    })

    it('inserts transcribed text into a textarea target and resets the voice state', async () => {
        const textarea = document.createElement('textarea')
        textarea.value = 'Draft'
        textarea.selectionStart = 5
        textarea.selectionEnd = 5
        const focusSpy = vi.spyOn(textarea, 'focus').mockImplementation(() => undefined)
        const setSelectionRangeSpy = vi.spyOn(textarea, 'setSelectionRange').mockImplementation(() => undefined)

        const wrapper = await mountSuspended(AppVoiceInputTrigger, {
            props: {
                modelValue: 'Draft',
                targetRef: ref(textarea),
                insertStrategy: 'cursor',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    ClientOnly: ClientOnlyStub,
                    AppVoiceInputOverlay: OverlayStub,
                },
            },
        })

        wrapper.findComponent(OverlayStub).vm.$emit('insert', ' recognized speech ')
        await nextTick()
        await nextTick()

        expect(insertVoiceTextMock).toHaveBeenCalledWith(expect.objectContaining({
            currentValue: 'Draft',
            text: ' recognized speech ',
            strategy: 'cursor',
            selectionStart: 5,
            selectionEnd: 5,
        }))
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated content'])
        expect(overlayHideMock).toHaveBeenCalledTimes(1)
        expect(resetVoiceMock).toHaveBeenCalledTimes(1)
        expect(focusSpy).toHaveBeenCalledTimes(1)
        expect(setSelectionRangeSpy).toHaveBeenCalledWith(14, 14)
    })

    it('refines text through the API and falls back to the raw transcript on failure', async () => {
        const wrapper = await mountSuspended(AppVoiceInputTrigger, {
            props: {
                modelValue: 'Draft',
                language: 'en-US',
                showRefineAction: true,
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    ClientOnly: ClientOnlyStub,
                    AppVoiceInputOverlay: OverlayStub,
                },
            },
        })

        wrapper.findComponent(OverlayStub).vm.$emit('refine', 'rough transcript')
        await nextTick()
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/ai/refine-voice', {
            method: 'POST',
            body: {
                content: 'rough transcript',
                language: 'en-US',
            },
        })
        expect(insertVoiceTextMock).toHaveBeenCalledWith(expect.objectContaining({
            text: 'refined content',
            strategy: 'append-paragraph',
        }))

        fetchMock.mockRejectedValueOnce(new Error('refine failed'))
        wrapper.findComponent(OverlayStub).vm.$emit('refine', 'fallback transcript')
        await nextTick()
        await nextTick()

        expect(insertVoiceTextMock).toHaveBeenCalledWith(expect.objectContaining({
            text: 'fallback transcript',
        }))
    })

    it('retries with the active language and hides the button when voice input is unsupported', async () => {
        const wrapper = await mountSuspended(AppVoiceInputTrigger, {
            props: {
                modelValue: 'Draft',
                language: 'ja-JP',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    ClientOnly: ClientOnlyStub,
                    AppVoiceInputOverlay: OverlayStub,
                },
            },
        })

        wrapper.findComponent(OverlayStub).vm.$emit('retry')
        await nextTick()

        expect(resetVoiceMock).toHaveBeenCalledTimes(1)
        expect(startListeningMock).toHaveBeenCalledWith('ja-JP')

        isSupportedRef.value = false
        const unsupportedWrapper = await mountSuspended(AppVoiceInputTrigger, {
            props: {
                modelValue: 'Draft',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    ClientOnly: ClientOnlyStub,
                    AppVoiceInputOverlay: OverlayStub,
                },
            },
        })

        expect(unsupportedWrapper.find('button').exists()).toBe(false)
    })
})
