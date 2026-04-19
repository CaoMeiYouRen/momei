import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppVoiceInputOverlay from './app-voice-input-overlay.vue'

const {
    popoverToggleMock,
    popoverShowMock,
    popoverHideMock,
} = vi.hoisted(() => ({
    popoverToggleMock: vi.fn(),
    popoverShowMock: vi.fn(),
    popoverHideMock: vi.fn(),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useI18n: () => ({
        t: (key: string) => key,
    }),
}))

const ButtonStub = defineComponent({
    inheritAttrs: false,
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot />{{ $attrs.label }}</button>',
})

const ProgressBarStub = defineComponent({
    inheritAttrs: false,
    props: {
        value: { type: Number, default: 0 },
    },
    template: '<div class="progress-bar">{{ value }}</div>',
})

const SelectButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        modelValue: { type: String, default: '' },
        options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    template: '<div class="select-button"><button v-for="option in options" :key="option.value" type="button" @click="$emit(\'update:modelValue\', option.value)">{{ option.label }}</button></div>',
})

const PopoverStub = defineComponent({
    inheritAttrs: false,
    emits: ['hide'],
    setup(_, { slots, expose }) {
        expose({
            toggle: popoverToggleMock,
            show: popoverShowMock,
            hide: popoverHideMock,
        })

        return () => h('div', { class: 'popover-stub' }, slots.default?.())
    },
})

function mountOverlay(props: Record<string, unknown> = {}) {
    return mountSuspended(AppVoiceInputOverlay, {
        props: {
            isListening: false,
            interimTranscript: '',
            finalTranscript: '',
            error: '',
            refining: false,
            mode: 'web-speech',
            isLoadingModel: false,
            modelProgress: 0,
            isModelReady: true,
            cloudConfig: {
                enabled: true,
                siliconflow: true,
                volcengine: true,
            },
            ...props,
        },
        global: {
            stubs: {
                Button: ButtonStub,
                Popover: PopoverStub,
                ProgressBar: ProgressBarStub,
                SelectButton: SelectButtonStub,
            },
        },
    })
}

describe('AppVoiceInputOverlay', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading and error states with translated labels and retry action', async () => {
        const loadingWrapper = await mountOverlay({
            isLoadingModel: true,
            modelProgress: 42,
        })

        expect(loadingWrapper.find('.voice-popover__loading').exists()).toBe(true)
        expect(loadingWrapper.text()).toContain('42')

        const errorWrapper = await mountOverlay({
            error: 'permission_denied',
        })

        expect(errorWrapper.text()).toContain('common.voice.permission_denied')
        const retryButton = errorWrapper.find('.voice-popover__error button')
        await retryButton?.trigger('click')
        expect(errorWrapper.emitted('retry')).toBeTruthy()
    })

    it('shows transcript actions and emits insert/refine for finalized speech', async () => {
        const wrapper = await mountOverlay({
            finalTranscript: 'Recognized text',
            showRefineAction: true,
            refining: true,
        })

        const actionButtons = wrapper.findAll('.voice-popover__action-btn')
        const insertButton = actionButtons[0]
        const refineButton = actionButtons[1]
        await insertButton?.trigger('click')
        await refineButton?.trigger('click')

        expect(wrapper.emitted('insert')?.[0]).toEqual(['Recognized text'])
        expect(wrapper.emitted('refine')?.[0]).toEqual(['Recognized text'])
    })

    it('computes placeholder text from the current mode and listening state', async () => {
        const cloudWrapper = await mountOverlay({
            mode: 'cloud-batch',
        })
        expect(cloudWrapper.text()).toContain('common.voice.model_ready')

        const listeningWrapper = await mountOverlay({
            isListening: true,
        })
        expect(listeningWrapper.text()).toContain('...')
    })

    it('updates mode selection and exposes popover controls', async () => {
        const wrapper = await mountOverlay({
            cloudConfig: {
                enabled: true,
                siliconflow: true,
                volcengine: false,
            },
        })

        const modeButtons = wrapper.findAll('.select-button button')
        expect(modeButtons).toHaveLength(2)

        await modeButtons[1]!.trigger('click')
        expect(wrapper.emitted('update:mode')?.[0]).toEqual(['cloud-batch'])

        wrapper.vm.show(new Event('click'))
        wrapper.vm.hide()
        wrapper.vm.toggle(new Event('click'))

        expect(popoverShowMock).toHaveBeenCalledTimes(1)
        expect(popoverHideMock).toHaveBeenCalledTimes(1)
        expect(popoverToggleMock).toHaveBeenCalledTimes(1)
    })
})
