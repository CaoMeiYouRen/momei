import { describe, it, expect } from 'vitest'
import { ContentProcessor } from './content-processor'

describe('ContentProcessor', () => {
    describe('splitMarkdown', () => {
        it('should return the original content if it is smaller than chunkSize', () => {
            const content = '# Topic\nThis is a short post.'
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 100 })
            expect(result).toHaveLength(1)
            expect(result[0]).toBe(content)
        })

        it('should split content at headings', () => {
            const content = '# Heading 1\nContent 1\n# Heading 2\nContent 2'
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 25, minChunkSize: 10 })
            expect(result).toHaveLength(2)
            expect(result[0]).toBe('# Heading 1\nContent 1')
            expect(result[1]).toBe('# Heading 2\nContent 2')
        })

        it('should split content at double newlines (paragraphs)', () => {
            const content = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 25, minChunkSize: 10 })
            expect(result).toHaveLength(2)
            expect(result[0]).toBe('Paragraph 1\n\nParagraph 2')
            expect(result[1]).toBe('Paragraph 3')
        })

        it('should respect minChunkSize to avoid tiny fragments', () => {
            const content = 'A very long paragraph that goes on and on.\n\nShort.'
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 20, minChunkSize: 50 })
            expect(result).toHaveLength(1)
        })

        it('should split extremely long paragraphs into smaller chunks without losing content', () => {
            const longParagraph = 'This is one sentence. This is two. This is three sentences.'
            const result = ContentProcessor.splitMarkdown(longParagraph, { chunkSize: 25, minChunkSize: 5 })
            expect(result.length).toBeGreaterThan(1)
            const combined = result.join('')
            expect(combined).toContain('This is one sentence.')
            expect(combined).toContain('This is two.')
            expect(combined).toContain('This is three sentences.')
        })

        it('should handle multi-level markdown headings correctly', () => {
            const content = '# H1\n## H2\n### H3\nText 1\n# H1-2\nText 2'
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 30, minChunkSize: 20 })
            expect(result).toHaveLength(2)
            expect(result[0]).toBe('# H1\n## H2\n### H3\nText 1')
            expect(result[1]).toBe('# H1-2\nText 2')
        })

        it('should trim whitespace from chunks but keep internal structure', () => {
            const content = '  # Heading  \n\nContent with spaces  '
            const result = ContentProcessor.splitMarkdown(content, { chunkSize: 40 })
            expect(result[0]).toBe('# Heading\n\nContent with spaces')
        })

        it('should handle empty or whitespace-only content', () => {
            expect(ContentProcessor.splitMarkdown('')).toEqual([])
            expect(ContentProcessor.splitMarkdown('   ')).toEqual([])
        })
    })
})
