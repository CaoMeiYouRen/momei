<template>
    <div class="setting-audit-log-list">
        <div class="setting-audit-log-list__header">
            <div>
                <h3 class="setting-audit-log-list__title">
                    {{ $t('pages.admin.settings.system.audit_logs.title') }}
                </h3>
                <p class="setting-audit-log-list__description">
                    {{ $t('pages.admin.settings.system.audit_logs.description') }}
                </p>
                <p v-if="demoPreview" class="setting-audit-log-list__demo-note">
                    {{ $t('pages.admin.settings.system.demo_preview.description') }}
                </p>
            </div>
            <CaomeiButton
                variant="ghost"
                :label="$t('common.refresh')"
                @click="loadLogs"
            >
                <template #icon>
                    <RefreshCw :size="16" />
                </template>
                {{ $t('common.refresh') }}
            </CaomeiButton>
        </div>

        <CaomeiDataTable
            :data="items"
            :columns="columns"
            :loading="loading"
            paginator
            lazy
            :rows="limit"
            :total-records="total"
            class="setting-audit-log-list__table"
            @page="onPage"
        >
            <template #cell-time="{row}">
                {{ formatDateTime(row.createdAt) }}
            </template>

            <template #cell-action="{row}">
                <CaomeiTag :tone="row.action === 'create' ? 'success' : 'primary'">
                    {{ $t(`pages.admin.settings.system.audit_logs.actions.${row.action}`) }}
                </CaomeiTag>
            </template>

            <template #cell-oldValue="{row}">
                <span class="setting-audit-log-list__value">{{ formatAuditValue(row.oldValue) }}</span>
            </template>

            <template #cell-newValue="{row}">
                <span class="setting-audit-log-list__value">{{ formatAuditValue(row.newValue) }}</span>
            </template>

            <template #cell-effectiveSource="{row}">
                <div class="setting-audit-log-list__source">
                    <CaomeiTag :tone="row.effectiveSource === 'env' ? 'warning' : 'success'">
                        {{ $t(`pages.admin.settings.system.audit_logs.effective_sources.${row.effectiveSource}`) }}
                    </CaomeiTag>
                    <small v-if="row.isOverriddenByEnv" class="setting-audit-log-list__source-note">
                        {{ $t('pages.admin.settings.system.audit_logs.overridden_by_env') }}
                    </small>
                </div>
            </template>

            <template #cell-operator="{row}">
                <div v-if="row.operator" class="setting-audit-log-list__operator">
                    <span>{{ row.operator.name || row.operator.email }}</span>
                    <small>{{ row.operator.email }}</small>
                </div>
                <span v-else>-</span>
            </template>

            <template #cell-source="{row}">
                <span class="setting-audit-log-list__value">{{ translateAuditSource(row.source) }}</span>
            </template>

            <template #cell-reason="{row}">
                <span class="setting-audit-log-list__value">{{ translateAuditReason(row.reason) }}</span>
            </template>

            <template #empty>
                <div class="setting-audit-log-list__empty">
                    {{ $t('pages.admin.settings.system.audit_logs.empty') }}
                </div>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import type { DataTableColumn } from 'caomei-ui'
import { useToast } from 'caomei-ui'
import { RefreshCw } from '@lucide/vue'
import type { ApiResponse } from '@/types/api'
import type { SettingAuditItem } from '@/types/setting'
import { getErrorDetail } from '@/utils/shared/error-detail'

const { $appFetch } = useAppApi()
const { formatDateTime } = useI18nDate()
const toast = useToast()
const { t } = useI18n()

const items = ref<SettingAuditItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(true)
const demoPreview = ref(false)

type AuditLogResponse = ApiResponse<{
    items: SettingAuditItem[]
    total: number
    page: number
    limit: number
    totalPages: number
    demoPreview?: boolean
}>

const formatAuditValue = (value: string | null) => {
    if (value === null) {
        return t('pages.admin.settings.system.audit_logs.value_states.unset')
    }

    if (value === '') {
        return t('pages.admin.settings.system.audit_logs.value_states.empty_string')
    }

    return value
}

const translateAuditSource = (source: string | null) => {
    if (!source) {
        return t('pages.admin.settings.system.audit_logs.value_states.unset')
    }

    const key = `pages.admin.settings.system.audit_logs.sources.${source}`
    const translated = t(key)
    return translated === key ? source : translated
}

const translateAuditReason = (reason: string | null) => {
    if (!reason) {
        return t('pages.admin.settings.system.audit_logs.value_states.unset')
    }

    const key = `pages.admin.settings.system.audit_logs.reasons.${reason}`
    const translated = t(key)
    return translated === key ? reason : translated
}

const loadLogs = async () => {
    loading.value = true
    try {
        const response = await $appFetch<AuditLogResponse>('/api/admin/settings/audit-logs', {
            query: {
                page: page.value,
                limit: limit.value,
            },
        })
        items.value = response.data.items || []
        total.value = response.data.total || 0
        demoPreview.value = Boolean(response.data.demoPreview)
    } catch (error) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: getErrorDetail(error, t('common.error_loading')),
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}

const onPage = (event: { page: number, rows: number }) => {
    /* caomei 的 `@page` 是 1 基页码（迁移前 PrimeVue 为 0 基偏移）。 */
    page.value = event.page
    limit.value = event.rows
    loadLogs()
}

const columns = computed<DataTableColumn<SettingAuditItem>[]>(() => [
    { key: 'time', header: t('pages.admin.settings.system.audit_logs.columns.time'), headerClass: 'setting-audit-log-list__time-column' },
    { key: 'settingKey', header: t('pages.admin.settings.system.audit_logs.columns.key') },
    { key: 'action', header: t('pages.admin.settings.system.audit_logs.columns.action') },
    { key: 'oldValue', header: t('pages.admin.settings.system.audit_logs.columns.old_value') },
    { key: 'newValue', header: t('pages.admin.settings.system.audit_logs.columns.new_value') },
    { key: 'effectiveSource', header: t('pages.admin.settings.system.audit_logs.columns.effective_source') },
    { key: 'operator', header: t('pages.admin.settings.system.audit_logs.columns.operator') },
    { key: 'source', header: t('pages.admin.settings.system.audit_logs.columns.source') },
    { key: 'reason', header: t('pages.admin.settings.system.audit_logs.columns.reason') },
])

onMounted(() => {
    loadLogs()
})

defineExpose({ refresh: loadLogs })
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.setting-audit-log-list {
    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: $spacing-md;
    }

    &__title {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 600;
    }

    &__description {
        margin: $spacing-xs 0 0;
        color: var(--p-text-muted-color);
    }

    &__demo-note {
        margin: $spacing-xs 0 0;
        color: var(--p-primary-600);
    }

    &__table {
        :deep(.caomei-data-table__td) {
            vertical-align: top;
        }
    }

    &__value {
        display: inline-block;
        max-width: 240px;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    &__source {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__source-note {
        color: var(--p-orange-500);
    }

    &__operator {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__empty {
        padding: $spacing-lg;
        text-align: center;
        color: var(--p-text-muted-color);
    }

    &__time-column {
        min-width: 12rem;
    }
}
</style>
