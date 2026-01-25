import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
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

    it('triggers lightbox on image click', async () => {
        const content = '![Alt text](/image.jpg)'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        const img = wrapper.find('img')
        await img.trigger('click')

        // Check if Dialog (lightbox) is visible
        const vm = wrapper.vm as any
        expect(vm.lightboxVisible).toBe(true)
        expect(vm.lightboxImage).toContain('/image.jpg')
    })

    it('copies code to clipboard', async () => {
        const content = '```ts\nconst x = 1;\n```'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        // Mock clipboard
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

        const copyButton = wrapper.find('.copy-code-button')
        expect(copyButton.exists()).toBe(true)

        await copyButton.trigger('click')
        expect(writeText).toHaveBeenCalledWith('const x = 1;\n')
        expect(copyButton.classes()).toContain('copied')
    })

    it('initializes code groups', async () => {
        const content = '::: code-group\n```ts [index.ts]\nconsole.log(1)\n```\n\n```ts [utils.ts]\nconsole.log(2)\n```\n:::'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        await nextTick()

        const tabs = wrapper.findAll('.code-group-tabs button')
        expect(tabs.length).toBe(2)
        expect(tabs[0]?.text()).toBe('index.ts')
        expect(tabs[1]?.text()).toBe('utils.ts')

        // Check active state
        expect(tabs[0]?.classes()).toContain('active')
        expect(tabs[1]?.classes()).not.toContain('active')

        // Click second tab
        await tabs[1]?.trigger('click')
        expect(tabs[0]?.classes()).not.toContain('active')
        expect(tabs[1]?.classes()).toContain('active')
    })

    it('renders custom containers (admonitions)', async () => {
        const content = '::: tip\nThis is a tip\n:::\n\n::: warning\nThis is a warning\n:::'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        expect(wrapper.find('.custom-block.tip').exists()).toBe(true)
        expect(wrapper.find('.custom-block.warning').exists()).toBe(true)
        expect(wrapper.text()).toContain('This is a tip')
    })

    it('renders GitHub alerts', async () => {
        const content = '> [!NOTE]\n> This is a note'
        const wrapper = await mountSuspended(ArticleContent, {
            props: {
                content,
            },
        })

        // githubAlerts typically generates a div with markdown-alert class
        expect(wrapper.find('.markdown-alert').exists()).toBe(true)
        expect(wrapper.find('.markdown-alert-note').exists()).toBe(true)
        expect(wrapper.text()).toContain('This is a note')
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
