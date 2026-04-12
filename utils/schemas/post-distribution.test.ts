import { describe, it, expect } from 'vitest'
import { dispatchPostDistributionSchema, completeWechatSyncDistributionSchema } from './post-distribution'

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
})
