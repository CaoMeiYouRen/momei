import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ArticleCard from './article-card.vue'

describe('ArticleCard', () => {
    const mockPost = {
        id: '123',
        slug: 'test-slug',
        title: 'Test Title',
        summary: 'Test Summary',
        views: 100,
        publishedAt: new Date().toISOString(),
        author: {
            id: '1',
            name: 'Author Name',
            image: '',
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
})
