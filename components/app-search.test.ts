import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppSearch from './app-search.vue'

const {
    localeRef,
    visibleRef,
    closeSearchMock,
    appFetchMock,
    navigateToMock,
    localePathMock,
} = vi.hoisted(() => ({
    localeRef: { __v_isRef: true, value: 'zh-CN' },
    visibleRef: { __v_isRef: true, value: true },
    closeSearchMock: vi.fn(),
    appFetchMock: vi.fn(),
    navigateToMock: vi.fn(),
    localePathMock: vi.fn((path: string) => `/zh-CN${path}`),
}))

mockNuxtImport('useI18n', () => () => ({
    locale: localeRef,
}))

mockNuxtImport('useLocalePath', () => () => localePathMock)
mockNuxtImport('useSearch', () => () => ({
    isSearchOpen: visibleRef,
    closeSearch: closeSearchMock,
}))
mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
}))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('@vueuse/core', () => ({
    useDebounceFn: (fn: (...args: any[]) => any) => fn,
}))

const DialogStub = defineComponent({
    props: {
        visible: { type: Boolean, default: false },
    },
    emits: ['update:visible'],
    template: '<div v-if="visible" class="dialog"><slot /></div>',
})

const InputTextStub = defineComponent({
    props: {
        modelValue: { type: String, default: '' },
    },
    emits: ['update:modelValue', 'keyup.enter'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keyup.enter="$emit(\'keyup.enter\')">',
})

const TagStub = defineComponent({
    props: {
        value: { type: String, default: '' },
    },
    template: '<span class="tag">{{ value }}</span>',
})

const NuxtLinkStub = defineComponent({
    props: {
        to: { type: String, required: true },
    },
    emits: ['click'],
    template: '<a :href="to" @click="$emit(\'click\')"><slot /></a>',
})

describe('AppSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localeRef.value = 'zh-CN'
        visibleRef.value = true
    })

    it('shows the idle hint before the user starts searching', async () => {
        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        expect(wrapper.text()).toContain('Type keywords to search...')
    })

    it('searches posts, renders results and closes the dialog when a result is opened', async () => {
        appFetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                items: [{
                    id: 'post-1',
                    slug: 'hello-world',
                    title: 'Hello World',
                    summary: 'Summary',
                    category: { name: 'Notes' },
                    language: 'zh-CN',
                }],
            },
        })

        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        await wrapper.find('input').setValue('hello')
        await Promise.resolve()
        await Promise.resolve()

        expect(appFetchMock).toHaveBeenCalledWith('/api/search', {
            query: {
                q: 'hello',
                limit: 8,
            },
        })
        expect(wrapper.text()).toContain('Hello World')
        expect(wrapper.text()).toContain('Summary')
        expect(localePathMock).toHaveBeenCalledWith('/posts/hello-world')

        await wrapper.find('a').trigger('click')
        expect(closeSearchMock).toHaveBeenCalledTimes(1)
    })

    it('shows the empty state when the query has no results and clears results on blank input', async () => {
        appFetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                items: [],
            },
        })

        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        await wrapper.find('input').setValue('missing')
        await Promise.resolve()
        await Promise.resolve()

        expect(wrapper.text()).toContain('No results found')

        await wrapper.find('input').setValue('   ')
        await Promise.resolve()

        expect(wrapper.text()).toContain('No results found')
    })

    it('falls back to the empty state on search errors and navigates to the first result on enter', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        appFetchMock
            .mockRejectedValueOnce(new Error('search failed'))
            .mockResolvedValueOnce({
                code: 200,
                data: {
                    items: [{
                        id: 'post-9',
                        slug: 'first-hit',
                        title: 'First Hit',
                        summary: '',
                        category: null,
                        language: 'en-US',
                    }],
                },
            })

        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        await wrapper.find('input').setValue('oops')
        await Promise.resolve()
        await Promise.resolve()
        expect(wrapper.text()).toContain('No results found')

        await wrapper.find('input').setValue('first')
        await Promise.resolve()
        await Promise.resolve()
        await wrapper.find('input').trigger('keyup.enter')

        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/posts/first-hit')
        expect(closeSearchMock).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith('Search failed:', expect.any(Error))

        consoleErrorSpy.mockRestore()
    })

    it('shows the loading state while a search request is still pending', async () => {
        let resolveRequest: ((value: any) => void) | undefined
        appFetchMock.mockReturnValueOnce(new Promise((resolve) => {
            resolveRequest = resolve
        }))

        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        await wrapper.find('input').setValue('slow')
        await Promise.resolve()

        expect(wrapper.find('.app-search__status').exists()).toBe(true)

        resolveRequest?.({
            code: 200,
            data: {
                items: [],
            },
        })
        await Promise.resolve()
        await Promise.resolve()

        expect(wrapper.find('.app-search__status').exists()).toBe(false)
    })

    it('keeps the empty state when the api returns a non-200 response and does not navigate on enter', async () => {
        appFetchMock.mockResolvedValueOnce({
            code: 500,
            data: {
                items: [{
                    id: 'ignored',
                    slug: 'ignored',
                    title: 'Ignored',
                    summary: 'Ignored',
                    category: null,
                    language: 'en-US',
                }],
            },
        })

        const wrapper = await mountSuspended(AppSearch, {
            global: {
                stubs: {
                    Dialog: DialogStub,
                    InputText: InputTextStub,
                    Tag: TagStub,
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        await wrapper.find('input').setValue('ignored')
        await Promise.resolve()
        await Promise.resolve()
        await wrapper.find('input').trigger('keyup.enter')

        expect(wrapper.text()).toContain('No results found')
        expect(navigateToMock).not.toHaveBeenCalled()
        expect(closeSearchMock).not.toHaveBeenCalled()
    })
})
