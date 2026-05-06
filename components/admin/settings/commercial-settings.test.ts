import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
    appFetchMock,
    toastAddMock,
    openFeedbackEntryMock,
    unsavedChangesGuardMock,
} = vi.hoisted(() => ({
    appFetchMock: vi.fn(),
    toastAddMock: vi.fn(),
    openFeedbackEntryMock: vi.fn(),
    unsavedChangesGuardMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
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

vi.mock('@/composables/use-feedback-entry', () => ({
    useFeedbackEntry: () => ({
        openFeedbackEntry: openFeedbackEntryMock,
        shouldShowFeedbackEntry: true,
    }),
}))

vi.mock('@/composables/use-unsaved-changes-guard', () => ({
    useUnsavedChangesGuard: unsavedChangesGuardMock,
}))

const stubs = {
    Message: {
        props: ['severity', 'closable', 'class'],
        template: '<div class="message-stub"><slot /></div>',
    },
    ToggleSwitch: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<input class="toggle-switch-stub" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    },
    CommercialLinkManager: {
        props: ['socialLinks', 'donationLinks', 'isAdmin'],
        emits: ['update:socialLinks', 'update:donationLinks'],
        template: `
            <div class="commercial-link-manager-stub">
                <span class="social-count">{{ socialLinks.length }}</span>
                <span class="donation-count">{{ donationLinks.length }}</span>
                <span class="is-admin-flag">{{ isAdmin === '' || isAdmin === true ? 'admin' : 'user' }}</span>
                <button class="update-social" type="button" @click="$emit('update:socialLinks', [{ name: 'X', url: 'https://x.com/momei' }])">update social</button>
                <button class="update-donation" type="button" @click="$emit('update:donationLinks', [{ name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/momei' }])">update donation</button>
            </div>
        `,
    },
    AdminFloatingActions: {
        props: ['primaryLabel', 'primaryLoading', 'primaryDisabled', 'secondaryLabel', 'statusLabel', 'statusTone'],
        emits: ['primary-click', 'secondary-click'],
        template: `
            <div class="admin-floating-actions-stub" :data-status-tone="statusTone">
                <span class="status-label">{{ statusLabel }}</span>
                <button class="primary-action" type="button" :disabled="primaryDisabled" :data-loading="primaryLoading ? 'true' : 'false'" @click="$emit('primary-click')">{{ primaryLabel }}</button>
                <button class="secondary-action" type="button" @click="$emit('secondary-click')">{{ secondaryLabel }}</button>
            </div>
        `,
    },
}

async function mountComponent() {
    const { default: CommercialSettings } = await import('./commercial-settings.vue')

    return mountSuspended(CommercialSettings, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

function createFetchError(message: string, key: 'message' | 'statusMessage' = 'message') {
    const error = new Error(message) as Error & {
        data?: { message?: string, statusMessage?: string }
    }

    error.data = { [key]: message }
    return error
}

describe('CommercialSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        appFetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/settings/commercial' && options?.method === 'PUT') {
                return Promise.resolve({ code: 200 })
            }

            return Promise.resolve({
                code: 200,
                data: {
                    demoPreview: true,
                    enabled: true,
                    socialLinks: [
                        { name: 'GitHub', url: 'https://github.com/momei' },
                    ],
                    donationLinks: [
                        { name: 'Patreon', url: 'https://patreon.com/momei' },
                    ],
                },
            })
        })
    })

    it('loads admin commercial settings, tracks dirty state, and saves updated payload', async () => {
        const wrapper = await mountComponent()

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/commercial')
        expect(wrapper.find('.message-stub').exists()).toBe(true)
        expect(wrapper.find('.social-count').text()).toBe('1')
        expect(wrapper.find('.donation-count').text()).toBe('1')
        expect(wrapper.find('.is-admin-flag').text()).toBe('admin')
        expect(wrapper.find('.status-label').text()).toBe('pages.admin.settings.system.floating_actions.saved')
        expect(wrapper.get('.primary-action').attributes('disabled')).toBeDefined()

        await wrapper.get('.update-social').trigger('click')
        await wrapper.get('.update-donation').trigger('click')
        await wrapper.get('.toggle-switch-stub').setValue(false)

        expect(wrapper.find('.commercial-link-manager-stub').exists()).toBe(false)
        expect(wrapper.find('.status-label').text()).toBe('pages.admin.settings.system.floating_actions.unsaved')
        expect(wrapper.get('.primary-action').attributes('disabled')).toBeUndefined()

        await wrapper.get('.primary-action').trigger('click')

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/commercial', {
            method: 'PUT',
            body: {
                enabled: false,
                socialLinks: [
                    { name: 'X', url: 'https://x.com/momei' },
                ],
                donationLinks: [
                    { name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/momei' },
                ],
            },
        })
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.commercial.success',
        }))
        expect(wrapper.find('.status-label').text()).toBe('pages.admin.settings.system.floating_actions.saved')
    })

    it('shows backend detail when saving fails', async () => {
        appFetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/settings/commercial' && options?.method === 'PUT') {
                return Promise.reject(createFetchError('Save rejected'))
            }

            return Promise.resolve({
                code: 200,
                data: {
                    demoPreview: false,
                    enabled: true,
                    socialLinks: [],
                    donationLinks: [],
                },
            })
        })

        const wrapper = await mountComponent()

        await wrapper.get('.toggle-switch-stub').setValue(false)
        await wrapper.get('.primary-action').trigger('click')

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Save rejected',
        }))
    })

    it('shows a load error toast and forwards feedback action', async () => {
        appFetchMock.mockRejectedValueOnce(createFetchError('Load failed', 'statusMessage'))

        const wrapper = await mountComponent()

        expect(wrapper.find('.commercial-link-manager-stub').exists()).toBe(false)
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Load failed',
        }))

        await wrapper.get('.secondary-action').trigger('click')
        expect(openFeedbackEntryMock).toHaveBeenCalledTimes(1)
        expect(unsavedChangesGuardMock).toHaveBeenCalledTimes(1)
    })
})
