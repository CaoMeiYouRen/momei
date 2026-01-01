import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import type { DataSource } from 'typeorm'
import { generateRandomString } from '@/utils/shared/random'
import type { auth as Auth } from '@/lib/auth'

describe('Auth Flow (Direct API)', async () => {
    let auth: typeof Auth
    let dataSource: DataSource

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
            EMAIL_REQUIRE_VERIFICATION: 'false',
            DATABASE_ENTITY_PREFIX: 'momei_',
            NUXT_PUBLIC_AUTH_BASE_URL: 'http://localhost:3000',
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

        // Mock email service to avoid connection errors
        vi.mock('@/server/utils/email/service', () => ({
            emailService: {
                sendVerificationEmail: vi.fn().mockResolvedValue(true),
                sendLoginOTP: vi.fn().mockResolvedValue(true),
                sendEmailVerificationOTP: vi.fn().mockResolvedValue(true),
                sendPasswordResetOTP: vi.fn().mockResolvedValue(true),
                sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
                sendMagicLink: vi.fn().mockResolvedValue(true),
                sendEmailChangeVerification: vi.fn().mockResolvedValue(true),
            },
        }))

        // Dynamic import to ensure env vars are picked up
        const dbModule = await import('@/server/database/index')
        // The module export 'dataSource' is already awaited in the file, so it should be initialized
        dataSource = dbModule.dataSource

        // If initializeDB is idempotent, calling it again is fine, but we can just use the exported dataSource
        if (!dataSource.isInitialized) {
            await dataSource.initialize()
        }

        const authModule = await import('@/lib/auth')
        auth = authModule.auth
    }, 30000) // Increase timeout to 30s

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    const testUser = {
        username: `testuser-${Date.now()}`,
        email: `test-direct-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
    }

    it('should register and login using auth.api', async () => {
        // 1. Sign Up
        const signUpRes = await auth.api.signUpEmail({
            body: {
                email: testUser.email,
                password: testUser.password,
                name: testUser.name,
                username: testUser.username,
            },
        })

        expect(signUpRes).toBeDefined()
        expect(signUpRes.user).toBeDefined()
        expect(signUpRes.user.email).toBe(testUser.email)
        expect(signUpRes.token).toBeDefined()
        // better-auth signUpEmail might not return session if email verification is required or configured differently
        // But we disabled verification.
        // Let's check what it returns.
        // console.log('SignUp Res:', signUpRes)


        // 2. Sign In with Email
        const signInRes = await auth.api.signInEmail({
            body: {
                email: testUser.email,
                password: testUser.password,
            },
        })

        expect(signInRes).toBeDefined()
        expect(signInRes.user).toBeDefined()
        expect(signInRes.user.email).toBe(testUser.email)
        expect(signInRes?.token).toBeDefined()

        // 2. Sign In with Username
        const signInUsernameRes = await auth.api.signInUsername({
            body: {
                username: testUser.username,
                password: testUser.password,
            },
        })

        expect(signInUsernameRes).toBeDefined()
        expect(signInUsernameRes?.user).toBeDefined()
        expect(signInUsernameRes?.user?.username).toBe(testUser.username)
        expect(signInUsernameRes?.token).toBeDefined()

        // If session is not returned, it might be because we are not passing headers to store the cookie?
        // Or better-auth API behavior.
        // But user authentication is successful.

        // 3. Sign Out
        // Sign out requires headers/session to identify the session to revoke.
        // But auth.api.signOut might expect headers.
        // Since we don't have a real request context with cookies, testing signOut via API might be tricky
        // without mocking headers.
        // However, we can verify that we can get the session if we mock the headers.

        // For now, verifying SignUp and SignIn works confirms the integration with DB and better-auth logic.
    })
})
