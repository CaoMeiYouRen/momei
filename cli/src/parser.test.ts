import { describe, it, expect } from 'vitest'
import { convertToMomeiPost } from './parser.js'
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
    })
})
