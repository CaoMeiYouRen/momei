<template>
    <div class="page-container">
        <div class="page-header">
            <h1 class="page-title">
                {{ $t('pages.admin.posts.title') }}
            </h1>
            <Button
                :label="$t('pages.admin.posts.create')"
                icon="pi pi-plus"
                @click="navigateTo('/admin/posts/new')"
            />
        </div>

        <div class="content-card">
            <div class="filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.posts.search_placeholder')"
                        @keydown.enter="loadPosts"
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
                    @change="loadPosts"
                />
            </div>

            <DataTable
                :value="posts"
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { formatDate, formatDateTime } from '@/utils/shared/date'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()

interface Post {
    id: string
    title: string
    status: string
    author: { name: string }
    category?: { name: string }
    views: number
    publishedAt: string
}

const posts = ref<Post[]>([])
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const pending = ref(false)

const filters = ref({
    search: '',
    status: null,
})

const statuses = computed(() => [
    { label: t('common.status.published'), value: 'published' },
    { label: t('common.status.draft'), value: 'draft' },
    { label: t('common.status.pending'), value: 'pending' },
])

const loadPosts = async () => {
    pending.value = true
    try {
        const response = await $fetch<{ code: number, data: { items: Post[], total: number } }>('/api/posts', {
            query: {
                page: page.value,
                limit: limit.value,
                scope: 'manage',
                search: filters.value.search || undefined,
                status: filters.value.status || undefined,
            },
        })
        if (response.code === 200 && response.data) {
            posts.value = response.data.items
            total.value = response.data.total
        }
    } catch (error) {
        console.error('Failed to load posts:', error)
    } finally {
        pending.value = false
    }
}

const onPage = (event: any) => {
    page.value = event.page + 1
    limit.value = event.rows
    loadPosts()
}

const editPost = (id: string) => {
    navigateTo(`/admin/posts/${id}`)
}

const confirmDelete = async (post: Post) => {
    if (confirm(`确定要删除文章 "${post.title}" 吗？`)) {
        try {
            await $fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
            loadPosts()
        } catch (error) {
            console.error('Failed to delete post:', error)
            alert('删除失败')
        }
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

onMounted(() => {
    loadPosts()
})
</script>

<style lang="scss" scoped>
.page-container {
    padding: 1.5rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.content-card {
    padding: 1rem;
    background-color: var(--p-surface-card);
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border: 1px solid var(--p-surface-border);
    margin-bottom: 1.5rem;
}

.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
}

.status-select {
    width: 10rem;
}

.empty-state {
    text-align: center;
    padding: 1rem;
}
</style>
