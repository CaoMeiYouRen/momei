import { z } from 'zod'

export const postDistributionChannelSchema = z.enum(['memos', 'wechatsync'])
export const postDistributionModeSchema = z.enum(['update-existing', 'republish-new'])
export const postDistributionOperationSchema = z.enum(['sync', 'retry', 'terminate'])

export const dispatchPostDistributionSchema = z.object({
    channel: postDistributionChannelSchema,
    mode: postDistributionModeSchema.optional(),
    operation: postDistributionOperationSchema.default('sync'),
})

export const completeWechatSyncDistributionSchema = z.object({
    attemptId: z.string().min(1).max(255),
    accounts: z.array(z.object({
        id: z.union([z.string(), z.number()]).transform((value) => String(value)),
        title: z.string().min(1).max(255),
        status: z.enum(['uploading', 'done', 'failed']),
        msg: z.string().max(1000).optional(),
        error: z.string().max(4000).optional(),
        draftLink: z.string().max(2048).optional(),
    })).min(1),
})
