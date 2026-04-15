import { describe, expect, it } from 'vitest'
import { buildDistributionMaterialBundle } from './distribution-template'
import {
    buildMemosDistributionPreview,
    buildWechatSyncDistributionPreviewGroups,
} from './post-distribution-preview'
import { normalizeWechatSyncAccounts } from './wechatsync'

describe('post-distribution-preview', () => {
    const post = {
        id: 'post-1',
        title: 'Nuxt 分发预览测试',
        slug: 'nuxt-distribution-preview-test',
        content: '## Heading\n\n> 引用内容\n\n正文内容。\n\n<figure class="image"><img src="https://static.example.com/figure.png" /></figure>',
        summary: '这是一段用于同步前检查的摘要。',
        coverImage: 'https://static.example.com/cover.png',
        language: 'zh-CN',
        copyright: 'all-rights-reserved',
        author: {
            id: 'author-1',
            name: 'Momei Author',
        },
        tags: [
            { id: '1', slug: 'nuxt', name: 'Nuxt', translationId: 'cluster-nuxt' },
            { id: '2', slug: 'vue', name: 'Vue', translationId: 'cluster-vue' },
        ],
    }

    it('builds a structured memos preview from the material bundle', () => {
        const materialBundle = buildDistributionMaterialBundle(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const preview = buildMemosDistributionPreview(materialBundle)

        expect(preview.title).toBe('Nuxt 分发预览测试')
        expect(preview.summary).toBe('这是一段用于同步前检查的摘要。')
        expect(preview.coverUrl).toBe('https://static.example.com/cover.png')
        expect(preview.tagLine).toBe('#Nuxt #Vue')
        expect(preview.content).toContain('[阅读全文](https://momei.app/posts/nuxt-distribution-preview-test)')
    })

    it('builds grouped wechatsync risk-analysis previews around the shared raw payload', () => {
        const materialBundle = buildDistributionMaterialBundle(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })
        const accounts = normalizeWechatSyncAccounts([
            { type: 'bilibili', title: 'B 站专栏' },
            { type: 'weibo', title: '微博专栏' },
            { type: 'xiaohongshu', title: '小红书专栏' },
        ])

        const groups = buildWechatSyncDistributionPreviewGroups(materialBundle, accounts)
        const bilibiliPreview = groups.find((group) => group.contentProfile === 'default')
        const weiboPreview = groups.find((group) => group.contentProfile === 'weibo')
        const xiaohongshuPreview = groups.find((group) => group.contentProfile === 'xiaohongshu')

        expect(groups).toHaveLength(3)
        expect(bilibiliPreview).toBeTruthy()
        expect(bilibiliPreview?.accountsLabel).toBe('B 站专栏')
        expect(bilibiliPreview?.tagLine).toBe('')
        expect(bilibiliPreview?.copyrightMarkdown).toBe('')
        expect(bilibiliPreview?.finalMarkdown).toBe(post.content)

        expect(weiboPreview).toBeTruthy()
        expect(weiboPreview?.accountsLabel).toBe('微博专栏')
        expect(weiboPreview?.tagLine).toBe('')
        expect(weiboPreview?.finalMarkdown).toBe(post.content)
        expect(weiboPreview?.compatibility.adjustments).toEqual(
            expect.arrayContaining(['blockquote', 'figure', 'heading-anchor', 'divider']),
        )

        expect(xiaohongshuPreview).toBeTruthy()
        expect(xiaohongshuPreview?.accountsLabel).toBe('小红书专栏')
        expect(xiaohongshuPreview?.tagLine).toBe('')
        expect(xiaohongshuPreview?.finalMarkdown).toBe(post.content)
        expect(xiaohongshuPreview?.compatibility.adjustments).toEqual(
            expect.arrayContaining(['heading-anchor']),
        )
    })
})
