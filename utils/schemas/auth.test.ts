import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from './auth'

describe('utils/schemas/auth', () => {
    describe('loginSchema', () => {
        it('应该验证有效的登录数据', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
            }

            const result = loginSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.email).toBe('test@example.com')
                expect(result.data.password).toBe('password123')
            }
        })

        it('应该拒绝空邮箱', () => {
            const invalidData = {
                email: '',
                password: 'password123',
            }

            const result = loginSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.login.email_required')
            }
        })

        it('应该拒绝空密码', () => {
            const invalidData = {
                email: 'test@example.com',
                password: '',
            }

            const result = loginSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.login.password_required')
            }
        })

        it('应该拒绝缺少邮箱字段', () => {
            const invalidData = {
                password: 'password123',
            }

            const result = loginSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少密码字段', () => {
            const invalidData = {
                email: 'test@example.com',
            }

            const result = loginSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受任何格式的邮箱字符串（不验证格式）', () => {
            const data = {
                email: 'not-an-email',
                password: 'password123',
            }

            const result = loginSchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })

    describe('registerSchema', () => {
        it('应该验证有效的注册数据', () => {
            const validData = {
                name: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                agreed: true,
            }

            const result = registerSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('testuser')
                expect(result.data.email).toBe('test@example.com')
                expect(result.data.password).toBe('password123')
                expect(result.data.confirmPassword).toBe('password123')
                expect(result.data.agreed).toBe(true)
            }
        })

        it('应该拒绝空用户名', () => {
            const invalidData = {
                name: '',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.register.name_required')
            }
        })

        it('应该拒绝空邮箱', () => {
            const invalidData = {
                name: 'testuser',
                email: '',
                password: 'password123',
                confirmPassword: 'password123',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.register.email_required')
            }
        })

        it('应该拒绝空密码', () => {
            const invalidData = {
                name: 'testuser',
                email: 'test@example.com',
                password: '',
                confirmPassword: '',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.register.password_required')
            }
        })

        it('应该拒绝空确认密码', () => {
            const invalidData = {
                name: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: '',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('pages.register.confirm_password_required')
            }
        })

        it('应该拒绝密码不匹配', () => {
            const invalidData = {
                name: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'different-password',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                const passwordMismatchError = result.error.issues.find(
                    (issue) => issue.path.includes('confirmPassword'),
                )
                expect(passwordMismatchError?.message).toBe('pages.register.password_mismatch')
            }
        })

        it('应该拒绝未同意协议', () => {
            const invalidData = {
                name: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                agreed: false,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('legal.agreement_required')
            }
        })

        it('应该拒绝缺少 agreed 字段', () => {
            const invalidData = {
                name: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝所有字段都为空', () => {
            const invalidData = {
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                agreed: false,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThan(0)
            }
        })

        it('应该验证密码匹配但其他字段无效', () => {
            const invalidData = {
                name: '',
                email: '',
                password: 'password123',
                confirmPassword: 'password123',
                agreed: true,
            }

            const result = registerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })
})
