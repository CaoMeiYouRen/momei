import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
    fetchMock,
    toastAddMock,
    toJpegMock,
} = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    toastAddMock: vi.fn(),
    toJpegMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: toastAddMock,
        }),
    }
})

vi.mock('dom-to-image-more', () => ({
    default: {
        toJpeg: toJpegMock,
    },
}))

vi.stubGlobal('$fetch', fetchMock)

const stubs = {
    Dialog: {
        props: ['visible', 'header', 'modal', 'class', 'style', 'dismissableMask', 'appendTo'],
        emits: ['update:visible'],
        template: '<div v-if="visible" class="dialog-stub"><slot /><slot name="footer" /></div>',
    },
    InputText: {
        props: ['modelValue', 'placeholder', 'autofocus', 'class'],
        emits: ['update:modelValue'],
        template: `<input class="input-text-stub" :value="modelValue ?? ''" @input="$emit('update:modelValue', $event.target.value)" />`,
    },
    Textarea: {
        props: ['modelValue', 'rows', 'class', 'placeholder', 'autoResize'],
        emits: ['update:modelValue'],
        template: `<textarea class="textarea-stub" :value="modelValue ?? ''" @input="$emit('update:modelValue', $event.target.value)" />`,
    },
    Button: {
        props: ['label', 'text', 'severity', 'loading', 'disabled'],
        emits: ['click'],
        template: `<button class="button-stub" type="button" :data-label="label" :data-loading="loading ? 'true' : 'false'" :disabled="disabled" @click="$emit('click')">{{ label }}</button>`,
    },
}

function createSettings(overrides: Record<string, unknown> = {}) {
    return {
        themePreset: 'green',
        themePrimaryColor: null,
        themeAccentColor: '#123456',
        themeSurfaceColor: null,
        themeTextColor: null,
        themeDarkPrimaryColor: null,
        themeDarkAccentColor: null,
        themeDarkSurfaceColor: null,
        themeDarkTextColor: null,
        themeBorderRadius: null,
        themeLogoUrl: '/logo.svg',
        themeFaviconUrl: '/favicon.ico',
        themeMourningMode: false,
        themeBackgroundType: 'color',
        themeBackgroundValue: '#f5f5f5',
        ...overrides,
    }
}

async function mountComponent(props: {
    modelValue: boolean
    settings: Record<string, unknown> | null
    previewInner?: HTMLElement | null
}) {
    const { default: ThemeSaveDialog } = await import('./theme-save-dialog.vue')

    return mount(ThemeSaveDialog, {
        props,
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

function createFetchError(message: string) {
    const error = new Error(message) as Error & {
        data?: { message?: string }
    }

    error.data = { message }
    return error
}

describe('ThemeSaveDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockResolvedValue({ code: 200 })
        toJpegMock.mockResolvedValue('data:image/jpeg;base64,preview')
    })

    it('saves a merged custom theme snapshot and preview image successfully', async () => {
        const previewInner = document.createElement('div')
        previewInner.style.backgroundColor = 'rgb(255, 255, 255)'

        const wrapper = await mountComponent({
            modelValue: true,
            settings: createSettings(),
            previewInner,
        })

        await wrapper.get('.input-text-stub').setValue('My Green Theme')
        await wrapper.get('.textarea-stub').setValue('Saved from tests')
        await wrapper.get('.button-stub[data-label="common.confirm"]').trigger('click')
        await flushPromises()

        expect(toJpegMock).toHaveBeenCalledWith(previewInner, expect.objectContaining({
            quality: 0.8,
            bgcolor: '#ffffff',
        }))

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/theme-configs', {
            method: 'POST',
            body: expect.objectContaining({
                name: 'My Green Theme',
                description: 'Saved from tests',
                previewImage: 'data:image/jpeg;base64,preview',
            }),
        })

        const payload = fetchMock.mock.calls[0]?.[1]?.body as { configData: string }
        const snapshot = JSON.parse(payload.configData)

        expect(snapshot.themePreset).toBe('custom')
        expect(snapshot.themePrimaryColor).toBe('#059669')
        expect(snapshot.themeAccentColor).toBe('#123456')
        expect(snapshot.themeDarkPrimaryColor).toBe('#10b981')
        expect(snapshot.themeBorderRadius).toBe('0px')
        expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
        expect(wrapper.emitted('saved')).toEqual([[]])
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.settings.theme.save_preset_success',
        }))
        expect((wrapper.get('.input-text-stub').element as HTMLInputElement).value).toBe('')
    })

    it('returns early when settings are missing and resets the form when reopened', async () => {
        const wrapper = await mountComponent({
            modelValue: true,
            settings: null,
            previewInner: null,
        })

        await wrapper.get('.input-text-stub').setValue('Will not save')
        await wrapper.get('.textarea-stub').setValue('No settings available')
        await wrapper.get('.button-stub[data-label="common.confirm"]').trigger('click')
        await flushPromises()

        expect(fetchMock).not.toHaveBeenCalled()

        await wrapper.setProps({ modelValue: false })
        await wrapper.setProps({ modelValue: true })
        await flushPromises()

        expect((wrapper.get('.input-text-stub').element as HTMLInputElement).value).toBe('')
        expect((wrapper.get('.textarea-stub').element as HTMLTextAreaElement).value).toBe('')
    })

    it('falls back to an empty preview when capture fails and still saves', async () => {
        const previewInner = document.createElement('div')
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        toJpegMock.mockRejectedValueOnce(new Error('capture failed'))

        const wrapper = await mountComponent({
            modelValue: true,
            settings: createSettings(),
            previewInner,
        })

        await wrapper.get('.input-text-stub').setValue('Fallback Theme')
        await wrapper.get('.button-stub[data-label="common.confirm"]').trigger('click')
        await flushPromises()

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to capture theme preview:', expect.any(Error))
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/theme-configs', expect.objectContaining({
            body: expect.objectContaining({
                previewImage: '',
            }),
        }))

        consoleErrorSpy.mockRestore()
    })

    it('shows the backend error message when saving fails', async () => {
        fetchMock.mockRejectedValueOnce(createFetchError('Save failed'))

        const wrapper = await mountComponent({
            modelValue: true,
            settings: createSettings(),
            previewInner: null,
        })

        await wrapper.get('.input-text-stub').setValue('Broken Theme')
        await wrapper.get('.button-stub[data-label="common.confirm"]').trigger('click')
        await flushPromises()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Save failed',
        }))
        expect(wrapper.emitted('saved')).toBeUndefined()
        expect(wrapper.get('.button-stub[data-label="common.confirm"]').attributes('data-loading')).toBe('false')
    })
})
