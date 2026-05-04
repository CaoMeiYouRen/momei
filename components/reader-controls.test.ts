import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ReaderControls from './reader-controls.vue'

const { settingsRef, isDarkRef, toggleReaderModeMock } = vi.hoisted(() => ({
    settingsRef: {
        __v_isRef: true,
        value: {
            active: false,
            fontSize: 18,
            lineHeight: 1.8,
            width: 800,
            theme: 'default',
        },
    },
    isDarkRef: {
        __v_isRef: true,
        value: false,
    },
    toggleReaderModeMock: vi.fn((active: boolean) => {
        settingsRef.value = {
            ...settingsRef.value,
            active,
        }
    }),
}))

vi.mock('@/composables/use-reader-mode', () => ({
    useReaderMode: () => ({
        settings: settingsRef,
        toggleReaderMode: toggleReaderModeMock,
        isDark: isDarkRef,
    }),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

const stubs = {
    Button: {
        template: '<button :data-icon="icon" @click="$emit(\'click\')"><slot /></button>',
        props: ['icon', 'severity', 'rounded', 'text', 'size'],
        emits: ['click'],
    },
    Slider: {
        template: '<input class="slider" type="range" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
        props: ['modelValue', 'min', 'max', 'step'],
        emits: ['update:modelValue'],
    },
}

async function mountControls() {
    return mountSuspended(ReaderControls, {
        global: {
            stubs,
        },
    })
}

function getWindowListenerCalls(spy: ReturnType<typeof vi.spyOn>) {
    return spy.mock.calls as [string, EventListenerOrEventListenerObject][]
}

describe('ReaderControls', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        settingsRef.value = {
            active: false,
            fontSize: 18,
            lineHeight: 1.8,
            width: 800,
            theme: 'default',
        }
        isDarkRef.value = false
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('enters reader mode when the panel is inactive', async () => {
        const wrapper = await mountControls()

        await wrapper.get('.reader-controls__actions button').trigger('click')

        expect(toggleReaderModeMock).toHaveBeenCalledWith(true)
    })

    it('expands the settings panel for active readers and hides the dark theme in light mode', async () => {
        settingsRef.value = {
            ...settingsRef.value,
            active: true,
        }

        const wrapper = await mountControls()
        await wrapper.findAll('.reader-controls__actions button')[1]?.trigger('click')
        await nextTick()

        const themeButtons = wrapper.findAll('.reader-controls__theme-btn')

        expect(wrapper.find('.reader-controls__panel').exists()).toBe(true)
        expect(themeButtons).toHaveLength(3)
        expect(wrapper.find('.theme-dark-night').exists()).toBe(false)
    })

    it('shows the dark theme in dark mode and resets settings to defaults', async () => {
        settingsRef.value = {
            active: true,
            fontSize: 24,
            lineHeight: 2.1,
            width: 950,
            theme: 'sepia',
        }
        isDarkRef.value = true

        const wrapper = await mountControls()
        await wrapper.findAll('.reader-controls__actions button')[1]?.trigger('click')
        await nextTick()

        expect(wrapper.findAll('.reader-controls__theme-btn')).toHaveLength(4)

        await wrapper.get('.reader-controls__panel .flex button').trigger('click')

        expect(settingsRef.value).toEqual({
            active: true,
            fontSize: 18,
            lineHeight: 1.8,
            width: 800,
            theme: 'default',
        })
    })

    it('collapses the panel on the first Escape and exits reader mode on the second Escape', async () => {
        settingsRef.value = {
            ...settingsRef.value,
            active: true,
        }

        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const wrapper = await mountControls()
        await wrapper.findAll('.reader-controls__actions button')[1]?.trigger('click')
        await nextTick()

        const keydownHandler = getWindowListenerCalls(addEventListenerSpy)
            .find(([eventName]) => eventName === 'keydown')?.[1] as ((event: KeyboardEvent) => void) | undefined

        keydownHandler?.(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        expect(wrapper.find('.reader-controls__panel').exists()).toBe(false)

        keydownHandler?.(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        expect(toggleReaderModeMock).toHaveBeenCalledWith(false)
    })

    it('registers and removes the Escape key listener with the component lifecycle', async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

        const wrapper = await mountControls()
        wrapper.unmount()

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
})
