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
                <div class="admin-link-governance__section-header">
                    <div>
                        <h3 class="admin-link-governance__section-title">
                            {{ $t('pages.admin.link_governance.execution.title') }}
                        </h3>
                        <p class="admin-link-governance__section-description">
                            {{ $t('pages.admin.link_governance.execution.description') }}
                        </p>
                    </div>
                </div>

                <div class="admin-link-governance__execution-grid">
                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-scopes">
                            {{ $t('pages.admin.link_governance.execution.scopes') }}
                        </label>
                        <MultiSelect
                            id="link-governance-scopes"
                            v-model="executionForm.scopes"
                            :options="scopeOptions"
                            option-label="label"
                            option-value="value"
                            display="chip"
                            class="admin-link-governance__input"
                        />
                    </div>

                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-content-types">
                            {{ $t('pages.admin.link_governance.execution.content_types') }}
                        </label>
                        <MultiSelect
                            id="link-governance-content-types"
                            v-model="executionForm.contentTypes"
                            :options="contentTypeOptions"
                            option-label="label"
                            option-value="value"
                            display="chip"
                            class="admin-link-governance__input"
                        />
                    </div>

                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-domains">
                            {{ $t('pages.admin.link_governance.execution.domains') }}
                        </label>
                        <InputText
                            id="link-governance-domains"
                            v-model="executionForm.domainsText"
                            :placeholder="$t('pages.admin.link_governance.execution.domains_placeholder')"
                            class="admin-link-governance__input"
                        />
                    </div>

                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-path-prefixes">
                            {{ $t('pages.admin.link_governance.execution.path_prefixes') }}
                        </label>
                        <InputText
                            id="link-governance-path-prefixes"
                            v-model="executionForm.pathPrefixesText"
                            :placeholder="$t('pages.admin.link_governance.execution.path_prefixes_placeholder')"
                            class="admin-link-governance__input"
                        />
                    </div>

                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-validation-mode">
                            {{ $t('pages.admin.link_governance.execution.validation_mode') }}
                        </label>
                        <Select
                            id="link-governance-validation-mode"
                            v-model="executionForm.validationMode"
                            :options="validationModeOptions"
                            option-label="label"
                            option-value="value"
                            class="admin-link-governance__input"
                        />
                    </div>

                    <div class="admin-link-governance__field">
                        <label class="admin-link-governance__label" for="link-governance-report-format">
                            {{ $t('pages.admin.link_governance.execution.report_format') }}
                        </label>
                        <Select
                            id="link-governance-report-format"
                            v-model="executionForm.reportFormat"
                            :options="reportFormatOptions"
                            option-label="label"
                            option-value="value"
                            class="admin-link-governance__input"
                        />
                    </div>
                </div>

                <div class="admin-link-governance__execution-options">
                    <div class="admin-link-governance__checkbox-field">
                        <Checkbox
                            id="link-governance-relative-links"
                            v-model="executionForm.allowRelativeLinks"
                            binary
                        />
                        <label for="link-governance-relative-links">
                            {{ $t('pages.admin.link_governance.execution.allow_relative_links') }}
                        </label>
                    </div>

                    <div class="admin-link-governance__checkbox-field">
                        <Checkbox
                            id="link-governance-apply-confirmed"
                            v-model="executionForm.applyConfirmed"
                            binary
                        />
                        <label for="link-governance-apply-confirmed">
                            {{ $t('pages.admin.link_governance.execution.confirm_apply') }}
                        </label>
                    </div>
                </div>

                <div class="admin-link-governance__execution-actions">
                    <Button
                        :label="$t('pages.admin.link_governance.actions.dry_run')"
                        icon="pi pi-search"
                        :loading="runMode === 'dry-run'"
                        :disabled="runMode !== null"
                        @click="executeGovernance('dry-run')"
                    />
                    <Button
                        :label="$t('pages.admin.link_governance.actions.apply_now')"
                        icon="pi pi-play"
                        severity="warn"
                        :loading="runMode === 'apply'"
                        :disabled="runMode !== null || !executionForm.applyConfirmed || !reviewedDryRunReportId"
                        @click="executeGovernance('apply')"
                    />
                </div>
            </template>
        </Card>

        <Card class="admin-link-governance__card">
            <template #content>
                <div class="admin-link-governance__section-header">
                    <div>
                        <h3 class="admin-link-governance__section-title">
                            {{ $t('pages.admin.link_governance.report_list.title') }}
                        </h3>
                    </div>
                </div>

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

                <div class="admin-link-governance__detail-section">
                    <h3>{{ $t('pages.admin.link_governance.detail.redirect_seeds') }}</h3>
                    <div v-if="selectedReport.redirectSeeds.length === 0" class="admin-link-governance__detail-empty">
                        {{ $t('pages.admin.link_governance.detail.empty_redirect_seeds') }}
                    </div>
                    <div v-else class="admin-link-governance__redirect-list">
                        <article
                            v-for="seed in selectedReport.redirectSeeds.slice(0, 20)"
                            :key="`${seed.source}-${seed.target}`"
                            class="admin-link-governance__redirect-item"
                        >
                            <div class="admin-link-governance__diff-item-header">
                                <Tag :value="String(seed.statusCode)" severity="info" />
                                <Tag :value="seed.reason" severity="secondary" />
                            </div>
                            <p class="admin-link-governance__diff-source">
                                {{ seed.source }}
                            </p>
                            <p class="admin-link-governance__diff-target">
                                {{ seed.target }}
                            </p>
                        </article>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    v-if="selectedReport"
                    :label="$t('pages.admin.link_governance.actions.export_json')"
                    severity="secondary"
                    variant="outlined"
                    @click="downloadReport('json')"
                />
                <Button
                    v-if="selectedReport?.markdown"
                    :label="$t('pages.admin.link_governance.actions.export_markdown')"
                    severity="secondary"
                    variant="outlined"
                    @click="downloadReport('markdown')"
                />
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
    LinkGovernanceContentType,
    LinkGovernanceMode,
    LinkGovernanceRequest,
    LinkGovernanceReportData,
    LinkGovernanceReportListData,
    LinkGovernanceReportListItem,
    LinkGovernanceReportStatus,
    LinkGovernanceScope,
    LinkGovernanceValidationMode,
} from '@/types/migration-link-governance'
import {
    LINK_GOVERNANCE_CONTENT_TYPES,
    LINK_GOVERNANCE_SCOPES,
    LINK_GOVERNANCE_VALIDATION_MODES,
} from '@/types/migration-link-governance'
import { splitAndNormalizeStringList } from '@/utils/shared/string-list'

definePageMeta({
    middleware: 'admin',
})

const { $appFetch } = useAppApi()
const { t } = useI18n()
const { formatDateTime } = useI18nDate()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const reports = ref<LinkGovernanceReportListItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const runMode = ref<LinkGovernanceMode | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedReport = ref<LinkGovernanceReportData | null>(null)
const reviewedDryRunReportId = ref<string | null>(null)

const executionForm = reactive<{
    scopes: LinkGovernanceScope[]
    contentTypes: LinkGovernanceContentType[]
    domainsText: string
    pathPrefixesText: string
    validationMode: LinkGovernanceValidationMode
    reportFormat: 'json' | 'markdown'
    allowRelativeLinks: boolean
    applyConfirmed: boolean
}>({
    scopes: ['asset-url'],
    contentTypes: ['post'],
    domainsText: '',
    pathPrefixesText: '',
    validationMode: 'static',
    reportFormat: 'markdown',
    allowRelativeLinks: false,
    applyConfirmed: false,
})

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

const scopeOptions = computed(() => LINK_GOVERNANCE_SCOPES.map((value) => ({
    label: t(`pages.admin.link_governance.scopes.${value}`),
    value,
})))

const contentTypeOptions = computed(() => LINK_GOVERNANCE_CONTENT_TYPES.map((value) => ({
    label: t(`pages.admin.link_governance.content_types.${value}`),
    value,
})))

const validationModeOptions = computed(() => LINK_GOVERNANCE_VALIDATION_MODES.map((value) => ({
    label: t(`pages.admin.link_governance.validation_modes.${value}`),
    value,
})))

const reportFormatOptions = computed(() => [
    {
        label: t('pages.admin.link_governance.report_formats.json'),
        value: 'json',
    },
    {
        label: t('pages.admin.link_governance.report_formats.markdown'),
        value: 'markdown',
    },
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

function parseTextList(value: string) {
    return splitAndNormalizeStringList(value, {
        delimiters: /[\n,]/,
        dedupe: true,
    })
}

function buildExecutionRequest(mode: LinkGovernanceMode): LinkGovernanceRequest {
    const domains = parseTextList(executionForm.domainsText)
    const pathPrefixes = parseTextList(executionForm.pathPrefixesText)

    return {
        scopes: executionForm.scopes,
        filters: {
            contentTypes: executionForm.contentTypes,
            ...(domains.length > 0 ? { domains } : {}),
            ...(pathPrefixes.length > 0 ? { pathPrefixes } : {}),
        },
        options: {
            reportFormat: executionForm.reportFormat,
            validationMode: executionForm.validationMode,
            allowRelativeLinks: executionForm.allowRelativeLinks,
            ...(mode === 'apply' && reviewedDryRunReportId.value
                ? { reviewedDryRunReportId: reviewedDryRunReportId.value }
                : {}),
        },
    }
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

async function executeGovernance(mode: LinkGovernanceMode) {
    runMode.value = mode

    try {
        const response = await $appFetch<ApiResponse<LinkGovernanceReportData>>(`/api/admin/migrations/link-governance/${mode}`, {
            method: 'POST',
            body: buildExecutionRequest(mode),
        })

        selectedReport.value = response.data || null
        detailVisible.value = Boolean(selectedReport.value)
        if (mode === 'dry-run') {
            reviewedDryRunReportId.value = response.data?.reportId || null
        } else {
            reviewedDryRunReportId.value = null
        }
        showSuccessToast(mode === 'dry-run'
            ? 'pages.admin.link_governance.messages.dry_run_success'
            : 'pages.admin.link_governance.messages.apply_success')
        await loadReports()
    } catch (error: unknown) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.link_governance.messages.run_failed',
        })
    } finally {
        runMode.value = null
    }
}

function downloadReport(format: 'json' | 'markdown') {
    if (!import.meta.client || !selectedReport.value) {
        return
    }

    const fileBaseName = `link-governance-${selectedReport.value.reportId}`
    const payload = format === 'markdown'
        ? selectedReport.value.markdown || ''
        : JSON.stringify(selectedReport.value, null, 2)
    const blob = new Blob([payload], {
        type: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8',
    })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `${fileBaseName}.${format === 'markdown' ? 'md' : 'json'}`
    anchor.click()
    URL.revokeObjectURL(href)
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

watch(() => JSON.stringify({
    scopes: executionForm.scopes,
    contentTypes: executionForm.contentTypes,
    domainsText: executionForm.domainsText,
    pathPrefixesText: executionForm.pathPrefixesText,
    validationMode: executionForm.validationMode,
    allowRelativeLinks: executionForm.allowRelativeLinks,
}), () => {
    reviewedDryRunReportId.value = null
})

onMounted(() => {
    void loadReports()
})
</script>

<style lang="scss" scoped src="./link-governance.scss"></style>
