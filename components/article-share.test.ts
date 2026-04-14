import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ArticleShare from './article-share.vue'

const toastAdd = vi.fn()

vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: toastAdd,
    }),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string, params?: Record<string, string>) => {
        if (params?.platform) {
            return `${key}:${params.platform}`
        }

        return key
    },
    locale: { value: 'zh-CN' },
}))

const ButtonStub = defineComponent({
    inheritAttrs: false,
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
})

const DialogStub = defineComponent({
    inheritAttrs: false,
    props: {
        visible: { type: Boolean, default: false },
    },
    template: '<div v-if="visible" class="dialog"><slot /></div>',
})

describe('ArticleShare', () => {
    const openSpy = vi.fn()
    const shareSpy = vi.fn()
    const writeTextSpy = vi.fn()
    const matchMediaSpy = vi.fn()

    beforeEach(() => {
        toastAdd.mockReset()
        openSpy.mockReset()
        shareSpy.mockReset()
        writeTextSpy.mockReset()
        matchMediaSpy.mockReset()

        Object.defineProperty(window, 'open', {
            value: openSpy,
            writable: true,
        })

        Object.defineProperty(window, 'matchMedia', {
            value: matchMediaSpy.mockReturnValue({ matches: false }),
            writable: true,
        })

        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextSpy.mockResolvedValue(undefined) },
            configurable: true,
        })

        Object.defineProperty(navigator, 'share', {
            value: shareSpy.mockResolvedValue(undefined),
            configurable: true,
        })
    })

    it('copies the share link from the shortcut action', async () => {
        const wrapper = await mountSuspended(ArticleShare, {
            props: {
                title: 'Test Post',
                text: 'Summary',
                url: 'https://momei.app/posts/test-post',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        await wrapper.find('[data-testid="article-share-copy-link"]').trigger('click')
        expect(writeTextSpy).toHaveBeenCalledWith('https://momei.app/posts/test-post')
    })

    it('opens the share panel on desktop and triggers direct share links', async () => {
        const wrapper = await mountSuspended(ArticleShare, {
            props: {
                title: 'Test Post',
                text: 'Summary',
                url: 'https://momei.app/posts/test-post',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        await wrapper.find('[data-testid="article-share-primary"]').trigger('click')
        await wrapper.find('[data-platform="x"]').trigger('click')

        expect(openSpy).toHaveBeenCalledTimes(1)
        expect(String(openSpy.mock.calls[0]?.[0])).toContain('twitter.com/intent/tweet')
    })

    it('uses native share on mobile-sized viewports', async () => {
        matchMediaSpy.mockReturnValue({ matches: true })

        const wrapper = await mountSuspended(ArticleShare, {
            props: {
                title: 'Test Post',
                text: 'Summary',
                url: 'https://momei.app/posts/test-post',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        await wrapper.find('[data-testid="article-share-primary"]').trigger('click')

        expect(shareSpy).toHaveBeenCalledWith({
            title: 'Test Post',
            text: 'Summary',
            url: 'https://momei.app/posts/test-post',
        })
    })

    it('copies platform-specific rich text for copy-first platforms', async () => {
        const wrapper = await mountSuspended(ArticleShare, {
            props: {
                title: 'Test Post',
                text: 'Summary',
                url: 'https://momei.app/posts/test-post',
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        await wrapper.find('[data-testid="article-share-primary"]').trigger('click')
        await wrapper.find('[data-platform="weibo"]').trigger('click')

        expect(writeTextSpy).toHaveBeenCalledWith('Test Post\n\nSummary\n\nhttps://momei.app/posts/test-post')
    })
})
