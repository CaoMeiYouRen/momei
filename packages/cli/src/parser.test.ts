import { describe, it, expect } from 'vitest'
import { convertToMomeiPost, parseHexoMarkdown, scanMarkdownFiles } from './parser'
import type { HexoFrontMatter } from './types'

describe('Parser - convertToMomeiPost: Basic Conversion', () => {
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
        expect(result.publishedAt).toBeDefined()
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

    it('should include language and visibility fields', () => {
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

    it('should align aliases with current editor import flow', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Alias Post',
            abbrlink: 'alias-post',
            description: 'Description summary',
            image: 'https://example.com/cover.jpg',
            license: 'CC BY-SA 4.0',
            language: 'ko-KR',
            category: ['Tech', 'Ignored'],
            tags: 'cli',
            audio: 'https://example.com/audio.mp3',
            duration: '01:02:03',
            medialength: '2048',
            mediatype: 'audio/mpeg',
            permalink: '/:year/:month/:day/:slug/',
        }

        const result = convertToMomeiPost(frontMatter, 'Content', 'nested/post-file.md')

        expect(result.slug).toBe('alias-post')
        expect(result.summary).toBe('Description summary')
        expect(result.coverImage).toBe('https://example.com/cover.jpg')
        expect(result.copyright).toBe('CC BY-SA 4.0')
        expect(result.language).toBe('ko-KR')
        expect(result.category).toBe('Tech')
        expect(result.tags).toEqual(['cli'])
        expect(result.metadata).toEqual({
            audio: {
                url: 'https://example.com/audio.mp3',
                duration: 3723,
                size: 2048,
                mimeType: 'audio/mpeg',
            },
        })
    })
})

describe('Parser - convertToMomeiPost: Slug Generation', () => {
    it('should generate slug from filename when permalink is missing', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Test Post',
        }
        const content = 'Content'
        const filePath = 'my-awesome-post.md'

        const result = convertToMomeiPost(frontMatter, content, filePath)

        expect(result.slug).toBe('my-awesome-post')
    })

    it('should use explicit slug when provided', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Test Post',
            slug: 'custom-slug',
        }
        const content = 'Content'
        const filePath = 'test.md'

        const result = convertToMomeiPost(frontMatter, content, filePath)

        expect(result.slug).toBe('custom-slug')
    })

    it('should use abbrlink when provided', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Test Post',
            abbrlink: 'my-custom-slug-2024',
        }
        const content = 'Content'
        const filePath = 'test.md'

        const result = convertToMomeiPost(frontMatter, content, filePath)

        expect(result.slug).toBe('my-custom-slug-2024')
    })

    it('should not use permalink templates as canonical slug', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Test Post',
            permalink: '/:year/:month/:day/:slug/',
        }

        const result = convertToMomeiPost(frontMatter, 'Content', 'path/to/post-name.md')

        expect(result.slug).toBe('post-name')
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
})

describe('Parser - convertToMomeiPost: Status and Date Handling', () => {
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
})

describe('Parser - convertToMomeiPost: Edge Cases', () => {
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

    it('should support desc and cover aliases', () => {
        const frontMatter: HexoFrontMatter = {
            title: 'Test Post',
            desc: 'Short description',
            cover: '/uploads/cover.jpg',
        }

        const result = convertToMomeiPost(frontMatter, 'Content', 'test.md')

        expect(result.summary).toBe('Short description')
        expect(result.coverImage).toBe('/uploads/cover.jpg')
    })
})

describe('Parser - parseHexoMarkdown', () => {
    it('should be an async function that reads files', () => {
        expect(typeof parseHexoMarkdown).toBe('function')
        expect(parseHexoMarkdown.constructor.name).toBe('AsyncFunction')
    })
})

describe('Parser - scanMarkdownFiles', () => {
    it('should be an async function', () => {
        expect(typeof scanMarkdownFiles).toBe('function')
        expect(scanMarkdownFiles.constructor.name).toBe('AsyncFunction')
    })
})
