import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BenefitsPage from './benefits.vue'

describe('benefits page', () => {
    it('renders the hero section with real text (no raw keys)', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        const text = wrapper.text()

        expect(text).toMatch(/全球读者|worldwide/u)
        expect(text).not.toContain('pages.enhanced_pack.hero.title')
        expect(text).not.toContain('pages.enhanced_pack.hero.subtitle')
    })

    it('renders free core section heading', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        expect(wrapper.text()).toMatch(/开源|Open.?Source|Free Core/u)
        expect(wrapper.findAll('.capability-card')).toHaveLength(5)
    })

    it('renders premium section with 3 cards', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        expect(wrapper.findAll('.premium-card')).toHaveLength(3)
    })

    it('renders comparison table with 8 rows', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        const rows = wrapper.findAll('.comparison-table__row')
        expect(rows).toHaveLength(8)
    })

    it('renders FAQ section', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        expect(wrapper.findAll('.faq-item')).toHaveLength(4)
    })

    it('renders CTA form section', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        const form = wrapper.find('#cta-form')
        expect(form.exists()).toBe(true)
    })

    it('has a back link to home page', async () => {
        const wrapper = await mountSuspended(BenefitsPage)

        const backLink = wrapper.find('.back-link')
        expect(backLink.exists()).toBe(true)
    })
})
