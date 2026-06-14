import { describe, expect, it } from 'vitest'
import { renderDistributionPreviewHtml } from './post-distribution-preview-renderer'

describe('post-distribution-preview-renderer', () => {
    it('renders preview markdown links as clickable anchors', () => {
        const html = renderDistributionPreviewHtml(
            '本文链接: [https://momei.app/posts/test](https://momei.app/posts/test)\n\n版权声明: 本博客所有文章除特别声明外，均采用 [CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。转载请注明出处！',
            'empty',
        )

        expect(html).toContain('href="https://momei.app/posts/test"')
        expect(html).toContain('href="https://creativecommons.org/licenses/by-nc-sa/4.0/"')
        expect(html).toContain('target="_blank"')
        expect(html).toContain('rel="noopener noreferrer"')
    })

    it('preserves markdown hard line breaks in copyright tailnotes', () => {
        const html = renderDistributionPreviewHtml(
            '本文作者: 草梅友仁  \n本文链接: [https://momei.app/posts/test](https://momei.app/posts/test)  \n版权声明: 本博客所有文章除特别声明外，均采用 [CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。转载请注明出处！',
            'empty',
        )

        expect(html).toContain('<br')
        expect(html).toContain('href="https://momei.app/posts/test"')
    })

    it('sanitizes unsafe html and disallowed schemes in preview content', () => {
        const html = renderDistributionPreviewHtml(
            '<script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">bad</a><img src="https://momei.app/cover.png" onerror="alert(1)" />',
            'empty',
        )

        expect(html).not.toContain('<script')
        expect(html).not.toContain('javascript:alert(1)')
        expect(html).not.toContain('onclick=')
        expect(html).not.toContain('onerror=')
        expect(html).toContain('src="https://momei.app/cover.png"')
    })

    it('renders wechat_mp profile with inline typography styles and no heading anchors', () => {
        const html = renderDistributionPreviewHtml(
            '## 标题\n\n这是正文\n\n[官网](https://momei.app)',
            'empty',
            { contentProfile: 'wechat_mp' },
        )

        expect(html).toContain('<div style="width:750px;max-width:100%;margin:auto">')
        expect(html).toContain('<h2 style=')
        expect(html).toContain('background:rgba(15, 76, 129, 1)')
        expect(html).toContain('<p style=')
        expect(html).toContain('letter-spacing:0.1em')
        expect(html).toContain('href="https://momei.app"')
        expect(html).toContain('text-decoration:none')
        expect(html).not.toContain('header-anchor')
    })

    it('applies wechat_mp table and blockquote styling', () => {
        const html = renderDistributionPreviewHtml(
            '> 提示信息\n\n|A|B|\n|-|-|\n|1|2|',
            'empty',
            { contentProfile: 'wechat_mp' },
        )

        expect(html).toContain('<blockquote style=')
        expect(html).toContain('background:#f7f7f7')
        expect(html).toContain('<table style=')
        expect(html).toContain('border-collapse:collapse')
        expect(html).toContain('<td style=')
    })
})
