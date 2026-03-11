import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './translate-name.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readBody } = global as unknown as {
    readBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/translate-name', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should translate a single name', async () => {
        vi.mocked(readBody).mockResolvedValue({
            name: '源标签',
            targetLanguage: 'en-US',
        })
        vi.mocked(TextService.translateName).mockResolvedValue('Translated Tag')

        const result = await handler({ context: {} } as any)

        expect(TextService.translateName).toHaveBeenCalledWith('源标签', 'en-US', 'user-1')
        expect(result).toEqual({
            code: 200,
            data: 'Translated Tag',
        })
    })

    it('should translate batched names in one request', async () => {
        vi.mocked(readBody).mockResolvedValue({
            names: ['源标签', '另一个标签'],
            targetLanguage: 'en-US',
        })
        vi.mocked(TextService.translateNames).mockResolvedValue(['Translated Tag', 'Another Tag'])

        const result = await handler({ context: {} } as any)

        expect(TextService.translateNames).toHaveBeenCalledWith(['源标签', '另一个标签'], 'en-US', 'user-1')
        expect(result).toEqual({
            code: 200,
            data: ['Translated Tag', 'Another Tag'],
        })
    })
})
