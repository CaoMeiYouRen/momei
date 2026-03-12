<template>
    <div class="admin-link-governance page-container">
        <AdminPageHeader :title="$t('pages.admin.link_governance.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.link_governance.actions.refresh')"
                    icon="pi pi-refresh"
                    severity="secondary"
                    variant="outlined"
                    @click="loadReports"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-link-governance__intro">
            <h2 class="admin-link-governance__intro-title">
                {{ $t('pages.admin.link_governance.overview_title') }}
            </h2>
            <p class="admin-link-governance__intro-description">
                {{ $t('pages.admin.link_governance.overview_description') }}
            </p>
        </div>

        <Card class="admin-link-governance__card">
            <template #content>
                <div class="admin-link-governance__filters">
                    <Select
                        v-model="filters.mode"
                        :options="modeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.link_governance.filters.mode')"
                        show-clear
                        class="admin-link-governance__filter"
                    />

                    <Select
                        v-model="filters.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.link_governance.filters.status')"
                        show-clear
                        class="admin-link-governance__filter"
                    />

                    <div class="admin-link-governance__filter-actions">
                        <Button
                            :label="$t('pages.admin.link_governance.filters.apply')"
                            size="small"
                            @click="applyFilters"
                        />
                        <Button
                            :label="$t('pages.admin.link_governance.filters.reset')"
                            size="small"
                            severity="secondary"
                            variant="outlined"
                            @click="resetFilters"
                        />
                    </div>
                </div>

                <DataTable
                    :value="reports"
                    :loading="loading"
                    paginator
                    lazy
                    :rows="limit"
                    :total-records="total"
                    class="admin-link-governance__table"
                    @page="onPage"
                >
                    <Column :header="$t('pages.admin.link_governance.columns.created_at')">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.createdAt) }}
                        </template>
                    </Column>

                    <Column :header="$t('pages.admin.link_governance.columns.mode')">
                        <template #body="slotProps">
                            <Tag :severity="getModeSeverity(slotProps.data.mode)">
                                {{ translateMode(slotProps.data.mode) }}
                            </Tag>
                        </template>
                    </Column>

                    <Column :header="$t('pages.admin.link_governance.columns.status')">
                        <template #body="slotProps">
                            <Tag :severity="getStatusSeverity(slotProps.data.status)">
                                {{ translateStatus(slotProps.data.status) }}
                            </Tag>
                        </template>
                    </Column>

                    <Column :header="$t('pages.admin.link_governance.columns.requested_by')">
                        <template #body="slotProps">
                            <div class="admin-link-governance__requester">
                                <strong>{{ getRequesterLabel(slotProps.data) }}</strong>
                                <span v-if="slotProps.data.requestedByEmail" class="admin-link-governance__requester-email">
                                    {{ slotProps.data.requestedByEmail }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column :header="$t('pages.admin.link_governance.columns.summary')">
                        <template #body="slotProps">
                            <div class="admin-link-governance__summary-cell">
                                <span>{{ $t('pages.admin.link_governance.summary.total') }}: {{ slotProps.data.summary.total }}</span>
                                <span>{{ $t('pages.admin.link_governance.summary.failed') }}: {{ slotProps.data.summary.failed }}</span>
                                <span>{{ $t('pages.admin.link_governance.summary.needs_confirmation') }}: {{ slotProps.data.summary.needsConfirmation }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column :header="$t('pages.admin.link_governance.columns.redirects')">
                        <template #body="slotProps">
                            {{ slotProps.data.redirectSeedCount }}
                        </template>
                    </Column>

                    <Column :header="$t('common.actions')" class="text-right">
                        <template #body="slotProps">
                            <Button
                                :label="$t('pages.admin.link_governance.actions.view')"
                                icon="pi pi-eye"
                                text
                                rounded
                                @click="openReportDetail(slotProps.data.reportId)"
                            />
                        </template>
                    </Column>

                    <template #empty>
                        <div class="admin-link-governance__empty">
                            {{ $t('pages.admin.link_governance.empty') }}
                        </div>
                    </template>
                </DataTable>
            </template>
        </Card>

        <Dialog
            v-model:visible="detailVisible"
            :header="$t('pages.admin.link_governance.detail.title')"
            modal
            class="admin-link-governance__dialog"
        >
            <div v-if="detailLoading" class="admin-link-governance__detail-loading">
                <ProgressSpinner stroke-width="4" style="width: 2.5rem; height: 2.5rem" />
            </div>
            <div v-else-if="selectedReport" class="admin-link-governance__detail">
                <div class="admin-link-governance__detail-grid">
                    <div>
                        <strong>{{ $t('pages.admin.link_governance.detail.report_id') }}</strong>
                        <p>{{ selectedReport.reportId }}</p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.admin.link_governance.columns.mode') }}</strong>
                        <p>{{ translateMode(selectedReport.mode) }}</p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.admin.link_governance.columns.status') }}</strong>
                        <p>{{ translateStatus(selectedReport.status || 'completed') }}</p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.admin.link_governance.detail.requested_by') }}</strong>
                        <p>{{ selectedReport.requestedByUserId }}</p>
                    </div>
                </div>

                <div class="admin-link-governance__scope-list">
                    <Tag
                        v-for="scope in selectedReport.scopes || []"
                        :key="scope"
                        :value="scope"
                        severity="secondary"
                    />
                </div>

                <div class="admin-link-governance__summary-grid">
                    <div class="admin-link-governance__summary-item">
                        <strong>{{ $t('pages.admin.link_governance.summary.resolved') }}</strong>
                        <span>{{ selectedReport.summary.resolved }}</span>
                    </div>
                    <div class="admin-link-governance__summary-item">
                        <strong>{{ $t('pages.admin.link_governance.summary.rewritten') }}</strong>
                        <span>{{ selectedReport.summary.rewritten }}</span>
                    </div>
                    <div class="admin-link-governance__summary-item">
                        <strong>{{ $t('pages.admin.link_governance.summary.failed') }}</strong>
                        <span>{{ selectedReport.summary.failed }}</span>
                    </div>
                    <div class="admin-link-governance__summary-item">
                        <strong>{{ $t('pages.admin.link_governance.summary.needs_confirmation') }}</strong>
                        <span>{{ selectedReport.summary.needsConfirmation }}</span>
                    </div>
                </div>

                <div class="admin-link-governance__detail-section">
                    <h3>{{ $t('pages.admin.link_governance.detail.items') }}</h3>
                    <div v-if="selectedReport.items.length === 0" class="admin-link-governance__detail-empty">
                        {{ $t('pages.admin.link_governance.detail.empty_items') }}
                    </div>
                    <div v-else class="admin-link-governance__diff-list">
                        <article
                            v-for="item in selectedReport.items.slice(0, 20)"
                            :key="`${item.contentId}-${item.sourceValue}`"
                            class="admin-link-governance__diff-item"
                        >
                            <div class="admin-link-governance__diff-item-header">
                                <Tag :value="item.scope" severity="contrast" />
                                <Tag :value="item.status" :severity="getItemStatusSeverity(item.status)" />
                            </div>
                            <p class="admin-link-governance__diff-source">
                                {{ item.sourceValue }}
                            </p>
                            <p class="admin-link-governance__diff-target">
                                {{ item.targetValue || '-' }}
                            </p>
                        </article>
                    </div>
                </div>

                <div v-if="selectedReport.markdown" class="admin-link-governance__detail-section">
                    <h3>{{ $t('pages.admin.link_governance.detail.markdown') }}</h3>
                    <pre class="admin-link-governance__markdown">{{ selectedReport.markdown }}</pre>
                </div>
            </div>

            <template #footer>
                <Button
                    :label="$t('common.close')"
                    severity="secondary"
                    @click="detailVisible = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type {
    LinkGovernanceMode,
    LinkGovernanceReportData,
    LinkGovernanceReportListData,
    LinkGovernanceReportListItem,
    LinkGovernanceReportStatus,
} from '@/types/migration-link-governance'

definePageMeta({
    middleware: 'admin',
})

const { $appFetch } = useAppApi()
const { t } = useI18n()
const { formatDateTime } = useI18nDate()
const { showErrorToast } = useRequestFeedback()

const reports = ref<LinkGovernanceReportListItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedReport = ref<LinkGovernanceReportData | null>(null)

const filters = reactive<{
    mode: LinkGovernanceMode | null
    status: LinkGovernanceReportStatus | null
}>({
    mode: null,
    status: null,
})

const modeOptions = computed(() => [
    { label: translateMode('dry-run'), value: 'dry-run' },
    { label: translateMode('apply'), value: 'apply' },
])

const statusOptions = computed(() => [
    { label: translateStatus('completed'), value: 'completed' },
    { label: translateStatus('failed'), value: 'failed' },
])

function translateMode(mode: LinkGovernanceMode) {
    return t(`pages.admin.link_governance.modes.${mode}`)
}

function translateStatus(status: LinkGovernanceReportStatus) {
    return t(`pages.admin.link_governance.statuses.${status}`)
}

function getModeSeverity(mode: LinkGovernanceMode) {
    return mode === 'apply' ? 'success' : 'info'
}

function getStatusSeverity(status: LinkGovernanceReportStatus) {
    return status === 'failed' ? 'danger' : 'success'
}

function getItemStatusSeverity(status: LinkGovernanceReportData['items'][number]['status']) {
    if (status === 'resolved' || status === 'unchanged') {
        return 'success'
    }

    if (status === 'rewritten') {
        return 'info'
    }

    if (status === 'needs-confirmation') {
        return 'warn'
    }

    return 'danger'
}

function getRequesterLabel(item: LinkGovernanceReportListItem) {
    return item.requestedByName || item.requestedByEmail || item.requestedByUserId
}

async function loadReports() {
    loading.value = true
    try {
        const response = await $appFetch<ApiResponse<LinkGovernanceReportListData>>('/api/admin/migrations/link-governance/reports', {
            query: {
                page: page.value,
                limit: limit.value,
                mode: filters.mode || undefined,
                status: filters.status || undefined,
            },
        })

        reports.value = response.data?.items || []
        total.value = response.data?.total || 0
    } catch (error: unknown) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.link_governance.messages.load_failed',
        })
    } finally {
        loading.value = false
    }
}

async function openReportDetail(reportId: string) {
    detailVisible.value = true
    detailLoading.value = true
    selectedReport.value = null

    try {
        const response = await $appFetch<ApiResponse<LinkGovernanceReportData>>(`/api/admin/migrations/link-governance/reports/${reportId}`)
        selectedReport.value = response.data || null
    } catch (error: unknown) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.link_governance.messages.detail_failed',
        })
        detailVisible.value = false
    } finally {
        detailLoading.value = false
    }
}

function applyFilters() {
    page.value = 1
    void loadReports()
}

function resetFilters() {
    filters.mode = null
    filters.status = null
    page.value = 1
    void loadReports()
}

function onPage(event: { page: number, rows: number }) {
    page.value = event.page + 1
    limit.value = event.rows
    void loadReports()
}

onMounted(() => {
    void loadReports()
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.admin-link-governance {
    padding: $spacing-md;

    &__intro {
        margin-bottom: $spacing-lg;
    }

    &__intro-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__intro-description {
        margin: $spacing-xs 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.7;
    }

    &__card {
        :deep(.p-card-body) {
            padding: $spacing-lg;
        }
    }

    &__filters {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: $spacing-md;
        margin-bottom: $spacing-lg;
    }

    &__filter,
    &__filter-actions {
        min-width: 0;
    }

    &__filter-actions {
        display: flex;
        gap: $spacing-sm;
        justify-content: flex-end;
        align-items: center;
    }

    &__requester {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__requester-email,
    &__diff-target {
        color: var(--p-text-muted-color);
    }

    &__summary-cell {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        font-size: 0.875rem;
    }

    &__empty,
    &__detail-empty,
    &__detail-loading {
        padding: $spacing-xl;
        text-align: center;
        color: var(--p-text-muted-color);
    }

    &__detail-grid,
    &__summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: $spacing-md;
    }

    &__scope-list {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
        margin: $spacing-lg 0;
    }

    &__summary-grid {
        margin-bottom: $spacing-lg;
    }

    &__summary-item,
    &__diff-item {
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        padding: $spacing-md;
        background: var(--p-surface-0);
    }

    &__summary-item {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__detail-section + &__detail-section {
        margin-top: $spacing-lg;
    }

    &__diff-list {
        display: grid;
        gap: $spacing-sm;
    }

    &__diff-item-header {
        display: flex;
        gap: $spacing-sm;
        margin-bottom: $spacing-sm;
    }

    &__diff-source,
    &__diff-target,
    &__markdown {
        margin: 0;
        word-break: break-all;
    }

    &__markdown {
        padding: $spacing-md;
        border-radius: 1rem;
        background: var(--p-surface-100);
        max-height: 24rem;
        overflow: auto;
        white-space: pre-wrap;
    }
}

@media (width <= 960px) {
    .admin-link-governance {
        &__filters,
        &__detail-grid,
        &__summary-grid {
            grid-template-columns: 1fr;
        }

        &__filter-actions {
            justify-content: flex-start;
        }
    }
}
</style>
