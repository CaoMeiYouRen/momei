import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './review.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/review', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should return structured review suggestions', async () => {
        const mockSuggestions = [
            {
                type: 'grammar',
                severity: 'major',
                original: '这是一个错误句。',
                suggestion: '建议修改为正确的语法结构',
                replacement: '这是一个正确的句子。',
            },
            {
                type: 'style',
                severity: 'minor',
                original: '然后然后',
                suggestion: '重复词语建议删除一个',
                replacement: '然后',
            },
        ]

        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一个需要审查的文本内容。',
            language: 'zh-CN',
        })
        vi.mocked(TextService.review).mockResolvedValue(mockSuggestions)

        const result = await handler({ context: {} } as any)

        expect(TextService.review).toHaveBeenCalledWith(
            '这是一个需要审查的文本内容。',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: mockSuggestions,
        })
    })

    it('should return empty array when no issues found', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Perfect content with no issues.',
            language: 'en-US',
        })
        vi.mocked(TextService.review).mockResolvedValue([])

        const result = await handler({ context: {} } as any)

        expect(TextService.review).toHaveBeenCalledWith(
            'Perfect content with no issues.',
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: [],
        })
    })

    it('should handle various suggestion types', async () => {
        const mockSuggestions = [
            { type: 'spelling', severity: 'critical', original: 'recieve', suggestion: 'Misspelled word', replacement: 'receive' },
            { type: 'logic', severity: 'major', original: 'Therefore the conclusion...', suggestion: 'Missing premise', replacement: undefined },
            { type: 'fact', severity: 'minor', original: 'In 2020...', suggestion: 'Date may be inaccurate', replacement: undefined },
        ]

        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Content with various issues.',
            language: 'en-US',
        })
        vi.mocked(TextService.review).mockResolvedValue(mockSuggestions)

        const result = await handler({ context: {} } as any)

        expect(result.code).toBe(200)
        expect(result.data).toHaveLength(3)
        expect(result.data[0].type).toBe('spelling')
        expect(result.data[0].severity).toBe('critical')
        expect(result.data[1].type).toBe('logic')
        expect(result.data[2].type).toBe('fact')
    })
})
