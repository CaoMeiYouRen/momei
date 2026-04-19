import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ComplianceInfo from './compliance-info.vue'

const { siteConfigRef } = vi.hoisted(() => ({
    siteConfigRef: {
        __v_isRef: true,
        value: {
            showComplianceInfo: false,
            icpLicenseNumber: '',
            publicSecurityNumber: '',
        },
    },
}))

mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: siteConfigRef,
}))

const NuxtLinkStub = {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
}

describe('ComplianceInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        siteConfigRef.value = {
            showComplianceInfo: false,
            icpLicenseNumber: '',
            publicSecurityNumber: '',
        }
    })

    it('stays hidden when compliance display is disabled or no numbers exist', async () => {
        const hiddenWrapper = await mountSuspended(ComplianceInfo, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        expect(hiddenWrapper.find('.compliance-info').exists()).toBe(false)

        siteConfigRef.value = {
            showComplianceInfo: true,
            icpLicenseNumber: '',
            publicSecurityNumber: '',
        }

        const emptyWrapper = await mountSuspended(ComplianceInfo, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        expect(emptyWrapper.find('.compliance-info').exists()).toBe(false)
    })

    it('renders localized compliance links for icp and police registrations', async () => {
        siteConfigRef.value = {
            showComplianceInfo: true,
            icpLicenseNumber: '京ICP备12345678号',
            publicSecurityNumber: '京公网安备11000002000001号',
        }

        const wrapper = await mountSuspended(ComplianceInfo, {
            global: {
                stubs: {
                    NuxtLink: NuxtLinkStub,
                },
            },
        })

        const links = wrapper.findAll('a')
        expect(links).toHaveLength(2)
        expect(links[0]!.attributes('href')).toBe('https://beian.miit.gov.cn/#/query/webSearch?site=京ICP备12345678号')
        expect(links[1]!.attributes('href')).toBe('https://beian.mps.gov.cn/')
        expect(wrapper.text()).toContain('京ICP备12345678号')
        expect(wrapper.text()).toContain('京公网安备11000002000001号')
    })
})