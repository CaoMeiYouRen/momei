import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RssIcon from './rss-icon.vue'

describe('RssIcon', () => {
    it('renders the expected svg structure', async () => {
        const wrapper = await mountSuspended(RssIcon)

        expect(wrapper.find('svg.rss-icon').exists()).toBe(true)
        expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 24 24')
        expect(wrapper.findAll('path')).toHaveLength(2)
        expect(wrapper.find('circle').attributes()).toEqual(expect.objectContaining({
            cx: '5',
            cy: '19',
            r: '1',
            fill: 'currentColor',
        }))
    })
})
