<template>
    <div class="setting-audit-log-list">
        <DataTable
            :value="items"
            :loading="loading"
            paginator
            lazy
            :rows="limit"
            :total-records="total"
            class="setting-audit-log-list__table"
            @page="onPage"
        >
            <template #header>
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
                    <Button
                        icon="pi pi-refresh"
                        variant="text"
                        :label="$t('pages.admin.settings.system.audit_logs.refresh')"
                        @click="loadLogs"
                    />
                </div>
            </template>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.time')" class="setting-audit-log-list__time-column">
                <template #body="slotProps">
                    {{ formatDateTime(slotProps.data.createdAt) }}
                </template>
            </Column>

            <Column field="settingKey" :header="$t('pages.admin.settings.system.audit_logs.columns.key')" />

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.action')">
                <template #body="slotProps">
                    <Tag :severity="slotProps.data.action === 'create' ? 'success' : 'info'">
                        {{ $t(`pages.admin.settings.system.audit_logs.actions.${slotProps.data.action}`) }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.old_value')">
                <template #body="slotProps">
                    <span class="setting-audit-log-list__value">{{ formatAuditValue(slotProps.data.oldValue) }}</span>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.new_value')">
                <template #body="slotProps">
                    <span class="setting-audit-log-list__value">{{ formatAuditValue(slotProps.data.newValue) }}</span>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.effective_source')">
                <template #body="slotProps">
                    <div class="setting-audit-log-list__source">
                        <Tag :severity="slotProps.data.effectiveSource === 'env' ? 'warn' : 'success'">
                            {{ $t(`pages.admin.settings.system.audit_logs.effective_sources.${slotProps.data.effectiveSource}`) }}
                        </Tag>
                        <small v-if="slotProps.data.isOverriddenByEnv" class="setting-audit-log-list__source-note">
                            {{ $t('pages.admin.settings.system.audit_logs.overridden_by_env') }}
                        </small>
                    </div>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.operator')">
                <template #body="slotProps">
                    <div v-if="slotProps.data.operator" class="setting-audit-log-list__operator">
                        <span>{{ slotProps.data.operator.name || slotProps.data.operator.email }}</span>
                        <small>{{ slotProps.data.operator.email }}</small>
                    </div>
                    <span v-else>-</span>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.source')">
                <template #body="slotProps">
                    <span class="setting-audit-log-list__value">{{ translateAuditSource(slotProps.data.source) }}</span>
                </template>
            </Column>

            <Column :header="$t('pages.admin.settings.system.audit_logs.columns.reason')">
                <template #body="slotProps">
                    <span class="setting-audit-log-list__value">{{ translateAuditReason(slotProps.data.reason) }}</span>
                </template>
            </Column>

            <template #empty>
                <div class="setting-audit-log-list__empty">
                    {{ $t('pages.admin.settings.system.audit_logs.empty') }}
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { SettingAuditItem } from '@/types/setting'

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

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

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
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const onPage = (event: { page: number, rows: number }) => {
    page.value = event.page + 1
    limit.value = event.rows
    loadLogs()
}

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
        :deep(.p-datatable-tbody > tr > td) {
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
