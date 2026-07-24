import { describe, it, expect } from 'vitest'
import {
    createUsageAggregate,
    normalizeScopes,
    normalizeSlugStrategy,
    normalizeCategoryStrategy,
    normalizeConfirmationMode,
    sanitizeSlug,
    parseTaskPayload,
    parseTaskResult,
    mergeAudioMetadata,
    normalizeMetadataForPostInput,
} from './post-automation-helpers'
import type { PostTranslationSourceDetail } from '@/types/post-translation'

describe('post-automation-helpers', () => {
    describe('createUsageAggregate', () => {
        it('should return zero-initialized aggregate', () => {
            const result = createUsageAggregate()
            expect(result).toEqual({
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                requestCount: 0,
                textChars: 0,
                outputChars: 0,
            })
        })
    })

    describe('normalizeScopes', () => {
        it('should filter valid scopes only', () => {
            const result = normalizeScopes(['title', 'content', 'invalid' as any])
            expect(result).toEqual(['title', 'content'])
        })

        it('should deduplicate scopes', () => {
            const result = normalizeScopes(['title', 'category', 'title'])
            expect(result).toEqual(['title', 'category'])
        })

        it('should return all default scopes when input is undefined', () => {
            const result = normalizeScopes()
            expect(result).toContain('title')
            expect(result).toContain('content')
            expect(result).toContain('summary')
            expect(result).toContain('category')
        })

        it('should return empty array when input is empty array (no valid scopes match)', () => {
            const result = normalizeScopes([])
            expect(result).toEqual([])
        })
    })

    describe('normalizeSlugStrategy', () => {
        it('should return provided strategy', () => {
            expect(normalizeSlugStrategy('translate')).toBe('translate')
            expect(normalizeSlugStrategy('ai')).toBe('ai')
        })

        it('should default to source', () => {
            expect(normalizeSlugStrategy()).toBe('source')
            expect(normalizeSlugStrategy(undefined)).toBe('source')
        })
    })

    describe('normalizeCategoryStrategy', () => {
        it('should return provided strategy', () => {
            expect(normalizeCategoryStrategy('suggest')).toBe('suggest')
        })

        it('should default to cluster', () => {
            expect(normalizeCategoryStrategy()).toBe('cluster')
            expect(normalizeCategoryStrategy(undefined)).toBe('cluster')
        })
    })

    describe('normalizeConfirmationMode', () => {
        it('should return provided mode', () => {
            expect(normalizeConfirmationMode('require')).toBe('require')
            expect(normalizeConfirmationMode('confirmed')).toBe('confirmed')
        })

        it('should default to auto', () => {
            expect(normalizeConfirmationMode()).toBe('auto')
            expect(normalizeConfirmationMode(undefined)).toBe('auto')
        })
    })

    describe('sanitizeSlug', () => {
        it('should lowercase and trim slug', () => {
            expect(sanitizeSlug('  Hello World  ')).toBe('hello-world')
        })

        it('should replace special characters with hyphens', () => {
            expect(sanitizeSlug('hello@world#test')).toBe('hello-world-test')
        })

        it('should collapse multiple hyphens', () => {
            expect(sanitizeSlug('hello---world')).toBe('hello-world')
        })

        it('should trim leading and trailing hyphens', () => {
            expect(sanitizeSlug('--hello-world--')).toBe('hello-world')
        })

        it('should return default slug for empty input', () => {
            expect(sanitizeSlug('')).toBe('translated-post')
        })

        it('should return default slug for null input', () => {
            expect(sanitizeSlug(null)).toBe('translated-post')
        })

        it('should return default slug for undefined input', () => {
            expect(sanitizeSlug(undefined)).toBe('translated-post')
        })

        it('should return default slug for input with only special chars', () => {
            expect(sanitizeSlug('!!!')).toBe('translated-post')
        })
    })

    describe('parseTaskPayload', () => {
        it('should parse string payload', () => {
            const payload = JSON.stringify({ sourcePostId: 'post-1', targetLanguage: 'en-US' })
            const result = parseTaskPayload({ payload } as any)
            expect(result.sourcePostId).toBe('post-1')
            expect(result.targetLanguage).toBe('en-US')
        })

        it('should return object payload as-is', () => {
            const payload = { sourcePostId: 'post-1', targetLanguage: 'en-US' }
            const result = parseTaskPayload({ payload } as any)
            expect(result).toEqual(payload)
        })

        it('should throw error when payload is null', () => {
            expect(() => parseTaskPayload({ payload: null } as any)).toThrow('Task payload is required')
        })

        it('should throw error when payload is undefined', () => {
            expect(() => parseTaskPayload({} as any)).toThrow('Task payload is required')
        })
    })

    describe('parseTaskResult', () => {
        it('should return null for null input', () => {
            expect(parseTaskResult(null)).toBeNull()
        })

        it('should return null for undefined input', () => {
            expect(parseTaskResult(undefined)).toBeNull()
        })

        it('should parse JSON string result', () => {
            const result = parseTaskResult(JSON.stringify({ key: 'value' }))
            expect(result).toEqual({ key: 'value' })
        })

        it('should return non-string result as-is', () => {
            const obj = { existing: true }
            const result = parseTaskResult(obj as any)
            expect(result).toBe(obj)
        })
    })

    describe('mergeAudioMetadata', () => {
        it('should merge audio from metadata object', () => {
            const source = {
                metadata: { audio: { url: 'audio.mp3', duration: 120 } },
            } as any as PostTranslationSourceDetail
            const result = mergeAudioMetadata(source)
            expect(result).toEqual({ audio: { url: 'audio.mp3', duration: 120 } })
        })

        it('should create audio from fallback audioUrl fields', () => {
            const source = {
                audioUrl: 'podcast.mp3',
                audioDuration: 300,
                audioSize: 1024,
                audioMimeType: 'audio/mpeg',
            } as any as PostTranslationSourceDetail
            const result = mergeAudioMetadata(source)
            expect(result).toEqual({
                audio: {
                    url: 'podcast.mp3',
                    duration: 300,
                    size: 1024,
                    mimeType: 'audio/mpeg',
                },
            })
        })

        it('should preserve existing audio metadata as-is', () => {
            const source = {
                metadata: { audio: { url: 'old.mp3', duration: 60 }, cover: 'cover.jpg' },
            } as any as PostTranslationSourceDetail
            const result = mergeAudioMetadata(source)
            expect(result).toEqual({ audio: { url: 'old.mp3', duration: 60 }, cover: 'cover.jpg' })
        })

        it('should remove audio from metadata when both audio and audioUrl are absent', () => {
            const source = {
                metadata: { cover: 'cover.jpg' },
            } as any as PostTranslationSourceDetail
            const result = mergeAudioMetadata(source)
            expect(result).toEqual({ cover: 'cover.jpg' })
            expect(result).not.toHaveProperty('audio')
        })

        it('should return null when metadata is empty after processing', () => {
            const source = {} as any as PostTranslationSourceDetail
            const result = mergeAudioMetadata(source)
            expect(result).toBeNull()
        })
    })

    describe('normalizeMetadataForPostInput', () => {
        it('should return null for null metadata', () => {
            expect(normalizeMetadataForPostInput(null)).toBeNull()
        })

        it('should return undefined for undefined metadata', () => {
            expect(normalizeMetadataForPostInput(undefined)).toBeUndefined()
        })

        it('should convert date strings to Date objects in cover', () => {
            const input = {
                cover: { url: 'cover.jpg', generatedAt: '2026-01-01T00:00:00.000Z' },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.cover!.generatedAt).toBeInstanceOf(Date)
            expect((result!.cover!.generatedAt as Date).toISOString()).toBe('2026-01-01T00:00:00.000Z')
        })

        it('should keep existing Date objects as-is', () => {
            const date = new Date('2026-06-15')
            const input = {
                cover: { url: 'cover.jpg', generatedAt: date },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.cover!.generatedAt).toBe(date)
        })

        it('should handle visualAssets with date strings', () => {
            const input = {
                visualAssets: [
                    { url: 'asset1.png', generatedAt: '2026-03-01T00:00:00.000Z' },
                ],
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.visualAssets![0]!.generatedAt).toBeInstanceOf(Date)
        })

        it('should handle tts metadata with date field', () => {
            const input = {
                tts: { url: 'tts.mp3', generatedAt: '2026-04-01T00:00:00.000Z' },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.tts!.generatedAt).toBeInstanceOf(Date)
        })

        it('should pass through non-date fields unchanged', () => {
            const input = {
                cover: { url: 'cover.jpg', generatedAt: '2026-01-01T00:00:00.000Z' },
                scaffold: { template: 'default' },
                publish: { scheduledAt: '2026-07-01' },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.scaffold).toEqual({ template: 'default' })
            expect(result!.publish).toEqual({ scheduledAt: '2026-07-01' })
        })

        it('should normalize distribution timeline entries', () => {
            const input = {
                integration: {
                    memosId: 'memos-1',
                    distribution: {
                        channels: {
                            memos: {
                                status: 'published',
                                remoteId: 'remote-1',
                                lastAttemptAt: '2026-05-01T00:00:00.000Z',
                            },
                            wechatsync: null,
                        },
                        timeline: [
                            {
                                id: 'tl-1',
                                channel: 'memos',
                                action: 'publish',
                                mode: 'auto',
                                status: 'success',
                                triggeredBy: 'system',
                                startedAt: '2026-05-01T00:00:00.000Z',
                            },
                        ],
                    },
                },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.integration!.distribution!.channels!.memos!.lastAttemptAt).toBeInstanceOf(Date)
            expect(result!.integration!.distribution!.timeline![0]!.startedAt).toBeInstanceOf(Date)
            expect(result!.integration!.memosId).toBe('memos-1')
        })

        it('should set distribution to null when explicitly null', () => {
            const input = {
                integration: {
                    memosId: 'memos-1',
                    distribution: null,
                },
            } as any
            const result = normalizeMetadataForPostInput(input)
            expect(result!.integration!.distribution).toBeNull()
        })
    })
})
