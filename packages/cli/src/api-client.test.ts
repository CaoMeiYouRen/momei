import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MomeiPost } from './types'

const { mockCreate, mockGet, mockPost } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
    mockGet: vi.fn(),
    mockPost: vi.fn(),
}))

vi.mock('axios', () => ({
    default: {
        create: mockCreate,
    },
}))

import { MomeiApiClient } from './api-client'

function createPostPayload(title: string): MomeiPost {
    return {
        title,
        content: `${title} content`,
        status: 'draft',
        visibility: 'public',
    }
}

describe('MomeiApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreate.mockReturnValue({
            post: mockPost,
            get: mockGet,
        })
    })

    it('should report sequential progress across concurrent batches', async () => {
        mockPost
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 1 } } })
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 2 } } })
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 3 } } })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const onProgress = vi.fn()

        const results = await client.importPosts([
            { file: 'a.md', post: createPostPayload('A') },
            { file: 'b.md', post: createPostPayload('B') },
            { file: 'c.md', post: createPostPayload('C') },
        ], {
            concurrency: 2,
            onProgress,
        })

        expect(results).toHaveLength(3)
        expect(onProgress.mock.calls.map((call) => call[0])).toEqual([1, 2, 3])
        expect(onProgress.mock.calls.map((call) => call[1])).toEqual([3, 3, 3])
    })
})
