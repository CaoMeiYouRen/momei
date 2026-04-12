import { describe, it, expect } from 'vitest'
import {
    SocialLinkSchema,
    DonationLinkSchema,
    CommercialConfigSchema,
    UserCommercialConfigSchema,
} from './commercial-schema'

describe('SocialLinkSchema', () => {
    it('parses valid minimal entry', () => {
        const result = SocialLinkSchema.safeParse({ platform: 'github' })
        expect(result.success).toBe(true)
    })

    it('fails when platform is empty', () => {
        const result = SocialLinkSchema.safeParse({ platform: '' })
        expect(result.success).toBe(false)
    })

    it('accepts valid https url', () => {
        const result = SocialLinkSchema.safeParse({ platform: 'github', url: 'https://github.com/user' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid url', () => {
        const result = SocialLinkSchema.safeParse({ platform: 'twitter', url: 'ftp://bad.example.com' })
        expect(result.success).toBe(false)
    })

    it('accepts empty string url', () => {
        const result = SocialLinkSchema.safeParse({ platform: 'twitter', url: '' })
        expect(result.success).toBe(true)
    })

    it('accepts optional label and locales', () => {
        const result = SocialLinkSchema.safeParse({
            platform: 'github',
            label: 'My GitHub',
            locales: ['zh-CN', 'en-US'],
        })
        expect(result.success).toBe(true)
    })
})

describe('DonationLinkSchema', () => {
    it('parses minimal data', () => {
        const result = DonationLinkSchema.safeParse({ platform: 'alipay' })
        expect(result.success).toBe(true)
    })

    it('fails with empty platform', () => {
        const result = DonationLinkSchema.safeParse({ platform: '' })
        expect(result.success).toBe(false)
    })

    it('accepts valid url', () => {
        const result = DonationLinkSchema.safeParse({ platform: 'wechat', url: 'https://pay.wechat.com/xxx' })
        expect(result.success).toBe(true)
    })
})

describe('CommercialConfigSchema', () => {
    it('parses empty with defaults', () => {
        const result = CommercialConfigSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.enabled).toBe(true)
            expect(result.data.socialLinks).toEqual([])
            expect(result.data.donationLinks).toEqual([])
        }
    })

    it('parses fully populated config', () => {
        const result = CommercialConfigSchema.safeParse({
            enabled: false,
            socialLinks: [{ platform: 'github' }],
            donationLinks: [{ platform: 'alipay' }],
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.enabled).toBe(false)
            expect(result.data.socialLinks).toHaveLength(1)
        }
    })
})

describe('UserCommercialConfigSchema', () => {
    it('parses empty with empty arrays', () => {
        const result = UserCommercialConfigSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.socialLinks).toEqual([])
            expect(result.data.donationLinks).toEqual([])
        }
    })

    it('parses with both links', () => {
        const result = UserCommercialConfigSchema.safeParse({
            socialLinks: [{ platform: 'twitter' }],
            donationLinks: [{ platform: 'paypal', url: 'https://paypal.me/user' }],
        })
        expect(result.success).toBe(true)
    })
})
