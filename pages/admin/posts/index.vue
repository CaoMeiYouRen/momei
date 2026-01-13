<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.posts.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.posts.create')"
                    icon="pi pi-plus"
                    @click="navigateTo('/admin/posts/new')"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <div class="admin-filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.posts.search_placeholder')"
                        @keydown.enter="load"
                    />
                </IconField>
                <Select
                    v-model="filters.status"
                    :options="statuses"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.posts.status')"
                    show-clear
                    class="status-select"
                    @change="load"
                />
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                paginator
                :rows-per-page-options="[5, 10, 20]"
                table-style="min-width: 50rem"
                @page="onPage"
                @sort="onSort"
            >
                <Column
                    field="title"
                    :header="$t('common.title')"
                    sortable
                />
                <Column field="author.name" :header="$t('common.author')" />
                <Column
                    field="status"
                    :header="$t('pages.admin.posts.status')"
                    sortable
                >
                    <template #body="slotProps">
                        <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column field="category.name" :header="$t('common.category')" />
                <Column
                    field="language"
                    :header="$t('common.language')"
                    sortable
                >
                    <template #body="{data}">
                        <Tag :value="data.language" severity="secondary" />
                    </template>
                </Column>
                <Column
                    field="views"
                    :header="$t('common.views')"
                    sortable
                />
                <Column
                    field="publishedAt"
                    :header="$t('common.published_at')"
                    sortable
                >
                    <template #body="slotProps">
                        <div class="user-created-at">
                            <span class="user-created-at__date">{{ formatDateTime(slotProps.data.publishedAt) }}</span>
                            <small v-if="slotProps.data.publishedAt" class="user-created-at__relative">{{ relativeTime(slotProps.data.publishedAt) }}</small>
                        </div>
                    </template>
                </Column>
                <Column
                    :header="$t('common.actions')"
                    :exportable="false"
                    style="min-width:8rem"
                >
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            text
                            rounded
                            severity="info"
                            @click="editPost(slotProps.data.id)"
                        />
                        <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            @click="confirmDelete(slotProps.data)"
                        />
                    </template>
                </Column>
                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <ConfirmDeleteDialog
            ref="deleteDialog"
            @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminList } from '@/composables/useAdminList'
import { useI18nDate } from '@/composables/useI18nDate'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const { formatDateTime, relativeTime } = useI18nDate()

interface Post {
    id: string
    title: string
    status: string
    author: { name: string }
    category?: { name: string }
    views: number
    publishedAt: string
}

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    refresh: load,
} = useAdminList<Post, { search: string, status: string | null }>({
    url: '/api/posts',
    initialFilters: {
        search: '',
        status: null,
    },
    initialSort: {
        field: 'publishedAt',
        order: 'desc',
    },
})

const statuses = computed(() => [
    { label: t('common.status.published'), value: 'published' },
    { label: t('common.status.draft'), value: 'draft' },
    { label: t('common.status.pending'), value: 'pending' },
    { label: t('common.status.rejected'), value: 'rejected' },
    { label: t('common.status.hidden'), value: 'hidden' },
])

const editPost = (id: string) => {
    navigateTo(`/admin/posts/${id}`)
}

const deleteDialog = ref()
const postToDelete = ref<Post | null>(null)

const confirmDelete = (post: Post) => {
    postToDelete.value = post
    deleteDialog.value.open()
}

const handleDelete = async () => {
    if (!postToDelete.value) return

    deleteDialog.value.setLoading(true)
    try {
        await $fetch(`/api/posts/${postToDelete.value.id}`, { method: 'DELETE' as any })
        deleteDialog.value.close()
        load()
    } catch (error) {
        console.error('Failed to delete post:', error)
    } finally {
        deleteDialog.value.setLoading(false)
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        published: t('common.status.published'),
        draft: t('common.status.draft'),
        pending: t('common.status.pending'),
        rejected: t('common.status.rejected'),
        hidden: t('common.status.hidden'),
    }
    return map[status] || status
}

const getStatusSeverity = (status: string) => {
    const map: Record<string, string | undefined> = {
        published: 'success',
        draft: 'secondary',
        pending: 'warn',
        rejected: 'danger',
        hidden: 'info',
    }
    return map[status] || 'info'
}
</script>

<style lang="scss" scoped>
.status-select {
    width: 10rem;
}

.empty-state {
    text-align: center;
    padding: 1rem;
}

.user-created-at {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__relative {
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
    }
}
</style>
