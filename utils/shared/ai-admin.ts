import type { Component } from 'vue'
import { AlignLeft, Image as ImageIcon, MessageSquare, Mic, Volume2 } from '@lucide/vue'
import { parseMaybeJson } from '@/utils/shared/coerce'
import { rawIcon } from '@/utils/shared/brand-icons'
import type { AIAdminTaskDataValue, AIAdminTaskType, AIChargeStatus, AITaskStatus } from '@/types/ai'

const DEFAULT_AI_TASK_ICON = rawIcon(AlignLeft)

const AI_TASK_TYPE_ICONS: Record<string, Component> = {
    image_generation: rawIcon(ImageIcon),
    tts: rawIcon(Volume2),
    podcast: rawIcon(Mic),
    transcription: rawIcon(MessageSquare),
    text_generation: DEFAULT_AI_TASK_ICON,
}

export function getAITaskTypeIcon(type: AIAdminTaskType): Component {
    return AI_TASK_TYPE_ICONS[type] ?? DEFAULT_AI_TASK_ICON
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
