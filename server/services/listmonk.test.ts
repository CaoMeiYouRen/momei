import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchListmonkCampaign, getListmonkDispatchConfig, ListmonkDispatchError } from './listmonk'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/services/setting', () => ({
    getSettings: vi.fn(),
}))

vi.mock('@/server/utils/email/i18n', () => ({
    emailI18n: {
        getText: vi.fn().mockReturnValue({
            headerIcon: 'pi pi-send',
            author: '作者',
            category: '分类',
            publishedAt: '发布时间',
            buttonText: '立即查看',
            title: '{title}',
            preheader: '{title}',
        }),
        replaceParameters: vi.fn((text: string, params: Record<string, string>) => text.replace('{title}', params.title || '')),
    },
}))

vi.mock('@/server/utils/email/templates', () => ({
    emailTemplateEngine: {
        generateMarketingEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html><body>newsletter</body></html>',
            text: 'newsletter',
        }),
    },
}))

import { getSettings } from '@/server/services/setting'

describe('listmonk service', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock = vi.fn()
        vi.stubGlobal('$fetch', fetchMock)
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.LISTMONK_ENABLED]: 'true',
            [SettingKey.LISTMONK_INSTANCE_URL]: 'https://listmonk.example.com',
            [SettingKey.LISTMONK_USERNAME]: 'admin',
            [SettingKey.LISTMONK_ACCESS_TOKEN]: 'token',
            [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: '1,2',
            [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: '{"category-a":[3]}',
            [SettingKey.LISTMONK_TAG_LIST_MAP]: '{"tag-a":[4]}',
            [SettingKey.LISTMONK_TEMPLATE_ID]: '5',
        })
    })

    it('should create and start a remote campaign on first dispatch', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: { id: 42 } } as never)
            .mockResolvedValueOnce({ success: true } as never)

        const result = await dispatchListmonkCampaign({
            id: 'campaign-1',
            title: 'Weekly Newsletter',
            content: 'Summary',
            type: 'BLOG_POST',
            targetCriteria: {
                articleTitle: 'Weekly Newsletter',
                authorName: 'Momei',
                categoryName: 'General',
                publishDate: '2026-03-17',
                articleLink: '/posts/newsletter',
                articleLocale: 'zh-CN',
            },
        } as never)

        expect(result).toEqual({
            remoteCampaignId: 42,
            action: 'created',
            listIds: [1, 2],
        })
        expect(fetchMock).toHaveBeenCalledWith('https://listmonk.example.com/api/campaigns', expect.objectContaining({
            method: 'POST',
        }))
        expect(fetchMock).toHaveBeenCalledWith('https://listmonk.example.com/api/campaigns/42/status', expect.objectContaining({
            method: 'PUT',
            body: { status: 'running' },
        }))
    })

    it('should update the existing remote campaign on repeated dispatch', async () => {
        fetchMock
            .mockResolvedValueOnce({ success: true } as never)
            .mockResolvedValueOnce({ success: true } as never)

        const result = await dispatchListmonkCampaign({
            id: 'campaign-2',
            title: 'Updated Newsletter',
            content: 'Summary',
            type: 'BLOG_POST',
            targetCriteria: {
                categoryIds: ['category-a'],
                tagIds: ['tag-a'],
                articleTitle: 'Updated Newsletter',
                authorName: 'Momei',
                categoryName: 'General',
                publishDate: '2026-03-17',
                articleLink: '/posts/newsletter',
                articleLocale: 'zh-CN',
                externalDistribution: {
                    listmonk: {
                        remoteCampaignId: 77,
                    },
                },
            },
        } as never)

        expect(result).toEqual({
            remoteCampaignId: 77,
            action: 'updated',
            listIds: [1, 2, 3, 4],
        })
        expect(fetchMock).toHaveBeenCalledWith('https://listmonk.example.com/api/campaigns/77', expect.objectContaining({
            method: 'PUT',
        }))
    })

    it('should fail when required config is missing', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.LISTMONK_ENABLED]: 'true',
            [SettingKey.LISTMONK_INSTANCE_URL]: '',
            [SettingKey.LISTMONK_USERNAME]: 'admin',
            [SettingKey.LISTMONK_ACCESS_TOKEN]: '',
            [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: '',
            [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: '',
            [SettingKey.LISTMONK_TAG_LIST_MAP]: '',
            [SettingKey.LISTMONK_TEMPLATE_ID]: '',
        })

        await expect(dispatchListmonkCampaign({
            id: 'campaign-3',
            title: 'Broken Config',
            content: 'Summary',
            type: 'BLOG_POST',
            targetCriteria: {},
        } as never)).rejects.toMatchObject({
            code: 'CONFIG_MISSING',
        })
    })

    it('should surface remote id when listmonk fails after campaign creation', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: { id: 99 } } as never)
            .mockRejectedValueOnce(new Error('remote status update failed'))

        const execution = dispatchListmonkCampaign({
            id: 'campaign-4',
            title: 'Remote Failure',
            content: 'Summary',
            type: 'BLOG_POST',
            targetCriteria: {},
        } as never)

        await expect(execution).rejects.toBeInstanceOf(ListmonkDispatchError)

        await execution.catch((error: unknown) => {
            expect(error).toMatchObject({
                code: 'REMOTE_REQUEST_FAILED',
                remoteCampaignId: 99,
                action: 'created',
            })
        })
    })

    it('should expose parsed runtime config for listmonk delivery', async () => {
        const config = await getListmonkDispatchConfig()

        expect(config).toMatchObject({
            enabled: true,
            baseUrl: 'https://listmonk.example.com',
            username: 'admin',
            defaultListIds: [1, 2],
            templateId: 5,
        })
    })

    it('should treat quoted true as enabled for listmonk delivery', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.LISTMONK_ENABLED]: '"true"',
            [SettingKey.LISTMONK_INSTANCE_URL]: 'https://listmonk.example.com',
            [SettingKey.LISTMONK_USERNAME]: 'admin',
            [SettingKey.LISTMONK_ACCESS_TOKEN]: 'token',
            [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: '1,2',
            [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: '',
            [SettingKey.LISTMONK_TAG_LIST_MAP]: '',
            [SettingKey.LISTMONK_TEMPLATE_ID]: '',
        })

        const config = await getListmonkDispatchConfig()

        expect(config.enabled).toBe(true)
        expect(config.missingFields).toEqual([])
    })

    it('should keep listmonk disabled when explicitly configured as false', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.LISTMONK_ENABLED]: 'false',
            [SettingKey.LISTMONK_INSTANCE_URL]: 'https://listmonk.example.com',
            [SettingKey.LISTMONK_USERNAME]: 'admin',
            [SettingKey.LISTMONK_ACCESS_TOKEN]: 'token',
            [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: '1,2',
            [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: '',
            [SettingKey.LISTMONK_TAG_LIST_MAP]: '',
            [SettingKey.LISTMONK_TEMPLATE_ID]: '',
        })

        const config = await getListmonkDispatchConfig()

        expect(config.enabled).toBe(false)
        expect(config.missingFields).toEqual([])
    })
})
