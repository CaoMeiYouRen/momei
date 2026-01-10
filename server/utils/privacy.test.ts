import { describe, it, expect, vi, afterEach } from 'vitest'
import { maskEmail, maskPhone, maskUserId, maskIP, maskString, createSafeLogData } from './privacy'

describe('server/utils/privacy.ts', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    describe('maskEmail', () => {
        it('should handle non-string or empty input', () => {
            // @ts-expect-error test non-string
            expect(maskEmail(null)).toBe(null)
            // @ts-expect-error test non-string
            expect(maskEmail(undefined)).toBe(undefined)
            expect(maskEmail('')).toBe('')
        })

        it('should not mask in development', () => {
            vi.stubEnv('NODE_ENV', 'development')
            expect(maskEmail('test@example.com')).toBe('test@example.com')
        })

        it('should mask in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            expect(maskEmail('test@example.com')).toBe('t**t@example.com')
        })
    })

    describe('maskPhone', () => {
        it('should handle non-string or empty input', () => {
            // @ts-expect-error test non-string
            expect(maskPhone(null)).toBe(null)
            // @ts-expect-error test non-string
            expect(maskPhone(undefined)).toBe(undefined)
            expect(maskPhone('')).toBe('')
        })

        it('should not mask in development', () => {
            vi.stubEnv('NODE_ENV', 'development')
            expect(maskPhone('13800138000')).toBe('13800138000')
        })

        it('should mask in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            expect(maskPhone('+8613800138000')).toBe('+86 138 **** 8000')
        })
    })

    describe('maskUserId', () => {
        it('should handle non-string or empty input', () => {
            // @ts-expect-error test non-string
            expect(maskUserId(null)).toBe(null)
            // @ts-expect-error test non-string
            expect(maskUserId(undefined)).toBe(undefined)
            expect(maskUserId('')).toBe('')
        })

        it('should not mask in development', () => {
            vi.stubEnv('NODE_ENV', 'development')
            expect(maskUserId('1234567890')).toBe('1234567890')
        })

        it('should mask in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            expect(maskUserId('1234567890')).toBe('1234****7890')
        })
    })

    describe('maskIP', () => {
        it('should handle non-string or empty input', () => {
            // @ts-expect-error test non-string
            expect(maskIP(null)).toBe(null)
            // @ts-expect-error test non-string
            expect(maskIP(undefined)).toBe(undefined)
            expect(maskIP('')).toBe('')
        })

        it('should not mask in development', () => {
            vi.stubEnv('NODE_ENV', 'development')
            expect(maskIP('192.168.1.1')).toBe('192.168.1.1')
        })

        it('should mask in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            expect(maskIP('192.168.1.1')).toBe('192.168.1.***')
        })
    })

    describe('maskString', () => {
        it('should handle non-string or empty input', () => {
            // @ts-expect-error test non-string
            expect(maskString(null)).toBe(null)
            // @ts-expect-error test non-string
            expect(maskString(undefined)).toBe(undefined)
            expect(maskString('')).toBe('')
        })

        it('should not mask in development', () => {
            vi.stubEnv('NODE_ENV', 'development')
            expect(maskString('secret')).toBe('secret')
        })

        it('should mask in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            expect(maskString('secret')).toBe('se***et')
        })
    })

    describe('createSafeLogData', () => {
        it('should handle null or undefined fields', () => {
            const data = {
                a: null,
                b: undefined,
                c: 'test',
            }
            expect(createSafeLogData(data)).toEqual(data)
        })

        it('should mask sensitive fields in production', () => {
            vi.stubEnv('NODE_ENV', 'production')
            const data = {
                email: 'test@example.com',
                phone: '13800138000',
                userId: '1234567890',
                ip: '127.0.0.1',
                password: 'password123',
                token: 'token123',
                secret: 'secret123',
                apiKey: 'key123',
                other: 'normal',
            }
            const safeData = createSafeLogData(data)
            expect(safeData.email).toBe('t**t@example.com')
            expect(safeData.phone).toBe('+86 138 **** 8000')
            expect(safeData.userId).toBe('1234****7890')
            expect(safeData.ip).toBe('127.0.0.***')
            expect(safeData.password).toBe('[REDACTED]')
            expect(safeData.token).toBe('[REDACTED]')
            expect(safeData.secret).toBe('[REDACTED]')
            expect(safeData.apiKey).toBe('[REDACTED]')
            expect(safeData.other).toBe('normal')
        })

        it('should handle alias keys', () => {
            vi.stubEnv('NODE_ENV', 'production')
            const data = {
                mail: 'test@example.com',
                mobile: '13800138000',
                uid: '1234567890',
                addr: '8.8.8.8',
            }
            const safeData = createSafeLogData(data)
            expect(safeData.mail).toBe('t**t@example.com')
            expect(safeData.mobile).toBe('+86 138 **** 8000')
            expect(safeData.uid).toBe('1234****7890')
            expect(safeData.addr).toBe('8.8.8.***')
        })
    })
})
