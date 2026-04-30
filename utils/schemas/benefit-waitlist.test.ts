import { describe, it, expect } from 'vitest'
import { benefitWaitlistSchema } from './benefit-waitlist'

describe('benefitWaitlistSchema', () => {
    const valid = {
        name: '张三',
        email: 'zhangsan@example.com',
    }

    it('accepts a valid entry', () => {
        expect(benefitWaitlistSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects an empty name', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    })

    it('rejects an overly long name', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
    })

    it('rejects invalid email', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
    })

    it('rejects overly long email', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, email: `${'a'.repeat(256)}@example.com` }).success).toBe(false)
    })

    it('accepts optional locale', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, locale: 'zh-CN' }).success).toBe(true)
    })

    it('accepts null locale', () => {
        expect(benefitWaitlistSchema.safeParse({ ...valid, locale: null }).success).toBe(true)
    })
})
