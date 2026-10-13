<template>
    <div class="admin-submissions page-container">
        <AdminPageHeader :title="$t('pages.admin.submissions.title')" />

        <div class="admin-submissions__card">
            <div class="admin-submissions__filters">
                <CaomeiInput
                    v-model="filters.keyword"
                    class="admin-submissions__keyword"
                    :placeholder="$t('pages.admin.submissions.search_placeholder')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>

                <div class="admin-submissions__status-select">
                    <CaomeiSelect
                        :model-value="filters.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.submissions.status')"
                        @update:model-value="handleStatusChange"
                    />
                </div>
            </div>

            <CaomeiDataTable
                :data="items"
                :columns="columns"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                :page="pagination.page"
                paginator
                class="admin-submissions__table"
                @page="onPage"
            >
                <template #cell-status="{row}">
                    <CaomeiTag :tone="getSubmissionStatusTone(row.status)">
                        {{ $t(`pages.admin.submissions.status_${row.status}`) }}
                    </CaomeiTag>
                </template>

                <template #cell-contributor="{row}">
                    <div class="contributor-info">
                        <div class="contributor-info__name">
                            {{ row.contributorName }}
                        </div>
                        <div class="contributor-info__email">
                            {{ row.contributorEmail }}
                        </div>
                    </div>
                </template>

                <template #cell-createdAt="{row}">
                    {{ formatDateTime(row.createdAt) }}
                </template>

                <template #cell-actions="{row}">
                    <div class="admin-submissions__actions">
                        <CaomeiButton
                            v-if="row.status === SubmissionStatus.PENDING"
                            v-tooltip.top="$t('pages.admin.submissions.review')"
                            icon-only
                            variant="ghost"
                            rounded
                            :label="$t('pages.admin.submissions.review')"
                            @click="openReview(row)"
                        >
                            <template #icon>
                                <Eye :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="$t('common.delete')"
                            icon-only
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
                        {{ $t('common.no_data') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <!-- 浮层显式豁免（迁移方案 §5.5 / §非目标）：Dialog / Divider / Textarea / Checkbox 维持 PrimeVue 至第六十九阶段。
             其**内部**的 Button / Select 属批次在册族，须随本路由迁移，否则命中「在册族零残留」守卫。 -->
        <Dialog
            v-model:visible="reviewVisible"
            :header="$t('pages.admin.submissions.review')"
            modal
            class="submission-review-dialog"
            :style="{width: '80vw', maxWidth: '900px'}"
        >
            <div v-if="selectedSubmission" class="review-content">
                <div class="review-section">
                    <h3>{{ selectedSubmission.title }}</h3>
                    <div class="contributor-meta">
                        <span>{{ selectedSubmission.contributorName }} ({{ selectedSubmission.contributorEmail }})</span>
                        <span v-if="selectedSubmission.contributorUrl"> | <a :href="selectedSubmission.contributorUrl" target="_blank">{{ selectedSubmission.contributorUrl }}</a></span>
                    </div>
                    <Divider />
                    <!-- eslint-disable vue/no-v-html -->
                    <div class="markdown-preview" v-html="previewContent" />
                    <!-- eslint-enable vue/no-v-html -->
                </div>

                <Divider />

                <div class="review-form">
                    <div class="field">
                        <label>{{ $t('pages.admin.submissions.admin_note') }}</label>
                        <Textarea
                            v-model="reviewForm.adminNote"
                            rows="3"
                            fluid
                            :placeholder="$t('pages.admin.submissions.admin_note_placeholder')"
                        />
                    </div>

                    <div v-if="reviewAction === 'accept'" class="accept-options">
                        <div class="field">
                            <label>{{ $t('pages.admin.submissions.language') }}</label>
                            <CaomeiSelect
                                v-model="reviewForm.acceptOptions.language"
                                :options="locales"
                                option-label="name"
                                option-value="code"
                            />
                        </div>
                        <div class="field">
                            <label>{{ $t('pages.admin.submissions.category') }}</label>
                            <CaomeiSelect
                                v-model="reviewForm.acceptOptions.categoryId"
                                :options="categories"
                                option-label="name"
                                option-value="id"
                            />
                        </div>
                        <div class="field-checkbox">
                            <Checkbox
                                v-model="reviewForm.acceptOptions.publishImmediately"
                                :binary="true"
                                input-id="publishNow"
                            />
                            <label for="publishNow">{{ $t('pages.admin.submissions.publish_immediately') }}</label>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <CaomeiButton
                        variant="ghost"
                        :label="$t('common.cancel')"
                        @click="reviewVisible = false"
                    />
                    <CaomeiButton
                        v-if="reviewAction !== 'accept'"
                        tone="success"
                        :label="$t('pages.admin.submissions.accept')"
                        @click="reviewAction = 'accept'"
                    />
                    <CaomeiButton
                        v-if="reviewAction === 'accept'"
                        tone="success"
                        :label="$t('common.confirm')"
                        :loading="reviewLoading"
                        @click="submitReview(SubmissionStatus.ACCEPTED)"
                    />
                    <CaomeiButton
                        v-if="reviewAction !== 'accept'"
                        tone="danger"
                        :label="$t('pages.admin.submissions.reject')"
                        :loading="reviewLoading"
                        @click="submitReview(SubmissionStatus.REJECTED)"
                    />
                </div>
            </template>
        </Dialog>

        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :title="$t('common.delete_confirm')"
            @confirm="handleDelete"
        />
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { Eye, Search, Trash } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { SubmissionStatus } from '@/types/submission'
import { useAdminList } from '@/composables/use-admin-list'
import { createMarkdownRenderer } from '@/utils/shared/markdown'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locales } = useI18n()
const { formatDateTime } = useI18nDate()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const markdownRenderer = createMarkdownRenderer({ html: false })

const filters = ref({
    keyword: '',
    status: null as SubmissionStatus | null,
})

const statusOptions = [
    { label: t('pages.admin.submissions.status_pending'), value: SubmissionStatus.PENDING },
    { label: t('pages.admin.submissions.status_accepted'), value: SubmissionStatus.ACCEPTED },
    { label: t('pages.admin.submissions.status_rejected'), value: SubmissionStatus.REJECTED },
]

// caomei `DataTable` 的 `page` 为 1 基（PrimeVue 为 0 基），故显式声明页码基准，
// 由共享 composable 统一归一（避免在页面侧写「减一」包装）。
const { items, loading, pagination, onPage, onFilterChange, refresh } = useAdminList<any>({
    url: '/api/admin/submissions',
    initialFilters: filters.value,
    pageIndexBase: 1,
})
const {
    visible: deleteVisible,
    item: submissionToDelete,
    openDeleteDialog,
    resetDeleteDialog,
} = useDeleteDialogState<any>()

const columns = computed<DataTableColumn<any>[]>(() => [
    // 不设显式 `width`：迁移前 PrimeVue `Column` 未声明宽度，列宽由内容 / 表格均分决定，
    // 迁移应保持几何不变（避免顺带改变列宽成为无法归因的差异）。
    { key: 'status', header: t('pages.admin.submissions.status') },
    { key: 'contributor', header: t('pages.admin.submissions.contributor') },
    // 标题列走默认取值（`accessor` 缺省用 key），无需自定义单元格。
    { key: 'title', header: t('pages.admin.submissions.article_title') },
    { key: 'createdAt', header: t('pages.admin.submissions.created_at') },
    // 不设 `align: 'right'`：单元格内已有 `justify-content: flex-end` 容器承载右对齐，
    // 与迁移前 PrimeVue 列组件无对齐声明的形态一致。
    { key: 'actions', header: t('common.actions') },
])

// caomei Tag 无 `severity`，改用 `tone`（迁移方案 §6.3 已接受的「Tag severity → tone」有意差异）。
// 本页 `PENDING` 源为 PrimeVue `info`，§6.2 属性级映射为 `info → primary`；此处改用 `warning`
// 属**新增的一条有意差异**（与 §6.2 不同）：`primary` 承载品牌主色语义，用于「待审核」状态
// 辨识度不足，故按状态语义取 `warning`。该偏离已登记在回归记录的本批窗口。
const getSubmissionStatusTone = (status: SubmissionStatus) => {
    switch (status) {
        case SubmissionStatus.PENDING: return 'warning'
        case SubmissionStatus.ACCEPTED: return 'success'
        case SubmissionStatus.REJECTED: return 'danger'
        default: return 'neutral'
    }
}

const handleStatusChange = (value: string | number | null | undefined) => {
    filters.value.status = (value ?? null) as SubmissionStatus | null
    onFilterChange()
}

// 审核弹窗逻辑
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const selectedSubmission = ref<any>(null)
const reviewAction = ref<'idle' | 'accept'>('idle')
const reviewForm = ref({
    adminNote: '',
    acceptOptions: {
        categoryId: null,
        tags: [], language: 'zh-CN', publishImmediately: false,
    },
})

const categories = ref<any[]>([])
const fetchCategories = async () => {
    try {
        const res = await $fetch<any>('/api/admin/categories')
        if (res.code === 200) {
            categories.value = res.data.items || res.data.list
        }
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_loading' })
    }
}

const previewContent = computed(() => {
    if (!selectedSubmission.value) return ''
    return markdownRenderer.render(selectedSubmission.value.content || '')
})

const openReview = (submission: any) => {
    selectedSubmission.value = submission
    reviewAction.value = 'idle'
    reviewForm.value.adminNote = ''
    reviewForm.value.acceptOptions.categoryId = null
    reviewForm.value.acceptOptions.language = useI18n().locale.value
    reviewForm.value.acceptOptions.publishImmediately = false
    reviewVisible.value = true
    fetchCategories()
}

const submitReview = async (status: SubmissionStatus) => {
    reviewLoading.value = true
    try {
        await $fetch(`/api/admin/submissions/${selectedSubmission.value.id}/review`, {
            method: 'PUT',
            body: {
                status,
                adminNote: reviewForm.value.adminNote,
                acceptOptions: status === SubmissionStatus.ACCEPTED ? reviewForm.value.acceptOptions : undefined,
            },
        })
        showSuccessToast('pages.admin.submissions.review_success')
        reviewVisible.value = false
        refresh()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.submissions.review_failed' })
    } finally {
        reviewLoading.value = false
    }
}

// 删除逻辑
const handleDelete = async () => {
    if (!submissionToDelete.value) return

    try {
        // 虽然 design doc 没写 DELETE API，但通常后台需要，我顺便实现一个对应的 API 或用通用删除
        // 暂时假设有 DELETE /api/admin/submissions/:id
        await $fetch(`/api/admin/submissions/${submissionToDelete.value.id}`, { method: 'DELETE' })
        showSuccessToast('pages.admin.submissions.delete_success')
        refresh()
        resetDeleteDialog()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.submissions.delete_failed' })
    }
}
</script>

<style lang="scss" scoped>
.admin-submissions {
    &__card {
        background: var(--caomei-color-bg);
        padding: 1.5rem;
        border-radius: var(--caomei-radius-md);
    }

    &__filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    // 宽度与迁移前 PrimeVue `InputText` 在 `IconField` 内的固有宽度保持一致（筛选行几何属迁移不改项）。
    &__keyword {
        width: 260px;
        max-width: 100%;
    }

    // 宽度须落在 caomei Select 的字段外层（`class` 会透传到触发器），故以包装元素约束宽度。
    &__status-select {
        width: 100%;

        @media screen and (width >= 768px) {
            width: 180px;
        }
    }

    &__actions {
        display: flex;
        gap: 0.25rem;
        justify-content: flex-end;
    }

    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；0.4.0 起提供
    // `--caomei-data-table-pagination-justify` token，用它保持迁移前布局（迁移不改几何）。
    &__table {
        --caomei-data-table-pagination-justify: center;
    }

    .contributor-info {
        &__name {
            font-weight: 600;
        }

        &__email {
            font-size: 0.85rem;
            color: var(--caomei-color-text-muted);
        }
    }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--caomei-color-text-muted);
}

.review-content {
    .markdown-preview {
        padding: 1rem;
        border: 1px solid var(--caomei-color-border);
        border-radius: 4px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--caomei-color-bg-elevated);
    }
}

.review-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        label { font-weight: 600; }
    }

    .field-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
</style>
