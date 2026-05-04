import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AdPlacement from './ad-placement.vue'

const { placementDataRef, pendingRef, scriptDataRef, useFetchMock } = vi.hoisted(() => ({
    placementDataRef: { __v_isRef: true, value: null as any },
    pendingRef: { __v_isRef: true, value: false },
    scriptDataRef: { __v_isRef: true, value: null as any },
    useFetchMock: vi.fn(),
}))

vi.mock('#app', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app')>()

    return {
        ...actual,
        useFetch: useFetchMock,
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            locale: {
                __v_isRef: true,
                value: 'zh-CN',
            },
        }),
    }
})

async function mountComponent(props?: Record<string, unknown>) {
    return mountSuspended(AdPlacement, {
        props: {
            location: 'content_top',
            ...props,
        },
        global: {
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('AdPlacement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        placementDataRef.value = null
        pendingRef.value = false
        scriptDataRef.value = null
        document.head.querySelectorAll('script[data-ad-adapter]').forEach((node) => node.remove())

        useFetchMock.mockImplementation((input: string | (() => string)) => {
            const url = typeof input === 'function' ? input() : input

            if (url.startsWith('/api/ads/placements?')) {
                return {
                    data: placementDataRef,
                    pending: pendingRef,
                }
            }

            if (url.startsWith('/api/ads/script?adapter=')) {
                return {
                    data: scriptDataRef,
                }
            }

            throw new Error(`Unexpected request: ${url}`)
        })
    })

    it('does not render when the placement is still loading or missing', async () => {
        pendingRef.value = true
        const loadingWrapper = await mountComponent()

        expect(loadingWrapper.find('.ad-placement').exists()).toBe(false)

        pendingRef.value = false
        placementDataRef.value = null
        const emptyWrapper = await mountComponent()

        expect(emptyWrapper.find('.ad-placement').exists()).toBe(false)
    })

    it('requests the placement with locale and taxonomy context, then renders the ad html', async () => {
        placementDataRef.value = {
            id: 'placement-1',
            name: 'Top banner',
            location: 'content_top',
            format: 'html',
            adapterId: 'adsense',
            metadata: {
                slot: 'slot-top',
            },
            customCss: 'display:block;',
        }

        const wrapper = await mountComponent({
            showLabel: true,
            context: {
                categories: ['news', 'release'],
                tags: ['nuxt', 'vitest'],
            },
        })

        const placementCall = useFetchMock.mock.calls.find((call) => typeof call[0] === 'function')
        expect(placementCall).toBeDefined()
        const placementUrl = placementCall?.[0]()
        expect(placementUrl).toContain('location=content_top')
        expect(placementUrl).toContain('locale=zh-CN')
        expect(placementUrl).toContain('categories=news')
        expect(placementUrl).toContain('categories=release')
        expect(placementUrl).toContain('tags=nuxt')
        expect(placementUrl).toContain('tags=vitest')

        expect(wrapper.find('.ad-placement').exists()).toBe(true)
        expect(wrapper.find('.ad-placement__label').text()).toContain('common.advertisement')
        expect(wrapper.find('.ad-placement__content').attributes('data-ad-location')).toBe('content_top')
        expect(wrapper.find('.ad-placement').attributes('style')?.replaceAll(' ', '')).toContain('display:block;')
        expect(wrapper.find('.ad-placement__content').html()).toContain('data-adapter="adsense"')
        expect(wrapper.find('.ad-placement__content').html()).toContain('data-slot="slot-top"')
    })

    it('loads the adapter script once when the placement requires it', async () => {
        placementDataRef.value = {
            id: 'placement-1',
            name: 'Top banner',
            location: 'content_top',
            format: 'html',
            adapterId: 'adsense',
            metadata: {
                slot: 'slot-top',
            },
            customCss: null,
        }
        scriptDataRef.value = {
            script: 'window.__adPlacementLoaded = true',
        }

        await mountComponent()

        await vi.waitFor(() => {
            expect(useFetchMock.mock.calls.some((call) => call[0] === '/api/ads/script?adapter=adsense')).toBe(true)
        })

        const script = document.head.querySelector('script[data-ad-adapter="adsense"]') as HTMLScriptElement | null
        expect(script).not.toBeNull()
        expect(script?.innerHTML).toBe('window.__adPlacementLoaded = true')
    })

    it('skips duplicate script injection and warns when script loading fails', async () => {
        placementDataRef.value = {
            id: 'placement-1',
            name: 'Top banner',
            location: 'content_top',
            format: 'html',
            adapterId: 'adsense',
            metadata: {},
            customCss: null,
        }

        const existingScript = document.createElement('script')
        existingScript.setAttribute('data-ad-adapter', 'adsense')
        document.head.appendChild(existingScript)

        await mountComponent()

        expect(useFetchMock.mock.calls.some((call) => call[0] === '/api/ads/script?adapter=adsense')).toBe(false)

        existingScript.remove()
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        useFetchMock.mockImplementation((input: string | (() => string)) => {
            const url = typeof input === 'function' ? input() : input

            if (url.startsWith('/api/ads/placements?')) {
                return {
                    data: placementDataRef,
                    pending: pendingRef,
                }
            }

            if (url === '/api/ads/script?adapter=adsense') {
                throw new Error('script fetch failed')
            }

            throw new Error(`Unexpected request: ${url}`)
        })

        await mountComponent()

        await vi.waitFor(() => {
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load ad adapter script: adsense', expect.any(Error))
        })

        consoleWarnSpy.mockRestore()
    })
})
