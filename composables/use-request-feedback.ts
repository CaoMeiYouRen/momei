interface RequestFeedbackError {
    statusCode?: number
    statusMessage?: string
    message?: string
    data?: {
        code?: number | string
        i18nKey?: string
        message?: string
        statusMessage?: string
    }
}

interface RequestFeedbackOptions {
    fallbackKey: string
    statusKeyMap?: Partial<Record<number, string>>
    codeKeyMap?: Record<string, string>
    life?: number
}

export function useRequestFeedback() {
    const { t } = useI18n()
    const toast = useToast()

    const resolveErrorMessage = (error: unknown, options: RequestFeedbackOptions) => {
        const candidate = error as RequestFeedbackError | null | undefined

        if (candidate?.data?.i18nKey) {
            return t(candidate.data.i18nKey)
        }

        if (candidate?.data?.code !== undefined) {
            const mappedKey = options.codeKeyMap?.[String(candidate.data.code)]
            if (mappedKey) {
                return t(mappedKey)
            }
        }

        if (candidate?.statusCode !== undefined) {
            const mappedKey = options.statusKeyMap?.[candidate.statusCode]
            if (mappedKey) {
                return t(mappedKey)
            }
        }

        return t(options.fallbackKey)
    }

    const showErrorToast = (error: unknown, options: RequestFeedbackOptions) => {
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
