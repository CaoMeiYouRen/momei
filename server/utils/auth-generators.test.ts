import { describe, it, expect } from 'vitest'
import {
    getTempEmail,
    getTempName,
    generateClientId,
    generateClientSecret,
} from './auth-generators'
import { TEMP_EMAIL_DOMAIN_NAME } from '@/utils/shared/env'

describe('auth-generators.ts', () => {
    describe('getTempEmail', () => {
        it('should generate email with correct domain', () => {
            const email = getTempEmail()
            expect(email).toContain(`@${TEMP_EMAIL_DOMAIN_NAME}`)
        })
    })

    describe('getTempName', () => {
        it('should generate name starting with user-', () => {
            const name = getTempName()
            expect(name).toMatch(/^user-/)
        })
    })

    describe('generateClientId', () => {
        it('should generate 16 char lowercase string', () => {
            const id = generateClientId()
            expect(id).toHaveLength(16)
            expect(id).toMatch(/^[a-z0-9]+$/)
        })
    })

    describe('generateClientSecret', () => {
        it('should generate secret', () => {
            const secret = generateClientSecret()
            expect(secret).toBeDefined()
            expect(secret.length).toBeGreaterThan(0)
        })
    })
})
