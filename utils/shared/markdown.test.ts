import { describe, it, expect } from 'vitest'
import { formatMarkdown } from './markdown-formatter'
import { createMarkdownRenderer, sanitizeRenderedMarkdownHtml } from './markdown'
import { slugifyMarkdownHeading } from './markdown-heading'

describe('createMarkdownRenderer', () => {
    const md = createMarkdownRenderer({ html: true })

    it('should render emoji', () => {
        const result = md.render(':smile:')
        expect(result).toContain('😄')
    })

    it('should render custom containers', () => {
        const content = '::: tip\nhello\n:::'
        const result = md.render(content)
        expect(result).toContain('tip custom-block')
        expect(result).toContain('TIP')
        expect(result).toContain('hello')
    })

    it('should render github alerts', () => {
        const content = '> [!NOTE]\n> info'
        const result = md.render(content)
        expect(result).toContain('markdown-alert')
        expect(result).toContain('markdown-alert-note')
    })

    it('should render code-group container', () => {
        const content = '::: code-group\n```js\nconsole.log(1)\n```\n:::'
        const result = md.render(content)
        expect(result).toContain('code-group')
    })

    it('should render code block with title', () => {
        const content = '```js [index.js]\nconst a = 1\n```'
        const result = md.render(content)
        expect(result).toContain('data-title="index.js"')
        expect(result).toContain('language-js')
    })

    it('should support custom title in tip container', () => {
        const content = '::: tip 提示名称\n内容\n:::'
        const result = md.render(content)
        expect(result).toContain('提示名称')
    })

    it('should keep heading ids after sanitization when anchor mode is enabled', () => {
        const anchored = createMarkdownRenderer({ html: true, withAnchor: true })
        const html = sanitizeRenderedMarkdownHtml(anchored.render('## Hello World'))

        expect(html).toContain('<h2 id="hello-world"')
        expect(html).toContain('href="#hello-world"')
    })

    it('should reuse shared heading slug rules', () => {
        expect(slugifyMarkdownHeading('  中文 Heading: Hello World!  ')).toBe('中文-heading-hello-world-')
    })
})

describe('formatMarkdown', () => {
    it('should format chinese and english with space', async () => {
        const content = '测试test'
        const result = await formatMarkdown(content)
        expect(result).toBe('测试 test')
    })

    it('should handle empty content', async () => {
        const result = await formatMarkdown('')
        expect(result).toBe('')
    })

    it('should handle non-chinese content', async () => {
        const content = 'Hello world'
        const result = await formatMarkdown(content)
        expect(result).toBe('Hello world')
    })
})
