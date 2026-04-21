import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ExternalFeedPanel from './external-feed-panel.vue'

describe('ExternalFeedPanel', () => {
    const items = [
        {
            id: 'item-1',
            sourceId: 'source-1',
            title: 'External item title',
            summary: 'External item summary',
            url: 'https://example.com/post-1',
            canonicalUrl: 'https://example.com/post-1',
            publishedAt: '2026-04-01T08:00:00.000Z',
            authorName: 'Author',
            language: 'en-US',
            coverImage: null,
            sourceTitle: 'Example Feed',
            sourceSiteUrl: 'https://example.com',
            sourceBadge: 'RSS',
            dedupeKey: 'https://example.com/post-1',
            priority: 10,
        },
    ]

    it('renders external feed item and opens in a new tab', async () => {
        const wrapper = await mountSuspended(ExternalFeedPanel, {
            props: {
                items,
            },
        })

        expect(wrapper.text()).toContain('External item title')
        expect(wrapper.text()).toContain('External item summary')
        expect(wrapper.text()).toContain('Example Feed')

        const link = wrapper.find('.external-feed-panel__link')
        expect(link.attributes('href')).toBe('https://example.com/post-1')
        expect(link.attributes('target')).toBe('_blank')
    })

    it('renders degraded state notice when stale data is used', async () => {
        const wrapper = await mountSuspended(ExternalFeedPanel, {
            props: {
                items,
                degraded: true,
                stale: true,
            },
        })

        expect(wrapper.text()).toContain('当前展示的是最近一次成功抓取的缓存快照，外部源暂时不可用。')
        expect(wrapper.text()).toContain('缓存回退')
    })

    it('does not render a title link when an item has no title', async () => {
        const wrapper = await mountSuspended(ExternalFeedPanel, {
            props: {
                items: [
                    {
                        ...items[0],
                        title: '',
                        url: 'https://memos.cmyr.ltd/m/abc123',
                    },
                ],
            },
        })

        expect(wrapper.find('.external-feed-panel__item-title').exists()).toBe(false)

        const action = wrapper.find('.external-feed-panel__action')
        expect(action.exists()).toBe(true)
        expect(action.attributes('href')).toBe('https://memos.cmyr.ltd/m/abc123')
    })
})
