import { describe, expect, it } from 'vitest'
import {
    DONATION_PLATFORMS,
    SOCIAL_PLATFORMS,
    filterCommercialLinksByLocale,
    getCommercialPlatformColor,
    getCommercialPlatformIcon,
    getDonationPlatformType,
    getSocialPlatformType,
} from './commercial'

describe('commercial platform registry', () => {
    it('includes expanded high-frequency social platforms', () => {
        const platformKeys = SOCIAL_PLATFORMS.map((platform) => platform.key)

        expect(platformKeys).toEqual(expect.arrayContaining([
            'juejin',
            'xiaohongshu',
            'douyin',
            'stack_overflow',
            'instagram',
            'linkedin',
            'twitch',
        ]))
    })

    it('includes expanded sponsorship platforms', () => {
        const platformKeys = DONATION_PLATFORMS.map((platform) => platform.key)

        expect(platformKeys).toEqual(expect.arrayContaining([
            'ko_fi',
            'liberapay',
            'github_sponsors',
        ]))
    })

    it('resolves icon, color and mode from the shared registry', () => {
        expect(getCommercialPlatformIcon('stack_overflow', 'social')).toBe('mdi mdi-stack-overflow')
        expect(getCommercialPlatformColor('github_sponsors', 'donation')).toBe('#ea4aaa')
        expect(getCommercialPlatformIcon('patreon', 'donation')).toBe('mdi mdi-patreon')
        expect(getSocialPlatformType('wechat_mp')).toBe('both')
        expect(getSocialPlatformType('github')).toBe('url')
        expect(getDonationPlatformType('custom')).toBe('both')
    })

    it('keeps locale filtering exact while preserving global entries', () => {
        const links = [
            { platform: 'github', url: 'https://github.com/example' },
            { platform: 'wechat_mp', image: '/wechat.png', locales: [] },
            { platform: 'x', url: 'https://x.com/example', locales: ['en-US'] },
            { platform: 'juejin', url: 'https://juejin.cn/user/example', locales: ['zh-CN'] },
        ]

        expect(filterCommercialLinksByLocale(links, 'zh-CN')).toEqual([
            links[0],
            links[1],
            links[3],
        ])
        expect(filterCommercialLinksByLocale(links, 'en-US')).toEqual([
            links[0],
            links[1],
            links[2],
        ])
        expect(filterCommercialLinksByLocale(undefined, 'zh-CN')).toEqual([])
    })
})
