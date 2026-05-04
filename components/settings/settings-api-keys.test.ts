import { defineComponent, inject, provide, ref, toRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsApiKeys from './settings-api-keys.vue'

const dataTableRowsKey = Symbol('data-table-rows')

const { fetchMock, toastAddMock, writeTextMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    toastAddMock: vi.fn(),
    writeTextMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useI18nDate', () => () => ({
    formatDate: (value: string) => `formatted:${value}`,
}))

mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))

const DataTableStub = defineComponent({
    props: {
        value: {
            type: Array,
            default: () => [],
        },
        loading: Boolean,
    },
    setup(props) {
        provide(dataTableRowsKey, toRef(props, 'value'))
        return {}
    },
    template: '<div class="data-table"><slot /></div>',
})

const ColumnStub = defineComponent({
    props: {
        field: {
            type: String,
            default: '',
        },
        header: {
            type: String,
            default: '',
        },
    },
    setup() {
        const rows = inject(dataTableRowsKey, ref<Record<string, unknown>[]>([]))
        return { rows }
    },
    template: `
        <div class="column">
            <div v-for="row in rows" :key="row.id || header" class="column-row">
                <slot name="body" :data="row">
                    <span>{{ field ? row[field] : '' }}</span>
                </slot>
            </div>
        </div>
    `,
})

const stubs = {
    InputText: {
        props: ['modelValue', 'placeholder', 'readonly', 'value'],
        emits: ['update:modelValue'],
        template: `
            <input
                :value="modelValue ?? value ?? ''"
                :placeholder="placeholder"
                :readonly="readonly"
                @input="$emit('update:modelValue', $event.target.value)"
            >
        `,
    },
    Select: {
        props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
        emits: ['update:modelValue'],
        template: `
            <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
                <option v-for="option in options" :key="option[optionValue]" :value="option[optionValue]">
                    {{ option[optionLabel] }}
                </option>
            </select>
        `,
    },
    Button: {
        props: ['label', 'icon', 'loading', 'disabled', 'type'],
        emits: ['click'],
        template: `
            <button
                :type="type || 'button'"
                :data-icon="icon || ''"
                :disabled="disabled || loading"
                @click="$emit('click')"
            >
                {{ label }}
                <slot />
            </button>
        `,
    },
    DataTable: DataTableStub,
    Column: ColumnStub,
    Tag: {
        props: ['value', 'severity'],
        template: '<span class="tag">{{ value }}</span>',
    },
    Dialog: {
        props: ['visible', 'header', 'modal', 'style'],
        emits: ['update:visible'],
        template: '<div v-if="visible" class="dialog"><slot /><slot name="footer" /></div>',
    },
    Message: {
        props: ['severity', 'closable'],
        template: '<div class="message"><slot /></div>',
    },
}

async function mountComponent() {
    return mountSuspended(SettingsApiKeys, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('SettingsApiKeys', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('$fetch', fetchMock)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: writeTextMock,
            },
        })
        fetchMock.mockResolvedValue({
            code: 200,
            data: [
                {
                    id: 'key-1',
                    name: 'Reader bot',
                    prefix: 'momei_key',
                    lastUsedAt: '2025-01-02T00:00:00.000Z',
                    expiresAt: null,
                },
            ],
        })
        writeTextMock.mockResolvedValue(undefined)
    })

    it('loads and renders the existing API keys on mount', async () => {
        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/user/api-keys')
        })

        expect(wrapper.text()).toContain('Reader bot')
        expect(wrapper.text()).toContain('momei_key')
        expect(wrapper.text()).toContain('formatted:2025-01-02T00:00:00.000Z')
        expect(wrapper.text()).toContain('pages.settings.api_keys.never_expires')
    })

    it('creates a new API key and opens the dialog with the secret', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string, body?: Record<string, string> }) => {
            if (url === '/api/user/api-keys' && !options) {
                return { code: 200, data: [] }
            }

            if (url === '/api/user/api-keys' && options?.method === 'POST') {
                return { code: 200, data: { key: 'secret-api-key' } }
            }

            throw new Error(`Unexpected request: ${url}`)
        })

        const wrapper = await mountComponent()

        await wrapper.get('input[placeholder="pages.settings.api_keys.name"]').setValue('  Publishing bot  ')
        await wrapper.get('select').setValue('30d')
        await wrapper.findAll('button').find((button) => button.text().includes('pages.settings.api_keys.create_btn'))?.trigger('click')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/user/api-keys', {
                method: 'POST',
                body: {
                    name: 'Publishing bot',
                    expiresIn: '30d',
                },
            })
        })

        expect(wrapper.find('.dialog').exists()).toBe(true)
        expect((wrapper.find('.dialog input[readonly]').element as HTMLInputElement).value).toBe('secret-api-key')
        expect((wrapper.get('input[placeholder="pages.settings.api_keys.name"]').element as HTMLInputElement).value).toBe('')
        expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('never')
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.api_keys.create_success',
        }))
    })

    it('shows an error toast when creating a key fails', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/user/api-keys' && !options) {
                return { code: 200, data: [] }
            }

            if (url === '/api/user/api-keys' && options?.method === 'POST') {
                throw new Error('create failed')
            }

            return { code: 200, data: [] }
        })

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const wrapper = await mountComponent()

        await wrapper.get('input[placeholder="pages.settings.api_keys.name"]').setValue('Broken key')
        await wrapper.findAll('button').find((button) => button.text().includes('pages.settings.api_keys.create_btn'))?.trigger('click')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'common.unexpected_error',
            }))
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('deletes an API key and refreshes the list on success', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/user/api-keys' && !options) {
                return {
                    code: 200,
                    data: [
                        {
                            id: 'key-1',
                            name: 'Reader bot',
                            prefix: 'momei_key',
                            lastUsedAt: null,
                            expiresAt: null,
                        },
                    ],
                }
            }

            if (url === '/api/user/api-keys/key-1' && options?.method === 'DELETE') {
                return { code: 200 }
            }

            throw new Error(`Unexpected request: ${url}`)
        })

        const wrapper = await mountComponent()

        const deleteButton = wrapper.find('button[data-icon="pi pi-trash"]')
        await deleteButton.trigger('click')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/user/api-keys/key-1', {
                method: 'DELETE',
            })
        })

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.api_keys.delete_success',
        }))
    })

    it('shows an error toast when deleting an API key fails', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/user/api-keys' && !options) {
                return {
                    code: 200,
                    data: [
                        {
                            id: 'key-1',
                            name: 'Reader bot',
                            prefix: 'momei_key',
                            lastUsedAt: null,
                            expiresAt: null,
                        },
                    ],
                }
            }

            if (url === '/api/user/api-keys/key-1' && options?.method === 'DELETE') {
                throw new Error('delete failed')
            }

            return { code: 200, data: [] }
        })

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const wrapper = await mountComponent()

        await wrapper.find('button[data-icon="pi pi-trash"]').trigger('click')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'common.unexpected_error',
            }))
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('copies the newly created key to the clipboard', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/user/api-keys' && !options) {
                return { code: 200, data: [] }
            }

            if (url === '/api/user/api-keys' && options?.method === 'POST') {
                return { code: 200, data: { key: 'copy-me' } }
            }

            throw new Error(`Unexpected request: ${url}`)
        })

        const wrapper = await mountComponent()

        await wrapper.get('input[placeholder="pages.settings.api_keys.name"]').setValue('Clipboard key')
        await wrapper.findAll('button').find((button) => button.text().includes('pages.settings.api_keys.create_btn'))?.trigger('click')

        const copyButton = wrapper.find('button[data-icon="pi pi-copy"]')
        await copyButton.trigger('click')

        expect(writeTextMock).toHaveBeenCalledWith('copy-me')
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'Copied to clipboard',
        }))
    })
})
