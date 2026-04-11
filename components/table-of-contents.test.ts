import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TableOfContents from './table-of-contents.vue'

describe('TableOfContents', () => {
    it('builds toc links with the same heading slug rule as markdown renderer', async () => {
        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '# Title\n\n## Hello World\n\n### 中文 Heading: Hello World!',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const links = wrapper.findAll('.toc__link')
        expect(links).toHaveLength(2)
        expect(links[0]?.attributes('href')).toBe('#hello-world')
        expect(links[1]?.attributes('href')).toBe('#中文-heading-hello-world-')
    })

    it('keeps duplicate heading anchors aligned with rendered markdown ids', async () => {
        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## Hello World\n\n## Hello World',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const links = wrapper.findAll('.toc__link')
        expect(links).toHaveLength(2)
        expect(links[0]?.attributes('href')).toBe('#hello-world')
        expect(links[1]?.attributes('href')).toBe('#hello-world-1')
    })

    it('sanitizes heading html through the shared text utility', async () => {
        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## Safe &amp; Sound &amp;quot; <script>alert(1)</script> <em>Heading</em>',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const links = wrapper.findAll('.toc__link')
        expect(links).toHaveLength(1)
        expect(links[0]?.text()).toBe('Safe & Sound &quot; <script>alert(1)</script> <em>Heading</em>')
    })
})
