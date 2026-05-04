import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsCommercial from './settings-commercial.vue'

const {
    appFetchMock,
    asyncDataRef,
    refreshMock,
    toastAddMock,
} = vi.hoisted(() => ({
    appFetchMock: vi.fn(),
    asyncDataRef: {
        __v_isRef: true,
        value: {
            data: {
                socialLinks: [
                    { name: 'GitHub', url: 'https://github.com/momei' },
                ],
                donationLinks: [
                    { name: 'Patreon', url: 'https://patreon.com/momei' },
                ],
            },
        },
    },
    refreshMock: vi.fn(),
    toastAddMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
}))

mockNuxtImport('useAsyncData', () => () => ({
    data: asyncDataRef,
    refresh: refreshMock,
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

const stubs = {
    CommercialLinkManager: {
        props: ['socialLinks', 'donationLinks'],
        emits: ['update:socialLinks', 'update:donationLinks'],
        template: `
            <div class="commercial-link-manager-stub">
                <span class="social-count">{{ socialLinks.length }}</span>
                <span class="donation-count">{{ donationLinks.length }}</span>
                <button class="update-social" type="button" @click="$emit('update:socialLinks', [{ name: 'X', url: 'https://x.com/momei' }])">update social</button>
                <button class="update-donation" type="button" @click="$emit('update:donationLinks', [{ name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/momei' }])">update donation</button>
            </div>
        `,
    },
    Button: {
        props: ['label', 'loading'],
        emits: ['click'],
        template: '<button type="button" :data-loading="loading ? \'true\' : \'false\'" @click="$emit(\'click\')">{{ label }}</button>',
    },
}

async function mountComponent() {
    return mountSuspended(SettingsCommercial, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('SettingsCommercial', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        asyncDataRef.value = {
            data: {
                socialLinks: [
                    { name: 'GitHub', url: 'https://github.com/momei' },
                ],
                donationLinks: [
                    { name: 'Patreon', url: 'https://patreon.com/momei' },
                ],
            },
        }
        appFetchMock.mockResolvedValue({ code: 200 })
    })

    it('hydrates the manager from async data and saves updated links successfully', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.social-count').text()).toBe('1')
        expect(wrapper.find('.donation-count').text()).toBe('1')

        await wrapper.get('.update-social').trigger('click')
        await wrapper.get('.update-donation').trigger('click')

        const saveButton = wrapper.findAll('button').find((button) => button.text().includes('common.save'))
        await saveButton?.trigger('click')

        expect(appFetchMock).toHaveBeenCalledWith('/api/user/commercial', {
            method: 'PUT',
            body: {
                socialLinks: [
                    { name: 'X', url: 'https://x.com/momei' },
                ],
                donationLinks: [
                    { name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/momei' },
                ],
            },
        })
        expect(refreshMock).toHaveBeenCalledTimes(1)
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.commercial.success',
        }))
    })

    it('shows the backend message when saving fails', async () => {
        appFetchMock.mockRejectedValueOnce({
            data: {
                message: 'Save rejected',
            },
        })

        const wrapper = await mountComponent()
        const saveButton = wrapper.findAll('button').find((button) => button.text().includes('common.save'))
        await saveButton?.trigger('click')

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Save rejected',
        }))
    })
})
