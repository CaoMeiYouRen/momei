<template>
    <div class="admin-comments page-container">
        <AdminPageHeader :title="$t('pages.admin.comments.title')" show-language-switcher />

        <div class="admin-comments__card">
            <div class="admin-comments__filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.keyword"
                        :placeholder="$t('pages.admin.comments.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>

                <Select
                    v-model="filters.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.comments.status')"
                    class="admin-comments__status-select"
                    @change="onFilterChange"
                />
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="total"
                :rows="pagination.pageSize"
                paginator
                class="admin-comments__table"
                @page="onPage"
            >
                <Column
                    field="status"
                    :header="$t('pages.admin.comments.status')"
                    class="admin-comments__col--status"
                >
                    <template #body="{data}">
                        <Tag
                            :severity="getStatusSeverity(data.status)"
                            :value="$t(`pages.admin.comments.status_${data.status}`)"
                        />
                    </template>
                </Column>

                <Column :header="$t('pages.admin.comments.author')" class="admin-comments__col--author">
                    <template #body="{data}">
                        <div class="author-info">
                            <div class="author-info__name">
                                {{ data.authorName }}
                            </div>
                            <div class="author-info__email">
                                {{ data.authorEmail }}
                            </div>
                        </div>
                    </template>
                </Column>

                <Column :header="$t('pages.admin.comments.content')" class="admin-comments__col--content">
                    <template #body="{data}">
                        <div class="admin-comments__content-text">
                            {{ data.content }}
                        </div>
                    </template>
                </Column>

                <Column :header="$t('pages.admin.comments.post')">
                    <template #body="{data}">
                        <NuxtLink
                            v-if="data.post"
                            :to="`/posts/${data.post.id}`"
                            target="_blank"
                            class="admin-comments__post-link"
                        >
                            {{ data.post.title }}
                        </NuxtLink>
                    </template>
                </Column>

                <Column field="createdAt" :header="$t('pages.admin.comments.created_at')">
                    <template #body="{data}">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

                <Column :header="$t('common.actions')" class="admin-comments__col--actions">
                    <template #body="{data}">
                        <div class="admin-comments__actions">
                            <Button
                                v-if="data.status !== CommentStatus.PUBLISHED"
                                v-tooltip.top="$t('pages.admin.comments.approve')"
                                icon="pi pi-check"
                                text
                                rounded
                                severity="success"
                                @click="updateStatus(data, CommentStatus.PUBLISHED)"
                            />
                            <Button
                                v-if="data.status !== CommentStatus.SPAM"
                                v-tooltip.top="$t('pages.admin.comments.reject')"
                                icon="pi pi-ban"
                                text
                                rounded
                                severity="warning"
                                @click="updateStatus(data, CommentStatus.SPAM)"
                            />
                            <Button
                                v-tooltip.top="$t('common.delete')"
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                @click="confirmDelete(data)"
                            />
                        </div>
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
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.comments.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'author',
})

import { CommentStatus, type Comment } from '@/types/comment'

const { t } = useI18n()
const { formatDate } = useI18nDate()

const loading = ref(false)
const items = ref<Comment[]>([])
const total = ref(0)
const pagination = reactive({
    page: 1,
    pageSize: 20,
})
const filters = reactive({
    keyword: '',
    status: null as CommentStatus | null,
})

const statusOptions = computed(() => [
    { label: t('common.all'), value: null },
    { label: t('pages.admin.comments.status_pending'), value: CommentStatus.PENDING },
    { label: t('pages.admin.comments.status_published'), value: CommentStatus.PUBLISHED },
    { label: t('pages.admin.comments.status_spam'), value: CommentStatus.SPAM },
])

const deleteVisible = ref(false)
const itemToDelete = ref<Comment | null>(null)

const loadData = async () => {
    loading.value = true
    try {
        const query = {
            page: pagination.page,
            limit: pagination.pageSize,
            keyword: filters.keyword || undefined,
            status: filters.status || undefined,
        }
        const res = await $fetch<any>('/api/comments', { query })
        if (res.code === 200) {
            items.value = res.data.items
            total.value = res.data.total
        }
    } catch (error) {
        console.error('Failed to load comments:', error)
    } finally {
        loading.value = false
    }
}

const onPage = (event: any) => {
    pagination.page = event.page + 1
    pagination.pageSize = event.rows
    loadData()
}

const onFilterChange = useDebounceFn(() => {
    pagination.page = 1
    loadData()
}, 500)

const getStatusSeverity = (status: CommentStatus) => {
    switch (status) {
        case 'published': return 'success'
        case 'pending': return 'warn'
        case 'spam': return 'danger'
        default: return 'secondary'
    }
}

const updateStatus = async (item: Comment, status: CommentStatus) => {
    try {
        await $fetch(`/api/comments/${item.id}`, {
            method: 'PUT',
            body: { status },
        })
        item.status = status
    } catch (error) {
        console.error('Failed to update status:', error)
    }
}

const confirmDelete = (item: Comment) => {
    itemToDelete.value = item
    deleteVisible.value = true
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/comments/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        loadData()
    } catch (error) {
        console.error('Failed to delete comment:', error)
    } finally {
        deleteVisible.value = false
        itemToDelete.value = null
    }
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.admin-comments {
    padding-bottom: 2rem;

    &__card {
        background: var(--p-content-background);
        border: 1px solid var(--p-content-border-color);
        border-radius: var(--p-border-radius-lg);
        overflow: hidden;
    }

    &__filters {
        padding: 1rem;
        display: flex;
        gap: 1rem;
        border-bottom: 1px solid var(--p-content-border-color);
        flex-wrap: wrap;
    }

    &__status-select {
        width: 100%;

        @media screen and (width >= 768px) {
            width: 180px;
        }
    }

    &__content-text {
        font-size: 0.875rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__post-link {
        font-size: 0.875rem;
        color: var(--p-primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__actions {
        display: flex;
        gap: 0.25rem;
        justify-content: flex-end;
    }

    &__col {
        &--status {
            width: 100px;
        }

        &--author {
            width: 220px;
        }

        &--content {
            max-width: 400px;
        }

        &--actions {
            text-align: right;
        }
    }
}

.author-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.2;

    &__name {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--p-text-color);
    }

    &__email {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        opacity: 0.8;
    }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--p-text-muted-color);
}
</style>
