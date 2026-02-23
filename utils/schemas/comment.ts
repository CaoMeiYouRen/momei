import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'
import { paginationSchema } from './pagination'
import { CommentStatus } from '@/types/comment'

const commentStatusEnum = z.enum([
    CommentStatus.PENDING,
    CommentStatus.PUBLISHED,
    CommentStatus.SPAM,
] as [CommentStatus, ...CommentStatus[]])

const optionalTrimmedString = (maxLength: number) => z.preprocess(
    (value) => {
        if (typeof value !== 'string') {
            return value
        }

        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(maxLength).optional(),
)

export const commentListQuerySchema = paginationSchema.extend({
    status: z.preprocess((value) => {
        if (typeof value !== 'string') {
            return value
        }

        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
    }, commentStatusEnum.optional()),
    keyword: optionalTrimmedString(100),
    postId: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().refine((value) => isSnowflakeId(value), {
            message: 'Invalid postId',
        }).optional(),
    ),
})

export const commentBodySchema = z.object({
    parentId: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().refine((value) => isSnowflakeId(value), {
            message: 'Invalid parentId',
        }).optional(),
    ),
    content: z.string().trim().min(1).max(5000),
    authorName: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().min(1).max(100).optional(),
    ),
    authorEmail: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.email().max(255).optional(),
    ),
    authorUrl: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.url().max(255).optional(),
    ),
})

export type CommentListQuery = z.infer<typeof commentListQuerySchema>
export type CommentBodyInput = z.infer<typeof commentBodySchema>
