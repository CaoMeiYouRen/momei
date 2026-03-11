import { resolveRequestErrorMessage, type RequestFeedbackOptions } from '@/utils/shared/request-feedback'

interface ToastFeedbackOptions extends RequestFeedbackOptions {
    life?: number
}

export function useRequestFeedback() {
    const { t } = useI18n()
    const toast = useToast()

    const resolveErrorMessage = (error: unknown, options: RequestFeedbackOptions) => resolveRequestErrorMessage(error, options, t)

    const showErrorToast = (error: unknown, options: ToastFeedbackOptions) => {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: resolveErrorMessage(error, options),
            life: options.life || 3000,
        })
    }

    const showSuccessToast = (detailKey: string, options?: { life?: number, severity?: 'success' | 'info' | 'warn', summaryKey?: string }) => {
        toast.add({
            severity: options?.severity || 'success',
            summary: t(options?.summaryKey || 'common.success'),
            detail: t(detailKey),
            life: options?.life || 3000,
        })
    }

    return {
        resolveErrorMessage,
        showErrorToast,
        showSuccessToast,
    }
}
