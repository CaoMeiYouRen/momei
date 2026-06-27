import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from './index.vue'

describe('index page i18n', () => {
    it('应该装配真实公开页文案而不是显示 raw key', async () => {
        const wrapper = await mountSuspended(IndexPage)

        const text = wrapper.text()

        // 验证主要 i18n key 不是 raw key
        expect(text).not.toContain('home.hero.title')
        expect(text).not.toContain('home.hero.subtitle')
        expect(text).not.toContain('home.hero.cta')
        expect(text).not.toContain('home.latest_posts.title')
        expect(text).not.toContain('home.popular_posts.title')
        expect(text).not.toContain('home.about.description')

        // 验证 common key 不是 raw key
        expect(text).not.toContain('common.about')
        expect(text).not.toContain('common.view_all')
        expect(text).not.toContain('common.error_loading')
        expect(text).not.toContain('app.name')
    })

    it('应该显示最新文章区域', async () => {
        const wrapper = await mountSuspended(IndexPage)

        const latestPosts = wrapper.find('.latest-posts')
        expect(latestPosts.exists()).toBe(true)
    })

    it('应该显示页面容器', async () => {
        const wrapper = await mountSuspended(IndexPage)

        const page = wrapper.find('.home-page')
        expect(page.exists()).toBe(true)
    })
})
