import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'

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
    const requestBody = {
        provider: 'volcengine',
        voice: 'zh_female_vv_uranus_bigtts',
        text: 'hello world',
        mode: 'podcast',
        options: {},
    }

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
    })

    it('should return frontend-direct strategy in serverless runtimes', async () => {
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        const waitUntil = vi.fn()

        const result = await handler({
            body: requestBody,
            waitUntil,
            context: {},
        } as any)

        expect(result).toEqual({
            strategy: 'frontend-direct',
            provider: 'volcengine',
            mode: 'podcast',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
            message: expect.any(String),
        })
        expect(waitUntil).not.toHaveBeenCalled()
        expect(TTSService.processTask).not.toHaveBeenCalled()
        expect(taskRepo.create).not.toHaveBeenCalled()
    })

    it('should skip waitUntil registration outside serverless runtimes', async () => {
        const waitUntil = vi.fn()

        await expect(handler({ body: requestBody, waitUntil, context: {} } as any)).resolves.toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })

        expect(waitUntil).not.toHaveBeenCalled()
        expect(TTSService.processTask).toHaveBeenCalledWith('task-1')
    })

    it('should still return frontend-direct strategy when waitUntil is unavailable', async () => {
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)

        await expect(handler({ body: requestBody, context: {} } as any)).resolves.toEqual({
            strategy: 'frontend-direct',
            provider: 'volcengine',
            mode: 'podcast',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
            message: expect.any(String),
        })

        expect(TTSService.processTask).not.toHaveBeenCalled()
    })
})
