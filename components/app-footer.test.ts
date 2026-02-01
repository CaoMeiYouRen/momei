import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppFooter from './app-footer.vue'

describe('AppFooter', () => {
    it('should render footer with logo and title', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                },
            },
        })

        expect(wrapper.find('.app-logo').exists()).toBe(true)
        expect(wrapper.find('.app-logo__img').exists()).toBe(true)
        expect(wrapper.find('.app-logo__title').exists()).toBe(true)
    })

    it('should render navigation links', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                },
            },
        })

        const links = wrapper.findAll('.footer__link')
        expect(links.length).toBeGreaterThan(0)
    })

    it('should render copyright text', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                },
            },
        })

        expect(wrapper.find('.footer__copyright').exists()).toBe(true)
    })

    it('should render ComplianceInfo component', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                },
            },
        })

        expect(wrapper.findComponent({ name: 'ComplianceInfo' }).exists()).toBe(true)
    })
})
