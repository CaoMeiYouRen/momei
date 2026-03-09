import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TravellingsLink from './travellings-link.vue'

const mockSiteConfig = ref({
    travellingsEnabled: true,
    travellingsHeaderEnabled: true,
    travellingsFooterEnabled: true,
    travellingsSidebarEnabled: true,
})

vi.mock('@/composables/use-momei-config', () => ({
    useMomeiConfig: vi.fn(() => ({
        siteConfig: mockSiteConfig,
    })),
}))

describe('TravellingsLink', () => {
    beforeEach(() => {
        mockSiteConfig.value = {
            travellingsEnabled: true,
            travellingsHeaderEnabled: true,
            travellingsFooterEnabled: true,
            travellingsSidebarEnabled: true,
        }
    })

    it('renders external link when the placement is enabled', async () => {
        const wrapper = await mountSuspended(TravellingsLink, {
            props: {
                placement: 'header',
            },
        })

        const link = wrapper.find('a')
        expect(link.exists()).toBe(true)
        expect(link.attributes('href')).toBe('https://www.travellings.cn/go.html')
        expect(link.attributes('target')).toBe('_blank')
        expect(link.classes()).toContain('travellings-link--header')
        expect(wrapper.find('.pi-external-link').exists()).toBe(true)
    })

    it('hides itself when the placement switch is off', async () => {
        mockSiteConfig.value.travellingsSidebarEnabled = false

        const wrapper = await mountSuspended(TravellingsLink, {
            props: {
                placement: 'sidebar',
            },
        })

        expect(wrapper.find('a').exists()).toBe(false)
    })

    it('hides itself when the global switch is off', async () => {
        mockSiteConfig.value.travellingsEnabled = false

        const wrapper = await mountSuspended(TravellingsLink, {
            props: {
                placement: 'footer',
            },
        })

        expect(wrapper.find('a').exists()).toBe(false)
    })
})
