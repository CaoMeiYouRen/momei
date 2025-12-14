import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { generateRandomString } from '../../../utils/shared/random'

describe('API test', async () => {
    await setup({
        // server: true,
        // dev: true,
        port: 3001,
        env: {
            DATABASE_TYPE: 'sqlite',
            DATABASE_PATH: ':memory:',
            LOGFILES: 'false',
            LOG_LEVEL: 'error',
            AUTH_SECRET: generateRandomString(32),
            NODE_ENV: 'test',
        },
    })

    it('GET /api/auth/ok', async () => {
        const res = await $fetch('/api/auth/ok')
        expect(res).toEqual({ ok: true })
    })
})
