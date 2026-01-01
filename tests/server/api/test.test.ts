import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { generateRandomString } from '@/utils/shared/random'

describe('API test', async () => {
    await setup({
        server: false,
        dev: true,
        env: {
            DATABASE_TYPE: 'sqlite',
            DATABASE_PATH: ':memory:',
            LOGFILES: 'false',
            LOG_LEVEL: 'error',
            AUTH_SECRET: 'test_secret_1234567890_abcdefghij',
            NODE_ENV: 'test',
        },
    })

    it('GET /api/auth/ok', async () => {
        const res = await $fetch('/api/auth/ok')
        expect(res).toEqual({ ok: true })
    })
})
