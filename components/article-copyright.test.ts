import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ArticleCopyright from './article-copyright.vue'

describe('ArticleCopyright', () => {
    it('renders author name and link correctly', async () => {
        const wrapper = await mountSuspended(ArticleCopyright, {
            props: {
                authorName: 'CaoMei',
                url: 'https://momei.app/posts/test',
                license: 'all-rights-reserved',
            },
        })

        expect(wrapper.text()).toContain('CaoMei')
        const link = wrapper.find('.article-copyright__link')
        expect(link.exists()).toBe(true)
        expect(link.attributes('href')).toBe('https://momei.app/posts/test')
    })

    it('displays correctly for CC licenses', async () => {
        const wrapper = await mountSuspended(ArticleCopyright, {
            props: {
                authorName: 'CaoMei',
                url: 'https://momei.app/posts/test',
                license: 'cc-by-nc-sa',
            },
        })

        // Should contain license name (the Chinese version is active by default in tests often)
        expect(wrapper.text()).toContain('CC BY-NC-SA')

        // Should have a link to the license
        const links = wrapper.findAll('.article-copyright__link')
        expect(links.some((l) => l.attributes('href')?.includes('creativecommons.org'))).toBe(true)
    })

    it('falls back to default license from config', async () => {
        const wrapper = await mountSuspended(ArticleCopyright, {
            props: {
                authorName: 'CaoMei',
                url: 'https://momei.app/posts/test',
                license: null,
            },
        })

        // Default is all-rights-reserved
        expect(wrapper.text()).toContain('所有权利保留')
    })
})
