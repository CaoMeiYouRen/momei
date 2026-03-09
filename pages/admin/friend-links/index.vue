<template>
    <div class="admin-friend-links page-container">
        <AdminPageHeader :title="tt('pages.admin.friend_links.title')">
            <template #actions>
                <div class="admin-friend-links__header-actions">
                    <Button
                        :label="tt('pages.admin.friend_links.create_category')"
                        severity="secondary"
                        @click="openCategoryDialog()"
                    />
                    <Button
                        :label="tt('pages.admin.friend_links.create_link')"
                        icon="pi pi-plus"
                        @click="openLinkDialog()"
                    />
                </div>
            </template>
        </AdminPageHeader>

        <div class="admin-friend-links__section">
            <div class="admin-friend-links__section-header">
                <h2>{{ tt('pages.admin.friend_links.links') }}</h2>
                <Button
                    text
                    icon="pi pi-refresh"
                    @click="loadLinks"
                />
            </div>

            <DataTable
                :value="links"
                :loading="loading.links"
                class="admin-friend-links__table"
            >
                <Column field="name" :header="$t('common.name')" />
                <Column field="url" :header="tt('pages.admin.friend_links.site_url')">
                    <template #body="{data}">
                        <a
                            :href="data.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="admin-friend-links__external-link"
                        >
                            {{ data.url }}
                        </a>
                    </template>
                </Column>
                <Column :header="$t('common.category')">
                    <template #body="{data}">
                        {{ data.category?.name || tt('pages.links.uncategorized') }}
                    </template>
                </Column>
                <Column field="status" :header="tt('pages.admin.friend_links.link_status')">
                    <template #body="{data}">
                        <Tag :value="tt(`pages.admin.friend_links.statuses.${data.status}`)" :severity="getLinkStatusSeverity(data.status)" />
                    </template>
                </Column>
                <Column :header="tt('pages.admin.friend_links.featured')">
                    <template #body="{data}">
                        <Tag :value="data.isFeatured ? $t('common.yes') : $t('common.no')" :severity="data.isFeatured ? 'success' : 'secondary'" />
                    </template>
                </Column>
                <Column :header="tt('pages.admin.friend_links.pinned')">
                    <template #body="{data}">
                        <Tag :value="data.isPinned ? $t('common.yes') : $t('common.no')" :severity="data.isPinned ? 'info' : 'secondary'" />
                    </template>
                </Column>
                <Column field="sortOrder" :header="tt('pages.admin.friend_links.sort_order')" />
                <Column field="lastCheckedAt" :header="tt('pages.admin.friend_links.last_checked_at')">
                    <template #body="{data}">
                        {{ formatDate(data.lastCheckedAt) }}
                    </template>
                </Column>
                <Column :header="$t('common.actions')">
                    <template #body="{data}">
                        <div class="admin-friend-links__actions">
                            <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                severity="info"
                                @click="openLinkDialog(data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                @click="confirmDeleteLink(data)"
                            />
                        </div>
                    </template>
                </Column>
                <template #empty>
                    <div class="admin-friend-links__empty">
                        {{ tt('pages.admin.friend_links.empty_links') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <div class="admin-friend-links__split">
            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.categories') }}</h2>
                </div>

                <DataTable
                    :value="categories"
                    :loading="loading.categories"
                    class="admin-friend-links__table"
                >
                    <Column field="name" :header="$t('common.name')" />
                    <Column field="slug" :header="$t('common.slug')" />
                    <Column field="sortOrder" :header="tt('pages.admin.friend_links.sort_order')" />
                    <Column :header="tt('pages.admin.friend_links.category_status')">
                        <template #body="{data}">
                            <Tag :value="data.isEnabled ? tt('pages.admin.friend_links.enabled') : tt('pages.admin.friend_links.disabled')" :severity="data.isEnabled ? 'success' : 'secondary'" />
                        </template>
                    </Column>
                    <Column :header="$t('common.actions')">
                        <template #body="{data}">
                            <div class="admin-friend-links__actions">
                                <Button
                                    icon="pi pi-pencil"
                                    text
                                    rounded
                                    severity="info"
                                    @click="openCategoryDialog(data)"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    severity="danger"
                                    @click="confirmDeleteCategory(data)"
                                />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_categories') }}
                        </div>
                    </template>
                </DataTable>
            </section>

            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.applications') }}</h2>
                </div>

                <DataTable
                    :value="applications"
                    :loading="loading.applications"
                    class="admin-friend-links__table"
                >
                    <Column field="name" :header="$t('common.name')" />
                    <Column field="contactEmail" :header="tt('pages.admin.friend_links.contact_email')" />
                    <Column field="submittedIp" :header="tt('pages.admin.friend_links.submitted_ip')" />
                    <Column field="createdAt" :header="$t('common.created_at')">
                        <template #body="{data}">
                            {{ formatDate(data.createdAt) }}
                        </template>
                    </Column>
                    <Column field="status" :header="tt('pages.admin.friend_links.application_status')">
                        <template #body="{data}">
                            <Tag :value="tt(`pages.admin.friend_links.application_statuses.${data.status}`)" :severity="getApplicationStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column :header="$t('common.actions')">
                        <template #body="{data}">
                            <div class="admin-friend-links__actions">
                                <Button
                                    icon="pi pi-eye"
                                    text
                                    rounded
                                    severity="info"
                                    @click="openReviewDialog(data)"
                                />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_applications') }}
                        </div>
                    </template>
                </DataTable>
            </section>
        </div>

        <Dialog
            v-model:visible="linkDialogVisible"
            :header="editingLink ? tt('pages.admin.friend_links.edit_link') : tt('pages.admin.friend_links.create_link')"
            modal
            class="admin-friend-links__dialog"
        >
            <div class="admin-friend-links__form">
                <div class="admin-friend-links__field">
                    <label for="link-name">{{ $t('common.name') }}</label>
                    <InputText
                        id="link-name"
                        v-model="linkForm.name"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-url">{{ tt('pages.admin.friend_links.site_url') }}</label>
                    <InputText
                        id="link-url"
                        v-model="linkForm.url"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-logo">{{ tt('pages.admin.friend_links.logo') }}</label>
                    <InputText
                        id="link-logo"
                        v-model="linkForm.logo"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-rss">{{ tt('pages.admin.friend_links.rss_url') }}</label>
                    <InputText
                        id="link-rss"
                        v-model="linkForm.rssUrl"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-email">{{ tt('pages.admin.friend_links.contact_email') }}</label>
                    <InputText
                        id="link-email"
                        v-model="linkForm.contactEmail"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-category">{{ $t('common.category') }}</label>
                    <Select
                        id="link-category"
                        v-model="linkForm.categoryId"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-status">{{ tt('pages.admin.friend_links.link_status') }}</label>
                    <Select
                        id="link-status"
                        v-model="linkForm.status"
                        :options="linkStatusOptions"
                        option-label="label"
                        option-value="value"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                    <InputNumber
                        id="link-sort"
                        v-model="linkForm.sortOrder"
                        :min="0"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="link-description">{{ $t('common.description') }}</label>
                    <Textarea
                        id="link-description"
                        v-model="linkForm.description"
                        rows="4"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__toggles">
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="linkForm.isFeatured"
                            :binary="true"
                            input-id="link-featured"
                        />
                        <label for="link-featured">{{ tt('pages.admin.friend_links.is_featured') }}</label>
                    </div>
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="linkForm.isPinned"
                            :binary="true"
                            input-id="link-pinned"
                        />
                        <label for="link-pinned">{{ tt('pages.admin.friend_links.is_pinned') }}</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="linkDialogVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    :loading="saving"
                    @click="saveLink"
                />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="categoryDialogVisible"
            :header="editingCategory ? tt('pages.admin.friend_links.edit_category') : tt('pages.admin.friend_links.create_category')"
            modal
            class="admin-friend-links__dialog"
        >
            <div class="admin-friend-links__form">
                <div class="admin-friend-links__field">
                    <label for="category-name">{{ $t('common.name') }}</label>
                    <InputText
                        id="category-name"
                        v-model="categoryForm.name"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="category-slug">{{ $t('common.slug') }}</label>
                    <InputText
                        id="category-slug"
                        v-model="categoryForm.slug"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="category-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                    <InputNumber
                        id="category-sort"
                        v-model="categoryForm.sortOrder"
                        :min="0"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="category-description">{{ $t('common.description') }}</label>
                    <Textarea
                        id="category-description"
                        v-model="categoryForm.description"
                        rows="4"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__toggle">
                    <Checkbox
                        v-model="categoryForm.isEnabled"
                        :binary="true"
                        input-id="category-enabled"
                    />
                    <label for="category-enabled">{{ tt('pages.admin.friend_links.enabled') }}</label>
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="categoryDialogVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    :loading="saving"
                    @click="saveCategory"
                />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="reviewDialogVisible"
            :header="tt('pages.admin.friend_links.review_application')"
            modal
            class="admin-friend-links__dialog admin-friend-links__dialog--wide"
        >
            <div v-if="selectedApplication" class="admin-friend-links__review">
                <div class="admin-friend-links__review-grid">
                    <div><strong>{{ $t('common.name') }}:</strong> {{ selectedApplication.name }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.contact_email') }}:</strong> {{ selectedApplication.contactEmail }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.site_url') }}:</strong> {{ selectedApplication.url }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.reciprocal_url') }}:</strong> {{ selectedApplication.reciprocalUrl || '-' }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.submitted_ip') }}:</strong> {{ selectedApplication.submittedIp || '-' }}</div>
                    <div><strong>{{ $t('common.created_at') }}:</strong> {{ formatDate(selectedApplication.createdAt) }}</div>
                </div>

                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="review-note">{{ tt('pages.admin.friend_links.review_note') }}</label>
                    <Textarea
                        id="review-note"
                        v-model="reviewForm.reviewNote"
                        rows="4"
                        fluid
                    />
                </div>

                <div class="admin-friend-links__review-options">
                    <div class="admin-friend-links__field">
                        <label for="review-category">{{ $t('common.category') }}</label>
                        <Select
                            id="review-category"
                            v-model="reviewForm.linkData.categoryId"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            fluid
                        />
                    </div>
                    <div class="admin-friend-links__field">
                        <label for="review-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                        <InputNumber
                            id="review-sort"
                            v-model="reviewForm.linkData.sortOrder"
                            :min="0"
                            fluid
                        />
                    </div>
                </div>

                <div class="admin-friend-links__toggles">
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="reviewForm.linkData.isFeatured"
                            :binary="true"
                            input-id="review-featured"
                        />
                        <label for="review-featured">{{ tt('pages.admin.friend_links.is_featured') }}</label>
                    </div>
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="reviewForm.linkData.isPinned"
                            :binary="true"
                            input-id="review-pinned"
                        />
                        <label for="review-pinned">{{ tt('pages.admin.friend_links.is_pinned') }}</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="reviewDialogVisible = false"
                />
                <Button
                    :label="tt('pages.admin.friend_links.reject')"
                    severity="danger"
                    :loading="saving"
                    @click="submitReview('rejected')"
                />
                <Button
                    :label="tt('pages.admin.friend_links.approve')"
                    severity="success"
                    :loading="saving"
                    @click="submitReview('approved')"
                />
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { FriendLinkApplicationStatus, FriendLinkStatus } from '@/types/friend-link'

definePageMeta({
    middleware: 'admin',
})

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const tt = (key: string) => t(key as never)

const loading = reactive({
    links: false,
    categories: false,
    applications: false,
})
const saving = ref(false)

const links = ref<any[]>([])
const categories = ref<any[]>([])
const applications = ref<any[]>([])

const linkDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const reviewDialogVisible = ref(false)

const editingLink = ref<any>(null)
const editingCategory = ref<any>(null)
const selectedApplication = ref<any>(null)

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
    { label: tt('pages.admin.friend_links.statuses.unreachable'), value: FriendLinkStatus.UNREACHABLE },
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
        case FriendLinkStatus.UNREACHABLE:
            return 'danger'
        case FriendLinkStatus.DRAFT:
            return 'info'
        case FriendLinkStatus.CHECKING:
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

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '-'

const loadLinks = async () => {
    loading.links = true
    try {
        const response = await $fetch<any>('/api/admin/friend-links', { query: { limit: 100 } })
        links.value = response.data.items || []
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || tt('pages.admin.friend_links.messages.load_links_failed'), life: 3000 })
    } finally {
        loading.links = false
    }
}

const loadCategories = async () => {
    loading.categories = true
    try {
        const response = await $fetch<any>('/api/admin/friend-link-categories')
        categories.value = response.data || []
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || tt('pages.admin.friend_links.messages.load_categories_failed'), life: 3000 })
    } finally {
        loading.categories = false
    }
}

const loadApplications = async () => {
    loading.applications = true
    try {
        const response = await $fetch<any>('/api/admin/friend-link-applications', { query: { limit: 100 } })
        applications.value = response.data.items || []
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || tt('pages.admin.friend_links.messages.load_applications_failed'), life: 3000 })
    } finally {
        loading.applications = false
    }
}

const openLinkDialog = (item?: any) => {
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

const saveLink = async () => {
    saving.value = true
    try {
        const url = editingLink.value ? `/api/admin/friend-links/${editingLink.value.id}` : '/api/admin/friend-links'
        const method = editingLink.value ? 'PUT' : 'POST'
        await $fetch(url, { method, body: linkForm })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: editingLink.value ? tt('pages.admin.friend_links.messages.update_success') : tt('pages.admin.friend_links.messages.create_success'),
            life: 3000,
        })

        linkDialogVisible.value = false
        await loadLinks()
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || error.message || tt('pages.admin.friend_links.messages.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}

const confirmDeleteLink = (item: any) => {
    confirm.require({
        message: tt('pages.admin.friend_links.messages.delete_link_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await $fetch(`/api/admin/friend-links/${item.id}`, { method: 'DELETE' })
                toast.add({ severity: 'success', summary: t('common.success'), detail: tt('pages.admin.friend_links.messages.delete_link_success'), life: 3000 })
                await loadLinks()
            } catch (error: any) {
                toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || error.message || tt('pages.admin.friend_links.messages.delete_link_failed'), life: 3000 })
            }
        },
    })
}

const openCategoryDialog = (item?: any) => {
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

const saveCategory = async () => {
    saving.value = true
    try {
        const url = editingCategory.value ? `/api/admin/friend-link-categories/${editingCategory.value.id}` : '/api/admin/friend-link-categories'
        const method = editingCategory.value ? 'PUT' : 'POST'
        await $fetch(url, { method, body: categoryForm })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: editingCategory.value ? tt('pages.admin.friend_links.messages.update_category_success') : tt('pages.admin.friend_links.messages.create_category_success'),
            life: 3000,
        })

        categoryDialogVisible.value = false
        await Promise.all([loadCategories(), loadLinks()])
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || error.message || tt('pages.admin.friend_links.messages.save_category_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}

const confirmDeleteCategory = (item: any) => {
    confirm.require({
        message: tt('pages.admin.friend_links.messages.delete_category_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await $fetch(`/api/admin/friend-link-categories/${item.id}`, { method: 'DELETE' })
                toast.add({ severity: 'success', summary: t('common.success'), detail: tt('pages.admin.friend_links.messages.delete_category_success'), life: 3000 })
                await Promise.all([loadCategories(), loadLinks()])
            } catch (error: any) {
                toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || error.message || tt('pages.admin.friend_links.messages.delete_category_failed'), life: 3000 })
            }
        },
    })
}

const openReviewDialog = (item: any) => {
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

        toast.add({ severity: 'success', summary: t('common.success'), detail: tt('pages.admin.friend_links.messages.review_success'), life: 3000 })
        reviewDialogVisible.value = false
        await Promise.all([loadApplications(), loadLinks()])
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || error.message || tt('pages.admin.friend_links.messages.review_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}
onMounted(async () => {
    await Promise.all([loadLinks(), loadCategories(), loadApplications()])
})
</script>

<style scoped src="@/styles/pages/admin-friend-links.scss" lang="scss"></style>
