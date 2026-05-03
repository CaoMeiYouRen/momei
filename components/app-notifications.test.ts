import { defineComponent, h, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppNotifications from './app-notifications.vue'

const {
    notificationsRef,
    unreadCountRef,
    browserPermissionRef,
    browserPushReadyRef,
    markAsReadMock,
    enableBrowserPushMock,
    formatDateTimeMock,
    localePathMock,
    popoverToggleMock,
} = vi.hoisted(() => ({
    notificationsRef: { __v_isRef: true, value: [] as Record<string, any>[] },
    unreadCountRef: { __v_isRef: true, value: 0 },
    browserPermissionRef: { __v_isRef: true, value: 'unsupported' },
    browserPushReadyRef: { __v_isRef: true, value: false },
    markAsReadMock: vi.fn(),
    enableBrowserPushMock: vi.fn(),
    formatDateTimeMock: vi.fn((value: string) => `formatted:${value}`),
    localePathMock: vi.fn((path: string) => `/zh-CN${path}`),
    popoverToggleMock: vi.fn(),
}))

const sessionState = ref<{ data: { user: { role: string } } | null }>({
    data: null,
})

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useI18nDate', () => () => ({
    formatDateTime: formatDateTimeMock,
}))

mockNuxtImport('useLocalePath', () => () => localePathMock)

vi.mock('@/composables/use-notifications', () => ({
    useNotifications: () => ({
        notifications: notificationsRef,
        unreadCount: unreadCountRef,
        markAsRead: markAsReadMock,
        browserPermission: browserPermissionRef,
        browserPushReady: browserPushReadyRef,
        enableBrowserPush: enableBrowserPushMock,
    }),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => sessionState),
    },
}))

const ButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        label: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            default: '',
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" :label="label" :icon="icon" :loading="loading" @click="$emit(\'click\', $event)"><slot />{{ label }}</button>',
})

const PopoverStub = defineComponent({
    setup(_, { slots, expose }) {
        expose({
            toggle: popoverToggleMock,
        })

        return () => h('div', { class: 'popover-stub' }, slots.default?.())
    },
})

const MessageStub = defineComponent({
    inheritAttrs: false,
    template: '<div class="message-stub" v-bind="$attrs"><slot /></div>',
})

const NuxtLinkStub = defineComponent({
    inheritAttrs: false,
    props: {
        to: {
            type: String,
            required: true,
        },
    },
    template: '<a :href="to" v-bind="$attrs"><slot /></a>',
})

function mountComponent() {
    return mountSuspended(AppNotifications, {
        global: {
            stubs: {
                Button: ButtonStub,
                Popover: PopoverStub,
                Message: MessageStub,
                NuxtLink: NuxtLinkStub,
            },
        },
    })
}

describe('AppNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        notificationsRef.value = []
        unreadCountRef.value = 0
        browserPermissionRef.value = 'unsupported'
        browserPushReadyRef.value = false
        sessionState.value = { data: null }
        localePathMock.mockImplementation((path: string) => `/zh-CN${path}`)
    })

    it('shows the empty state and toggles the popover from the bell button', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.empty-state').exists()).toBe(true)

        await wrapper.find('#notification-btn').trigger('click')
        expect(popoverToggleMock).toHaveBeenCalledTimes(1)
    })

    it('renders notification items, formats timestamps and supports mark-all and item read actions', async () => {
        notificationsRef.value = [
            {
                id: 'n-1',
                type: 'COMMENT_REPLY',
                title: 'Reply',
                content: 'A new reply arrived',
                link: '/posts/hello-world',
                isRead: false,
                createdAt: '2026-04-19T10:00:00.000Z',
            },
            {
                id: 'n-2',
                type: 'SECURITY',
                title: 'Alert',
                content: 'Password changed',
                link: null,
                isRead: true,
                createdAt: '2026-04-19T11:00:00.000Z',
            },
        ]
        unreadCountRef.value = 1

        const wrapper = await mountComponent()

        expect(wrapper.findAll('.notification-item')).toHaveLength(2)
        expect(wrapper.find('.notification-item .item-icon i').classes()).toContain('pi-comment')
        expect(wrapper.text()).toContain('formatted:2026-04-19T10:00:00.000Z')
        expect(wrapper.find('.item-title').attributes('href')).toBe('/zh-CN/posts/hello-world')
        expect(wrapper.find('.notification-footer a').attributes('href')).toBe('/zh-CN/settings?tab=notifications')

        await wrapper.find('.notification-header button').trigger('click')
        await wrapper.find('.notification-item').trigger('click')

        expect(markAsReadMock).toHaveBeenNthCalledWith(1, undefined)
        expect(markAsReadMock).toHaveBeenNthCalledWith(2, ['n-1'])
    })

    it('shows the browser push prompt and enables browser notifications when permission is default', async () => {
        browserPushReadyRef.value = true
        browserPermissionRef.value = 'default'
        enableBrowserPushMock.mockResolvedValueOnce(true)

        const wrapper = await mountComponent()

        expect(wrapper.text()).toContain('components.notifications.browser_status.default')

        const enableButton = wrapper.find('.browser-state-content button')
        await enableButton.trigger('click')

        expect(enableBrowserPushMock).toHaveBeenCalledTimes(1)
    })

    it('hides admin-only notification targets for normal users and exposes resolved admin task links for admins', async () => {
        notificationsRef.value = [
            {
                id: 'n-3',
                type: 'SYSTEM',
                title: 'AI Task',
                content: 'Background generation completed',
                link: '/admin/ai/history?taskId=task-42',
                isRead: false,
                createdAt: '2026-04-19T12:00:00.000Z',
            },
        ]
        unreadCountRef.value = 1

        sessionState.value = {
            data: {
                user: { role: 'user' },
            },
        }

        const userWrapper = await mountComponent()
        expect(userWrapper.find('.item-title').element.tagName).toBe('SPAN')

        sessionState.value = {
            data: {
                user: { role: 'admin' },
            },
        }

        const adminWrapper = await mountComponent()
        expect(adminWrapper.find('.item-title').attributes('href')).toBe('/zh-CN/admin/ai/tasks/task-42')
    })
})
