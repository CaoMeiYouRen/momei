import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { FriendLinkApplicationStatus, FriendLinkHealthStatus, FriendLinkStatus } from '@/types/friend-link'
import { friendLinkSchema } from '@/utils/schemas/friend-link'

interface FriendLinkCategory {
    id: string
    name: string
    slug: string
    description?: string | null
    sortOrder: number
    isEnabled: boolean
}

interface FriendLinkItem {
    id: string
    name: string
    url: string
    logo?: string | null
    description?: string | null
    rssUrl?: string | null
    contactEmail: string
    categoryId?: string | null
    category?: FriendLinkCategory | null
    status: FriendLinkStatus
    healthStatus?: FriendLinkHealthStatus | null
    isPinned: boolean
    isFeatured: boolean
    sortOrder: number
    lastCheckedAt?: string | null
}

interface FriendLinkApplicant {
    id: string
    name?: string | null
    email?: string | null
}

interface FriendLinkApplication {
    id: string
    name: string
    url: string
    reciprocalUrl?: string | null
    contactEmail: string
    submittedIp?: string | null
    createdAt?: string | null
    reviewNote?: string | null
    categoryId?: string | null
    applicant?: FriendLinkApplicant | null
    status: FriendLinkApplicationStatus
}

interface PaginatedResponse<T> {
    data?: {
        items?: T[]
    }
}

interface ListResponse<T> {
    data?: T[]
}

export function useAdminFriendLinksPage() {
    const { t } = useI18n()
    const { formatDateTime } = useI18nDate()
    const { showErrorToast, showSuccessToast } = useRequestFeedback()
    const toast = useToast()
    const confirm = useConfirm()
    const tt = (key: string) => t(key as never)

    const loading = reactive({
        links: false,
        categories: false,
        applications: false,
    })
    const saving = ref(false)

    const links = ref<FriendLinkItem[]>([])
    const categories = ref<FriendLinkCategory[]>([])
    const applications = ref<FriendLinkApplication[]>([])

    const linkDialogVisible = ref(false)
    const categoryDialogVisible = ref(false)
    const reviewDialogVisible = ref(false)

    const editingLink = ref<FriendLinkItem | null>(null)
    const editingCategory = ref<FriendLinkCategory | null>(null)
    const selectedApplication = ref<FriendLinkApplication | null>(null)

    const linkForm = reactive({
        name: '',
        url: '',
        logo: '',
        description: '',
        rssUrl: '',
        contactEmail: '',
        categoryId: '',
        status: FriendLinkStatus.ACTIVE,
        isPinned: false,
        isFeatured: false,
        sortOrder: 0,
    })

    const categoryForm = reactive({
        name: '',
        slug: '',
        description: '',
        sortOrder: 0,
        isEnabled: true,
    })

    const reviewForm = reactive({
        reviewNote: '',
        linkData: {
            categoryId: '',
            sortOrder: 0,
            isPinned: false,
            isFeatured: false,
        },
    })

    const linkStatusOptions = computed(() => [
        { label: tt('pages.admin.friend_links.statuses.draft'), value: FriendLinkStatus.DRAFT },
        { label: tt('pages.admin.friend_links.statuses.active'), value: FriendLinkStatus.ACTIVE },
        { label: tt('pages.admin.friend_links.statuses.inactive'), value: FriendLinkStatus.INACTIVE },
    ])

    const resetLinkForm = () => {
        Object.assign(linkForm, {
            name: '',
            url: '',
            logo: '',
            description: '',
            rssUrl: '',
            contactEmail: '',
            categoryId: '',
            status: FriendLinkStatus.ACTIVE,
            isPinned: false,
            isFeatured: false,
            sortOrder: 0,
        })
    }

    const resetCategoryForm = () => {
        Object.assign(categoryForm, {
            name: '',
            slug: '',
            description: '',
            sortOrder: 0,
            isEnabled: true,
        })
    }

    const getLinkStatusSeverity = (status: FriendLinkStatus) => {
        switch (status) {
            case FriendLinkStatus.ACTIVE:
                return 'success'
            case FriendLinkStatus.DRAFT:
                return 'info'
            default:
                return 'secondary'
        }
    }

    const getHealthStatusSeverity = (status?: FriendLinkHealthStatus | null) => {
        switch (status) {
            case FriendLinkHealthStatus.HEALTHY:
                return 'success'
            case FriendLinkHealthStatus.UNREACHABLE:
                return 'danger'
            case FriendLinkHealthStatus.CHECKING:
                return 'warning'
            default:
                return 'secondary'
        }
    }

    const getApplicationStatusSeverity = (status: FriendLinkApplicationStatus) => {
        switch (status) {
            case FriendLinkApplicationStatus.APPROVED:
                return 'success'
            case FriendLinkApplicationStatus.REJECTED:
                return 'danger'
            case FriendLinkApplicationStatus.ARCHIVED:
                return 'secondary'
            default:
                return 'info'
        }
    }

    const formatDate = (value?: string | null) => formatDateTime(value)

    const shouldSuggestReviewOrDisable = (item: FriendLinkItem) => item.status === FriendLinkStatus.ACTIVE && item.healthStatus === FriendLinkHealthStatus.UNREACHABLE

    const loadLinks = async () => {
        loading.links = true
        try {
            const response = await $fetch<PaginatedResponse<FriendLinkItem>>('/api/admin/friend-links', { query: { limit: 100 } })
            links.value = response.data?.items || []
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.load_links_failed' })
        } finally {
            loading.links = false
        }
    }

    const loadCategories = async () => {
        loading.categories = true
        try {
            const response = await $fetch<ListResponse<FriendLinkCategory>>('/api/admin/friend-link-categories')
            categories.value = response.data || []
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.load_categories_failed' })
        } finally {
            loading.categories = false
        }
    }

    const loadApplications = async () => {
        loading.applications = true
        try {
            const response = await $fetch<PaginatedResponse<FriendLinkApplication>>('/api/admin/friend-link-applications', { query: { limit: 100 } })
            applications.value = response.data?.items || []
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.load_applications_failed' })
        } finally {
            loading.applications = false
        }
    }

    const openLinkDialog = (item?: FriendLinkItem) => {
        editingLink.value = item || null
        resetLinkForm()

        if (item) {
            Object.assign(linkForm, {
                name: item.name,
                url: item.url,
                logo: item.logo || '',
                description: item.description || '',
                rssUrl: item.rssUrl || '',
                contactEmail: item.contactEmail || '',
                categoryId: item.categoryId || '',
                status: item.status,
                isPinned: item.isPinned,
                isFeatured: item.isFeatured,
                sortOrder: item.sortOrder,
            })
        }

        linkDialogVisible.value = true
    }

    const openCategoryDialog = (item?: FriendLinkCategory) => {
        editingCategory.value = item || null
        resetCategoryForm()

        if (item) {
            Object.assign(categoryForm, {
                name: item.name,
                slug: item.slug,
                description: item.description || '',
                sortOrder: item.sortOrder,
                isEnabled: item.isEnabled,
            })
        }

        categoryDialogVisible.value = true
    }

    const openReviewDialog = (item: FriendLinkApplication) => {
        selectedApplication.value = item
        Object.assign(reviewForm, {
            reviewNote: item.reviewNote || '',
            linkData: {
                categoryId: item.categoryId || '',
                sortOrder: 0,
                isPinned: false,
                isFeatured: false,
            },
        })
        reviewDialogVisible.value = true
    }

    const saveLink = async () => {
        const validation = friendLinkSchema.safeParse(linkForm)

        if (!validation.success) {
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: validation.error.issues[0]?.message || tt('pages.admin.friend_links.messages.save_failed'),
                life: 3000,
            })
            return
        }

        saving.value = true
        try {
            const url = editingLink.value ? `/api/admin/friend-links/${editingLink.value.id}` : '/api/admin/friend-links'
            const method = editingLink.value ? 'PUT' : 'POST'
            await $fetch(url, { method, body: validation.data })

            showSuccessToast(editingLink.value ? 'pages.admin.friend_links.messages.update_success' : 'pages.admin.friend_links.messages.create_success')

            linkDialogVisible.value = false
            await loadLinks()
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.save_failed' })
        } finally {
            saving.value = false
        }
    }

    const saveCategory = async () => {
        saving.value = true
        try {
            const url = editingCategory.value ? `/api/admin/friend-link-categories/${editingCategory.value.id}` : '/api/admin/friend-link-categories'
            const method = editingCategory.value ? 'PUT' : 'POST'
            await $fetch(url, { method, body: categoryForm })

            showSuccessToast(editingCategory.value ? 'pages.admin.friend_links.messages.update_category_success' : 'pages.admin.friend_links.messages.create_category_success')

            categoryDialogVisible.value = false
            await Promise.all([loadCategories(), loadLinks()])
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.save_category_failed' })
        } finally {
            saving.value = false
        }
    }

    const submitReview = async (status: 'approved' | 'rejected') => {
        if (!selectedApplication.value) {
            return
        }

        saving.value = true
        try {
            await $fetch(`/api/admin/friend-link-applications/${selectedApplication.value.id}/review`, {
                method: 'PUT',
                body: {
                    status,
                    reviewNote: reviewForm.reviewNote,
                    linkData: reviewForm.linkData,
                },
            })

            showSuccessToast('pages.admin.friend_links.messages.review_success')
            reviewDialogVisible.value = false
            await Promise.all([loadApplications(), loadLinks()])
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.review_failed' })
        } finally {
            saving.value = false
        }
    }

    const disableLink = async (item: FriendLinkItem) => {
        try {
            await $fetch(`/api/admin/friend-links/${item.id}`, {
                method: 'PUT',
                body: {
                    status: FriendLinkStatus.INACTIVE,
                },
            })

            showSuccessToast('pages.admin.friend_links.messages.disable_link_success')
            await loadLinks()
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.disable_link_failed' })
        }
    }

    const confirmReviewOrDisable = (item: FriendLinkItem) => {
        confirm.require({
            message: tt('pages.admin.friend_links.messages.review_or_disable_confirm'),
            header: tt('pages.admin.friend_links.review_or_disable_title'),
            icon: 'pi pi-info-circle',
            acceptLabel: tt('pages.admin.friend_links.disable_now'),
            rejectLabel: tt('pages.admin.friend_links.open_site_recheck'),
            accept: () => {
                void disableLink(item)
            },
            reject: () => {
                window.open(item.url, '_blank', 'noopener,noreferrer')
            },
        })
    }

    const confirmDeleteLink = (item: FriendLinkItem) => {
        confirm.require({
            message: tt('pages.admin.friend_links.messages.delete_link_confirm'),
            header: t('common.confirm_delete'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                void (async () => {
                    try {
                        await $fetch(`/api/admin/friend-links/${item.id}`, { method: 'DELETE' })
                        showSuccessToast('pages.admin.friend_links.messages.delete_link_success')
                        await loadLinks()
                    } catch (error) {
                        showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.delete_link_failed' })
                    }
                })()
            },
        })
    }

    const confirmDeleteCategory = (item: FriendLinkCategory) => {
        confirm.require({
            message: tt('pages.admin.friend_links.messages.delete_category_confirm'),
            header: t('common.confirm_delete'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                void (async () => {
                    try {
                        await $fetch(`/api/admin/friend-link-categories/${item.id}`, { method: 'DELETE' })
                        showSuccessToast('pages.admin.friend_links.messages.delete_category_success')
                        await Promise.all([loadCategories(), loadLinks()])
                    } catch (error) {
                        showErrorToast(error, { fallbackKey: 'pages.admin.friend_links.messages.delete_category_failed' })
                    }
                })()
            },
        })
    }

    onMounted(async () => {
        await Promise.all([loadLinks(), loadCategories(), loadApplications()])
    })

    return {
        tt,
        loading,
        saving,
        links,
        categories,
        applications,
        linkDialogVisible,
        categoryDialogVisible,
        reviewDialogVisible,
        editingLink,
        editingCategory,
        selectedApplication,
        linkForm,
        categoryForm,
        reviewForm,
        linkStatusOptions,
        getLinkStatusSeverity,
        getHealthStatusSeverity,
        getApplicationStatusSeverity,
        formatDate,
        shouldSuggestReviewOrDisable,
        loadLinks,
        openLinkDialog,
        saveLink,
        confirmDeleteLink,
        openCategoryDialog,
        saveCategory,
        confirmDeleteCategory,
        openReviewDialog,
        submitReview,
        confirmReviewOrDisable,
    }
}
