import { describe, it, expect, vi } from 'vitest'
import { convertToMomeiPost, parseHexoMarkdown, scanMarkdownFiles } from './parser.js'
import type { HexoFrontMatter } from './types.js'

describe('Parser', () => {
    describe('convertToMomeiPost', () => {
        it('should convert basic Hexo front-matter to Momei post', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                date: '2024-01-01',
                tags: ['tag1', 'tag2'],
                categories: ['category1'],
            }
            const content = 'This is test content'
            const filePath = 'test-post.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.title).toBe('Test Post')
            expect(result.content).toBe(content)
            expect(result.tags).toEqual(['tag1', 'tag2'])
            expect(result.category).toBe('category1')
            expect(result.status).toBe('published')
            expect(result.createdAt).toBeDefined()
        })

        it('should handle string tags and categories', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                tags: 'single-tag',
                categories: 'single-category',
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.tags).toEqual(['single-tag'])
            expect(result.category).toBe('single-category')
        })

        it('should generate slug from filename when permalink is missing', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
            }
            const content = 'Content'
            const filePath = 'my-awesome-post.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.slug).toBe('my-awesome-post')
        })

        it('should use permalink as slug when provided', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                permalink: 'custom-slug',
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.slug).toBe('custom-slug')
        })

        it('should set status to draft when no date is provided', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Draft Post',
            }
            const content = 'Content'
            const filePath = 'draft.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.status).toBe('draft')
            expect(result.createdAt).toBeUndefined()
        })

        it('should include language field', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                lang: 'en-US',
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.language).toBe('en-US')
            expect(result.visibility).toBe('public')
            expect(result.summary).toBeNull()
        })

        it('should handle missing title', () => {
            const frontMatter: HexoFrontMatter = {
                title: '',
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.title).toBe('Untitled')
        })

        it('should handle empty tags array', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                tags: [],
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.tags).toEqual([])
        })

        it('should handle empty categories array', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                categories: [],
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.category).toBeNull()
        })

        it('should handle multiple categories and use first one', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                categories: ['cat1', 'cat2', 'cat3'],
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.category).toBe('cat1')
        })

        it('should handle complex file paths', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
            }
            const content = 'Content'
            const filePath = 'path/to/nested/my-post-title.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.slug).toBe('my-post-title')
        })

        it('should handle permalink with special characters', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                permalink: 'my-custom-slug-2024',
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.slug).toBe('my-custom-slug-2024')
        })

        it('should handle date as Date object', () => {
            const date = new Date('2024-01-15T10:30:00Z')
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
                date,
            }
            const content = 'Content'
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.status).toBe('published')
            expect(result.createdAt).toBeDefined()
        })

        it('should handle empty content', () => {
            const frontMatter: HexoFrontMatter = {
                title: 'Test Post',
            }
            const content = ''
            const filePath = 'test.md'

            const result = convertToMomeiPost(frontMatter, content, filePath)

            expect(result.content).toBe('')
            expect(result.title).toBe('Test Post')
        })
    })

    describe('parseHexoMarkdown', () => {
        it('should be an async function that reads files', async () => {
            const { parseHexoMarkdown } = await import('./parser.js')
            expect(typeof parseHexoMarkdown).toBe('function')
            expect(parseHexoMarkdown.constructor.name).toBe('AsyncFunction')
        })
    })

    describe('scanMarkdownFiles', () => {
        it('should be an async function', async () => {
            const { scanMarkdownFiles } = await import('./parser.js')
            expect(typeof scanMarkdownFiles).toBe('function')
            expect(scanMarkdownFiles.constructor.name).toBe('AsyncFunction')
        })
    })
})
