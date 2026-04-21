import { parseMaybeJson } from '@/utils/shared/coerce'
import type { AIAdminTaskDataValue, AIAdminTaskType, AIChargeStatus, AITaskStatus } from '@/types/ai'

export function getAITaskTypeIcon(type: AIAdminTaskType) {
    switch (type) {
        case 'image_generation':
            return 'pi pi-image'
        case 'tts':
            return 'pi pi-volume-up'
        case 'podcast':
            return 'pi pi-microphone'
        case 'transcription':
            return 'pi pi-comment'
        default:
            return 'pi pi-align-left'
    }
}

export function getAITaskStatusSeverity(status: AITaskStatus) {
    switch (status) {
        case 'completed':
            return 'success'
        case 'processing':
            return 'info'
        case 'failed':
            return 'danger'
        default:
            return 'secondary'
    }
}

export function getAIChargeStatusSeverity(status: AIChargeStatus | null) {
    switch (status) {
        case 'actual':
            return 'success'
        case 'estimated':
            return 'warning'
        case 'waived':
            return 'secondary'
        default:
            return 'contrast'
    }
}

export function formatAIAdminJson(data: AIAdminTaskDataValue) {
    if (!data) {
        return ''
    }

    if (typeof data === 'string') {
        const parsed = parseMaybeJson<unknown>(data, data)
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
    }

    return JSON.stringify(data, null, 2)
}
