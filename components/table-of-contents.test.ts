import { describe, expect, it, vi } from 'vitest'
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

    it('returns no toc entries when the content is empty', async () => {
        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.findAll('.toc__link')).toHaveLength(0)
    })

    it('emits navigate when a heading link is clicked', async () => {
        const scrollToMock = vi.fn()
        Object.defineProperty(window, 'scrollTo', {
            value: scrollToMock,
            writable: true,
        })
        vi.spyOn(document, 'getElementById').mockReturnValue({
            getBoundingClientRect: () => ({ top: 200 }),
        } as unknown as HTMLElement)

        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## Section One',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.find('.toc__link').trigger('click')

        expect(wrapper.emitted('navigate')?.[0]).toEqual(['section-one'])
        expect(scrollToMock).toHaveBeenCalled()
    })

    it('scrolls to headings with the configured top offset', async () => {
        const scrollToMock = vi.fn()
        const element = {
            getBoundingClientRect: () => ({ top: 260 }),
        }

        Object.defineProperty(window, 'scrollTo', {
            value: scrollToMock,
            writable: true,
        })
        vi.spyOn(document, 'getElementById').mockReturnValue(element as unknown as HTMLElement)
        vi.spyOn(document.body, 'getBoundingClientRect').mockReturnValue({ top: 20 } as DOMRect)

        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## Heading',
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.get('.toc__link').trigger('click')

        expect(scrollToMock).toHaveBeenCalledWith({
            top: 160,
            behavior: 'smooth',
        })
    })

    it('does not scroll when deferScroll is true but still emits navigate', async () => {
        const scrollToMock = vi.fn()
        Object.defineProperty(window, 'scrollTo', {
            value: scrollToMock,
            writable: true,
        })
        vi.spyOn(document, 'getElementById').mockReturnValue({
            getBoundingClientRect: () => ({ top: 200 }),
        } as unknown as HTMLElement)

        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## Deferred Section',
                deferScroll: true,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.find('.toc__link').trigger('click')

        expect(wrapper.emitted('navigate')?.[0]).toEqual(['deferred-section'])
        expect(scrollToMock).not.toHaveBeenCalled()
    })

    it('hides the built-in title when hideTitle is true', async () => {
        const wrapper = await mountSuspended(TableOfContents, {
            props: {
                content: '## With Title',
                hideTitle: true,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.find('.toc__title').exists()).toBe(false)
        expect(wrapper.findAll('.toc__link')).toHaveLength(1)
    })
})
