import { describe, expect, it } from 'vitest'
import {
    buildDirectShareUrl,
    buildShareCanonicalUrl,
    buildShareCopyText,
    COPY_SHARE_PLATFORMS,
    DIRECT_SHARE_PLATFORMS,
    type SharePayload,
} from './share'

const payload: SharePayload = {
    pageKind: 'post',
    title: 'Test Post',
    text: 'Test summary',
    url: 'https://momei.app/posts/test-post',
    locale: 'zh-CN',
}

describe('share helpers', () => {
    it('builds canonical post urls from locale paths and strips hash/query by default', () => {
        const url = buildShareCanonicalUrl({
            siteUrl: 'https://momei.app',
            localePath: (path) => `/en-US${path}`,
            pageKind: 'post',
            slug: 'test-post?preview=true#section',
        })

        expect(url).toBe('https://momei.app/en-US/posts/test-post')
    })

    it('preserves explicitly allowed query parameters', () => {
        const url = buildShareCanonicalUrl({
            siteUrl: 'https://momei.app',
            localePath: (path) => path,
            pageKind: 'page',
            path: '/posts?page=2&preview=true',
            allowedQueryKeys: ['page'],
        })

        expect(url).toBe('https://momei.app/posts?page=2')
    })

    it('builds direct share urls for supported platforms', () => {
        expect(buildDirectShareUrl('x', payload)).toContain('twitter.com/intent/tweet')
        expect(buildDirectShareUrl('facebook', payload)).toContain('facebook.com/sharer/sharer.php')
        expect(buildDirectShareUrl('email', payload)).toContain('mailto:')
    })

    it('builds copy payloads for both link and rich modes', () => {
        expect(buildShareCopyText(payload, 'link')).toBe('https://momei.app/posts/test-post')
        expect(buildShareCopyText(payload, 'rich')).toBe('Test Post\n\nTest summary\n\nhttps://momei.app/posts/test-post')
    })

    it('keeps the expected direct and copy platform groups', () => {
        expect(DIRECT_SHARE_PLATFORMS.map((platform) => platform.key)).toEqual(['x', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'email'])
        expect(COPY_SHARE_PLATFORMS.map((platform) => platform.key)).toEqual(['wechat_mp', 'weibo', 'xiaohongshu', 'juejin', 'bilibili', 'zhihu'])
    })
})
