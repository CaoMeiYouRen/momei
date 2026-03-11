import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './translate.stream.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readBody } = global as unknown as {
    readBody: ReturnType<typeof vi.fn>
}

const setResponseHeaderMock = vi.fn()
vi.stubGlobal('setResponseHeader', setResponseHeaderMock)

describe('POST /api/ai/translate.stream', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should stream translation chunks with context and end event', async () => {
        vi.mocked(readBody).mockResolvedValue({
            content: 'stream me',
            targetLanguage: 'en-US',
            sourceLanguage: 'zh-CN',
            field: 'content',
        })
        vi.mocked(TextService.translateStream).mockReturnValue((async function* () {
            await Promise.resolve()
            yield { progress: 10, chunk: 'Hello' }
            yield { progress: 100, chunk: 'World' }
        })() as any)

        const write = vi.fn()
        const end = vi.fn()
        const flush = vi.fn()
        const event = {
            node: {
                res: { write, end, flush },
            },
        } as any

        await handler(event)

        expect(setResponseHeaderMock).toHaveBeenCalledWith(event, 'Content-Type', 'text/event-stream')
        expect(TextService.translateStream).toHaveBeenCalledWith(
            'stream me',
            'en-US',
            'user-1',
            {
                sourceLanguage: 'zh-CN',
                field: 'content',
            },
        )
        expect(write).toHaveBeenCalledWith(`data: ${JSON.stringify({ progress: 10, chunk: 'Hello' })}\n\n`)
        expect(write).toHaveBeenCalledWith(`data: ${JSON.stringify({ progress: 100, chunk: 'World' })}\n\n`)
        expect(write).toHaveBeenCalledWith('event: end\ndata: {}\n\n')
        expect(flush).toHaveBeenCalledTimes(2)
        expect(end).toHaveBeenCalledTimes(1)
    })

    it('should emit an error event when streaming fails', async () => {
        vi.mocked(readBody).mockResolvedValue({
            content: 'stream me',
            targetLanguage: 'en-US',
        })
        vi.mocked(TextService.translateStream).mockReturnValue({
            [Symbol.asyncIterator]: () => ({
                next: async () => {
                    await Promise.resolve()
                    throw new Error('stream failed')
                },
            }),
        } as any)

        const write = vi.fn()
        const end = vi.fn()
        const event = {
            node: {
                res: { write, end },
            },
        } as any

        await handler(event)

        expect(write).toHaveBeenCalledWith(`event: error\ndata: ${JSON.stringify({ statusCode: 500, message: 'stream failed' })}\n\n`)
        expect(end).toHaveBeenCalledTimes(1)
    })
})
