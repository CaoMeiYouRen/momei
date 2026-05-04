import { defineComponent, inject, provide, ref, toRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import NotificationHistoryList from './notification-history-list.vue'

const dataTableRowsKey = Symbol('notification-history-rows')

const {
    appFetchMock,
    formatDateTimeMock,
    localePathMock,
    sessionRef,
    toastAddMock,
} = vi.hoisted(() => ({
    appFetchMock: vi.fn(),
    formatDateTimeMock: vi.fn((value: string) => `formatted:${value}`),
    localePathMock: vi.fn((path: string) => `/zh-CN${path}`),
    sessionRef: {
        __v_isRef: true,
        value: {
            data: {
                user: {
                    role: 'user',
                },
            },
        },
    },
    toastAddMock: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => sessionRef),
    },
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
}))

mockNuxtImport('useI18nDate', () => () => ({
    formatDateTime: formatDateTimeMock,
}))

mockNuxtImport('useToast', () => () => ({
    add: toastAddMock,
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => {
        if (key === 'pages.settings.notifications.notification_types.comment_reply') {
            return 'Comment reply'
        }

        if (key === 'pages.settings.notifications.notification_types.security') {
            return 'Security'
        }

        return key
    },
}))

mockNuxtImport('useLocalePath', () => () => localePathMock)

const DataTableStub = defineComponent({
    props: {
        value: {
            type: Array,
            default: () => [],
        },
        loading: Boolean,
    },
    emits: ['page'],
    setup(props) {
        provide(dataTableRowsKey, toRef(props, 'value'))
        return {}
    },
    template: `
        <div class="data-table">
            <slot name="header" />
            <slot />
            <slot v-if="!value.length" name="empty" />
            <button class="paginate" type="button" @click="$emit('page', { page: 1, rows: 20 })">paginate</button>
        </div>
    `,
})

const ColumnStub = defineComponent({
    props: {
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
                <slot name="body" :data="row" />
            </div>
        </div>
    `,
})

const stubs = {
    DataTable: DataTableStub,
    Column: ColumnStub,
    Button: {
        props: ['label', 'icon'],
        emits: ['click'],
        template: '<button type="button" :data-icon="icon || \'\'" @click="$emit(\'click\')">{{ label }}</button>',
    },
    Tag: {
        props: ['severity'],
        template: '<span class="tag" :data-severity="severity"><slot /></span>',
    },
    NuxtLink: {
        props: ['to'],
        template: '<a class="nuxt-link" :href="to"><slot /></a>',
    },
}

async function mountComponent() {
    return mountSuspended(NotificationHistoryList, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('NotificationHistoryList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionRef.value = {
            data: {
                user: {
                    role: 'user',
                },
            },
        }
    })

    it('loads notifications on mount, renders unread actions, and hides admin targets for non-admins', async () => {
        appFetchMock.mockResolvedValueOnce({
            items: [
                {
                    id: 'notification-1',
                    title: 'Unread title',
                    content: 'Unread content',
                    type: 'COMMENT_REPLY',
                    isRead: false,
                    link: '/admin/hidden-target',
                    createdAt: '2025-01-01T00:00:00.000Z',
                },
                {
                    id: 'notification-2',
                    title: 'Security title',
                    content: 'Security content',
                    type: 'SECURITY',
                    isRead: true,
                    link: null,
                    createdAt: '2025-01-02T00:00:00.000Z',
                },
            ],
            total: 2,
        })

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(appFetchMock).toHaveBeenCalledWith('/api/notifications', {
                query: {
                    page: 1,
                    limit: 10,
                    unreadOnly: false,
                },
            })
        })

        expect(wrapper.text()).toContain('formatted:2025-01-01T00:00:00.000Z')
        expect(wrapper.text()).toContain('Comment reply')
        expect(wrapper.text()).toContain('Security')
        expect(wrapper.text()).toContain('pages.settings.notifications.history.mark_all_read')
        expect(wrapper.text()).toContain('pages.settings.notifications.history.mark_read')
        expect(wrapper.find('.nuxt-link').exists()).toBe(false)

        const severities = wrapper.findAll('.tag').map((tag) => tag.attributes('data-severity'))
        expect(severities).toContain('info')
        expect(severities).toContain('danger')
        expect(severities).toContain('success')
        expect(severities).toContain('warn')
    })

    it('allows admin targets and reloads after marking one notification as read', async () => {
        sessionRef.value = {
            data: {
                user: {
                    role: 'admin',
                },
            },
        }

        appFetchMock
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'notification-1',
                        title: 'Unread title',
                        content: 'Unread content',
                        type: 'COMMENT_REPLY',
                        isRead: false,
                        link: '/admin/visible-target',
                        createdAt: '2025-01-01T00:00:00.000Z',
                    },
                ],
                total: 1,
            })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'notification-1',
                        title: 'Unread title',
                        content: 'Unread content',
                        type: 'COMMENT_REPLY',
                        isRead: true,
                        link: '/admin/visible-target',
                        createdAt: '2025-01-01T00:00:00.000Z',
                    },
                ],
                total: 1,
            })

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.find('.nuxt-link').attributes('href')).toBe('/zh-CN/admin/visible-target')
        })

        const markReadButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.notifications.history.mark_read'))
        await markReadButton?.trigger('click')

        expect(appFetchMock).toHaveBeenCalledWith('/api/notifications/read', {
            method: 'PUT',
            body: { ids: ['notification-1'] },
        })

        await vi.waitFor(() => {
            expect(wrapper.text()).not.toContain('pages.settings.notifications.history.mark_read')
        })
    })

    it('marks all notifications as read and reloads the next page', async () => {
        appFetchMock
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'notification-1',
                        title: 'Unread title',
                        content: 'Unread content',
                        type: 'COMMENT_REPLY',
                        isRead: false,
                        link: null,
                        createdAt: '2025-01-01T00:00:00.000Z',
                    },
                ],
                total: 1,
            })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ items: [], total: 0 })
            .mockResolvedValueOnce({ items: [], total: 0 })

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.settings.notifications.history.mark_all_read')
        })

        const markAllButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.notifications.history.mark_all_read'))
        await markAllButton?.trigger('click')

        expect(appFetchMock).toHaveBeenCalledWith('/api/notifications/read', {
            method: 'PUT',
            body: {},
        })

        await wrapper.get('.paginate').trigger('click')

        expect(appFetchMock).toHaveBeenCalledWith('/api/notifications', {
            query: {
                page: 2,
                limit: 20,
                unreadOnly: false,
            },
        })
        expect(wrapper.text()).toContain('pages.settings.notifications.history.empty')
    })

    it('shows the extracted backend message when loading fails', async () => {
        appFetchMock.mockRejectedValueOnce({
            data: {
                message: 'History failed to load',
            },
        })

        await mountComponent()

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'History failed to load',
            }))
        })
    })
})
