import { describe, it, expect } from 'vitest'
import { audioProbeQuerySchema } from './audio'

describe('utils/schemas/audio', () => {
    describe('audioProbeQuerySchema', () => {
        it('应该接受有效的音频 URL', () => {
            const validData = {
                url: 'https://example.com/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.url).toBe('https://example.com/audio.mp3')
            }
        })

        it('应该接受 HTTP URL', () => {
            const data = {
                url: 'http://example.com/audio.wav',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.url).toBe('http://example.com/audio.wav')
            }
        })

        it('应该接受 HTTPS URL', () => {
            const data = {
                url: 'https://cdn.example.com/audio.ogg',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝无效的 URL', () => {
            const invalidData = {
                url: 'not-a-valid-url',
            }
            const result = audioProbeQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝空 URL', () => {
            const invalidData = {
                url: '',
            }
            const result = audioProbeQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少 URL 的数据', () => {
            const invalidData = {}
            const result = audioProbeQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受 FTP URL（z.url() 允许多种协议）', () => {
            const data = {
                url: 'ftp://example.com/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受带查询参数的 URL', () => {
            const data = {
                url: 'https://example.com/audio.mp3?v=1&token=abc',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.url).toBe('https://example.com/audio.mp3?v=1&token=abc')
            }
        })

        it('应该接受带片段的 URL', () => {
            const data = {
                url: 'https://example.com/audio.mp3#t=10',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受带端口号的 URL', () => {
            const data = {
                url: 'https://example.com:8080/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受带认证信息的 URL', () => {
            const data = {
                url: 'https://user:pass@example.com/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受 IP 地址的 URL', () => {
            const data = {
                url: 'https://192.168.1.1/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝没有协议的 URL', () => {
            const invalidData = {
                url: 'example.com/audio.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受带路径的复杂 URL', () => {
            const data = {
                url: 'https://cdn.example.com/static/assets/audio/2024/04/test.mp3',
            }
            const result = audioProbeQuerySchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })
})
