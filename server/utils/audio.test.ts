import { describe, expect, it, vi, beforeEach } from 'vitest'
import { probeRemoteAudio } from './audio'

// Mock dependencies
vi.mock('./logger', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('music-metadata', () => ({
    parseFromTokenizer: vi.fn(),
}))

vi.mock('@tokenizer/http', () => ({
    makeTokenizer: vi.fn(),
}))

describe('audio utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('probeRemoteAudio', () => {
        it('should successfully probe audio metadata', async () => {
            const mockUrl = 'https://example.com/audio.mp3'
            const mockMetadata = {
                format: {
                    container: 'MPEG',
                    duration: 180.5,
                },
            }

            // Mock fetch for HEAD request
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn((key: string) => {
                        if (key === 'content-type') {
                            return 'audio/mpeg'
                        }
                        if (key === 'content-length') {
                            return '5242880'
                        }
                        return null
                    }),
                },
            })

            // Mock tokenizer
            const mockTokenizer = {
                fileInfo: { size: 5242880 },
            }

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockResolvedValue(mockTokenizer as any)
            vi.mocked(parseFromTokenizer).mockResolvedValue(mockMetadata as any)

            const result = await probeRemoteAudio(mockUrl)

            expect(result).toEqual({
                mimeType: 'audio/mpeg',
                size: 5242880,
                duration: 181, // Rounded from 180.5
            })
        })

        it('should handle HEAD request failure gracefully', async () => {
            const mockUrl = 'https://example.com/audio.mp3'
            const mockMetadata = {
                format: {
                    container: 'MP4',
                    duration: 120,
                },
            }

            // Mock fetch to fail for HEAD request
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

            const mockTokenizer = {
                fileInfo: { size: 3145728 },
            }

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockResolvedValue(mockTokenizer as any)
            vi.mocked(parseFromTokenizer).mockResolvedValue(mockMetadata as any)

            const result = await probeRemoteAudio(mockUrl)

            expect(result).toEqual({
                mimeType: 'audio/mp4',
                size: 3145728,
                duration: 120,
            })
        })

        it('should fallback to HEAD request when parsing fails', async () => {
            const mockUrl = 'https://example.com/audio.mp3'

            // Mock fetch for HEAD request
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn((key: string) => {
                        if (key === 'content-type') {
                            return 'audio/mpeg'
                        }
                        if (key === 'content-length') {
                            return '2097152'
                        }
                        return null
                    }),
                },
            })

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockRejectedValue(new Error('Parse error'))
            vi.mocked(parseFromTokenizer).mockRejectedValue(new Error('Parse error'))

            const result = await probeRemoteAudio(mockUrl)

            expect(result).toEqual({
                mimeType: 'audio/mpeg',
                size: 2097152,
                duration: null,
            })
        })

        it('should throw error when all methods fail', async () => {
            const mockUrl = 'https://example.com/audio.mp3'

            // Mock all requests to fail
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockRejectedValue(new Error('Tokenizer error'))
            vi.mocked(parseFromTokenizer).mockRejectedValue(new Error('Parse error'))

            await expect(probeRemoteAudio(mockUrl)).rejects.toThrow('Audio probe failed')
        })

        it('should map container types to MIME types correctly', async () => {
            const mockUrl = 'https://example.com/audio.ogg'
            const mockMetadata = {
                format: {
                    container: 'Ogg',
                    duration: 90,
                },
            }

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn(() => 'application/octet-stream'),
                },
            })

            const mockTokenizer = {
                fileInfo: { size: 1048576 },
            }

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockResolvedValue(mockTokenizer as any)
            vi.mocked(parseFromTokenizer).mockResolvedValue(mockMetadata as any)

            const result = await probeRemoteAudio(mockUrl)

            expect(result.mimeType).toBe('audio/ogg')
        })

        it('should handle missing duration', async () => {
            const mockUrl = 'https://example.com/audio.mp3'
            const mockMetadata = {
                format: {
                    container: 'MPEG',
                    duration: undefined,
                },
            }

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn(() => 'audio/mpeg'),
                },
            })

            const mockTokenizer = {
                fileInfo: { size: 1048576 },
            }

            const { makeTokenizer } = await import('@tokenizer/http')
            const { parseFromTokenizer } = await import('music-metadata')

            vi.mocked(makeTokenizer).mockResolvedValue(mockTokenizer as any)
            vi.mocked(parseFromTokenizer).mockResolvedValue(mockMetadata as any)

            const result = await probeRemoteAudio(mockUrl)

            expect(result.duration).toBeNull()
        })
    })
})
