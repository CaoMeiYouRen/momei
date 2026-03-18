import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateAgreementTranslationDraft, generateLocalizedSettingDraft } from './admin-drafts'
import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { TextService } from '@/server/services/ai/text'
import { createAgreementVersion } from '@/server/services/agreement'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/database')
vi.mock('@/server/services/ai/text', () => ({
    TextService: {
        translate: vi.fn(),
        translateNames: vi.fn(),
    },
}))
vi.mock('@/server/services/agreement', () => ({
    createAgreementVersion: vi.fn(),
}))

describe('admin draft services', () => {
    const mockAgreementRepo = {
        findOne: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === AgreementContent) {
                return mockAgreementRepo as never
            }

            return {} as never
        })
    })

    it('generates localized text drafts by reusing existing locale content', async () => {
        vi.mocked(TextService.translate).mockResolvedValue('English title')

        const result = await generateLocalizedSettingDraft({
            key: SettingKey.SITE_TITLE,
            targetLocale: 'en-US',
            value: {
                version: 1,
                type: 'localized-text',
                locales: {
                    'zh-CN': '中文标题',
                },
                legacyValue: '旧标题',
            },
            userId: 'admin-1',
        })

        expect(TextService.translate).toHaveBeenCalledWith('中文标题', 'en-US', 'admin-1', expect.objectContaining({
            sourceLanguage: 'zh-CN',
            field: 'title',
        }))
        expect(result.value.locales['en-US']).toBe('English title')
    })

    it('generates localized keyword drafts via translateNames', async () => {
        vi.mocked(TextService.translateNames).mockResolvedValue(['keyword one', 'keyword two'])

        const result = await generateLocalizedSettingDraft({
            key: SettingKey.SITE_KEYWORDS,
            targetLocale: 'en-US',
            value: {
                version: 1,
                type: 'localized-string-list',
                locales: {
                    'zh-CN': ['关键词一', '关键词二'],
                },
                legacyValue: null,
            },
            userId: 'admin-1',
        })

        expect(TextService.translateNames).toHaveBeenCalledWith(['关键词一', '关键词二'], 'en-US', 'admin-1')
        expect(result.value.locales['en-US']).toEqual(['keyword one', 'keyword two'])
    })

    it('creates agreement translation drafts from an existing source agreement', async () => {
        mockAgreementRepo.findOne.mockResolvedValue({
            id: 'agreement-source',
            type: 'user_agreement',
            language: 'zh-CN',
            content: '# 协议',
        })
        vi.mocked(TextService.translate).mockResolvedValue('# Agreement')
        vi.mocked(createAgreementVersion).mockResolvedValue({ id: 'agreement-draft' } as never)

        const result = await generateAgreementTranslationDraft({
            type: 'user_agreement',
            sourceAgreementId: 'agreement-source',
            targetLanguage: 'en-US',
            version: '2.0.0-en',
            versionDescription: 'AI translated draft',
            userId: 'admin-1',
        })

        expect(TextService.translate).toHaveBeenCalledWith('# 协议', 'en-US', 'admin-1', expect.objectContaining({
            sourceLanguage: 'zh-CN',
            field: 'content',
        }))
        expect(createAgreementVersion).toHaveBeenCalledWith(expect.objectContaining({
            type: 'user_agreement',
            language: 'en-US',
            sourceAgreementId: 'agreement-source',
            reviewStatus: 'draft',
        }))
        expect(result).toEqual({ id: 'agreement-draft' })
    })
})
