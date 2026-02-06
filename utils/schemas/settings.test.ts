import { describe, it, expect } from 'vitest'
import { themeUpdateSchema } from './settings'

describe('utils/schemas/settings', () => {
    describe('themeUpdateSchema', () => {
        it('应该验证有效的主题更新数据', () => {
            const validData = {
                themePreset: 'default',
                themePrimaryColor: '#3b82f6',
                themeAccentColor: '#10b981',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.themePreset).toBe('default')
                expect(result.data.themePrimaryColor).toBe('#3b82f6')
                expect(result.data.themeAccentColor).toBe('#10b981')
            }
        })

        it('应该允许所有字段为可选', () => {
            const emptyData = {}

            const result = themeUpdateSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
        })

        it('应该验证有效的 HEX 颜色（6位）', () => {
            const validData = {
                themePrimaryColor: '#ff5733',
                themeAccentColor: '#33ff57',
                themeSurfaceColor: '#3357ff',
                themeTextColor: '#000000',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证有效的 HEX 颜色（3位）', () => {
            const validData = {
                themePrimaryColor: '#f53',
                themeAccentColor: '#3f5',
                themeSurfaceColor: '#35f',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证暗色模式颜色', () => {
            const validData = {
                themeDarkPrimaryColor: '#1e40af',
                themeDarkAccentColor: '#059669',
                themeDarkSurfaceColor: '#1f2937',
                themeDarkTextColor: '#f9fafb',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证有效的 Logo URL', () => {
            const validData = {
                themeLogoUrl: '/uploads/logo.png',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证有效的 Favicon URL', () => {
            const validData = {
                themeFaviconUrl: '/uploads/favicon.ico',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝无效的 Logo URL', () => {
            const invalidData = {
                themeLogoUrl: 'javascript:alert(1)',
            }

            const result = themeUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('Logo URL source is not in the whitelist')
            }
        })

        it('应该拒绝无效的 Favicon URL', () => {
            const invalidData = {
                themeFaviconUrl: 'ftp://example.com/favicon.ico',
            }

            const result = themeUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('Favicon URL source is not in the whitelist')
            }
        })

        it('应该接受 null 值', () => {
            const validData = {
                themePreset: null,
                themePrimaryColor: null,
                themeLogoUrl: null,
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证哀悼模式为布尔值', () => {
            const validData = {
                themeMourningMode: true,
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证哀悼模式为字符串', () => {
            const validData = {
                themeMourningMode: 'true',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证边框圆角', () => {
            const validData = {
                themeBorderRadius: '8px',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证背景类型', () => {
            const validData = {
                themeBackgroundType: 'color',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证背景值为 HEX 颜色', () => {
            const validData = {
                themeBackgroundValue: '#ffffff',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证背景值为 URL', () => {
            const validData = {
                themeBackgroundValue: '/uploads/background.jpg',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝无效的背景值（既不是颜色也不是有效 URL）', () => {
            const invalidData = {
                themeBackgroundValue: 'invalid-value',
            }

            const result = themeUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe(
                    'Background value must be a valid HEX color or a whitelisted URL',
                )
            }
        })

        it('应该拒绝无效的 HEX 颜色格式', () => {
            const invalidData = {
                themeBackgroundValue: '#gggggg',
            }

            const result = themeUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证完整的主题配置', () => {
            const validData = {
                themePreset: 'ocean',
                themePrimaryColor: '#0ea5e9',
                themeAccentColor: '#06b6d4',
                themeSurfaceColor: '#f0f9ff',
                themeTextColor: '#0c4a6e',
                themeDarkPrimaryColor: '#0284c7',
                themeDarkAccentColor: '#0891b2',
                themeDarkSurfaceColor: '#082f49',
                themeDarkTextColor: '#e0f2fe',
                themeBorderRadius: '12px',
                themeLogoUrl: '/uploads/logo.svg',
                themeFaviconUrl: '/uploads/favicon.png',
                themeMourningMode: false,
                themeBackgroundType: 'color',
                themeBackgroundValue: '#ffffff',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证部分主题配置', () => {
            const validData = {
                themePrimaryColor: '#3b82f6',
                themeLogoUrl: '/uploads/new-logo.png',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受大写的 HEX 颜色', () => {
            const validData = {
                themePrimaryColor: '#FF5733',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受混合大小写的 HEX 颜色', () => {
            const validData = {
                themePrimaryColor: '#Ff5733',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝不带 # 的颜色值', () => {
            const invalidData = {
                themeBackgroundValue: 'ff5733',
            }

            const result = themeUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证 data URL 作为 Logo', () => {
            const validData = {
                themeLogoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
            }

            const result = themeUpdateSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })
    })
})
