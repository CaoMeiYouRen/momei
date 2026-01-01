import { describe, it, expect, vi, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { generateRandomString } from '@/utils/shared/random'

describe.skip('API test', async () => {
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

    beforeAll(async () => {
        // Ensure env vars are set for direct imports, in case setup() env doesn't propagate to process.env immediately
        vi.stubEnv('DATABASE_TYPE', 'sqlite')
        vi.stubEnv('DATABASE_PATH', ':memory:')
        vi.stubEnv('LOGFILES', 'false')
        vi.stubEnv('LOG_LEVEL', 'error')
        vi.stubEnv('AUTH_SECRET', 'test_secret_1234567890_abcdefghij')
        vi.stubEnv('NODE_ENV', 'test')
        vi.stubEnv('EMAIL_REQUIRE_VERIFICATION', 'false')
        vi.stubEnv('DATABASE_ENTITY_PREFIX', 'momei_')
        vi.stubEnv('NUXT_PUBLIC_AUTH_BASE_URL', 'http://localhost:3000')
    })

    it('GET /api/auth/ok', async () => {
        const res = await $fetch('/api/auth/ok')
        expect(res).toEqual({ ok: true })
    })
})
