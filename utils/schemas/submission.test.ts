import { describe, it, expect } from 'vitest'
import { submissionSchema, submissionReviewSchema } from './submission'

describe('submissionSchema', () => {
    const valid = {
        title: 'Test Title',
        content: 'This is a test submission with enough content.',
        contributorName: 'Alice',
        contributorEmail: 'alice@example.com',
    }

    it('accepts a valid submission', () => {
        expect(submissionSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects an empty title', () => {
        expect(submissionSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
    })

    it('rejects content shorter than 10 chars', () => {
        expect(submissionSchema.safeParse({ ...valid, content: 'Short' }).success).toBe(false)
    })

    it('rejects invalid email', () => {
        expect(submissionSchema.safeParse({ ...valid, contributorEmail: 'not-an-email' }).success).toBe(false)
    })

    it('rejects invalid contributorUrl', () => {
        expect(submissionSchema.safeParse({ ...valid, contributorUrl: 'not-a-url' }).success).toBe(false)
    })

    it('accepts empty contributorUrl', () => {
        expect(submissionSchema.safeParse({ ...valid, contributorUrl: '' }).success).toBe(true)
    })

    it('accepts valid contributorUrl', () => {
        expect(submissionSchema.safeParse({ ...valid, contributorUrl: 'https://example.com' }).success).toBe(true)
    })

    it('accepts optional captchaToken', () => {
        expect(submissionSchema.safeParse({ ...valid, captchaToken: 'token123' }).success).toBe(true)
    })
})

describe('submissionReviewSchema', () => {
    it('accepts a valid review with approved status', () => {
        const result = submissionReviewSchema.safeParse({ status: 'accepted' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
        expect(submissionReviewSchema.safeParse({ status: 'invalid_status' }).success).toBe(false)
    })

    it('accepts adminNote', () => {
        const result = submissionReviewSchema.safeParse({ status: 'rejected', adminNote: 'Reason' })
        expect(result.success).toBe(true)
    })
})
