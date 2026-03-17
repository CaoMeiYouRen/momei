import { describe, it, expect } from 'vitest'
import { formatPostToMarkdown } from '@/server/services/post-export'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'

describe('Post Export Service', () => {
    it('should format post to markdown with front-matter', () => {
        const post = new Post()
        post.title = 'Test Post'
        post.content = 'Hello World'
        post.slug = 'test-post'
        post.summary = 'A test post'
        post.createdAt = new Date('2026-02-11T12:00:00Z')

        const category = new Category()
        category.name = 'Tech'
        post.category = category

        const tag1 = new Tag()
        tag1.name = 'Vue'
        const tag2 = new Tag()
        tag2.name = 'Nuxt'
        post.tags = [tag1, tag2]

        const markdown = formatPostToMarkdown(post)

        expect(markdown).toContain('title: Test Post')
        expect(markdown).toContain('date: \'2026-02-11T12:00:00.000Z\'')
        expect(markdown).toContain('categories:\n  - Tech')
        expect(markdown).toContain('tags:\n  - Vue\n  - Nuxt')
        expect(markdown).toContain('abbrlink: test-post')
        expect(markdown).toContain('description: A test post')
        expect(markdown).toContain('Hello World')
    })

    it('should handle optional fields', () => {
        const post = new Post()
        post.title = 'Minimal Post'
        post.content = 'Content'
        post.slug = 'minimal'

        const markdown = formatPostToMarkdown(post)

        expect(markdown).toContain('title: Minimal Post')
        expect(markdown).toContain('categories: []')
        expect(markdown).toContain('tags: []')
        expect(markdown).toContain('Content')
    })

    it('should export audio from metadata', () => {
        const post = new Post()
        post.title = 'Audio Metadata Post'
        post.content = 'Audio Content'
        post.slug = 'audio-metadata'
        post.language = 'en-US'
        post.translationId = 'translation-cluster-1'
        post.metadata = {
            audio: {
                url: 'https://example.com/metadata-audio.mp3',
                duration: 321,
                size: 4096,
                mimeType: 'audio/mpeg',
                language: 'en-US',
                translationId: 'translation-cluster-1',
                postId: 'post-en-1',
                mode: 'podcast',
            },
            tts: {
                provider: 'openai',
                voice: 'alloy',
                generatedAt: new Date('2026-03-17T08:00:00Z'),
                language: 'en-US',
                translationId: 'translation-cluster-1',
                postId: 'post-en-1',
                mode: 'podcast',
            },
        }

        const markdown = formatPostToMarkdown(post)

        expect(markdown).toContain('language: en-US')
        expect(markdown).not.toContain('translationId:')
        expect(markdown).toContain('audio_url: https://example.com/metadata-audio.mp3')
        expect(markdown).not.toContain('audio: https://example.com/metadata-audio.mp3')
        expect(markdown).toContain('audio_duration: 321')
        expect(markdown).toContain('audio_size: 4096')
        expect(markdown).toContain('audio_mime_type: audio/mpeg')
        expect(markdown).toContain('audio_language: en-US')
        expect(markdown).not.toContain('audio_translation_id:')
        expect(markdown).not.toContain('audio_post_id:')
        expect(markdown).not.toContain('audio_mode:')
        expect(markdown).not.toContain('tts_provider:')
        expect(markdown).not.toContain('tts_voice:')
        expect(markdown).not.toContain('tts_generated_at:')
        expect(markdown).not.toContain('tts_language:')
        expect(markdown).not.toContain('tts_translation_id:')
        expect(markdown).not.toContain('tts_post_id:')
        expect(markdown).not.toContain('tts_mode:')
        expect(markdown).not.toContain('metadata:')
        expect(markdown).not.toContain('    translationId:')
        expect(markdown).not.toContain('    postId:')
        expect(markdown).not.toContain('    mode:')
        expect(markdown).not.toContain('  tts:')
    })
})
