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

export const externalPostImportSchema = createPostSchema.extend({
    abbrlink: optionalTrimmedString,
    permalink: optionalTrimmedString,
    sourceFile: optionalTrimmedString,
    confirmPathAliases: z.boolean().optional().default(false),
})

export const externalPostImportValidateSchema = externalPostImportSchema
