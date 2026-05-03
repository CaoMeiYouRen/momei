import { getActiveAgreementContent } from '@/server/services/agreement'
import { success } from '@/server/utils/response'
import type { AgreementPublicPayload, AgreementType } from '@/types/agreement'

interface AgreementPublicHandlerOptions {
    defaultContent: () => string
    fetchErrorMessage: string
    type: AgreementType
}

function createDefaultAgreementPayload(
    type: AgreementType,
    language: string,
    content: string,
): AgreementPublicPayload {
    return {
        id: 'default',
        type,
        language,
        content,
        version: null,
        versionDescription: null,
        effectiveAt: null,
        updatedAt: null,
        authoritativeLanguage: 'zh-CN',
        authoritativeVersion: null,
        isDefault: true,
        isReferenceTranslation: false,
        fallbackToAuthoritative: false,
        sourceAgreementId: null,
        sourceAgreementVersion: null,
        history: [],
    }
}

export function createAgreementPublicHandler(options: AgreementPublicHandlerOptions) {
    return defineEventHandler(async (event) => {
        try {
            const query = getQuery(event)
            const language = typeof query.language === 'string' ? query.language : undefined
            const agreement = await getActiveAgreementContent(options.type, language)

            if (!agreement) {
                return success(createDefaultAgreementPayload(
                    options.type,
                    language || 'zh-CN',
                    options.defaultContent(),
                ))
            }

            return success(agreement)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : options.fetchErrorMessage
            throw createError({
                statusCode: 500,
                statusMessage: message,
            })
        }
    })
}
