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
})
