import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './perspective-check.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/perspective-check', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should return structured perspective observations for editor mode', async () => {
        const mockObservations = [
            {
                mode: 'editor' as const,
                type: 'structure' as const,
                severity: 'minor' as const,
                original: 'The third paragraph...',
                suggestion: 'Consider moving this paragraph earlier for better logical flow',
                reason: 'The current placement breaks the narrative arc',
            },
            {
                mode: 'editor' as const,
                type: 'clarity' as const,
                severity: 'major' as const,
                suggestion: 'The technical term "X" should be explained on first use',
                reason: 'Readers without domain expertise may get lost',
            },
        ]

        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'This is the article content to check.',
            mode: 'editor',
            language: 'zh-CN',
        })
        vi.mocked(TextService.perspectiveCheck).mockResolvedValue(mockObservations)

        const result = await handler({ context: {} } as any)

        expect(TextService.perspectiveCheck).toHaveBeenCalledWith(
            'This is the article content to check.',
            'editor',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: mockObservations,
        })
    })

    it('should return structured perspective observations for reader mode', async () => {
        const mockObservations = [
            {
                mode: 'reader' as const,
                type: 'engagement' as const,
                severity: 'info' as const,
                suggestion: 'The introduction could use a hook to grab reader attention',
                reason: 'The current opening is factual but lacks emotional appeal',
            },
        ]

        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Some article content.',
            mode: 'reader',
            language: 'en-US',
        })
        vi.mocked(TextService.perspectiveCheck).mockResolvedValue(mockObservations)

        const result = await handler({ context: {} } as any)

        expect(TextService.perspectiveCheck).toHaveBeenCalledWith(
            'Some article content.',
            'reader',
            'en-US',
            'user-1',
        )
        expect(result.code).toBe(200)
        expect(result.data).toHaveLength(1)
        expect(result.data[0]!.mode).toBe('reader')
        expect(result.data[0]!.type).toBe('engagement')
    })

    it('should return empty array when no issues found', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Perfect content.',
            mode: 'editor',
            language: 'en-US',
        })
        vi.mocked(TextService.perspectiveCheck).mockResolvedValue([])

        const result = await handler({ context: {} } as any)

        expect(result).toEqual({
            code: 200,
            data: [],
        })
    })

    it('should handle various observation types', async () => {
        const mockObservations = [
            { mode: 'editor' as const, type: 'pacing' as const, severity: 'minor' as const, suggestion: 'Section too long', reason: 'Readers may lose interest' },
            { mode: 'reader' as const, type: 'confusion' as const, severity: 'major' as const, original: 'The algorithm...', suggestion: 'Explain algorithm briefly', reason: 'General audience may not know this term' },
            { mode: 'editor' as const, type: 'transition' as const, severity: 'info' as const, suggestion: 'Add transition sentence', reason: 'Helps maintain reading flow' },
        ]

        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Content with various aspects.',
            mode: 'editor',
            language: 'en-US',
        })
        vi.mocked(TextService.perspectiveCheck).mockResolvedValue(mockObservations)

        const result = await handler({ context: {} } as any)

        expect(result.code).toBe(200)
        expect(result.data).toHaveLength(3)
        expect(result.data[0]!.type).toBe('pacing')
        expect(result.data[1]!.type).toBe('confusion')
        expect(result.data[2]!.type).toBe('transition')
    })
})
