import { describe, expect, it } from 'vitest'
import {
    collapseWhitespace,
    extractFaqItemsFromMarkdown,
    resolveCitableExcerpt,
    stripMarkdownToPlainText,
    truncatePlainText,
} from './citable-content'

describe('utils/shared/citable-content', () => {
    it('collapses whitespace and strips markdown into plain text', () => {
        expect(collapseWhitespace('  hello\n\nworld  ')).toBe('hello world')
        expect(stripMarkdownToPlainText('# Title\n\nA [link](https://example.com) and `code`')).toBe('Title A link and')
    })

    it('resolves a citable excerpt from summary before falling back to content', () => {
        expect(resolveCitableExcerpt({
            summary: '  Existing summary  ',
            content: '# Title\n\nBody copy',
            maxLength: 40,
        })).toBe('Existing summary')

        expect(resolveCitableExcerpt({
            content: '# Title\n\nBody copy for fallback excerpt',
            maxLength: 18,
        })).toBe('Title Body copy fo...')
    })

    it('truncates long plain text safely', () => {
        expect(truncatePlainText('short text', 20)).toBe('short text')
        expect(truncatePlainText('long plain text value', 10)).toBe('long plain...')
    })

    it('extracts faq items from markdown question headings', () => {
        const faqItems = extractFaqItemsFromMarkdown(`## What is GEO?\n\nGEO is a way to improve AI citation visibility for published content.\n\n## How does it help?\n\nIt gives crawlers and answer engines clearer summaries and structured context.`)

        expect(faqItems).toEqual([
            {
                question: 'What is GEO?',
                answer: 'GEO is a way to improve AI citation visibility for published content.',
            },
            {
                question: 'How does it help?',
                answer: 'It gives crawlers and answer engines clearer summaries and structured context.',
            },
        ])
    })

    it('ignores question headings inside fenced code blocks', () => {
        const faqItems = extractFaqItemsFromMarkdown(`## What is GEO?

    GEO is a way to improve AI citation visibility for published content.

    ~~~md
    ## Should this become FAQ?

    No, fenced examples must be ignored.
    ~~~

    ## How does it help?

    It gives crawlers and answer engines clearer summaries and structured context.`)

        expect(faqItems).toEqual([
            {
                question: 'What is GEO?',
                answer: 'GEO is a way to improve AI citation visibility for published content.',
            },
            {
                question: 'How does it help?',
                answer: 'It gives crawlers and answer engines clearer summaries and structured context.',
            },
        ])
    })
})
