import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockAIProvider } from './mock-provider'

describe('MockAIProvider', () => {
    let provider: MockAIProvider

    beforeEach(() => {
        provider = new MockAIProvider()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should have a name', () => {
        expect(provider.name).toBe('mock')
    })

    it('should check successfully', async () => {
        expect(await provider.check()).toBe(true)
    })

    it('should throw error if messages are empty', async () => {
        await expect(provider.chat({ messages: [] })).rejects.toThrow('Messages cannot be empty')
    })

    it('should return mock response with usage', async () => {
        const promise = provider.chat({ messages: [{ role: 'user', content: 'Hello' }] })
        vi.runAllTimers()
        const res = await promise

        expect(res.content).toBe('This is a mock AI response for Demo mode.')
        expect(res.model).toBe('mock-demo-v1')
        expect(res.usage).toBeDefined()
        expect(res.usage?.totalTokens).toBe(370)
    })

    it('should detect title generation task', async () => {
        const promise = provider.chat({
            messages: [
                { role: 'system', content: 'Generate titles' },
                { role: 'user', content: 'something' },
            ],
        })
        vi.runAllTimers()
        const res = await promise
        const titles = JSON.parse(res.content)
        expect(Array.isArray(titles)).toBe(true)
        expect(titles.length).toBeGreaterThan(0)
    })

    it('should detect slug generation task', async () => {
        const promise = provider.chat({
            messages: [{ role: 'user', content: 'generate slug' }],
        })
        vi.runAllTimers()
        const res = await promise
        expect(res.content).toBe('momei-blog-demo-onboarding')
    })

    it('should detect translation task', async () => {
        const promise = provider.chat({
            messages: [{ role: 'user', content: 'Translate to English' }],
        })
        vi.runAllTimers()
        const res = await promise
        expect(res.content).toContain('simulated AI translation')
    })
})
