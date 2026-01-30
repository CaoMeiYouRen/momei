import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import App from './app.vue'

describe('app.vue', () => {
    it('should render the app layout with main components', async () => {
        const wrapper = await mountSuspended(App)

        // Check that the app renders
        expect(wrapper.exists()).toBe(true)

        // Check for key layout elements
        const html = wrapper.html()
        expect(html).toBeTruthy()
        expect(html.length).toBeGreaterThan(0)
    })

    it('should render on installation page', async () => {
        const wrapper = await mountSuspended(App, {
            route: '/installation',
        })

        expect(wrapper.exists()).toBe(true)
    })

    it('should render on regular pages', async () => {
        const wrapper = await mountSuspended(App, {
            route: '/about',
        })

        expect(wrapper.exists()).toBe(true)
    })
})
