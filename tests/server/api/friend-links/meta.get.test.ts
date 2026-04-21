import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetMeta,
    mockGetCategories,
    mockDetectRequestAuthLocale,
    mockMapAuthLocaleToAppLocale,
} = vi.hoisted(() => ({
    mockGetMeta: vi.fn(),
    mockGetCategories: vi.fn(),
    mockDetectRequestAuthLocale: vi.fn(),
    mockMapAuthLocaleToAppLocale: vi.fn(),
}))

vi.mock('@/server/services/friend-link', () => ({
    friendLinkService: {
        getMeta: mockGetMeta,
        getCategories: mockGetCategories,
    },
}))

vi.mock('@/server/utils/locale', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/locale')>()

    return {
        ...actual,
        detectRequestAuthLocale: mockDetectRequestAuthLocale,
        mapAuthLocaleToAppLocale: mockMapAuthLocaleToAppLocale,
    }
})

import friendLinksMetaHandler from '@/server/api/friend-links/meta.get'

describe('GET /api/friend-links/meta', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDetectRequestAuthLocale.mockReturnValue('zh-Hans')
        mockMapAuthLocaleToAppLocale.mockReturnValue('zh-CN')
        mockGetMeta.mockResolvedValue({
            enabled: true,
            applicationEnabled: true,
            applicationGuidelines: '请先放置本站友链后再申请。',
        })
        mockGetCategories.mockResolvedValue([
            { id: 'cat-1', name: '开发', slug: 'dev' },
        ])
    })

    it('should resolve localized meta with explicit query-aware locale detection', async () => {
        const event = {
            node: {
                req: {
                    url: '/api/friend-links/meta?locale=zh-Hans',
                },
            },
        } as any

        const result = await friendLinksMetaHandler(event)

        expect(mockDetectRequestAuthLocale).toHaveBeenCalledWith(event, { includeQuery: true })
        expect(mockMapAuthLocaleToAppLocale).toHaveBeenCalledWith('zh-Hans')
        expect(mockGetMeta).toHaveBeenCalledWith('zh-CN')
        expect(mockGetCategories).toHaveBeenCalledWith({ enabledOnly: true })
        expect(result).toEqual({
            code: 200,
            locale: 'zh-CN',
            data: {
                enabled: true,
                applicationEnabled: true,
                applicationGuidelines: '请先放置本站友链后再申请。',
                categories: [
                    { id: 'cat-1', name: '开发', slug: 'dev' },
                ],
            },
        })
    })
})
