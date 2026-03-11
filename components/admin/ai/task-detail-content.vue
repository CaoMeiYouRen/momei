<template>
    <div class="task-detail-content">
        <div class="detail-info grid">
            <div class="col-12 md:col-6">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.task_detail.task_id') }}:</span>
                    <div class="task-id value">
                        <span>{{ task.id }}</span>
                        <Button
                            icon="pi pi-copy"
                            text
                            size="small"
                            :aria-label="$t('pages.admin.ai.task_detail.copy_task_id')"
                            @click="copyTaskId"
                        />
                    </div>
                </div>
                <div class="detail-item mt-2">
                    <span class="label">{{ $t('pages.admin.ai.category') }}:</span>
                    <Tag
                        v-if="task.category"
                        :value="$t(`pages.admin.ai.types.${task.category}`)"
                        severity="contrast"
                    />
                    <span v-else class="value">-</span>
                </div>
                <div class="detail-item mt-2">
                    <span class="label">{{ $t('pages.admin.ai.type') }}:</span>
                    <span class="value">{{ $t(`pages.admin.ai.types.${task.type}`) }}</span>
                </div>
                <div class="detail-item mt-2">
                    <span class="label">{{ $t('pages.admin.ai.status') }}:</span>
                    <Tag
                        :value="$t(`pages.admin.ai.statuses.${task.status}`)"
                        :severity="getStatusSeverity(task.status)"
                    />
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.provider') }}:</span>
                    <span class="value">{{ task.provider || '-' }} / {{ task.model || '-' }}</span>
                </div>
                <div class="detail-item mt-2">
                    <span class="label">{{ $t('pages.admin.ai.charge_status') }}:</span>
                    <Tag
                        v-if="task.chargeStatus"
                        :value="$t(`pages.admin.ai.charge_statuses.${task.chargeStatus}`)"
                        :severity="getChargeStatusSeverity(task.chargeStatus)"
                    />
                    <span v-else class="value">-</span>
                </div>
                <div class="detail-item mt-2">
                    <span class="label">{{ $t('common.author') }}:</span>
                    <div class="author-info value">
                        <span class="author-name">{{ task.user_name || '-' }}</span>
                        <span v-if="task.user_email" class="author-email">{{ task.user_email }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="governance-metrics grid">
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.estimated_cost') }}:</span>
                    <span class="value">{{ formatMoney(task.estimatedCost) }}</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.actual_cost') }}:</span>
                    <span class="value">{{ formatMoney(task.actualCost) }}</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.estimated_quota_units') }}:</span>
                    <span class="value">{{ formatDecimal(task.estimatedQuotaUnits) }}</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.quota_units') }}:</span>
                    <span class="value">{{ formatDecimal(task.quotaUnits) }}</span>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.failure_stage') }}:</span>
                    <span class="value">{{ task.failureStage ? $t(`pages.admin.ai.failure_stages.${task.failureStage}`) : '-' }}</span>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.duration_ms') }}:</span>
                    <span class="value">{{ formatDuration(task.durationMs) }}</span>
                </div>
            </div>
        </div>

        <div v-if="task.error" class="error-section">
            <Message
                severity="error"
                :closable="false"
                class="m-0"
            >
                <strong>{{ $t('pages.admin.ai.error') }}:</strong><br>
                <div class="mt-1 text-sm">
                    {{ task.error }}
                </div>
            </Message>
        </div>

        <div v-if="task.type === 'transcription' && task.status === 'completed'" class="grid transcription-info">
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.audio_duration') }}:</span>
                    <span class="value">{{ task.audioDuration || 0 }}s</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.audio_size') }}:</span>
                    <span class="value">{{ formatSize(task.audioSize) }}</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.text_length') }}:</span>
                    <span class="value">{{ task.textLength || 0 }}</span>
                </div>
            </div>
            <div class="col-12 md:col-3">
                <div class="detail-item">
                    <span class="label">{{ $t('pages.admin.ai.language') }}:</span>
                    <span class="value">{{ task.language || '-' }}</span>
                </div>
            </div>
        </div>

        <div
            v-if="task.type === 'image_generation' && getTaskImages(task).length > 0"
            class="image-preview-section"
        >
            <h4 class="font-bold m-0 mb-3 text-lg">
                <i class="mr-2 pi pi-images" />{{ $t('pages.admin.ai.images') }}
            </h4>
            <div class="bg-emphasis border-round flex flex-wrap gap-3 p-3">
                <Image
                    v-for="(img, idx) in getTaskImages(task)"
                    :key="idx"
                    :src="img"
                    alt="AI Generated"
                    width="240"
                    preview
                    class="border-round hover:scale-105 overflow-hidden shadow-2 transition-transform"
                />
            </div>
        </div>

        <div
            v-if="(task.type === 'tts' || task.type === 'podcast') && task.status === 'completed'"
            class="audio-preview-section"
        >
            <h4 class="font-bold m-0 mb-3 text-lg">
                <i class="mr-2 pi pi-volume-up" />{{ $t('pages.admin.ai.audio_preview') }}
            </h4>
            <div class="bg-emphasis border-round p-3">
                <audio
                    v-if="getTaskAudio(task)"
                    :src="getTaskAudio(task) || undefined"
                    controls
                    class="w-full"
                />
            </div>
        </div>

        <div class="data-section grid">
            <div class="col-12 lg:col-6">
                <h4 class="align-items-center flex font-bold m-0 mb-2">
                    <i class="mr-2 pi pi-code" />{{ $t('pages.admin.ai.prompt') }}
                </h4>
                <div class="json-container">
                    <pre>{{ formatJson(task.payload) }}</pre>
                </div>
            </div>

            <div v-if="task.result" class="col-12 lg:col-6">
                <h4 class="align-items-center flex font-bold m-0 mb-2">
                    <i class="mr-2 pi pi-database" />{{ $t('pages.admin.ai.result') }}
                </h4>
                <div class="json-container">
                    <pre>{{ formatJson(task.result) }}</pre>
                </div>
            </div>

            <div v-if="task.usageSnapshot" class="col-12 lg:col-6">
                <h4 class="align-items-center flex font-bold m-0 mb-2">
                    <i class="mr-2 pi pi-chart-bar" />{{ $t('pages.admin.ai.usage_snapshot') }}
                </h4>
                <div class="json-container">
                    <pre>{{ formatJson(task.usageSnapshot) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { parseMaybeJson } from '@/utils/shared/coerce'
import { formatDecimal } from '@/utils/shared/number'
import { formatAICost } from '@/utils/shared/ai-cost'
import { formatAIAdminJson, getAIChargeStatusSeverity, getAITaskStatusSeverity } from '@/utils/shared/ai-admin'
import type {
    AIAdminTaskDataValue,
    AIAdminTaskListItem,
    AICostDisplay,
} from '@/types/ai'

function parseTaskDataValue(value: AIAdminTaskDataValue): Record<string, unknown> | null {
    if (!value) {
        return null
    }

    if (typeof value === 'string') {
        return parseMaybeJson<Record<string, unknown> | null>(value, null)
    }

    return value
}

const props = defineProps<{
    task: AIAdminTaskListItem
    costDisplay?: AICostDisplay | null
}>()

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const formatMoney = (value: unknown) => formatAICost(value, props.costDisplay)
const getStatusSeverity = getAITaskStatusSeverity
const getChargeStatusSeverity = getAIChargeStatusSeverity
const formatJson = formatAIAdminJson

const formatSize = (bytes?: number | null) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (durationMs?: number | null) => {
    const ms = Number(durationMs || 0)
    if (!ms) return '-'
    if (ms < 1000) return `${ms} ms`
    return `${(ms / 1000).toFixed(2)} s`
}

const getTaskImages = (task: AIAdminTaskListItem | null) => {
    if (!task || task.type !== 'image_generation' || !task.result) return []

    const result = parseTaskDataValue(task.result)
    const images = result?.images

    if (!Array.isArray(images)) {
        return []
    }

    return images.flatMap((image) => {
        if (typeof image !== 'object' || image === null) {
            return []
        }

        const { url } = image as { url?: unknown }
        return typeof url === 'string' && url ? [url] : []
    })
}

const getTaskAudio = (task: AIAdminTaskListItem | null) => {
    if (!task || !task.result) return null

    const result = parseTaskDataValue(task.result)
    return typeof result?.audioUrl === 'string' && result.audioUrl ? result.audioUrl : null
}

async function copyTaskId() {
    try {
        await navigator.clipboard.writeText(props.task.id)
        showSuccessToast('pages.admin.ai.task_detail.copy_task_id_success', { life: 2000 })
    } catch (error) {
        showErrorToast(error, {
            fallbackKey: 'common.copy_failed',
            life: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.task-detail-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.detail-item {
    display: flex;
    align-items: flex-start;

    .label {
        font-weight: bold;
        margin-right: 0.75rem;
        color: var(--text-color-secondary);
        white-space: nowrap;
    }

    .value {
        flex: 1;
    }
}

.task-id {
    align-items: center;
    display: flex;
    gap: 0.25rem;
    word-break: break-all;
}

.author-info {
    display: flex;
    flex-direction: column;

    .author-name {
        font-weight: bold;
        line-height: 1.5;
    }

    .author-email {
        color: var(--text-color-secondary);
        font-size: 0.75rem;
    }
}

.json-container {
    background-color: var(--content-background);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;

    pre {
        margin: 0;
        font-family: monospace;
        font-size: 0.875rem;
        white-space: pre-wrap;
        word-break: break-all;
    }
}

.error-section {
    :deep(.p-message) {
        border-width: 0 0 0 6px;
    }
}
</style>
