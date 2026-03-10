import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ArticleCard from './article-card.vue'
import { PostStatus, PostVisibility } from '@/types/post'

describe('ArticleCard', () => {
    const mockPost = {
        id: '123',
        slug: 'test-slug',
        title: 'Test Title',
        content: 'Test content',
        summary: 'Test Summary',
        views: 100,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        language: 'zh-CN',
        featured: false,
        sticky: false,
        allowComment: true,
        authorId: '1',
        categoryId: '1',
        copyright: null,
        tags: [],
        author: {
            id: '1',
            name: 'Author Name',
            image: '',
            emailHash: '...',
        },
        category: {
            id: '1',
            name: 'Tech',
            slug: 'tech',
        },
    }

    it('renders title and summary correctly', async () => {
        const wrapper = await mountSuspended(ArticleCard, {
            props: {
                post: mockPost,
            },
        })

        expect(wrapper.text()).toContain('Test Title')
        expect(wrapper.text()).toContain('Test Summary')
    })

    it('truncates long summary', async () => {
        const longSummary = 'a'.repeat(300)
        const wrapper = await mountSuspended(ArticleCard, {
            props: {
                post: {
                    ...mockPost,
                    summary: longSummary,
                },
            },
        })

        expect(wrapper.text()).toContain('...')
        expect(wrapper.text().length).toBeLessThan(longSummary.length)
    })

    it('renders cover image with lazy loading', async () => {
        const wrapper = await mountSuspended(ArticleCard, {
            props: {
                post: {
                    ...mockPost,
                    coverImage: '/test-image.jpg',
                },
            },
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('loading')).toBe('lazy')
        expect(img.attributes('decoding')).toBe('async')
    })

    it('renders podcast label when audio is present in metadata', async () => {
        const wrapper = await mountSuspended(ArticleCard, {
            props: {
                post: {
                    ...mockPost,
                    metadata: {
                        audio: {
                            url: 'https://example.com/audio.mp3',
                        },
                    },
                },
            },
        })

        // Should contain the translated word (we check for the tag since mountSuspended uses real translations if configured, or keys if not)
        expect(wrapper.find('.article-card__meta-item--podcast').exists()).toBe(true)
    })

    it('renders semantic links for article navigation', async () => {
        const wrapper = await mountSuspended(ArticleCard, {
            props: {
                post: mockPost,
            },
        })

        expect(wrapper.find('.article-card__main-link').exists()).toBe(true)
        expect(wrapper.find('.article-card__read-more').exists()).toBe(true)
    })
})
