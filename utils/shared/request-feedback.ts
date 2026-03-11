export interface RequestFeedbackError {
    statusCode?: number
    statusMessage?: string
    message?: string
    data?: unknown
}

export interface RequestFeedbackOptions {
    fallbackKey: string
    statusKeyMap?: Partial<Record<number, string>>
    codeKeyMap?: Record<string, string>
}

export interface ValidationIssue {
    path: (string | number)[]
    message: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isValidationIssue = (value: unknown): value is ValidationIssue => {
    if (!isRecord(value)) {
        return false
    }

    return Array.isArray(value.path) && typeof value.message === 'string'
}

export function extractValidationIssues(error: unknown): ValidationIssue[] {
    const candidate = error as RequestFeedbackError | null | undefined
    const data = candidate?.data

    if (Array.isArray(data)) {
        return data.filter(isValidationIssue)
    }

    if (isRecord(data) && Array.isArray(data.data)) {
        return data.data.filter(isValidationIssue)
    }

    return []
}

export function mapValidationIssues<Field extends string>(issues: ValidationIssue[]): Partial<Record<Field, string>> {
    const errors: Partial<Record<Field, string>> = {}

    issues.forEach((issue) => {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field as Field]) {
            errors[field as Field] = issue.message
        }
    })

    return errors
}

export function resolveRequestErrorMessage(
    error: unknown,
    options: RequestFeedbackOptions,
    translate: (key: string) => string,
) {
    const candidate = error as RequestFeedbackError | null | undefined

    if (isRecord(candidate?.data) && typeof candidate.data.i18nKey === 'string') {
        return translate(candidate.data.i18nKey)
    }

    if (isRecord(candidate?.data)) {
        const code = candidate.data.code
        const normalizedCode = typeof code === 'string' || typeof code === 'number'
            ? String(code)
            : null
        const mappedKey = normalizedCode ? options.codeKeyMap?.[normalizedCode] : undefined
        if (mappedKey) {
            return translate(mappedKey)
        }
    }

    if (candidate?.statusCode !== undefined) {
        const mappedKey = options.statusKeyMap?.[candidate.statusCode]
        if (mappedKey) {
            return translate(mappedKey)
        }
    }

    return translate(options.fallbackKey)
}
