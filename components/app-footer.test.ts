import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from './app-footer.vue'

describe('AppFooter', () => {
    it('should render footer with logo and title', () => {
        const wrapper = mount(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: {
                        template: '<a><slot /></a>',
                    },
                    ComplianceInfo: true,
                },
                mocks: {
                    $t: (key: string) => key,
                    localePath: (path: string) => path,
                },
            },
        })

        expect(wrapper.find('.footer__logo').exists()).toBe(true)
        expect(wrapper.find('.footer__logo-img').exists()).toBe(true)
        expect(wrapper.find('.footer__title').text()).toBe('components.footer.title')
    })

    it('should render navigation links', () => {
        const wrapper = mount(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: {
                        template: '<a><slot /></a>',
                    },
                    ComplianceInfo: true,
                },
                mocks: {
                    $t: (key: string) => key,
                    localePath: (path: string) => path,
                },
            },
        })

        const links = wrapper.findAll('.footer__link')
        expect(links.length).toBeGreaterThan(0)
    })

    it('should render copyright text', () => {
        const wrapper = mount(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: {
                        template: '<a><slot /></a>',
                    },
                    ComplianceInfo: true,
                },
                mocks: {
                    $t: (key: string) => key,
                    localePath: (path: string) => path,
                },
            },
        })

        expect(wrapper.find('.footer__copyright').exists()).toBe(true)
        expect(wrapper.find('.footer__copyright').text()).toBe('components.footer.copyright')
    })

    it('should render ComplianceInfo component', () => {
        const wrapper = mount(AppFooter, {
            global: {
                stubs: {
                    NuxtLink: {
                        template: '<a><slot /></a>',
                    },
                    ComplianceInfo: true,
                },
                mocks: {
                    $t: (key: string) => key,
                    localePath: (path: string) => path,
                },
            },
        })

        expect(wrapper.findComponent({ name: 'ComplianceInfo' }).exists()).toBe(true)
    })
})
