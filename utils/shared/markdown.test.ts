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

    it('should resolve editor image placeholders through shared renderer hooks', () => {
        const renderer = createMarkdownRenderer({ html: true })
        renderer.image_add(2, 'https://assets.example.com/image.png')

        const result = renderer.render('![demo](2)')

        expect(result).toContain('src="https://assets.example.com/image.png"')
        expect(result).toContain('rel="2"')
    })

    it('should reuse shared heading slug rules', () => {
        expect(slugifyMarkdownHeading('  中文 Heading: Hello World!  ')).toBe('中文-heading-hello-world-')
    })

    it('should keep fuzzy link autolinking behaviour after markdown-it 15 upgrade', () => {
        // linkify-it 6 默认关闭 fuzzyLink / urlAuth，渲染器需显式恢复以保持既有输出语义
        const result = md.render('访问 example.com 查看详情')

        expect(result).toContain('<a href="http://example.com">example.com</a>')
    })

    it('should keep URL auth part autolinking behaviour', () => {
        // linkify-it 6 新增 urlAuth 且默认关闭；未恢复时只会链接到 `https://user`
        const result = md.render('访问 https://user:pass@example.com/private 查看')

        expect(result).toContain('href="https://user:pass@example.com/private"')
    })

    it('should render katex math through markdown-it-texmath', () => {
        const result = md.render('公式 $x^2$ 结束')

        expect(result).toContain('class="katex"')
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
