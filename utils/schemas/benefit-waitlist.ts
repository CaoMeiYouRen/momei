import { z } from 'zod'

export const benefitWaitlistSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.email('Invalid email address').max(255, 'Email is too long'),
    purpose: z.string().max(100).optional().default('benefit'),
    locale: z.string().max(10).optional().nullable(),
})

export const waitlistListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().max(255).optional(),
    ),
    purpose: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().max(100).optional(),
    ),
})
