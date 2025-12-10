import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('API test', async () => {
    await setup({
        server: true,
    })

    it('GET /api/test', async () => {
        const res = await $fetch('/api/test')
        expect(res).toEqual({ message: 'Hello World!' })
    })
})
