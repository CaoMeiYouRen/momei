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
})
