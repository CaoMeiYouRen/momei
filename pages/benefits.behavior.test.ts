import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import BenefitsPage from './benefits.vue'

const {
    fetchMock,
    mockUsePageSeo,
    sessionRef,
} = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    mockUsePageSeo: vi.fn(),
    sessionRef: {
        __v_isRef: true,
        value: null as null | { data: { user: { name?: string | null, email?: string | null } | null } },
    },
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => sessionRef),
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    tm: (key: string) => {
        switch (key) {
            case 'pages.enhanced_pack.free_core.items':
                return [
                    { title: 'Free title', desc: 'Free desc' },
                ]
            case 'pages.enhanced_pack.premium.items':
                return [
                    { icon: 'pi-star', title: 'Premium title', desc: 'Premium desc' },
                ]
            case 'pages.enhanced_pack.faq.items':
                return [
                    { q: 'FAQ question', a: 'FAQ answer' },
                ]
            default:
                return []
        }
    },
    rt: (value: string) => value,
    locale: {
        __v_isRef: true,
        value: 'zh-CN',
    },
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('usePageSeo', () => (...args: Parameters<typeof mockUsePageSeo>) => mockUsePageSeo(...args))

async function mountPage() {
    return mountSuspended(BenefitsPage, {
        global: {
            stubs: {
                ClientOnly: { template: '<div><slot /></div>' },
                NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
            },
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('BenefitsPage form behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionRef.value = null
        vi.stubGlobal('$fetch', fetchMock)
        fetchMock.mockResolvedValue({
            code: 200,
        })
    })

    it('prefills the waitlist form from the logged-in user', async () => {
        sessionRef.value = {
            data: {
                user: {
                    name: 'Alice',
                    email: 'alice@example.com',
                },
            },
        }

        const wrapper = await mountPage()

        expect((wrapper.get('#benefits-name').element as HTMLInputElement).value).toBe('Alice')
        expect((wrapper.get('#benefits-email').element as HTMLInputElement).value).toBe('alice@example.com')
    })

    it('submits the waitlist form successfully and clears the fields', async () => {
        const wrapper = await mountPage()

        await wrapper.get('#benefits-name').setValue('Reader')
        await wrapper.get('#benefits-email').setValue('reader@example.com')
        await wrapper.get('form').trigger('submit')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/benefits/waitlist', {
                method: 'POST',
                body: {
                    name: 'Reader',
                    email: 'reader@example.com',
                    locale: 'zh-CN',
                },
            })
        })

        expect((wrapper.get('#benefits-name').element as HTMLInputElement).value).toBe('')
        expect((wrapper.get('#benefits-email').element as HTMLInputElement).value).toBe('')
        expect(wrapper.text()).toContain('pages.enhanced_pack.cta_form.success')
    })

    it('shows a form error when the waitlist API returns a non-200 response', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 500,
        })

        const wrapper = await mountPage()

        await wrapper.get('#benefits-name').setValue('Reader')
        await wrapper.get('#benefits-email').setValue('reader@example.com')
        await wrapper.get('form').trigger('submit')

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.enhanced_pack.cta_form.error')
        })
        expect(wrapper.text()).not.toContain('pages.enhanced_pack.cta_form.success')
    })

    it('shows a form error when the waitlist request throws', async () => {
        const error = new Error('network down')
        fetchMock.mockRejectedValueOnce(error)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        const wrapper = await mountPage()

        await wrapper.get('#benefits-name').setValue('Reader')
        await wrapper.get('#benefits-email').setValue('reader@example.com')
        await wrapper.get('form').trigger('submit')

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('pages.enhanced_pack.cta_form.error')
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith('[benefits] waitlist submission failed:', error)

        consoleErrorSpy.mockRestore()
    })
})
