import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AboutPage from './about.vue'

describe('about page', () => {
    it('应该正确渲染页面', async () => {
        const wrapper = await mountSuspended(AboutPage)

        expect(wrapper.html()).toContain('hero')
    })

    it('应该显示英雄区标题', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const title = wrapper.find('.hero__title')
        expect(title.exists()).toBe(true)
    })

    it('应该显示关于部分', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const aboutSection = wrapper.find('#about')
        expect(aboutSection.exists()).toBe(true)
    })

    it('应该显示功能部分', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const featuresSection = wrapper.find('#features')
        expect(featuresSection.exists()).toBe(true)
    })

    it('应该显示联系方式部分', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const contactSection = wrapper.find('#contact')
        expect(contactSection.exists()).toBe(true)
    })

    it('应该包含 GitHub 链接', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const githubLink = wrapper.find('a[href="https://github.com/CaoMeiYouRen/momei"]')
        expect(githubLink.exists()).toBe(true)
    })

    it('应该包含邮箱链接', async () => {
        const wrapper = await mountSuspended(AboutPage)

        const emailLink = wrapper.find('a[href="mailto:contact@momei.app"]')
        expect(emailLink.exists()).toBe(true)
    })
})
