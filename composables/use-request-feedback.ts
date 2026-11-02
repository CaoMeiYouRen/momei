import { useToast } from 'caomei-ui'
import { resolveRequestErrorMessage, type RequestFeedbackOptions } from '@/utils/shared/request-feedback'

interface ToastFeedbackOptions extends RequestFeedbackOptions {
    life?: number
}

export function useRequestFeedback() {
    const { t } = useI18n()
    const toast = useToast()

    const resolveErrorMessage = (error: unknown, options: RequestFeedbackOptions) => resolveRequestErrorMessage(error, options, t)

    const showErrorToast = (error: unknown, options: ToastFeedbackOptions) => {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: resolveErrorMessage(error, options),
            duration: options.life || 3000,
        })
    }

    const showSuccessToast = (detailKey: string, options?: { life?: number, severity?: 'success' | 'info' | 'warn', summaryKey?: string }) => {
        const toneMap = { success: 'success', info: 'primary', warn: 'warning' } as const
        const tone = toneMap[options?.severity ?? 'success']

        toast.show({
            tone,
            title: t(options?.summaryKey || 'common.success'),
            description: t(detailKey),
            duration: options?.life || 3000,
        })
    }

    return {
        resolveErrorMessage,
        showErrorToast,
        showSuccessToast,
    }
}
