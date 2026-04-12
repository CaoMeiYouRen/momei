import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSettingMock, buildDistributionMaterialBundleMock } = vi.hoisted(() => ({
    getSettingMock: vi.fn(),
    buildDistributionMaterialBundleMock: vi.fn(),
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: getSettingMock,
}))

vi.mock('@/utils/shared/distribution-template', () => ({
    buildDistributionMaterialBundle: buildDistributionMaterialBundleMock,
}))

import { buildPostDistributionMaterialBundle } from './post-distribution-template'
import type { Post } from '@/types/post'
import { SettingKey } from '@/types/setting'

describe('buildPostDistributionMaterialBundle', () => {
    const post = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Body',
        summary: 'Summary',
        coverImage: null,
        author: null,
        copyright: null,
        language: 'zh-CN',
        slug: 'test-post',
        tags: [],
    } as unknown as Post

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses configured site url from settings when available', async () => {
        getSettingMock.mockImplementation((key: SettingKey) => {
            if (key === SettingKey.SITE_URL) {
                return Promise.resolve('https://settings.example.com')
            }

            if (key === SettingKey.POST_COPYRIGHT) {
                return Promise.resolve('CC BY-SA 4.0')
            }

            return Promise.resolve(null)
        })
        buildDistributionMaterialBundleMock.mockReturnValue({ bundle: true })

        const result = await buildPostDistributionMaterialBundle(post)

        expect(getSettingMock).toHaveBeenCalledWith(SettingKey.SITE_URL)
        expect(getSettingMock).toHaveBeenCalledWith(SettingKey.POST_COPYRIGHT)
        expect(buildDistributionMaterialBundleMock).toHaveBeenCalledWith(post, {
            siteUrl: 'https://settings.example.com',
            defaultLicense: 'CC BY-SA 4.0',
        })
        expect(result).toEqual({ bundle: true })
    })

    it('falls back to default site url when setting is missing', async () => {
        getSettingMock.mockImplementation((key: SettingKey) => {
            if (key === SettingKey.POST_COPYRIGHT) {
                return Promise.resolve(null)
            }

            return Promise.resolve(null)
        })
        buildDistributionMaterialBundleMock.mockReturnValue({ bundle: 'runtime' })

        await buildPostDistributionMaterialBundle(post)

        expect(buildDistributionMaterialBundleMock).toHaveBeenCalledWith(post, {
            siteUrl: 'https://momei.app',
            defaultLicense: null,
        })
    })
})
