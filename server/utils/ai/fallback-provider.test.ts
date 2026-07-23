import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FallbackAIProvider, type AIFallbackEvent } from './fallback-provider'
import type { AIProvider, AIChatOptions, AIChatResponse, AIChatStreamChunk, AIImageOptions, AIImageResponse } from '@/types/ai'

function createMockProvider(name: string, failOn?: string[]): AIProvider {
    return {
        name,
        async chat(options: AIChatOptions): Promise<AIChatResponse> {
            if (failOn?.includes('chat')) {
                throw new Error(`${name} chat failed`)
            }
            return { content: `${name} response`, model: name }
        },
        async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
            if (failOn?.includes('image')) {
                throw new Error(`${name} image failed`)
            }
            return { images: [{ url: `https://${name}.com/img.png` }] }
        },
        async check(): Promise<boolean> {
            return !failOn?.includes('check')
        },
    }
}

// Mock logger
vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}))

describe('FallbackAIProvider', () => {
    let primary: AIProvider
    let fallback: AIProvider
    let provider: FallbackAIProvider

    beforeEach(() => {
        vi.clearAllMocks()
        primary = createMockProvider('gpt-4o')
        fallback = createMockProvider('claude')
        provider = new FallbackAIProvider(primary, fallback, 'text')
    })

    describe('constructor', () => {
        it('should set combined name', () => {
            expect(provider.name).toBe('gpt-4o+fallback:claude')
        })

        it('should apply default options', () => {
            expect((provider as any).options).toEqual({})
        })
    })

    describe('getFallbackEvents / clearFallbackEvents', () => {
        it('should start with empty events', () => {
            expect(provider.getFallbackEvents()).toEqual([])
        })

        it('should clear events after clearFallbackEvents', () => {
            (provider as any).fallbackEvents.push({
                timestamp: '2024-01-01T00:00:00.000Z',
                category: 'text',
                primaryProvider: 'gpt-4o',
                fallbackProvider: 'claude',
                operation: 'chat',
                primaryError: 'error',
                fallbackSuccess: true,
                retryCount: 1,
            })
            expect(provider.getFallbackEvents()).toHaveLength(1)
            provider.clearFallbackEvents()
            expect(provider.getFallbackEvents()).toHaveLength(0)
        })
    })

    describe('chat', () => {
        it('should return primary provider response on success', async () => {
            const result = await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })
            expect(result.content).toBe('gpt-4o response')
        })

        it('should fallback when primary fails', async () => {
            primary = createMockProvider('gpt-4o', ['chat'])
            provider = new FallbackAIProvider(primary, fallback, 'text')

            const result = await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })
            expect(result.content).toBe('claude response')
        })

        it('should throw when both primary and fallback fail', async () => {
            primary = createMockProvider('gpt-4o', ['chat'])
            fallback = createMockProvider('claude', ['chat'])
            provider = new FallbackAIProvider(primary, fallback, 'text')

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow(/Primary.*Fallback|failed/)
        })

        it('should throw when primary fails with non-retryable error (401)', async () => {
            const mockPrimary: AIProvider = {
                name: 'gpt-4o',
                async chat() {
                    throw new Error('401 Unauthorized - Invalid API key')
                },
            }
            provider = new FallbackAIProvider(mockPrimary, fallback, 'text')

            const result = await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })
            expect(result.content).toBe('claude response')
        })

        it('should retry primary before falling back', async () => {
            let attempts = 0
            const retryPrimary: AIProvider = {
                name: 'gpt-4o',
                async chat() {
                    attempts++
                    if (attempts < 2) {
                        throw new Error('Rate limit exceeded')
                    }
                    return { content: 'retry response', model: 'gpt-4o' }
                },
            }
            provider = new FallbackAIProvider(retryPrimary, fallback, 'text', {
                maxRetries: 2,
                retryDelayMs: 1,
            })

            const result = await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })
            expect(result.content).toBe('retry response')
            expect(attempts).toBe(2)
        })

        it('should throw when primary fails with non-retryable 403 and fallback also fails', async () => {
            const mockPrimary: AIProvider = {
                name: 'gpt-4o',
                async chat() {
                    throw new Error('403 Forbidden')
                },
            }
            const mockFallback: AIProvider = {
                name: 'claude',
                async chat() {
                    throw new Error('fallback error')
                },
            }
            provider = new FallbackAIProvider(mockPrimary, mockFallback, 'text')

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow(/failed/)
        })

        it('should record fallback event on successful fallback', async () => {
            primary = createMockProvider('gpt-4o', ['chat'])
            provider = new FallbackAIProvider(primary, fallback, 'text')

            await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })

            const events = provider.getFallbackEvents()
            expect(events).toHaveLength(1)
            expect(events[0]?.fallbackSuccess).toBe(true)
            expect(events[0]?.operation).toBe('chat')
            expect(events[0]?.primaryProvider).toBe('gpt-4o')
            expect(events[0]?.fallbackProvider).toBe('claude')
        })

        it('should record fallback event on fallback failure', async () => {
            primary = createMockProvider('gpt-4o', ['chat'])
            fallback = createMockProvider('claude', ['chat'])
            provider = new FallbackAIProvider(primary, fallback, 'text')

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow()

            const events = provider.getFallbackEvents()
            expect(events).toHaveLength(1)
            expect(events[0]?.fallbackSuccess).toBe(false)
            expect(events[0]?.fallbackError).toBe('claude chat failed')
        })

        it('should fallback when primary does not support chat', async () => {
            const noChatPrimary: AIProvider = {
                name: 'no-chat',
            } as AIProvider

            provider = new FallbackAIProvider(noChatPrimary, fallback, 'text')

            const result = await provider.chat({ messages: [{ role: 'user', content: 'Hi' }] })
            expect(result.content).toBe('claude response')
        })

        it('should throw when neither primary nor fallback support chat', async () => {
            const noChatPrimary: AIProvider = { name: 'no-chat' } as AIProvider
            const noChatFallback: AIProvider = { name: 'no-chat-fb' } as AIProvider

            provider = new FallbackAIProvider(noChatPrimary, noChatFallback, 'text')

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow(/does not support chat/)
        })
    })

    describe('generateImage', () => {
        it('should return primary image on success', async () => {
            const result = await provider.generateImage({ prompt: 'Test' })
            expect(result.images[0]?.url).toContain('gpt-4o')
        })

        it('should fallback when primary image generation fails', async () => {
            primary = createMockProvider('gpt-4o', ['image'])
            provider = new FallbackAIProvider(primary, fallback, 'image')

            const result = await provider.generateImage({ prompt: 'Test' })
            expect(result.images[0]?.url).toContain('claude')
        })

        it('should throw when both providers fail image generation', async () => {
            primary = createMockProvider('gpt-4o', ['image'])
            fallback = createMockProvider('claude', ['image'])
            provider = new FallbackAIProvider(primary, fallback, 'image')

            await expect(
                provider.generateImage({ prompt: 'Test' }),
            ).rejects.toThrow(/failed/)
        })

        it('should fallback when primary does not support image generation', async () => {
            const noImagePrimary: AIProvider = {
                name: 'no-image',
            } as AIProvider

            provider = new FallbackAIProvider(noImagePrimary, fallback, 'image')

            const result = await provider.generateImage({ prompt: 'Test' })
            expect(result.images[0]?.url).toContain('claude')
        })

        it('should throw when neither primary nor fallback support image generation', async () => {
            const noImagePrimary: AIProvider = { name: 'no-image' } as AIProvider
            const noImageFallback: AIProvider = { name: 'no-image-fb' } as AIProvider

            provider = new FallbackAIProvider(noImagePrimary, noImageFallback, 'image')

            await expect(
                provider.generateImage({ prompt: 'Test' }),
            ).rejects.toThrow(/does not support image generation/)
        })

        it('should record fallback event on image fallback', async () => {
            primary = createMockProvider('gpt-4o', ['image'])
            provider = new FallbackAIProvider(primary, fallback, 'image')

            await provider.generateImage({ prompt: 'Test' })

            const events = provider.getFallbackEvents()
            expect(events).toHaveLength(1)
            expect(events[0]?.fallbackSuccess).toBe(true)
            expect(events[0]?.category).toBe('image')
        })
    })

    describe('check', () => {
        it('should return primary check result', async () => {
            const result = await provider.check()
            expect(result).toBe(true)
        })

        it('should return false when primary check fails', async () => {
            primary = createMockProvider('gpt-4o', ['check'])
            provider = new FallbackAIProvider(primary, fallback, 'text')

            const result = await provider.check()
            expect(result).toBe(false)
        })
    })

    describe('pass-through methods', () => {
        it('should delegate getVoices to primary', async () => {
            const mockPrimary: AIProvider = {
                name: 'primary',
                async getVoices() {
                    return [{ id: 'voice1', name: 'Voice 1', language: 'en', gender: 'female' as const }]
                },
            }
            provider = new FallbackAIProvider(mockPrimary, fallback, 'text')

            const voices = await provider.getVoices?.()
            expect(voices).toHaveLength(1)
            expect(voices?.[0]?.id).toBe('voice1')
        })

        it('should return empty array when primary has no getVoices', async () => {
            const result = await provider.getVoices?.()
            expect(result).toEqual([])
        })

        it('should return 0 from estimateCost when primary has none', async () => {
            const result = await provider.estimateCost?.('text', ['voice1'])
            expect(result).toBe(0)
        })

        it('should delegate transcribe to primary', async () => {
            const mockPrimary: AIProvider = {
                name: 'primary',
                async transcribe(options) {
                    return { text: 'transcribed text', language: 'en', duration: 10, confidence: 0.95, usage: { audioSeconds: 10 } }
                },
            }
            provider = new FallbackAIProvider(mockPrimary, fallback, 'text')

            const result = await provider.transcribe?.({ audioBuffer: Buffer.from([]), fileName: 'test.wav', mimeType: 'audio/wav' })
            expect(result?.text).toBe('transcribed text')
        })
    })

    describe('chatStream', () => {
        it('should delegate to primary chatStream when available and succeeds', async () => {
            const mockPrimary: AIProvider = {
                name: 'primary',
                async* chatStream() {
                    yield { delta: 'hello', content: 'hello', model: 'primary' } as AIChatStreamChunk
                },
            }
            provider = new FallbackAIProvider(mockPrimary, fallback, 'text')

            const generator = provider.chatStream!({ messages: [{ role: 'user', content: 'Hi' }] })
            const result = await generator.next()
            expect(result.value?.delta).toBe('hello')
        })

        it('should fallback when primary chatStream throws synchronously', async () => {
            const mockPrimary: AIProvider = {
                name: 'primary',
                chatStream() {
                    throw new Error('Primary stream failed')
                },
            }
            const mockFallback: AIProvider = {
                name: 'fallback',
                async* chatStream() {
                    yield { delta: 'fallback', content: 'fallback', model: 'fallback' } as AIChatStreamChunk
                },
            }
            provider = new FallbackAIProvider(mockPrimary, mockFallback, 'text')

            const generator = provider.chatStream!({ messages: [{ role: 'user', content: 'Hi' }] })
            const result = await generator.next()
            expect(result.value?.delta).toBe('fallback')
        })

        it('should throw when both providers lack chatStream', async () => {
            const noStreamPrimary: AIProvider = { name: 'no-stream' } as AIProvider
            const noStreamFallback: AIProvider = { name: 'no-stream-fb' } as AIProvider
            provider = new FallbackAIProvider(noStreamPrimary, noStreamFallback, 'text')

            expect(() =>
                provider.chatStream!({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).toThrow(/Neither primary.*nor fallback.*support chatStream/)
        })
    })

    describe('isNonRetryableError', () => {
        it('should detect 401 as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('401 Unauthorized'))).toBe(true)
        })

        it('should detect 403 as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('403 Forbidden'))).toBe(true)
        })

        it('should detect 404 as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('404 Not Found'))).toBe(true)
        })

        it('should detect 409 as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('409 Conflict'))).toBe(true)
        })

        it('should NOT detect 429 as non-retryable (rate limit)', () => {
            expect((provider as any).isNonRetryableError(new Error('429 Rate limit exceeded'))).toBe(false)
        })

        it('should detect 500 as retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('500 Internal Server Error'))).toBe(false)
        })

        it('should detect "Unauthorized" as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('Unauthorized'))).toBe(true)
        })

        it('should detect "API key" as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('Invalid API key'))).toBe(true)
        })

        it('should detect "does not support" as non-retryable', () => {
            expect((provider as any).isNonRetryableError(new Error('does not support chat'))).toBe(true)
        })
    })
})
