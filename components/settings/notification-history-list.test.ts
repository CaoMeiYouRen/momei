import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import NotificationHistoryList from './notification-history-list.vue'
import { createLegacyToastApi } from '@/tests/helpers/caomei-service-mocks'

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

vi.mock('caomei-ui', async (importOriginal) => ({ ...await importOriginal<any>(), useToast: () => createLegacyToastApi(toastAddMock) }))

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

const CaomeiDataTableStub = defineComponent({
    props: {
        data: {
            type: Array,
            default: () => [],
        },
        columns: {
            type: Array,
            default: () => [],
        },
        loading: Boolean,
    },
    emits: ['page'],
    template: `
        <div class="data-table">
            <div v-for="row in data" :key="row.id" class="table-row">
                <div v-for="column in columns" :key="column.key" class="table-cell">
                    <slot :name="'cell-' + column.key" :row="row" />
                </div>
            </div>
            <slot v-if="!data.length" name="empty" />
            <button class="paginate" type="button" @click="$emit('page', { page: 2, rows: 20 })">paginate</button>
        </div>
    `,
})

const stubs = {
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiButton: {
        props: ['label'],
        emits: ['click'],
        template: '<button type="button" :aria-label="label" @click="$emit(\'click\')">{{ label }}<slot /></button>',
    },
    CaomeiTag: {
        props: ['tone'],
        template: '<span class="tag" :data-tone="tone"><slot /></span>',
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

        const tones = wrapper.findAll('.tag').map((tag) => tag.attributes('data-tone'))
        expect(tones).toContain('primary')
        expect(tones).toContain('danger')
        expect(tones).toContain('success')
        expect(tones).toContain('warning')
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
