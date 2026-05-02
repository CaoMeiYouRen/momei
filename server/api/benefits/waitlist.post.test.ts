import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './waitlist.post'
import { benefitWaitlistService } from '@/server/services/benefit-waitlist'

vi.mock('@/server/services/benefit-waitlist', () => ({
    benefitWaitlistService: {
        addToWaitlist: vi.fn(),
    },
}))

vi.mock('@/server/utils/rate-limit', () => ({
    rateLimit: vi.fn(),
}))

const readValidatedBodyMock = vi.fn()
const getRequestIPMock = vi.fn()
const getRequestHeaderMock = vi.fn()

vi.stubGlobal('readValidatedBody', readValidatedBodyMock)
vi.stubGlobal('getRequestIP', getRequestIPMock)
vi.stubGlobal('getRequestHeader', getRequestHeaderMock)

describe('POST /api/benefits/waitlist', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        readValidatedBodyMock.mockResolvedValue({
            success: true,
            data: {
                name: 'Test User',
                email: 'test@example.com',
                locale: 'zh-CN',
            },
        })
        getRequestIPMock.mockReturnValue('127.0.0.1')
        getRequestHeaderMock.mockReturnValue('vitest')
        vi.mocked(benefitWaitlistService.addToWaitlist).mockResolvedValue({
            id: 'test-id-1',
            name: 'Test User',
            email: 'test@example.com',
            locale: 'zh-CN',
            ip: '127.0.0.1',
            userAgent: 'vitest',
        } as any)
    })

    it('accepts valid waitlist submission', async () => {
        const result = await handler({} as any)

        expect(benefitWaitlistService.addToWaitlist).toHaveBeenCalledWith({
            name: 'Test User',
            email: 'test@example.com',
            purpose: 'benefit',
            locale: 'zh-CN',
            ip: '127.0.0.1',
            userAgent: 'vitest',
        })

        expect(result).toEqual({
            code: 200,
            message: 'Successfully joined the waitlist',
            data: { id: 'test-id-1' },
        })
    })

    it('rejects submission with validation error', async () => {
        readValidatedBodyMock.mockResolvedValue({
            success: false,
            error: { issues: [{ message: 'Name is required' }] },
        })

        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
        })
        expect(benefitWaitlistService.addToWaitlist).not.toHaveBeenCalled()
    })
})
