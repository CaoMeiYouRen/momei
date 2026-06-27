import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import PostDetailPage from './[id].vue'

// Mock useAppFetch
vi.mock('@/composables/use-app-fetch', () => ({
    useAppFetch: vi.fn(() => ({
        data: ref({
            id: '1',
            title: 'Test Post',
            slug: 'test-post',
            content: '<p>Test content</p>',
            status: 'published',
            visibility: 'public',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
        }),
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn(),
    })),
}))

describe('posts/[id] page i18n', () => {
    it('应该装配真实公开页文案而不是显示 raw key', async () => {
        const wrapper = await mountSuspended(PostDetailPage)

        const text = wrapper.text()

        // 验证主要 i18n key 不是 raw key
        expect(text).not.toContain('pages.error.404_title')
        expect(text).not.toContain('pages.error.title')
        expect(text).not.toContain('pages.error.404_desc')
        expect(text).not.toContain('pages.error.back_home')
        expect(text).not.toContain('pages.error.retry')
        expect(text).not.toContain('pages.posts.status_warning')
    })

    it('应该显示页面容器', async () => {
        const wrapper = await mountSuspended(PostDetailPage)

        const page = wrapper.find('.post-detail')
        expect(page.exists()).toBe(true)
    })
})
