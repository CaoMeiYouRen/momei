import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { isServerlessEnvironment } from '@/server/utils/env'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

const mocks = vi.hoisted(() => ({
    readValidatedBody: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()

    return {
        ...actual,
        readValidatedBody: mocks.readValidatedBody,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/env', () => ({
    isServerlessEnvironment: vi.fn(() => false),
}))

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest: vi.fn(),
}))

const mockTask = {
    id: 'task-ext-1',
    category: 'podcast',
    type: 'podcast',
    status: 'pending',
    estimatedCost: 1.23,
    estimatedQuotaUnits: 8,
}

const mockCreateTTSTask = vi.fn().mockResolvedValue({
    task: mockTask,
    estimatedCost: 1.23,
    estimatedQuotaUnits: 8,
})

vi.mock('@/server/utils/ai/tts-task-shared', () => ({
    createTTSTask: mockCreateTTSTask,
}))

describe('POST /api/external/ai/tts/task', () => {
    let handler: (event: any) => Promise<any>

    const postRepo = {
        findOneBy: vi.fn().mockResolvedValue(null),
    }

    beforeEach(async () => {
        handler ||= (await import('@/server/api/external/ai/tts/task.post')).default
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(postRepo as any)
        vi.mocked(validateApiKeyRequest).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(false)
        mocks.readValidatedBody.mockImplementation((event: { body?: unknown }, parser: (body: unknown) => unknown) => Promise.resolve(parser(event.body)))
    })

    it('should create external TTS task via shared helper', async () => {
        const event = {
            context: {},
            body: {
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                text: 'hello world',
                mode: 'podcast',
                options: {},
            },
        }

        const result = await handler(event as any)

        expect(result).toEqual({
            code: 200,
            data: {
                taskId: 'task-ext-1',
                status: 'pending',
                estimatedCost: 1.23,
                estimatedQuotaUnits: 8,
            },
        })
        expect(mockCreateTTSTask).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'author-1',
            content: 'hello world',
            voice: 'zh_female_vv_uranus_bigtts',
            mode: 'podcast',
        }))
    })

    it('should delegate to shared helper when waitUntil is unavailable', async () => {
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)

        const result = await handler({
            context: {},
            body: {
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                text: 'hello world',
                mode: 'podcast',
                options: {},
            },
        } as any)

        expect(result).toEqual({
            code: 200,
            data: {
                taskId: 'task-ext-1',
                status: 'pending',
                estimatedCost: 1.23,
                estimatedQuotaUnits: 8,
            },
        })
        expect(mockCreateTTSTask).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'podcast',
        }))
    })
})
