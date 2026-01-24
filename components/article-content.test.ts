import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ArticleContent from './article-content.vue'

describe('ArticleContent', () => {
    it('renders markdown with lazy loading images', async () => {
        const content = '![Alt text](/image.jpg)'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('loading')).toBe('lazy')
        expect(img.attributes('decoding')).toBe('async')
        expect(img.attributes('src')).toBe('/image.jpg')
    })

    it('renders multiple images with lazy loading', async () => {
        const content = '![img1](/1.jpg)\n\n![img2](/2.jpg)'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        const imgs = wrapper.findAll('img')
        expect(imgs.length).toBe(2)
        imgs.forEach((img) => {
            expect(img.attributes('loading')).toBe('lazy')
            expect(img.attributes('decoding')).toBe('async')
        })
    })

    it('renders mathematical formulas (KaTeX)', async () => {
        const content = 'Inline formula: $x^2 + y^2 = z^2$\n\nDisplay formula:\n\n$$e^{i\\pi} + 1 = 0$$'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        // KaTeX generates .katex class
        expect(wrapper.find('.katex').exists()).toBe(true)
        expect(wrapper.find('.katex-display').exists()).toBe(true)

        // Check for specific content (simplified)
        const html = wrapper.html()
        expect(html).toContain('katex')
        expect(html).toContain('math')
    })
})
