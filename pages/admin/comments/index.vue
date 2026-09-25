<template>
    <div class="admin-comments page-container">
        <AdminPageHeader :title="$t('pages.admin.comments.title')" show-language-switcher />

        <div class="admin-comments__card">
            <div class="admin-comments__filters">
                <CaomeiInput
                    v-model="filters.keyword"
                    class="admin-comments__keyword"
                    :placeholder="$t('pages.admin.comments.search_placeholder')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>

                <div class="admin-comments__status-select">
                    <CaomeiSelect
                        :model-value="statusModelValue"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.comments.status')"
                        @update:model-value="handleStatusChange"
                    />
                </div>
            </div>

            <CaomeiDataTable
                :data="items"
                :columns="columns"
                :loading="loading"
                lazy
                :total-records="total"
                :rows="pagination.pageSize"
                :page="pagination.page"
                paginator
                class="admin-comments__table"
                @page="onPage"
            >
                <template #cell-status="{row}">
                    <CaomeiTag :tone="getCommentStatusTone(row.status)">
                        {{ $t(`pages.admin.comments.status_${row.status}`) }}
                    </CaomeiTag>
                </template>

                <template #cell-author="{row}">
                    <div class="author-info">
                        <div class="author-info__name">
                            {{ row.authorName }}
                        </div>
                        <div class="author-info__email">
                            {{ row.authorEmail }}
                        </div>
                    </div>
                </template>

                <template #cell-content="{row}">
                    <div class="admin-comments__content-text">
                        {{ row.content }}
                    </div>
                </template>

                <template #cell-post="{row}">
                    <NuxtLink
                        v-if="row.post"
                        :to="`/posts/${row.post.id}`"
                        target="_blank"
                        class="admin-comments__post-link"
                    >
                        {{ row.post.title }}
                    </NuxtLink>
                </template>

                <template #cell-createdAt="{row}">
                    {{ formatDate(row.createdAt) }}
                </template>

                <template #cell-actions="{row}">
                    <div class="admin-comments__actions">
                        <CaomeiButton
                            v-if="row.status !== CommentStatus.PUBLISHED"
                            v-tooltip.top="$t('pages.admin.comments.approve')"
                            class="admin-comments__icon-button"
                            variant="ghost"
                            rounded
                            tone="success"
                            :label="$t('pages.admin.comments.approve')"
                            @click="updateStatus(row, CommentStatus.PUBLISHED)"
                        >
                            <template #icon>
                                <Check :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-if="row.status !== CommentStatus.SPAM"
                            v-tooltip.top="$t('pages.admin.comments.reject')"
                            class="admin-comments__icon-button"
                            variant="ghost"
                            rounded
                            tone="warning"
                            :label="$t('pages.admin.comments.reject')"
                            @click="updateStatus(row, CommentStatus.SPAM)"
                        >
                            <template #icon>
                                <Ban :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="$t('common.delete')"
                            class="admin-comments__icon-button"
                            variant="ghost"
                            rounded
                            tone="danger"
                            :label="$t('common.delete')"
                            @click="openDeleteDialog(row)"
                        >
                            <template #icon>
                                <Trash :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                </template>

                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.comments.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { Ban, Check, Search, Trash } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import type { Comment } from '@/types/comment'

definePageMeta({
    middleware: 'author',
})

import { CommentStatus } from '@/types/comment'

const { t } = useI18n()
const { formatDate } = useI18nDate()
const {
    visible: deleteVisible,
    item: itemToDelete,
    openDeleteDialog,
    resetDeleteDialog,
} = useDeleteDialogState<Comment>()

const loading = ref(false)
const items = ref<Comment[]>([])
const total = ref(0)
const pagination = ref({
    page: 1,
    pageSize: 20,
})
const filters = ref({
    keyword: '',
    status: null as CommentStatus | null,
})

// 「全部状态」在 caomei `Select` 中不能以 `null` 作为选项值（`optionValue` 解析结果非 string / number
// 的选项不渲染），故以哨兵值承载，并与查询模型（`null` = 全部）在边界互相转换。
const ALL_STATUS_SENTINEL = '__all__'

const statusModelValue = computed(() => filters.value.status ?? ALL_STATUS_SENTINEL)

const statusOptions = computed(() => [
    { label: t('common.all'), value: ALL_STATUS_SENTINEL },
    { label: t('pages.admin.comments.status_pending'), value: CommentStatus.PENDING },
    { label: t('pages.admin.comments.status_published'), value: CommentStatus.PUBLISHED },
    { label: t('pages.admin.comments.status_spam'), value: CommentStatus.SPAM },
])

const columns = computed<DataTableColumn<Comment>[]>(() => [
    { key: 'status', header: t('pages.admin.comments.status'), width: '100px' },
    { key: 'author', header: t('pages.admin.comments.author'), width: '220px' },
    // 内容列限宽：用列定义的 `bodyStyle`（caomei 会内联到单元格），而非 scoped class——
    // 单元格由子组件渲染、不带页面作用域属性，scoped 规则不会命中（避免留下意图落空的死规则）。
    { key: 'content', header: t('pages.admin.comments.content'), bodyStyle: { maxWidth: '400px' } },
    { key: 'post', header: t('pages.admin.comments.post') },
    { key: 'createdAt', header: t('pages.admin.comments.created_at') },
    { key: 'actions', header: t('common.actions'), align: 'right' },
])

const loadData = async () => {
    loading.value = true
    try {
        const query = {
            page: pagination.value.page,
            limit: pagination.value.pageSize,
            keyword: filters.value.keyword || undefined,
            status: filters.value.status || undefined,
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

// caomei `DataTable` 的 `page` 为 1 基（PrimeVue `@page` 为 0 基偏移），故不再 `+1`。
const onPage = (event: { page: number, rows: number }) => {
    pagination.value.page = event.page
    pagination.value.pageSize = event.rows
    loadData()
}

const onFilterChange = useDebounceFn(() => {
    pagination.value.page = 1
    loadData()
}, 500)

const handleStatusChange = (value: string | number | null | undefined) => {
    filters.value.status = typeof value === 'string' && value !== ALL_STATUS_SENTINEL
        ? value as CommentStatus
        : null
    onFilterChange()
}

const getCommentStatusTone = (status: CommentStatus) => {
    switch (status) {
        case 'published': return 'success'
        case 'pending': return 'warning'
        case 'spam': return 'danger'
        default: return 'neutral'
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
        resetDeleteDialog()
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
        background: var(--caomei-color-bg);
        border: 1px solid var(--caomei-color-border);
        border-radius: var(--caomei-radius-lg);
        overflow: hidden;
    }

    &__filters {
        padding: 1rem;
        display: flex;
        gap: 1rem;
        border-bottom: 1px solid var(--caomei-color-border);
        flex-wrap: wrap;
    }

    // 宽度与迁移前 PrimeVue `InputText` 在 `IconField` 内的固有宽度（实测 260px）保持一致，
    // 避免迁移顺带改变筛选行几何（迁移应保持行为与布局不变）。
    &__keyword {
        width: 260px;
        max-width: 100%;
    }

    // 宽度需落在 caomei Select 的字段外层（`.caomei-select__field`）：`class` 会透传到触发器，
    // 故以包装元素约束宽度（字段默认 `width: 100%`，并按 `--caomei-select-max-width` 限 20rem）。
    // 180px 与迁移前 PrimeVue Select 的 `width: 180px` 一致。
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
        color: var(--caomei-color-primary);
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

    // caomei Button 无「图标按钮」形态，按 caomei 文档化定制路径（`--caomei-*` token）收敛为方形图标按钮。
    &__icon-button {
        --caomei-button-padding-x: 0;

        width: var(--caomei-control-height-md);
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
        color: var(--caomei-color-text);
    }

    &__email {
        font-size: 0.75rem;
        color: var(--caomei-color-text-muted);
        opacity: 0.8;
    }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--caomei-color-text-muted);
}
</style>
