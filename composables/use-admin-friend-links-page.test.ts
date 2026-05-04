import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAdminFriendLinksPage } from './use-admin-friend-links-page'
import { FriendLinkApplicationStatus, FriendLinkHealthStatus, FriendLinkStatus } from '@/types/friend-link'

const {
    confirmRequireMock,
    fetchMock,
    formatDateTimeMock,
    showErrorToastMock,
    showSuccessToastMock,
    toastAddMock,
} = vi.hoisted(() => ({
    confirmRequireMock: vi.fn(),
    fetchMock: vi.fn(),
    formatDateTimeMock: vi.fn((value?: string | null) => value ? `formatted:${value}` : '-'),
    showErrorToastMock: vi.fn(),
    showSuccessToastMock: vi.fn(),
    toastAddMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useI18nDate', () => () => ({
    formatDateTime: formatDateTimeMock,
}))

mockNuxtImport('useRequestFeedback', () => () => ({
    showErrorToast: showErrorToastMock,
    showSuccessToast: showSuccessToastMock,
}))

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({ add: toastAddMock }),
    }
})

vi.mock('primevue/useconfirm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/useconfirm')>()

    return {
        ...actual,
        useConfirm: () => ({ require: confirmRequireMock }),
    }
})

function installDefaultFetchMock() {
    fetchMock.mockImplementation((url: string, options?: { method?: string, body?: unknown, query?: unknown }) => {
        if (url === '/api/admin/friend-links' && !options?.method) {
            return {
                data: {
                    items: [
                        {
                            id: 'link-1',
                            name: 'Momei',
                            url: 'https://momei.app',
                            contactEmail: 'contact@momei.app',
                            status: FriendLinkStatus.ACTIVE,
                            healthStatus: FriendLinkHealthStatus.UNREACHABLE,
                            isPinned: false,
                            isFeatured: false,
                            sortOrder: 1,
                            createdAt: '2025-01-01T00:00:00.000Z',
                        },
                    ],
                },
            }
        }

        if (url === '/api/admin/friend-link-categories' && !options?.method) {
            return {
                data: [
                    {
                        id: 'category-1',
                        name: 'Tech',
                        slug: 'tech',
                        sortOrder: 1,
                        isEnabled: true,
                    },
                ],
            }
        }

        if (url === '/api/admin/friend-link-applications' && !options?.method) {
            return {
                data: {
                    items: [
                        {
                            id: 'application-1',
                            name: 'Applicant',
                            url: 'https://friend.example.com',
                            contactEmail: 'friend@example.com',
                            status: FriendLinkApplicationStatus.PENDING,
                        },
                    ],
                },
            }
        }

        return { data: { items: [] } }
    })
}

const Harness = defineComponent({
    setup(_, { expose }) {
        const state = useAdminFriendLinksPage()
        expose(state)
        return () => null
    },
})

async function mountComposable() {
    vi.stubGlobal('$fetch', fetchMock)
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const wrapper = await mountSuspended(Harness)
    const exposed = (wrapper.vm as any).$?.exposed as ReturnType<typeof useAdminFriendLinksPage>

    await vi.waitFor(() => {
        expect(fetchMock.mock.calls.some((call) => call[0] === '/api/admin/friend-links')).toBe(true)
        expect(fetchMock.mock.calls.some((call) => call[0] === '/api/admin/friend-link-categories')).toBe(true)
        expect(fetchMock.mock.calls.some((call) => call[0] === '/api/admin/friend-link-applications')).toBe(true)
    })

    return { wrapper, exposed, openSpy }
}

describe('useAdminFriendLinksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        installDefaultFetchMock()
    })

    it('loads initial data and exposes status helpers', async () => {
        const { exposed } = await mountComposable()

        expect(exposed.links.value).toHaveLength(1)
        expect(exposed.categories.value).toHaveLength(1)
        expect(exposed.applications.value).toHaveLength(1)
        expect(exposed.getLinkStatusSeverity(FriendLinkStatus.ACTIVE)).toBe('success')
        expect(exposed.getHealthStatusSeverity(FriendLinkHealthStatus.UNREACHABLE)).toBe('danger')
        expect(exposed.getApplicationStatusSeverity(FriendLinkApplicationStatus.REJECTED)).toBe('danger')
        expect(exposed.formatDate('2025-01-01T00:00:00.000Z')).toBe('formatted:2025-01-01T00:00:00.000Z')
        expect(exposed.shouldSuggestReviewOrDisable(exposed.links.value[0]!)).toBe(true)
        expect(exposed.tt('pages.admin.friend_links.statuses.active')).toBe('pages.admin.friend_links.statuses.active')
    })

    it('opens the link dialog in create and edit modes', async () => {
        const { exposed } = await mountComposable()
        const link = exposed.links.value[0]!

        exposed.openLinkDialog(link)

        expect(exposed.linkDialogVisible.value).toBe(true)
        expect(exposed.editingLink.value?.id).toBe('link-1')
        expect(exposed.linkForm.name).toBe('Momei')
        expect(exposed.linkForm.url).toBe('https://momei.app')

        exposed.linkForm.name = 'Changed'
        exposed.openLinkDialog()

        expect(exposed.editingLink.value).toBeNull()
        expect(exposed.linkForm.name).toBe('')
        expect(exposed.linkForm.status).toBe(FriendLinkStatus.ACTIVE)
    })

    it('shows a validation toast instead of submitting an invalid friend link', async () => {
        const { exposed } = await mountComposable()
        fetchMock.mockClear()

        await exposed.saveLink()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
        }))
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('creates a new friend link and reloads the list on success', async () => {
        const { exposed } = await mountComposable()
        fetchMock.mockClear()
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/friend-links' && options?.method === 'POST') {
                return { code: 200 }
            }

            if (url === '/api/admin/friend-links' && !options?.method) {
                return { data: { items: [] } }
            }

            if (url === '/api/admin/friend-link-categories' && !options?.method) {
                return { data: [] }
            }

            if (url === '/api/admin/friend-link-applications' && !options?.method) {
                return { data: { items: [] } }
            }

            return { code: 200 }
        })

        Object.assign(exposed.linkForm, {
            name: 'New link',
            url: 'https://new-link.example.com',
            logo: '',
            description: 'Description',
            rssUrl: 'https://new-link.example.com/rss.xml',
            contactEmail: 'hello@new-link.example.com',
            categoryId: '',
            status: FriendLinkStatus.ACTIVE,
            isPinned: true,
            isFeatured: false,
            sortOrder: 2,
        })

        await exposed.saveLink()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/friend-links', expect.objectContaining({
            method: 'POST',
        }))
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.friend_links.messages.create_success')
        expect(exposed.linkDialogVisible.value).toBe(false)
    })

    it('updates categories and handles save/review failures with fallback toasts', async () => {
        const { exposed } = await mountComposable()
        fetchMock.mockClear()

        const category = exposed.categories.value[0]!
        exposed.openCategoryDialog(category)
        Object.assign(exposed.categoryForm, {
            name: 'Updated Tech',
            slug: 'updated-tech',
            description: 'Updated description',
            sortOrder: 3,
            isEnabled: false,
        })

        fetchMock.mockRejectedValueOnce(new Error('category failed'))
        await exposed.saveCategory()

        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.friend_links.messages.save_category_failed',
        })

        exposed.openReviewDialog(exposed.applications.value[0]!)
        fetchMock.mockRejectedValueOnce(new Error('review failed'))
        await exposed.submitReview('approved')

        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.friend_links.messages.review_failed',
        })
    })

    it('reviews applications successfully and reloads related lists', async () => {
        const { exposed } = await mountComposable()
        fetchMock.mockClear()
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/friend-link-applications/application-1/review' && options?.method === 'PUT') {
                return { code: 200 }
            }

            if (url === '/api/admin/friend-links' && !options?.method) {
                return { data: { items: [] } }
            }

            if (url === '/api/admin/friend-link-applications' && !options?.method) {
                return { data: { items: [] } }
            }

            if (url === '/api/admin/friend-link-categories' && !options?.method) {
                return { data: [] }
            }

            return { code: 200 }
        })

        exposed.openReviewDialog(exposed.applications.value[0]!)
        exposed.reviewForm.reviewNote = 'Looks good'
        exposed.reviewForm.linkData.categoryId = 'category-1'
        exposed.reviewForm.linkData.isFeatured = true

        await exposed.submitReview('approved')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/friend-link-applications/application-1/review', {
            method: 'PUT',
            body: {
                status: 'approved',
                reviewNote: 'Looks good',
                linkData: {
                    categoryId: 'category-1',
                    sortOrder: 0,
                    isPinned: false,
                    isFeatured: true,
                },
            },
        })
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.friend_links.messages.review_success')
        expect(exposed.reviewDialogVisible.value).toBe(false)
    })

    it('confirms disable/recheck actions and executes the selected callback', async () => {
        const { exposed, openSpy } = await mountComposable()
        fetchMock.mockClear()
        fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/friend-links/link-1' && options?.method === 'PUT') {
                return { code: 200 }
            }

            if (url === '/api/admin/friend-links' && !options?.method) {
                return { data: { items: [] } }
            }

            if (url === '/api/admin/friend-link-categories' && !options?.method) {
                return { data: [] }
            }

            if (url === '/api/admin/friend-link-applications' && !options?.method) {
                return { data: { items: [] } }
            }

            return { code: 200 }
        })

        const item = exposed.links.value[0]!
        exposed.confirmReviewOrDisable(item)

        const confirmOptions = confirmRequireMock.mock.calls[0]?.[0]
        expect(confirmOptions.message).toBe('pages.admin.friend_links.messages.review_or_disable_confirm')

        await confirmOptions.accept()
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/friend-links/link-1', {
            method: 'PUT',
            body: {
                status: FriendLinkStatus.INACTIVE,
            },
        })
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.friend_links.messages.disable_link_success')

        exposed.confirmReviewOrDisable(item)
        const rejectOptions = confirmRequireMock.mock.calls[1]?.[0]
        rejectOptions.reject()
        expect(openSpy).toHaveBeenCalledWith('https://momei.app', '_blank', 'noopener,noreferrer')
    })

    it('confirms link and category deletion and handles delete failures', async () => {
        const { exposed } = await mountComposable()
        fetchMock.mockClear()
        const category = exposed.categories.value[0]!

        exposed.confirmDeleteLink(exposed.links.value[0]!)
        let confirmOptions = confirmRequireMock.mock.calls[0]?.[0]
        fetchMock.mockRejectedValueOnce(new Error('delete link failed'))
        await confirmOptions.accept()
        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.friend_links.messages.delete_link_failed',
        })

        fetchMock.mockClear()
        exposed.confirmDeleteCategory(category)
        confirmOptions = confirmRequireMock.mock.calls[1]?.[0]
        fetchMock.mockRejectedValueOnce(new Error('delete category failed'))
        await confirmOptions.accept()
        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.friend_links.messages.delete_category_failed',
        })
    })
})
