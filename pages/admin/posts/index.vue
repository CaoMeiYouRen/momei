<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.posts.title')">
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
                :loading="pending"
                lazy
                :total-records="total"
                :rows="limit"
                paginator
                :rows-per-page-options="[5, 10, 20]"
                table-style="min-width: 50rem"
                @page="onPage"
            >
                <Column field="title" :header="$t('common.title')" />
                <Column field="author.name" :header="$t('common.author')" />
                <Column field="status" :header="$t('pages.admin.posts.status')">
                    <template #body="slotProps">
                        <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column field="category.name" :header="$t('common.category')">
                    <template #body="slotProps">
                        {{ slotProps.data.category?.name || '-' }}
                    </template>
                </Column>
                <Column field="views" :header="$t('common.views')" />
                <Column field="publishedAt" :header="$t('common.published_at')">
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.publishedAt) }}
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
const { formatDateTime } = useI18nDate()

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
    total,
    page,
    limit,
    pending,
    filters,
    load,
    onPage,
} = useAdminList<Post, { search: string, status: string | null }>({
    url: '/api/posts',
    initialFilters: {
        search: '',
        status: null,
    },
})

const statuses = computed(() => [
    { label: t('common.status.published'), value: 'published' },
    { label: t('common.status.draft'), value: 'draft' },
    { label: t('common.status.pending'), value: 'pending' },
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
    }
    return map[status] || status
}

const getStatusSeverity = (status: string) => {
    const map: Record<string, string> = {
        published: 'success',
        draft: 'secondary',
        pending: 'warn',
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
</style>
