<template>
    <div class="admin-link-governance page-container">
        <AdminPageHeader :title="$t('pages.admin.link_governance.title')" show-language-switcher>
            <template #actions>
                <CaomeiButton
                    variant="secondary"
                    @click="loadReports"
                >
                    <template #icon>
                        <RefreshCw :size="16" />
                    </template>
                    {{ $t('common.refresh') }}
                </CaomeiButton>
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

        <!-- 展示类容器 `Card` 与表单控件 `MultiSelect` / `Checkbox`、展示类 `ProgressSpinner` 不在 B2
             在册族清单内（§5.5 显式豁免枚举），维持 PrimeVue 至 B3 / B4 批次；本页页面级样式沿用
             `--p-*` token 与 `:deep(.p-card-body)` 即因其仍在 PrimeVue 侧。 -->
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
                        <CaomeiInput
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
                        <CaomeiInput
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
                        <CaomeiSelect
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
                        <CaomeiSelect
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
                    <CaomeiButton
                        :loading="runMode === 'dry-run'"
                        :disabled="runMode !== null"
                        @click="executeGovernance('dry-run')"
                    >
                        <template #icon>
                            <Search :size="16" />
                        </template>
                        {{ $t('pages.admin.link_governance.actions.dry_run') }}
                    </CaomeiButton>
                    <CaomeiButton
                        tone="warning"
                        :loading="runMode === 'apply'"
                        :disabled="runMode !== null || !executionForm.applyConfirmed || !reviewedDryRunReportId"
                        @click="executeGovernance('apply')"
                    >
                        <template #icon>
                            <Play :size="16" />
                        </template>
                        {{ $t('pages.admin.link_governance.actions.apply_now') }}
                    </CaomeiButton>
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
                    <CaomeiSelect
                        v-model="filters.mode"
                        :options="modeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.link_governance.filters.mode')"
                        show-clear
                        class="admin-link-governance__filter"
                    />

                    <CaomeiSelect
                        v-model="filters.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.link_governance.filters.status')"
                        show-clear
                        class="admin-link-governance__filter"
                    />

                    <div class="admin-link-governance__filter-actions">
                        <CaomeiButton
                            size="sm"
                            @click="applyFilters"
                        >
                            {{ $t('pages.admin.link_governance.filters.apply') }}
                        </CaomeiButton>
                        <CaomeiButton
                            size="sm"
                            variant="secondary"
                            @click="resetFilters"
                        >
                            {{ $t('pages.admin.link_governance.filters.reset') }}
                        </CaomeiButton>
                    </div>
                </div>

                <!-- 懒加载服务端分页：`page` 为 1 基受控值，`@page` 载荷亦为 1 基
                     （迁移前 PrimeVue 为 0 基，原实现恒 `+1`；迁移后直接取载荷页码）。 -->
                <CaomeiDataTable
                    :data="reports"
                    :columns="columns"
                    :loading="loading"
                    lazy
                    :total-records="total"
                    :rows="limit"
                    :page="page"
                    paginator
                    class="admin-link-governance__table"
                    @page="onPage"
                >
                    <template #cell-createdAt="{row}">
                        {{ formatDateTime(row.createdAt) }}
                    </template>

                    <template #cell-mode="{row}">
                        <CaomeiTag :tone="getModeTone(row.mode)">
                            {{ translateMode(row.mode) }}
                        </CaomeiTag>
                    </template>

                    <template #cell-status="{row}">
                        <CaomeiTag :tone="getReportStatusTone(row.status)">
                            {{ translateStatus(row.status) }}
                        </CaomeiTag>
                    </template>

                    <template #cell-requestedBy="{row}">
                        <div class="admin-link-governance__requester">
                            <strong>{{ getRequesterLabel(row) }}</strong>
                            <span v-if="row.requestedByEmail" class="admin-link-governance__requester-email">
                                {{ row.requestedByEmail }}
                            </span>
                        </div>
                    </template>

                    <template #cell-summary="{row}">
                        <div class="admin-link-governance__summary-cell">
                            <span>{{ $t('pages.admin.link_governance.summary.total') }}: {{ row.summary.total }}</span>
                            <span>{{ $t('pages.admin.link_governance.summary.failed') }}: {{ row.summary.failed }}</span>
                            <span>{{ $t('pages.admin.link_governance.summary.needs_confirmation') }}: {{ row.summary.needsConfirmation }}</span>
                        </div>
                    </template>

                    <template #cell-redirects="{row}">
                        {{ row.redirectSeedCount }}
                    </template>

                    <template #cell-actions="{row}">
                        <CaomeiButton
                            variant="ghost"
                            rounded
                            :label="$t('pages.admin.link_governance.actions.view')"
                            @click="openReportDetail(row.reportId)"
                        >
                            <template #icon>
                                <Eye :size="16" />
                            </template>
                            {{ $t('pages.admin.link_governance.actions.view') }}
                        </CaomeiButton>
                    </template>

                    <template #empty>
                        <div class="admin-link-governance__empty">
                            {{ $t('pages.admin.link_governance.empty') }}
                        </div>
                    </template>
                </CaomeiDataTable>
            </template>
        </Card>

        <!-- 浮层显式豁免（迁移方案 §5.5）：Dialog 属延后批次，本批维持 PrimeVue；其内部的 Button / Tag
             属批次在册族，须随本路由迁移，否则命中「在册族零残留」守卫。 -->
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
                    <CaomeiTag
                        v-for="scope in selectedReport.scopes || []"
                        :key="scope"
                        tone="neutral"
                    >
                        {{ scope }}
                    </CaomeiTag>
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
                                <CaomeiTag tone="neutral">
                                    {{ item.scope }}
                                </CaomeiTag>
                                <CaomeiTag :tone="getItemStatusTone(item.status)">
                                    {{ item.status }}
                                </CaomeiTag>
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
                                <CaomeiTag tone="primary">
                                    {{ String(seed.statusCode) }}
                                </CaomeiTag>
                                <CaomeiTag tone="neutral">
                                    {{ seed.reason }}
                                </CaomeiTag>
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
                <CaomeiButton
                    v-if="selectedReport"
                    variant="secondary"
                    @click="downloadReport('json')"
                >
                    {{ $t('pages.admin.link_governance.actions.export_json') }}
                </CaomeiButton>
                <CaomeiButton
                    v-if="selectedReport?.markdown"
                    variant="secondary"
                    @click="downloadReport('markdown')"
                >
                    {{ $t('pages.admin.link_governance.actions.export_markdown') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="secondary"
                    @click="detailVisible = false"
                >
                    {{ $t('common.close') }}
                </CaomeiButton>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { Eye, Play, RefreshCw, Search } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
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

// 列定义与迁移前 PrimeVue 列组件一一对应：创建时间 / 模式 / 状态 / 发起人 / 摘要 / Redirect Seeds / 动作。
// 迁移前列组件均未声明 `field`（全部走 `#body` 插槽），故此处只给出插槽所需的 `key`。
// 不设显式 `width`：迁移前未声明宽度，列宽由内容 / 表格均分决定（迁移不改几何）。
const columns = computed<DataTableColumn<LinkGovernanceReportListItem>[]>(() => [
    { key: 'createdAt', header: t('pages.admin.link_governance.columns.created_at') },
    { key: 'mode', header: t('pages.admin.link_governance.columns.mode') },
    { key: 'status', header: t('pages.admin.link_governance.columns.status') },
    { key: 'requestedBy', header: t('pages.admin.link_governance.columns.requested_by') },
    { key: 'summary', header: t('pages.admin.link_governance.columns.summary') },
    { key: 'redirects', header: t('pages.admin.link_governance.columns.redirects') },
    // 迁移前动作列以 `class="text-right"` 右对齐，迁移后用列级 `align` 等价还原。
    { key: 'actions', header: t('common.actions'), align: 'right' },
])

function translateMode(mode: LinkGovernanceMode) {
    return t(`pages.admin.link_governance.modes.${mode}`)
}

function translateStatus(status: LinkGovernanceReportStatus) {
    return t(`pages.admin.link_governance.statuses.${status}`)
}

// caomei Tag 无 `severity`，改用 `tone`（迁移方案 §6.2 / §6.3 有意差异）：
// `success` / `warning` / `danger` 直通，PrimeVue `info` 按 §6.2 取 `primary`、
// `secondary` / `contrast` 取有损近似 `neutral`。
function getModeTone(mode: LinkGovernanceMode): 'success' | 'primary' {
    return mode === 'apply' ? 'success' : 'primary'
}

function getReportStatusTone(status: LinkGovernanceReportStatus): 'danger' | 'success' {
    return status === 'failed' ? 'danger' : 'success'
}

function getItemStatusTone(status: LinkGovernanceReportData['items'][number]['status']): 'success' | 'primary' | 'warning' | 'danger' {
    if (status === 'resolved' || status === 'unchanged') {
        return 'success'
    }

    if (status === 'rewritten') {
        return 'primary'
    }

    if (status === 'needs-confirmation') {
        return 'warning'
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

// caomei `DataTable` 的 `page` / `@page` 为 **1 基**（PrimeVue 为 0 基）——迁移前原实现恒 `+1`，
// 迁移后直接取载荷页码（本页自持 `page`，未走 `useAdminList` 的 `pageIndexBase` 归一）。
function onPage(event: { page: number, rows: number }) {
    page.value = event.page
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
