import { describe, expect, it } from 'vitest'
import type { MomeiPost } from '@momei-blog/api-client'
import { formatPostToMarkdown, formatPostToJson, getPostFilename } from './post-formatter'

function createMinimalPost(overrides: Partial<MomeiPost> = {}): MomeiPost {
    return {
        title: 'Test Post',
        content: 'Hello world',
        slug: 'test-post',
        language: 'en-US',
        ...overrides,
    }
}

// ===== formatPostToMarkdown =====

describe('formatPostToMarkdown', () => {
    it('should generate valid Front-matter with core fields', () => {
        const post = createMinimalPost()
        const result = formatPostToMarkdown(post)

        expect(result).toContain('---\n')
        expect(result).toContain('title: Test Post')
        expect(result).toContain('slug: test-post')
        expect(result).toContain('language: en-US')
        expect(result).toContain('Hello world')
    })

    it('should include categories and tags in Front-matter', () => {
        const post = createMinimalPost({
            category: 'Tech',
            tags: ['javascript', 'typescript'],
        })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('categories:')
        expect(result).toContain('- Tech')
        expect(result).toContain('tags:')
        expect(result).toContain('- javascript')
        expect(result).toContain('- typescript')
    })

    it('should include empty categories and tags when not set', () => {
        const post = createMinimalPost({ category: null, tags: undefined })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('categories: []')
        expect(result).toContain('tags: []')
    })

    it('should include coverImage as image field', () => {
        const post = createMinimalPost({ coverImage: '/images/cover.jpg' })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('image:')
        expect(result).toContain('/images/cover.jpg')
    })

    it('should include translation_id when translationId is set', () => {
        const post = createMinimalPost({ translationId: 'abc123' })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('translation_id: abc123')
    })

    it('should include audio metadata when present', () => {
        const post = createMinimalPost({
            metadata: {
                audio: {
                    url: 'https://example.com/audio.mp3',
                    duration: 120,
                    size: 1024,
                    mimeType: 'audio/mpeg',
                    language: 'en',
                },
            },
        })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('audio_url:')
        expect(result).toContain('audio_duration: 120')
        expect(result).toContain('audio_size: 1024')
        expect(result).toContain('audio_mime_type: audio/mpeg')
        expect(result).toContain('audio_language: en')
    })

    it('should skip audio fields when only partial data is present', () => {
        const post = createMinimalPost({
            metadata: {
                audio: {
                    url: 'https://example.com/audio.mp3',
                    duration: null,
                    size: null,
                    mimeType: null,
                    language: null,
                },
            },
        })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('audio_url:')
        expect(result).not.toContain('audio_duration:')
        expect(result).not.toContain('audio_size:')
    })

    it('should include copyright and status when set', () => {
        const post = createMinimalPost({
            copyright: 'CC-BY-4.0',
            status: 'published',
        })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('copyright: CC-BY-4.0')
        expect(result).toContain('status: published')
    })

    it('should handle empty post gracefully', () => {
        const post = createMinimalPost({
            title: '',
            content: '',
            slug: '',
            language: '',
        })
        const result = formatPostToMarkdown(post)

        expect(result).toContain('---')
        expect(result).toContain('title')
        expect(result).toContain('---')
    })

    it('should produce a parseable YAML front matter', () => {
        const post = createMinimalPost({
            title: 'Hello: World',
            content: 'Some *markdown* content',
        })
        const result = formatPostToMarkdown(post)

        // Verify the structure: opening ---, front matter, closing ---, content
        expect(result).toMatch(/^---\n[\s\S]*?\n---\n\n[\s\S]*$/u)
    })
})

// ===== formatPostToJson =====

describe('formatPostToJson', () => {
    it('should produce valid JSON with all fields', () => {
        const post = createMinimalPost()
        const result = formatPostToJson(post)
        const parsed = JSON.parse(result)

        expect(parsed.title).toBe('Test Post')
        expect(parsed.content).toBe('Hello world')
        expect(parsed.slug).toBe('test-post')
    })

    it('should handle missing optional fields', () => {
        const post = createMinimalPost({
            slug: undefined,
            category: undefined,
            tags: undefined,
        })
        const result = formatPostToJson(post)
        const parsed = JSON.parse(result)

        expect(parsed.title).toBe('Test Post')
        expect(parsed.slug).toBeUndefined()
    })
})

// ===== getPostFilename =====

describe('getPostFilename', () => {
    it('should use slug as base name', () => {
        const post = createMinimalPost()
        const result = getPostFilename(post, '.md')

        expect(result).toBe('test-post.en-US.md')
    })

    it('should fall back to sanitised title when slug is missing', () => {
        const post = createMinimalPost({ slug: undefined })
        const result = getPostFilename(post, '.md')

        expect(result).toMatch(/^Test Post\.en-US\.md$/u)
    })

    it('should replace filesystem-illegal characters in title', () => {
        const post = createMinimalPost({ slug: undefined, title: 'My File: Test? "OK"' })
        const result = getPostFilename(post, '.md')

        expect(result).toMatch(/^My File_ Test_ _OK_\.en-US\.md$/u)
    })

    it('should use untitled fallback when both slug and title are empty', () => {
        const post = createMinimalPost({ slug: undefined, title: '' })
        const result = getPostFilename(post, '.md')

        expect(result).toMatch(/^untitled\.en-US\.md$/u)
    })

    it('should use unknown language when language is missing', () => {
        const post = createMinimalPost({ slug: 'test', language: undefined })
        const result = getPostFilename(post, '.md')

        expect(result).toBe('test.unknown.md')
    })

    it('should use correct extension for JSON', () => {
        const post = createMinimalPost()
        const result = getPostFilename(post, '.json')

        expect(result).toBe('test-post.en-US.json')
    })

    it('should strip leading and trailing dots', () => {
        const post = createMinimalPost({ slug: '...test-slug...' })
        const result = getPostFilename(post, '.md')

        expect(result).toBe('test-slug.en-US.md')
    })

    it('should truncate long base names to MAX_FILENAME_BASE_LENGTH', () => {
        const longSlug = 'a'.repeat(500)
        const post = createMinimalPost({ slug: longSlug })
        const result = getPostFilename(post, '.md')

        // 200 chars base + '.en-US.md' = 209 chars
        expect(result.length).toBe(209)
        expect(result).toMatch(/^a{200}\.en-US\.md$/u)
    })
})
