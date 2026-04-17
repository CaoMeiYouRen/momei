import { z } from 'zod'
import {
    MAX_WECHATSYNC_OBSERVATION_ACCOUNT_KEYS,
    MAX_WECHATSYNC_OBSERVATION_ACCOUNTS,
    MAX_WECHATSYNC_OBSERVATION_EVENTS,
    MAX_WECHATSYNC_OBSERVATION_RAW_STATUS_KEYS,
} from '@/utils/shared/wechatsync'

export const postDistributionChannelSchema = z.enum(['memos', 'wechatsync'])
export const postDistributionModeSchema = z.enum(['update-existing', 'republish-new'])
export const postDistributionOperationSchema = z.enum(['sync', 'retry', 'terminate'])

export const dispatchPostDistributionSchema = z.object({
    channel: postDistributionChannelSchema,
    mode: postDistributionModeSchema.optional(),
    operation: postDistributionOperationSchema.default('sync'),
})

const wechatSyncDispatchObservationAccountSchema = z.object({
    id: z.string().min(1).max(255),
    title: z.string().min(1).max(255),
    status: z.enum(['pending', 'uploading', 'done', 'failed']),
    msg: z.string().max(1000).optional(),
    error: z.string().max(4000).optional(),
    draftLink: z.string().max(2048).optional(),
})

const wechatSyncDispatchObservationEventSchema = z.object({
    phase: z.enum(['dispatch_started', 'ready', 'status_received', 'resolved', 'start_failed', 'timeout_resolved']),
    at: z.string().min(1).max(255),
    accountCount: z.number().int().min(0).optional(),
    syncId: z.string().max(255).nullable().optional(),
    rawStatusKeys: z.array(z.string().min(1).max(128)).max(MAX_WECHATSYNC_OBSERVATION_RAW_STATUS_KEYS).optional(),
    accounts: z.array(wechatSyncDispatchObservationAccountSchema).max(MAX_WECHATSYNC_OBSERVATION_ACCOUNTS).optional(),
})

const wechatSyncDispatchObservationSchema = z.object({
    strategy: z.enum(['single_add_task_default_raw', 'single_add_task_group_profile']),
    resolution: z.enum(['terminal_status', 'start_error', 'timeout_incomplete_status']).nullable().optional(),
    payload: z.object({
        renderMode: z.enum(['leading', 'wrapped', 'none']),
        contentProfile: z.enum(['default', 'weibo', 'xiaohongshu']),
        usesRawPost: z.boolean(),
        markdownLength: z.number().int().min(0).max(5_000_000),
        contentLength: z.number().int().min(0).max(5_000_000),
        descLength: z.number().int().min(0).max(100_000),
        accountKeys: z.array(z.string().min(1).max(255)).max(MAX_WECHATSYNC_OBSERVATION_ACCOUNT_KEYS),
    }),
    readyEventCount: z.number().int().min(0),
    statusEventCount: z.number().int().min(0),
    events: z.array(wechatSyncDispatchObservationEventSchema).max(MAX_WECHATSYNC_OBSERVATION_EVENTS),
})

export const completeWechatSyncDistributionSchema = z.object({
    attemptId: z.string().min(1).max(255),
    accounts: z.array(z.object({
        id: z.union([z.string(), z.number()]).transform((value) => String(value)),
        title: z.string().min(1).max(255),
        status: z.enum(['done', 'failed']),
        msg: z.string().max(1000).optional(),
        error: z.string().max(4000).optional(),
        draftLink: z.string().max(2048).optional(),
    })).min(1),
    observation: wechatSyncDispatchObservationSchema.optional(),
})
