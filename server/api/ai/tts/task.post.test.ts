import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const mocks = vi.hoisted(() => ({
    readBody: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()

    return {
        ...actual,
        readBody: mocks.readBody,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/ai', () => ({
    TTSService: {
        estimateCost: vi.fn(),
        getProvider: vi.fn(),
        processTask: vi.fn(),
    },
}))

vi.mock('@/server/services/ai/quota-governance', () => ({
    assertAIQuotaAllowance: vi.fn(),
}))

vi.mock('@/server/utils/ai/cost-governance', () => ({
    calculateQuotaUnits: vi.fn(),
    deriveChargeStatus: vi.fn(),
    normalizeUsageSnapshot: vi.fn(),
}))

vi.mock('@/server/utils/env', () => ({
    isServerlessEnvironment: vi.fn(() => false),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

describe('POST /api/ai/tts/task', () => {
    let handler: (event: any) => Promise<any>

    const taskRepo = {
        create: vi.fn((payload) => ({
            id: 'task-1',
            ...payload,
        })),
        save: vi.fn((value) => Promise.resolve(value)),
    }

    beforeEach(async () => {
        handler ||= (await import('./task.post')).default
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
        vi.mocked(normalizeUsageSnapshot).mockReturnValue({ textLength: 11 } as any)
        vi.mocked(calculateQuotaUnits).mockReturnValue(8)
        vi.mocked(deriveChargeStatus).mockReturnValue('pending' as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(false)
        vi.mocked(TTSService.estimateCost).mockResolvedValue(1.23)
        vi.mocked(TTSService.getProvider).mockResolvedValue({ model: 'seed-tts-2.0' } as any)
        vi.mocked(TTSService.processTask).mockResolvedValue(undefined)
        vi.mocked(assertAIQuotaAllowance).mockResolvedValue(undefined)
        mocks.readBody.mockResolvedValue({
            provider: 'volcengine',
            voice: 'zh_female_vv_uranus_bigtts',
            text: 'hello world',
            mode: 'podcast',
            options: {},
        })
    })

    it('should register TTS processing with waitUntil in serverless runtimes', async () => {
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        const waitUntil = vi.fn()

        const result = await handler({
            waitUntil,
            context: {},
        } as any)

        expect(result).toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })
        expect(waitUntil).toHaveBeenCalledTimes(1)
        expect(waitUntil.mock.calls[0]?.[0]).toBeInstanceOf(Promise)
        await waitUntil.mock.calls[0]?.[0]
        expect(TTSService.processTask).toHaveBeenCalledWith('task-1')
        expect(taskRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            category: 'podcast',
            type: 'podcast',
            status: 'pending',
            chargeStatus: 'pending',
        }))
    })

    it('should skip waitUntil registration outside serverless runtimes', async () => {
        const waitUntil = vi.fn()

        await expect(handler({ waitUntil, context: {} } as any)).resolves.toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })

        expect(waitUntil).not.toHaveBeenCalled()
        expect(TTSService.processTask).toHaveBeenCalledWith('task-1')
    })

    it('should still start processing when waitUntil is unavailable', async () => {
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)

        await expect(handler({ context: {} } as any)).resolves.toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })

        expect(TTSService.processTask).toHaveBeenCalledWith('task-1')
    })
})
