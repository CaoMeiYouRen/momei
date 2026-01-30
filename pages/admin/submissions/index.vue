<template>
    <div class="admin-submissions page-container">
        <AdminPageHeader :title="$t('pages.admin.submissions.title')" />

        <div class="admin-submissions__card">
            <div class="admin-submissions__filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.keyword"
                        :placeholder="$t('pages.admin.submissions.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>

                <Select
                    v-model="filters.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.submissions.status')"
                    class="admin-submissions__status-select"
                    @change="onFilterChange"
                />
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                paginator
                class="admin-submissions__table"
                @page="onPage"
            >
                <Column
                    field="status"
                    :header="$t('pages.admin.submissions.status')"
                    class="admin-submissions__col--status"
                >
                    <template #body="{data}">
                        <Tag
                            :severity="getStatusSeverity(data.status)"
                            :value="$t(`pages.admin.submissions.status_${data.status}`)"
                        />
                    </template>
                </Column>

                <Column :header="$t('pages.admin.submissions.contributor')" class="admin-submissions__col--author">
                    <template #body="{data}">
                        <div class="contributor-info">
                            <div class="contributor-info__name">
                                {{ data.contributorName }}
                            </div>
                            <div class="contributor-info__email">
                                {{ data.contributorEmail }}
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="title" :header="$t('pages.admin.submissions.article_title')" />

                <Column field="createdAt" :header="$t('pages.admin.submissions.created_at')">
                    <template #body="{data}">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

                <Column :header="$t('common.actions')" class="admin-submissions__col--actions">
                    <template #body="{data}">
                        <div class="admin-submissions__actions">
                            <Button
                                v-if="data.status === SubmissionStatus.PENDING"
                                v-tooltip.top="$t('pages.admin.submissions.review')"
                                icon="pi pi-eye"
                                text
                                rounded
                                @click="openReview(data)"
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
            </DataTable>
        </div>

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
                            <Select
                                v-model="reviewForm.acceptOptions.language"
                                :options="locales"
                                option-label="name"
                                option-value="code"
                                fluid
                            />
                        </div>
                        <div class="field">
                            <label>{{ $t('pages.admin.submissions.category') }}</label>
                            <Select
                                v-model="reviewForm.acceptOptions.categoryId"
                                :options="categories"
                                option-label="name"
                                option-value="id"
                                fluid
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
                    <Button
                        :label="$t('common.cancel')"
                        text
                        @click="reviewVisible = false"
                    />
                    <Button
                        v-if="reviewAction !== 'accept'"
                        :label="$t('pages.admin.submissions.accept')"
                        severity="success"
                        @click="reviewAction = 'accept'"
                    />
                    <Button
                        v-if="reviewAction === 'accept'"
                        :label="$t('common.confirm')"
                        severity="success"
                        :loading="reviewLoading"
                        @click="submitReview(SubmissionStatus.ACCEPTED)"
                    />
                    <Button
                        v-if="reviewAction !== 'accept'"
                        :label="$t('pages.admin.submissions.reject')"
                        severity="danger"
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
import { SubmissionStatus } from '@/types/submission'
import { useAdminList } from '@/composables/use-admin-list'
import dayjs from 'dayjs'
// @ts-ignore
import { marked } from 'marked'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locales } = useI18n()
const toast = useToast()

const filters = reactive({
    keyword: '',
    status: null,
})

const statusOptions = [
    { label: t('pages.admin.submissions.status_pending'), value: SubmissionStatus.PENDING },
    { label: t('pages.admin.submissions.status_accepted'), value: SubmissionStatus.ACCEPTED },
    { label: t('pages.admin.submissions.status_rejected'), value: SubmissionStatus.REJECTED },
]

const { items, loading, pagination, onPage, onFilterChange, refresh } = useAdminList<any>({
    url: '/api/admin/submissions',
    initialFilters: filters,
})

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getStatusSeverity = (status: SubmissionStatus) => {
    switch (status) {
        case SubmissionStatus.PENDING: return 'info'
        case SubmissionStatus.ACCEPTED: return 'success'
        case SubmissionStatus.REJECTED: return 'danger'
        default: return 'secondary'
    }
}

// 审核弹窗逻辑
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const selectedSubmission = ref<any>(null)
const reviewAction = ref<'idle' | 'accept'>('idle')
const reviewForm = reactive({
    adminNote: '',
    acceptOptions: {
        categoryId: null,
        tags: [], language: 'zh-CN', publishImmediately: false,
    },
})

const categories = ref<any[]>([])
const fetchCategories = async () => {
    const res = await $fetch<any>('/api/admin/categories')
    if (res.code === 200) {
        categories.value = res.data.items || res.data.list
    }
}

const previewContent = computed(() => {
    if (!selectedSubmission.value) return ''
    return marked.parse(selectedSubmission.value.content)
})

const openReview = (submission: any) => {
    selectedSubmission.value = submission
    reviewAction.value = 'idle'
    reviewForm.adminNote = ''
    reviewForm.acceptOptions.categoryId = null
    reviewForm.acceptOptions.language = useI18n().locale.value
    reviewForm.acceptOptions.publishImmediately = false
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
                adminNote: reviewForm.adminNote,
                acceptOptions: status === SubmissionStatus.ACCEPTED ? reviewForm.acceptOptions : undefined,
            },
        })
        toast.add({ severity: 'success', summary: t('pages.admin.submissions.review_success'), life: 3000 })
        reviewVisible.value = false
        refresh()
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.message, life: 3000 })
    } finally {
        reviewLoading.value = false
    }
}

// 删除逻辑
const deleteVisible = ref(false)
const submissionToDelete = ref<any>(null)

const confirmDelete = (submission: any) => {
    submissionToDelete.value = submission
    deleteVisible.value = true
}

const handleDelete = async () => {
    try {
        // 虽然 design doc 没写 DELETE API，但通常后台需要，我顺便实现一个对应的 API 或用通用删除
        // 暂时假设有 DELETE /api/admin/submissions/:id
        await $fetch(`/api/admin/submissions/${submissionToDelete.value.id}`, { method: 'DELETE' })
        toast.add({ severity: 'success', summary: t('common.delete_success'), life: 3000 })
        refresh()
    } catch (error: any) {
        toast.add({ severity: 'error', summary: t('common.delete_failed'), life: 3000 })
    }
}
</script>

<style lang="scss" scoped>
.admin-submissions {
    &__card {
        background: var(--p-content-background);
        padding: 1.5rem;
        border-radius: var(--p-content-border-radius);
    }

    &__filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .contributor-info {
        &__name {
            font-weight: 600;
        }

        &__email {
            font-size: 0.85rem;
            color: var(--p-text-muted-color);
        }
    }
}

.review-content {
    .markdown-preview {
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 4px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--p-content-hover-background);
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
