import { describe, it, expect } from 'vitest'
import { userApiKeySchema } from './user-api-key'

describe('utils/schemas/user-api-key', () => {
    describe('userApiKeySchema', () => {
        it('应该验证有效的 API Key 数据', () => {
            const validData = {
                name: 'My API Key',
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('My API Key')
                expect(result.data.expiresIn).toBe('30d')
            }
        })

        it('应该应用默认过期时间', () => {
            const minimalData = {
                name: 'My API Key',
            }

            const result = userApiKeySchema.safeParse(minimalData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.expiresIn).toBe('never')
            }
        })

        it('应该验证所有有效的过期时间选项', () => {
            const expiresInOptions = ['never', '7d', '30d', '365d']

            expiresInOptions.forEach((expiresIn) => {
                const data = {
                    name: 'Test Key',
                    expiresIn,
                }
                const result = userApiKeySchema.safeParse(data)
                expect(result.success).toBe(true)
                if (result.success) {
                    expect(result.data.expiresIn).toBe(expiresIn)
                }
            })
        })

        it('应该拒绝无效的过期时间选项', () => {
            const invalidData = {
                name: 'Test Key',
                expiresIn: '90d',
            }

            const result = userApiKeySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝空名称', () => {
            const invalidData = {
                name: '',
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长名称', () => {
            const invalidData = {
                name: 'a'.repeat(51),
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受最大长度的名称', () => {
            const validData = {
                name: 'a'.repeat(50),
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小长度的名称', () => {
            const validData = {
                name: 'a',
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝缺少名称字段', () => {
            const invalidData = {
                expiresIn: '30d',
            }

            const result = userApiKeySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受包含特殊字符的名称', () => {
            const validData = {
                name: 'My API Key - Production (v1.0)',
                expiresIn: 'never',
            }

            const result = userApiKeySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受中文名称', () => {
            const validData = {
                name: '我的API密钥',
                expiresIn: '7d',
            }

            const result = userApiKeySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })
    })
})
