import { z } from 'zod'
import { createPostSchema } from './post'

const optionalTrimmedString = z.preprocess((value) => {
    if (value === null || value === undefined) {
        return undefined
    }

    if (typeof value !== 'string') {
        return value
    }

    const trimmed = value.trim()
    return trimmed || undefined
}, z.string().optional())

const externalPostImportRawSchema = createPostSchema.extend({
    abbrlink: optionalTrimmedString,
    permalink: optionalTrimmedString,
    sourceFile: optionalTrimmedString,
    confirmPathAliases: z.boolean().optional().default(false),
})

function normalizeExternalPostImportPayload(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value
    }

    const payload = value as Record<string, unknown>
    const normalizedPayload: Record<string, unknown> = { ...payload }

    if (normalizedPayload.updatedAt === undefined && payload.updated !== undefined) {
        normalizedPayload.updatedAt = payload.updated
    }

    if (normalizedPayload.views === undefined && payload.view !== undefined) {
        normalizedPayload.views = payload.view
    }

    return normalizedPayload
}

export const externalPostImportSchema = z.preprocess(normalizeExternalPostImportPayload, externalPostImportRawSchema)

export const externalPostImportValidateSchema = externalPostImportSchema
