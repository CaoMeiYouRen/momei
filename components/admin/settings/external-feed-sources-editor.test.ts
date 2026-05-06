import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
    showSuccessToast,
    showErrorToast,
} = vi.hoisted(() => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useRequestFeedback', () => () => ({
    showSuccessToast,
    showErrorToast,
}))

const stubs = {
    Button: {
        props: ['icon', 'label', 'severity', 'disabled', 'text'],
        emits: ['click'],
        template: '<button class="button-stub" type="button" :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
    },
    Message: {
        props: ['severity', 'closable', 'class'],
        template: '<div class="message-stub"><slot /></div>',
    },
    ToggleSwitch: {
        props: ['modelValue', 'disabled', 'inputId'],
        emits: ['update:modelValue'],
        template: '<input :id="inputId" class="toggle-switch-stub" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    },
    InputText: {
        props: ['id', 'modelValue', 'disabled', 'fluid'],
        emits: ['update:modelValue'],
        template: `<input :id="id" class="input-text-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
    },
    Select: {
        props: ['id', 'modelValue', 'options', 'disabled', 'optionLabel', 'optionValue', 'fluid'],
        emits: ['update:modelValue'],
        template: `
            <select :id="id" class="select-stub" :value="modelValue ?? ''" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value || null)">
                <option
                    v-for="option in options"
                    :key="typeof option === 'string' ? option : option[optionValue || 'value'] ?? 'null-option'"
                    :value="typeof option === 'string' ? option : option[optionValue || 'value'] ?? ''"
                >
                    {{ typeof option === 'string' ? option : option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
    },
    InputNumber: {
        props: ['inputId', 'modelValue', 'disabled', 'min', 'max', 'showButtons', 'fluid'],
        emits: ['update:modelValue'],
        template: `<input :id="inputId" class="input-number-stub" type="number" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))" />`,
    },
}

function createSource(overrides: Record<string, unknown> = {}) {
    return {
        id: 'feed-1',
        enabled: true,
        provider: 'rss',
        title: 'Feed 1',
        sourceUrl: 'https://example.com/feed.xml',
        siteUrl: null,
        siteName: null,
        defaultLocale: null,
        localeStrategy: 'inherit-current',
        includeInHome: true,
        badgeLabel: null,
        priority: 0,
        timeoutMs: null,
        cacheTtlSeconds: null,
        staleWhileErrorSeconds: null,
        maxItems: 10,
        ...overrides,
    }
}

async function mountComponent(props: { modelValue?: unknown, disabled?: boolean } = {}) {
    const { default: ExternalFeedSourcesEditor } = await import('./external-feed-sources-editor.vue')

    return mountSuspended(ExternalFeedSourcesEditor, {
        props,
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('ExternalFeedSourcesEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('adds, updates, normalizes, and removes source drafts from the empty state', async () => {
        const wrapper = await mountComponent({ modelValue: '[]' })

        expect(wrapper.find('.external-feed-sources-editor__empty-state').exists()).toBe(true)

        await wrapper.get('.button-stub[data-icon="pi pi-plus"]').trigger('click')
        await flushPromises()

        expect(wrapper.find('.external-feed-sources-editor__card').exists()).toBe(true)
        expect(wrapper.find('.external-feed-sources-editor__empty-state').exists()).toBe(false)

        await wrapper.get('#external-feed-source-enabled-0').setValue(false)
        await wrapper.get('#external-feed-source-home-0').setValue(false)
        await wrapper.get('#external-feed-source-id-0').setValue('feed-updated')
        await wrapper.get('#external-feed-source-title-0').setValue('Updated Feed')
        await wrapper.get('#external-feed-source-provider-0').setValue('rsshub')
        await wrapper.get('#external-feed-source-url-0').setValue('https://example.com/rsshub')
        await wrapper.get('#external-feed-source-site-url-0').setValue('   ')
        await wrapper.get('#external-feed-source-site-name-0').setValue('Example Site')
        await wrapper.get('#external-feed-source-locale-strategy-0').setValue('fixed')
        await wrapper.get('#external-feed-source-default-locale-0').setValue('en-US')
        await wrapper.get('#external-feed-source-badge-0').setValue('Featured')
        await wrapper.get('#external-feed-source-priority-0').setValue('5')
        await wrapper.get('#external-feed-source-timeout-0').setValue('5000')
        await wrapper.get('#external-feed-source-cache-0').setValue('900')
        await wrapper.get('#external-feed-source-stale-0').setValue('3600')
        await wrapper.get('#external-feed-source-max-items-0').setValue('')
        await flushPromises()

        const latestPayload = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as Record<string, unknown>[]

        expect(latestPayload).toEqual([
            expect.objectContaining({
                id: 'feed-updated',
                enabled: false,
                includeInHome: false,
                provider: 'rsshub',
                title: 'Updated Feed',
                sourceUrl: 'https://example.com/rsshub',
                siteUrl: null,
                siteName: 'Example Site',
                localeStrategy: 'fixed',
                defaultLocale: 'en-US',
                badgeLabel: 'Featured',
                priority: 5,
                timeoutMs: 5000,
                cacheTtlSeconds: 900,
                staleWhileErrorSeconds: 3600,
                maxItems: null,
            }),
        ])

        await wrapper.get('.button-stub[data-icon="pi pi-trash"]').trigger('click')
        await flushPromises()

        expect(wrapper.find('.external-feed-sources-editor__empty-state').exists()).toBe(true)
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([])
    })

    it('shows a parse error for invalid current value and clears it when props become valid', async () => {
        const wrapper = await mountComponent({ modelValue: '{invalid json' })

        expect(wrapper.find('.message-stub').text()).toContain('pages.admin.settings.system.external_feeds.editor.invalid_current_value')
        expect(wrapper.find('.external-feed-sources-editor__card').exists()).toBe(false)

        await wrapper.setProps({ modelValue: JSON.stringify([createSource({ title: 'Recovered feed' })]) })
        await flushPromises()

        expect(wrapper.find('.message-stub').exists()).toBe(false)
        expect(wrapper.find('.external-feed-sources-editor__card-title').text()).toContain('Recovered feed')
    })

    it('imports valid json, exports current sources, and resets the file input', async () => {
        const wrapper = await mountComponent({ modelValue: '[]' })
        const input = wrapper.get('input[type="file"]')
        const inputClickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')
        const createObjectURLMock = vi.fn(() => 'blob:external-feed')
        const revokeObjectURLMock = vi.fn()
        const originalCreateObjectURL = URL.createObjectURL
        const originalRevokeObjectURL = URL.revokeObjectURL
        const anchorClickMock = vi.fn()
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return {
                    href: '',
                    download: '',
                    click: anchorClickMock,
                } as unknown as HTMLAnchorElement
            }

            return document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
        })

        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: createObjectURLMock,
        })
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: revokeObjectURLMock,
        })

        await wrapper.get('.button-stub[data-icon="pi pi-upload"]').trigger('click')
        expect(inputClickSpy).toHaveBeenCalledTimes(1)

        const file = new File([JSON.stringify([
            createSource({
                id: 'imported-feed',
                title: 'Imported feed',
            }),
        ])], 'sources.json', { type: 'application/json' })

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [file],
        })

        await input.trigger('change')
        await flushPromises()

        expect(showSuccessToast).toHaveBeenCalledWith('pages.admin.settings.system.external_feeds.editor.import_success')
        expect((input.element as HTMLInputElement).value).toBe('')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
            expect.objectContaining({
                id: 'imported-feed',
                title: 'Imported feed',
            }),
        ])

        await wrapper.get('.button-stub[data-icon="pi pi-download"]').trigger('click')

        expect(createObjectURLMock).toHaveBeenCalledTimes(1)
        expect(anchorClickMock).toHaveBeenCalledTimes(1)
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:external-feed')
        expect(showSuccessToast).toHaveBeenCalledWith('pages.admin.settings.system.external_feeds.editor.export_success')

        createElementSpy.mockRestore()
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: originalCreateObjectURL,
        })
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: originalRevokeObjectURL,
        })
    })

    it('shows an error toast when imported json is invalid', async () => {
        const wrapper = await mountComponent({ modelValue: '[]' })
        const input = wrapper.get('input[type="file"]')
        const invalidFile = new File(['not-json'], 'invalid.json', { type: 'application/json' })

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [invalidFile],
        })

        await input.trigger('change')
        await flushPromises()

        expect(showErrorToast).toHaveBeenCalledTimes(1)
        expect(showErrorToast).toHaveBeenCalledWith(expect.anything(), {
            fallbackKey: 'pages.admin.settings.system.external_feeds.editor.import_failed',
        })
        expect((input.element as HTMLInputElement).value).toBe('')
    })
})
