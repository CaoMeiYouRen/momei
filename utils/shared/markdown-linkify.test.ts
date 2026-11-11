import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { applyMarkdownLinkifyCompatibility } from './markdown-linkify'

describe('applyMarkdownLinkifyCompatibility', () => {
    const createPlainRenderer = () => new MarkdownIt({ html: false, linkify: true })

    it('恢复裸域名自动链接（linkify-it 6 默认关闭 fuzzyLink）', () => {
        const md = createPlainRenderer()
        expect(md.render('访问 example.com 查看详情')).not.toContain('<a ')

        applyMarkdownLinkifyCompatibility(md)

        expect(md.render('访问 example.com 查看详情')).toContain('<a href="http://example.com">example.com</a>')
    })

    it('恢复带认证信息 URL 的完整链接（linkify-it 6 默认关闭 urlAuth）', () => {
        const md = createPlainRenderer()
        applyMarkdownLinkifyCompatibility(md)

        const html = md.render('https://user:pass@example.com/private')

        expect(html).toContain('href="https://user:pass@example.com/private"')
    })

    it('不影响显式 Markdown 链接与邮箱识别', () => {
        const md = createPlainRenderer()
        applyMarkdownLinkifyCompatibility(md)

        expect(md.render('[站点](https://example.com)')).toContain('href="https://example.com"')
        expect(md.render('mail me@example.com')).toContain('href="mailto:me@example.com"')
    })
})
