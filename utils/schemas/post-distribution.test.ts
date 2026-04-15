import { describe, it, expect } from 'vitest'
import { dispatchPostDistributionSchema, completeWechatSyncDistributionSchema } from './post-distribution'
import { MAX_WECHATSYNC_OBSERVATION_EVENTS } from '@/utils/shared/wechatsync'

describe('dispatchPostDistributionSchema', () => {
    it('accepts valid minimal input with memos channel', () => {
        const result = dispatchPostDistributionSchema.safeParse({ channel: 'memos' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.operation).toBe('sync')
        }
    })

    it('accepts wechatsync channel', () => {
        expect(dispatchPostDistributionSchema.safeParse({ channel: 'wechatsync' }).success).toBe(true)
    })

    it('rejects invalid channel', () => {
        expect(dispatchPostDistributionSchema.safeParse({ channel: 'twitter' }).success).toBe(false)
    })

    it('defaults operation to sync', () => {
        const result = dispatchPostDistributionSchema.safeParse({ channel: 'memos' })
        if (result.success) {
            expect(result.data.operation).toBe('sync')
        }
    })

    it('accepts retry operation', () => {
        expect(dispatchPostDistributionSchema.safeParse({ channel: 'memos', operation: 'retry' }).success).toBe(true)
    })
})

describe('completeWechatSyncDistributionSchema', () => {
    const valid = {
        attemptId: 'attempt-123',
        accounts: [
            { id: 'acc1', title: 'Account 1', status: 'done' },
        ],
    }

    it('accepts valid input', () => {
        expect(completeWechatSyncDistributionSchema.safeParse(valid).success).toBe(true)
    })

    it('accepts structured observation payload for wechatsync debugging', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            observation: {
                strategy: 'single_add_task_default_raw',
                resolution: 'terminal_status',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 120,
                    contentLength: 240,
                    descLength: 32,
                    accountKeys: ['weibo'],
                },
                readyEventCount: 1,
                statusEventCount: 1,
                events: [
                    {
                        phase: 'dispatch_started',
                        at: '2026-04-16T10:00:00.000Z',
                        accountCount: 1,
                        accounts: [
                            {
                                id: 'weibo',
                                title: '微博 B',
                                status: 'pending',
                            },
                        ],
                    },
                ],
            },
        }).success).toBe(true)
    })

    it('accepts timeout observation payload for incomplete plugin status', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            observation: {
                strategy: 'single_add_task_default_raw',
                resolution: 'timeout_incomplete_status',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 120,
                    contentLength: 240,
                    descLength: 32,
                    accountKeys: ['wechat', 'weibo'],
                },
                readyEventCount: 0,
                statusEventCount: 1,
                events: [
                    {
                        phase: 'timeout_resolved',
                        at: '2026-04-16T10:01:00.000Z',
                        accountCount: 2,
                        accounts: [
                            {
                                id: 'weibo',
                                title: '微博 B',
                                status: 'failed',
                                error: 'status timeout',
                            },
                        ],
                    },
                ],
            },
        }).success).toBe(true)
    })

    it('accepts large observation counters when the persisted event payload stays bounded', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            observation: {
                strategy: 'single_add_task_default_raw',
                resolution: 'terminal_status',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 120,
                    contentLength: 240,
                    descLength: 32,
                    accountKeys: ['weibo'],
                },
                readyEventCount: 101,
                statusEventCount: 350,
                events: [
                    {
                        phase: 'status_received',
                        at: '2026-04-16T10:01:00.000Z',
                        accountCount: 350,
                    },
                ],
            },
        }).success).toBe(true)
    })

    it('rejects empty accounts array', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({ ...valid, accounts: [] }).success).toBe(false)
    })

    it('transforms numeric id to string', () => {
        const result = completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            accounts: [{ id: 123, title: 'Account', status: 'done' }],
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.accounts[0]!.id).toBe('123')
        }
    })

    it('rejects invalid account status', () => {
        const withBadStatus = {
            ...valid,
            accounts: [{ id: 'acc1', title: 'Account 1', status: 'invalid' }],
        }
        expect(completeWechatSyncDistributionSchema.safeParse(withBadStatus).success).toBe(false)
    })

    it('rejects non-terminal completion status', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            accounts: [{ id: 'acc1', title: 'Account 1', status: 'uploading' }],
        }).success).toBe(false)
    })

    it('rejects invalid observation phase', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            observation: {
                strategy: 'single_add_task_default_raw',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 1,
                    contentLength: 1,
                    descLength: 1,
                    accountKeys: ['weibo'],
                },
                readyEventCount: 0,
                statusEventCount: 0,
                events: [
                    {
                        phase: 'unknown',
                        at: '2026-04-16T10:00:00.000Z',
                    },
                ],
            },
        }).success).toBe(false)
    })

    it('rejects observation payloads that exceed the persisted event cap', () => {
        expect(completeWechatSyncDistributionSchema.safeParse({
            ...valid,
            observation: {
                strategy: 'single_add_task_default_raw',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 1,
                    contentLength: 1,
                    descLength: 1,
                    accountKeys: ['weibo'],
                },
                readyEventCount: 0,
                statusEventCount: MAX_WECHATSYNC_OBSERVATION_EVENTS + 1,
                events: Array.from({ length: MAX_WECHATSYNC_OBSERVATION_EVENTS + 1 }, (_, index) => ({
                    phase: 'status_received',
                    at: `2026-04-16T10:00:${String(index).padStart(2, '0')}.000Z`,
                })),
            },
        }).success).toBe(false)
    })
})
