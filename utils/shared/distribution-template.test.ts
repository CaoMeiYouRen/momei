import { describe, expect, it } from 'vitest'
import {
    buildDistributionMaterialBundle,
    buildWechatSyncDispatchPostFromMaterialBundle,
    buildWechatSyncPostFromMaterialBundle,
    inspectWechatSyncMaterialCompatibility,
} from './distribution-template'

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
            id: 'author-1',
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

        const wrappedWechatPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'wrapped',
        })
        const leadingWechatPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'leading',
        })

        expect(wrappedWechatPost.markdown).toContain('## Heading')
        expect(wrappedWechatPost.markdown).toContain('#Nuxt# #Vue#')
        expect(wrappedWechatPost.content).toContain('<h2')
        expect(wrappedWechatPost.desc).toBe('这是一段摘要。')
        expect(wrappedWechatPost.thumb).toBe('https://static.example.com/cover.png')

        expect(leadingWechatPost.markdown).toContain('#Nuxt #Vue')
    })

    it('builds the shared raw/default wechatsync payload with copyright but without tag tailing', () => {
        const materialBundle = buildDistributionMaterialBundle(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const rawWechatPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'default',
        })

        expect(rawWechatPost.markdown).toContain('## Heading')
        expect(rawWechatPost.markdown).toContain('版权声明')
        expect(rawWechatPost.markdown).not.toContain('#Nuxt #Vue')
        expect(rawWechatPost.content).toContain('版权声明')
    })

    it('removes spaces from rendered tag tailnotes for memos and bilibili-compatible payloads', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            tags: [
                { id: '1', slug: 'nuxt-3', name: 'Nuxt 3', translationId: 'cluster-nuxt-3' },
                { id: '2', slug: 'vue', name: 'Vue', translationId: 'cluster-vue' },
            ],
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const bilibiliPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'leading',
            contentProfile: 'default',
        })

        expect(materialBundle.channels.memos.content).toContain('#Nuxt3 #Vue')
        expect(materialBundle.channels.memos.content).not.toContain('#Nuxt 3')
        expect(bilibiliPost.markdown).toContain('#Nuxt3 #Vue')
        expect(bilibiliPost.markdown).not.toContain('#Nuxt 3')
    })

    it('downgrades weibo content into a compatible payload', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '## 标题\n\n> 引用内容\n\n这里有 `inline-code`。\n\n<figure class="image"><img src="https://static.example.com/figure.png" /></figure>',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const compatibility = inspectWechatSyncMaterialCompatibility(materialBundle, 'weibo')
        const weiboPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'weibo',
        })

        expect(compatibility.adjustments).toEqual(expect.arrayContaining(['heading', 'blockquote', 'code', 'figure', 'heading-anchor', 'divider']))
        expect(compatibility.blockers).toEqual([])
        expect(weiboPost.markdown).not.toContain('<figure')
        expect(weiboPost.markdown).toContain('**标题**')
        expect(weiboPost.markdown).not.toContain('## 标题')
        expect(weiboPost.markdown).not.toContain('`inline-code`')
        expect(weiboPost.markdown).not.toContain('----------')
        expect(weiboPost.content).not.toContain('<blockquote')
        expect(weiboPost.content).not.toContain('<h2')
        expect(weiboPost.content).not.toContain('header-anchor')
        expect(weiboPost.content).toContain('<img')
        expect(weiboPost.content).toContain('<strong>标题</strong>')
    })

    it('omits explicit markdown when dispatching weibo-compatible payloads', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '## 标题\n\n> 引用内容\n\n![cover](https://static.example.com/cover.png)',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const weiboDispatchPost = buildWechatSyncDispatchPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'weibo',
        })
        const defaultDispatchPost = buildWechatSyncDispatchPostFromMaterialBundle(materialBundle, {
            renderMode: 'wrapped',
            contentProfile: 'default',
        })

        expect(weiboDispatchPost.markdown).toBeUndefined()
        expect(weiboDispatchPost.content).not.toContain('----------')
        expect(weiboDispatchPost.content).not.toContain('<h2')
        expect(weiboDispatchPost.content).toContain('<strong>标题</strong>')
        expect(defaultDispatchPost.markdown).toContain('#')
    })

    it('builds xiaohongshu-compatible payloads without editor chrome', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '## 标题\n\n::: tip 提示\n这里是提示内容\n:::\n\n> [!NOTE]\n> 请先检查正文。\n\n```js [index.js]\nconsole.log(1)\n```',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const compatibility = inspectWechatSyncMaterialCompatibility(materialBundle, 'xiaohongshu')
        const xiaohongshuPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'leading',
            contentProfile: 'xiaohongshu',
        })
        const xiaohongshuDispatchPost = buildWechatSyncDispatchPostFromMaterialBundle(materialBundle, {
            renderMode: 'leading',
            contentProfile: 'xiaohongshu',
        })

        expect(compatibility.adjustments).toEqual(expect.arrayContaining(['heading-anchor', 'custom-block', 'github-alert', 'copy-code-button']))
        expect(xiaohongshuPost.markdown).not.toContain('::: tip')
        expect(xiaohongshuPost.markdown).not.toContain('> [!NOTE]')
        expect(xiaohongshuPost.content).not.toContain('header-anchor')
        expect(xiaohongshuPost.content).not.toContain('copy-code-button')
        expect(xiaohongshuPost.content).not.toContain('custom-block')
        expect(xiaohongshuPost.content).not.toContain('markdown-alert')
        expect(xiaohongshuDispatchPost.markdown).toContain('#Nuxt #Vue')
    })

    it('strips copyright separator and converts markdown soft breaks to paragraphs for xiaohongshu payloads', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '## 标题\n\n正文内容。',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const xiaohongshuPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'leading',
            contentProfile: 'xiaohongshu',
        })

        // 版权声明分隔线应被移除
        expect(xiaohongshuPost.markdown).not.toContain('----------')
        // Markdown 双空格软换行应被替换为段落换行
        expect(xiaohongshuPost.markdown).not.toMatch(/ {2}\n/)
        // 每个版权字段应包含独立段落（由 \n\n 分隔）
        expect(xiaohongshuPost.markdown).toMatch(/本文作者:.*\n\n本文链接:/)
        expect(xiaohongshuPost.markdown).toMatch(/本文链接:.*\n\n版权声明:/)
        // 版权声明中的链接应保留
        expect(xiaohongshuPost.markdown).toContain('[https://momei.app/posts/nuxt-distribution-test](https://momei.app/posts/nuxt-distribution-test)')
        // 正文内容应正常保留
        expect(xiaohongshuPost.markdown).toContain('## 标题')
        expect(xiaohongshuPost.markdown).toContain('正文内容')
    })

    it('converts markdown and bare external links to end references for wechat_mp payloads', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '外链示例：https://github.com/CaoMeiYouRen/momei\n\n微信内链：https://mp.weixin.qq.com/s/example\n\n重复外链：https://github.com/CaoMeiYouRen/momei\n\nMarkdown 外链：[RSSHub](https://github.com/DIYgod/RSSHub)\n\nURL 标签外链：[https://letsencrypt.org](https://letsencrypt.org)',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const wechatMpPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'wechat_mp',
        })

        expect(wechatMpPost.markdown).toContain('链接[')
        expect(wechatMpPost.markdown).toContain('RSSHub[')
        expect(wechatMpPost.markdown).not.toContain('链接[1] [1]')
        expect(wechatMpPost.markdown).toContain('https://letsencrypt.org[')
        expect(wechatMpPost.markdown).toContain('https://mp.weixin.qq.com/s/example')
        expect(wechatMpPost.markdown).toContain('## 引用链接')
        expect(wechatMpPost.markdown).toContain('链接: `https://')
        expect(wechatMpPost.markdown).toContain('RSSHub: `https://github.com/DIYgod/RSSHub`')
        expect(wechatMpPost.content).toContain('<ol>')
        expect(wechatMpPost.content).toContain('<li>RSSHub: <code>https://github.com/DIYgod/RSSHub</code></li>')
    })

    it('flags weibo-only blockers that still require manual cleanup', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '::: tip\n受支持平台提示\n:::\n\n<iframe src="https://example.com/embed"></iframe>',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        expect(inspectWechatSyncMaterialCompatibility(materialBundle, 'weibo').blockers).toEqual(
            expect.arrayContaining(['custom-block', 'embedded-media']),
        )
    })

    it('strips re-formed script delimiters from weibo markdown sanitization', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '<scrip<script>alert(1)</script>t>safe text</script>',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const weiboPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'weibo',
        })

        expect(weiboPost.markdown).not.toContain('<')
        expect(weiboPost.markdown).not.toContain('>')
    })

    it('keeps blockquote inner text while removing nested html tags', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...post,
            content: '<blockquote><strong>重点</strong><a href="https://example.com">链接</a></blockquote>',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const weiboPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: 'none',
            contentProfile: 'weibo',
        })

        expect(weiboPost.markdown).toContain('重点')
        expect(weiboPost.markdown).toContain('链接 (https://example.com)')
        expect(weiboPost.markdown).not.toContain('<strong')
        expect(weiboPost.markdown).not.toContain('<a ')
    })
})
