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

    it('generates localized text drafts with explicit source locale', async () => {
        vi.mocked(TextService.translate).mockResolvedValue('Japanese title')

        const result = await generateLocalizedSettingDraft({
            key: SettingKey.SITE_TITLE,
            targetLocale: 'ja-JP',
            sourceLocale: 'en-US',
            value: {
                version: 1,
                type: 'localized-text',
                locales: {
                    'zh-CN': '中文标题',
                    'en-US': 'English Title',
                },
                legacyValue: '旧标题',
            },
            userId: 'admin-1',
        })

        expect(TextService.translate).toHaveBeenCalledWith('English Title', 'ja-JP', 'admin-1', expect.objectContaining({
            sourceLanguage: 'en-US',
            field: 'title',
        }))
        expect(result.value.locales['ja-JP']).toBe('Japanese title')
        expect(result.sourceLocale).toBe('en-US')
    })

    it('should throw error for non-localized setting key', async () => {
        await expect(generateLocalizedSettingDraft({
            key: SettingKey.SITE_URL,
            targetLocale: 'en-US',
            value: { version: 1, type: 'localized-text', locales: {}, legacyValue: null },
            userId: 'admin-1',
        })).rejects.toThrow('is not localized')
    })

    it('should throw error when no source content available', async () => {
        await expect(generateLocalizedSettingDraft({
            key: SettingKey.SITE_TITLE,
            targetLocale: 'en-US',
            value: { version: 1, type: 'localized-text', locales: {}, legacyValue: null },
            userId: 'admin-1',
        })).rejects.toThrow('No source content available')
    })

    it('should throw error when source has no meaningful value (empty array treated as no content)', async () => {
        // Empty arrays are treated as not meaningful by hasMeaningfulLocalizedValue
        await expect(generateLocalizedSettingDraft({
            key: SettingKey.SITE_KEYWORDS,
            targetLocale: 'en-US',
            value: { version: 1, type: 'localized-string-list', locales: { 'zh-CN': [] }, legacyValue: null },
            userId: 'admin-1',
        })).rejects.toThrow('No source content available')
    })

    it('should throw error when source text is empty string (no meaningful value)', async () => {
        // Empty strings are treated as not meaningful by hasMeaningfulLocalizedValue
        await expect(generateLocalizedSettingDraft({
            key: SettingKey.SITE_TITLE,
            targetLocale: 'en-US',
            value: { version: 1, type: 'localized-text', locales: { 'zh-CN': '' }, legacyValue: null },
            userId: 'admin-1',
        })).rejects.toThrow('No source content available')
    })

    it('should fall back to legacy value when no locale source exists', async () => {
        vi.mocked(TextService.translate).mockResolvedValue('Translated legacy')

        const result = await generateLocalizedSettingDraft({
            key: SettingKey.SITE_TITLE,
            targetLocale: 'en-US',
            value: { version: 1, type: 'localized-text', locales: {}, legacyValue: '旧标题' },
            userId: 'admin-1',
        })

        expect(TextService.translate).toHaveBeenCalledWith('旧标题', 'en-US', 'admin-1', expect.objectContaining({
            sourceLanguage: undefined,
            field: 'title',
        }))
        expect(result.sourceLocale).toBe('legacy')
        expect(result.value.locales['en-US']).toBe('Translated legacy')
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

    it('should throw error when source agreement not found', async () => {
        mockAgreementRepo.findOne.mockResolvedValue(null)

        await expect(generateAgreementTranslationDraft({
            type: 'user_agreement',
            sourceAgreementId: 'non-existent',
            targetLanguage: 'en-US',
            userId: 'admin-1',
        })).rejects.toThrow('Source agreement not found')
    })

    it('should throw error when target language is same as source', async () => {
        mockAgreementRepo.findOne.mockResolvedValue({
            id: 'agreement-source',
            type: 'user_agreement',
            language: 'zh-CN',
            content: '# 协议',
        })

        await expect(generateAgreementTranslationDraft({
            type: 'user_agreement',
            sourceAgreementId: 'agreement-source',
            targetLanguage: 'zh-CN',
            userId: 'admin-1',
        })).rejects.toThrow('Target language must differ')
    })
})
