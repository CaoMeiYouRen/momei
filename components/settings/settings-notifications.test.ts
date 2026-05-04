import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsNotifications from './settings-notifications.vue'
import { NotificationChannel, NotificationType } from '@/utils/shared/notification'

const {
    browserPermissionRef,
    browserPushReadyRef,
    enableBrowserPushMock,
    fetchMock,
    fetchSiteConfigMock,
    isBrowserPushSupportedRef,
    siteConfigRef,
    toastAddMock,
} = vi.hoisted(() => ({
    browserPermissionRef: { __v_isRef: true, value: 'default' as 'default' | 'granted' | 'denied' },
    browserPushReadyRef: { __v_isRef: true, value: false },
    enableBrowserPushMock: vi.fn().mockResolvedValue(undefined),
    fetchMock: vi.fn(),
    fetchSiteConfigMock: vi.fn().mockResolvedValue(undefined),
    isBrowserPushSupportedRef: { __v_isRef: true, value: true },
    siteConfigRef: {
        __v_isRef: true,
        value: {
            webPushEnabled: false,
            webPushPublicKey: '',
        },
    },
    toastAddMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: {
        __v_isRef: true,
        value: 'zh-CN',
    },
}))

mockNuxtImport('useToast', () => () => ({
    add: toastAddMock,
}))

mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: siteConfigRef,
    fetchSiteConfig: fetchSiteConfigMock,
}))

mockNuxtImport('useNotifications', () => () => ({
    browserPermission: browserPermissionRef,
    browserPushReady: browserPushReadyRef,
    isBrowserPushSupported: isBrowserPushSupportedRef,
    enableBrowserPush: enableBrowserPushMock,
}))

const CheckboxStub = defineComponent({
    props: {
        modelValue: {
            type: Array,
            default: () => [],
        },
        value: {
            type: String,
            required: true,
        },
        inputId: {
            type: String,
            default: '',
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const onChange = (event: Event) => {
            const checked = (event.target as HTMLInputElement).checked
            const current = Array.isArray(props.modelValue) ? props.modelValue : []
            emit('update:modelValue', checked
                ? [...current, props.value]
                : current.filter((item) => item !== props.value))
        }

        return { onChange }
    },
    template: `
        <input
            :id="inputId"
            class="category-checkbox"
            type="checkbox"
            :checked="modelValue.includes(value)"
            @change="onChange"
        >
    `,
})

const ToggleButtonStub = defineComponent({
    props: {
        modelValue: {
            type: Boolean,
            default: false,
        },
        onLabel: {
            type: String,
            default: '',
        },
        offLabel: {
            type: String,
            default: '',
        },
    },
    emits: ['update:modelValue'],
    template: `
        <button
            type="button"
            class="tag-toggle"
            :data-pressed="modelValue ? 'true' : 'false'"
            @click="$emit('update:modelValue', !modelValue)"
        >
            {{ modelValue ? onLabel : offLabel }}
        </button>
    `,
})

const ToggleSwitchStub = defineComponent({
    props: {
        modelValue: {
            type: Boolean,
            default: false,
        },
        disabled: Boolean,
    },
    emits: ['update:modelValue'],
    template: `
        <input
            class="toggle-switch"
            type="checkbox"
            :checked="modelValue"
            :disabled="disabled"
            @change="$emit('update:modelValue', $event.target.checked)"
        >
    `,
})

const stubs = {
    ProgressSpinner: { template: '<div class="spinner" />' },
    Tag: { props: ['severity'], template: '<span class="status-tag" :data-severity="severity"><slot /></span>' },
    Button: {
        props: ['label', 'loading', 'disabled', 'type'],
        emits: ['click'],
        template: '<button :type="type || \'button\'" :data-loading="loading ? \'true\' : \'false\'" :disabled="disabled || loading" @click="$emit(\'click\')">{{ label }}<slot /></button>',
    },
    Divider: { template: '<hr>' },
    Checkbox: CheckboxStub,
    ToggleButton: ToggleButtonStub,
    ToggleSwitch: ToggleSwitchStub,
    Message: { props: ['severity', 'closable'], template: '<div class="message" :data-severity="severity"><slot /></div>' },
    NotificationHistoryList: { template: '<div class="notification-history-list-stub" />' },
}

const categoriesPayload = {
    data: {
        items: [
            {
                id: 'cat-zh',
                name: 'Category ZH',
                translations: [
                    { id: 'cat-en' },
                ],
            },
        ],
    },
}

const tagsPayload = {
    data: {
        items: [
            {
                id: 'tag-zh',
                name: 'Tag ZH',
                translations: [
                    { id: 'tag-en' },
                ],
            },
        ],
    },
}

const subscriberPayload = {
    data: {
        isActive: true,
        isMarketingEnabled: true,
        subscribedCategoryIds: ['cat-en'],
        subscribedTagIds: ['tag-en'],
    },
}

const notificationSettingsPayload = {
    data: [
        {
            type: NotificationType.COMMENT_REPLY,
            channel: NotificationChannel.EMAIL,
            isEnabled: false,
        },
        {
            type: NotificationType.SYSTEM,
            channel: NotificationChannel.WEB_PUSH,
            isEnabled: true,
        },
        {
            type: NotificationType.SECURITY,
            channel: NotificationChannel.WEB_PUSH,
            isEnabled: false,
        },
        {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.IN_APP,
            isEnabled: false,
        },
    ],
}

function installSuccessfulFetchMocks() {
    fetchMock.mockImplementation((url: string, options?: { method?: string, body?: unknown }) => {
        if (url === '/api/categories') {
            return categoriesPayload
        }

        if (url === '/api/tags') {
            return tagsPayload
        }

        if (url === '/api/user/subscription' && !options?.method) {
            return subscriberPayload
        }

        if (url === '/api/user/notifications/settings' && !options?.method) {
            return notificationSettingsPayload
        }

        if (url === '/api/user/subscription' && options?.method === 'PUT') {
            return { code: 200 }
        }

        if (url === '/api/user/notifications/settings' && options?.method === 'PUT') {
            return { code: 200 }
        }

        throw new Error(`Unexpected request: ${url}`)
    })
}

async function mountComponent() {
    return mountSuspended(SettingsNotifications, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('SettingsNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('$fetch', fetchMock)
        siteConfigRef.value = {
            webPushEnabled: false,
            webPushPublicKey: '',
        }
        browserPermissionRef.value = 'default'
        browserPushReadyRef.value = false
        isBrowserPushSupportedRef.value = true
        enableBrowserPushMock.mockResolvedValue(undefined)
        fetchSiteConfigMock.mockResolvedValue(undefined)
        installSuccessfulFetchMocks()
    })

    it('loads subscription data, maps translation clusters, and shows the site-disabled browser status', async () => {
        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/categories', expect.objectContaining({
                query: { limit: 500, aggregate: true, language: 'zh-CN' },
            }))
        })

        expect(wrapper.find('.spinner').exists()).toBe(false)
        expect((wrapper.get('#cat-cat-zh').element as HTMLInputElement).checked).toBe(true)
        expect(wrapper.get('.tag-toggle').attributes('data-pressed')).toBe('true')
        expect(wrapper.find('.message').attributes('data-severity')).toBe('secondary')
        expect(wrapper.text()).toContain('pages.settings.notifications.browser_status_site_disabled')

        const toggleSwitches = wrapper.findAll('.toggle-switch')
        expect((toggleSwitches[1]?.element as HTMLInputElement).checked).toBe(false)
        expect((toggleSwitches[3]?.element as HTMLInputElement).disabled).toBe(true)
        expect((toggleSwitches[6]?.element as HTMLInputElement).disabled).toBe(true)
    })

    it('shows browser push actions when the browser can be enabled and runs the enable flow', async () => {
        siteConfigRef.value = {
            webPushEnabled: true,
            webPushPublicKey: 'public-key',
        }
        browserPushReadyRef.value = true

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.settings.notifications.browser_status_default')
        })

        const enableButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.notifications.enable_browser_push'))
        await enableButton?.trigger('click')

        expect(enableBrowserPushMock).toHaveBeenCalledTimes(1)
    })

    it('covers the unsupported, granted, and denied browser status branches', async () => {
        siteConfigRef.value = {
            webPushEnabled: true,
            webPushPublicKey: 'public-key',
        }
        isBrowserPushSupportedRef.value = false
        let wrapper = await mountComponent()
        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.settings.notifications.browser_status_unsupported')
        })

        isBrowserPushSupportedRef.value = true
        browserPermissionRef.value = 'granted'
        wrapper = await mountComponent()
        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.settings.notifications.browser_status_granted')
        })

        browserPermissionRef.value = 'denied'
        wrapper = await mountComponent()
        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.settings.notifications.browser_status_denied')
        })
    })

    it('saves expanded category and tag ids together with normalized notification settings', async () => {
        siteConfigRef.value = {
            webPushEnabled: true,
            webPushPublicKey: 'public-key',
        }

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.find('.subscription-settings__form').exists()).toBe(true)
        })

        const toggleSwitches = wrapper.findAll('.toggle-switch')
        await toggleSwitches[0]?.setValue(false)
        await toggleSwitches[4]?.setValue(false)

        const pauseButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.notifications.pause_subscription'))
        await pauseButton?.trigger('click')

        const saveButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.profile.save'))
        await saveButton?.trigger('click')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/user/subscription', {
                method: 'PUT',
                body: {
                    isActive: false,
                    subscribedCategoryIds: ['cat-en', 'cat-zh'],
                    subscribedTagIds: ['tag-en', 'tag-zh'],
                    isMarketingEnabled: false,
                },
            })
        })

        const notificationSettingsCall = fetchMock.mock.calls.find((call) => call[0] === '/api/user/notifications/settings' && call[1]?.method === 'PUT')
        expect(notificationSettingsCall).toBeDefined()
        expect(notificationSettingsCall?.[1]?.body).toEqual(expect.arrayContaining([
            {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.EMAIL,
                isEnabled: false,
            },
            {
                type: NotificationType.SECURITY,
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            },
            {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.WEB_PUSH,
                isEnabled: false,
            },
            {
                type: NotificationType.SECURITY,
                channel: NotificationChannel.WEB_PUSH,
                isEnabled: true,
            },
        ]))
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.notifications.save_success',
        }))
    })

    it('shows an error toast when loading settings fails', async () => {
        const error = new Error('load failed')
        fetchMock.mockRejectedValueOnce(error)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountComponent()

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'common.error_loading',
            }))
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load settings:', error)

        consoleErrorSpy.mockRestore()
    })

    it('shows an error toast when saving settings fails', async () => {
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/categories') {
                return categoriesPayload
            }

            if (url === '/api/tags') {
                return tagsPayload
            }

            if (url === '/api/user/subscription' && !options?.method) {
                return subscriberPayload
            }

            if (url === '/api/user/notifications/settings' && !options?.method) {
                return notificationSettingsPayload
            }

            if (options?.method === 'PUT') {
                throw new Error('save failed')
            }

            throw new Error(`Unexpected request: ${url}`)
        })
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.find('.subscription-settings__form').exists()).toBe(true)
        })

        const saveButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.profile.save'))
        await saveButton?.trigger('click')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'pages.settings.notifications.save_failed',
            }))
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error))

        consoleErrorSpy.mockRestore()
    })
})
