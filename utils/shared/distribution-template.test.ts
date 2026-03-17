import { describe, expect, it } from 'vitest'
import { buildDistributionMaterialBundle, buildWechatSyncPostFromMaterialBundle } from './distribution-template'

describe('distribution-template', () => {
    const post = {
        id: 'post-1',
        title: 'Nuxt 分发测试',
        slug: 'nuxt-distribution-test',
        content: '## Heading\n\n正文内容。',
        summary: '这是一段摘要。',
        coverImage: 'https://static.example.com/cover.png',
        language: 'zh-CN',
        copyright: 'all-rights-reserved',
        author: {
            name: 'Momei Author',
        },
        tags: [
            { id: '1', slug: 'nuxt', name: 'Nuxt', translationId: 'cluster-nuxt' },
            { id: '2', slug: 'vue', name: 'Vue', translationId: 'cluster-vue' },
        ],
    }

    it('builds layered memos content with cover, summary, tags and copyright', () => {
        const materialBundle = buildDistributionMaterialBundle(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        expect(materialBundle.canonical.url).toBe('https://momei.app/posts/nuxt-distribution-test')
        expect(materialBundle.channels.memos.content).toContain('# Nuxt 分发测试')
        expect(materialBundle.channels.memos.content).toContain('![](https://static.example.com/cover.png)')
        expect(materialBundle.channels.memos.content).toContain('这是一段摘要。')
        expect(materialBundle.channels.memos.content).toContain('[阅读全文](https://momei.app/posts/nuxt-distribution-test)')
        expect(materialBundle.channels.memos.content).toContain('#Nuxt #Vue')
        expect(materialBundle.channels.memos.content).toContain('版权声明')
    })

    it('builds wechatsync posts with channel-specific tag formatting', () => {
        const materialBundle = buildDistributionMaterialBundle(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const wrappedWechatPost = buildWechatSyncPostFromMaterialBundle(materialBundle, 'wrapped')
        const leadingWechatPost = buildWechatSyncPostFromMaterialBundle(materialBundle, 'leading')

        expect(wrappedWechatPost.markdown).toContain('## Heading')
        expect(wrappedWechatPost.markdown).toContain('#Nuxt# #Vue#')
        expect(wrappedWechatPost.content).toContain('<h2')
        expect(wrappedWechatPost.desc).toBe('这是一段摘要。')
        expect(wrappedWechatPost.thumb).toBe('https://static.example.com/cover.png')

        expect(leadingWechatPost.markdown).toContain('#Nuxt #Vue')
    })
})
