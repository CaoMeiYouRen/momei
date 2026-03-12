import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createAgreementVersion,
    deleteAgreementVersion,
    getActiveAgreementContent,
    getAgreementContent,
    getAgreementVersions,
    markAgreementConsentForLocale,
    setActiveAgreement,
    updateAgreementContent,
} from './agreement'
import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/database')
vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(() => 'generated-id'),
    },
}))
vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: vi.fn(),
    },
}))

interface AgreementRecord {
    id: string
    type: 'user_agreement' | 'privacy_policy'
    language: string
    content: string
    version: string | null
    versionDescription: string | null
    isMainVersion: boolean
    isAuthoritativeVersion: boolean
    sourceAgreementId: string | null
    effectiveAt: Date | null
    isFromEnv: boolean
    hasUserConsent: boolean
    createdAt: Date
    updatedAt: Date
}

function createAgreement(overrides: Partial<AgreementRecord> = {}): AgreementRecord {
    return {
        id: 'agreement-1',
        type: 'user_agreement',
        language: 'zh-CN',
        content: '# Agreement',
        version: '1.0.0',
        versionDescription: 'Initial release',
        isMainVersion: true,
        isAuthoritativeVersion: true,
        sourceAgreementId: null,
        effectiveAt: new Date('2026-01-18T00:00:00.000Z'),
        isFromEnv: false,
        hasUserConsent: false,
        createdAt: new Date('2026-01-10T00:00:00.000Z'),
        updatedAt: new Date('2026-01-12T00:00:00.000Z'),
        ...overrides,
    }
}

describe('agreement service', () => {
    const mockAgreementRepo = {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    }

    const mockSettingRepo = {
        findOne: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
    }

    function mockSettings(mainLanguage = 'zh-CN', activeAgreementId: string | null = 'agreement-1') {
        mockSettingRepo.findOne.mockImplementation(({ where }: any) => {
            if (where.key === SettingKey.LEGAL_MAIN_LANGUAGE) {
                return Promise.resolve({ key: SettingKey.LEGAL_MAIN_LANGUAGE, value: mainLanguage })
            }
            if (where.key === SettingKey.LEGAL_USER_AGREEMENT_ID) {
                return Promise.resolve(activeAgreementId ? { key: SettingKey.LEGAL_USER_AGREEMENT_ID, value: activeAgreementId } : null)
            }
            if (where.key === SettingKey.LEGAL_PRIVACY_POLICY_ID) {
                return Promise.resolve(activeAgreementId ? { key: SettingKey.LEGAL_PRIVACY_POLICY_ID, value: activeAgreementId } : null)
            }
            return Promise.resolve(null)
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
            if (entity === AgreementContent) {
                return mockAgreementRepo as any
            }
            if (entity === Setting) {
                return mockSettingRepo as any
            }
            return {} as any
        })
        mockSettings()
    })

    it('returns the authoritative language version when preferred', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'older', updatedAt: new Date('2026-01-01T00:00:00.000Z') }),
            createAgreement({ id: 'current', updatedAt: new Date('2026-01-20T00:00:00.000Z') }),
        ])

        const result = await getAgreementContent('user_agreement', 'zh-CN', true)

        expect(result?.id).toBe('current')
    })

    it('returns the localized reference translation for the active authoritative version', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v2', version: '2.0.0', effectiveAt: new Date('2026-02-01T00:00:00.000Z') }),
            createAgreement({
                id: 'ua-v1',
                version: '1.0.0',
                effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            }),
            createAgreement({
                id: 'ua-v2-en',
                language: 'en-US',
                version: '2.0.0-en',
                isMainVersion: false,
                isAuthoritativeVersion: false,
                sourceAgreementId: 'ua-v2',
                effectiveAt: null,
            }),
        ])
        mockSettings('zh-CN', 'ua-v2')

        const result = await getActiveAgreementContent('user_agreement', 'en-US')

        expect(result).toMatchObject({
            id: 'ua-v2-en',
            isReferenceTranslation: true,
            fallbackToAuthoritative: false,
            sourceAgreementId: 'ua-v2',
            authoritativeVersion: '2.0.0',
        })
        expect(result?.effectiveAt).toBe('2026-02-01T00:00:00.000Z')
        expect(result?.history).toHaveLength(2)
        expect(result?.history[0]).toMatchObject({ id: 'ua-v2', isCurrentActive: true })
    })

    it('falls back to the authoritative version when no localized translation exists', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v2', version: '2.0.0' }),
        ])
        mockSettings('zh-CN', 'ua-v2')

        const result = await getActiveAgreementContent('user_agreement', 'ko-KR')

        expect(result).toMatchObject({
            id: 'ua-v2',
            language: 'zh-CN',
            isReferenceTranslation: false,
            fallbackToAuthoritative: true,
        })
    })

    it('returns admin payload with restriction reasons and authoritative options', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v2', version: '2.0.0', hasUserConsent: true }),
            createAgreement({
                id: 'ua-v2-en',
                language: 'en-US',
                version: '2.0.0-en',
                isMainVersion: false,
                isAuthoritativeVersion: false,
                sourceAgreementId: 'ua-v2',
                effectiveAt: null,
            }),
            createAgreement({
                id: 'env-version',
                version: 'seed',
                isFromEnv: true,
                effectiveAt: null,
            }),
        ])
        mockSettings('zh-CN', 'ua-v2')

        const result = await getAgreementVersions('user_agreement')

        expect(result.mainLanguage).toBe('zh-CN')
        expect(result.authoritativeOptions).toHaveLength(2)
        expect(result.items.find((item) => item.id === 'ua-v2')).toMatchObject({
            isCurrentActive: true,
            canEdit: false,
            canDelete: false,
            restrictionReasons: ['consented', 'active_authoritative'],
        })
        expect(result.items.find((item) => item.id === 'ua-v2-en')).toMatchObject({
            isReferenceTranslation: true,
            isCurrentReference: true,
            sourceAgreementId: 'ua-v2',
            canEdit: true,
        })
    })

    it('creates a reference translation linked to the latest authoritative version by default', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v2', version: '2.0.0' }),
        ])
        mockAgreementRepo.create.mockImplementation((payload) => payload)
        mockAgreementRepo.save.mockImplementation((payload) => Promise.resolve(payload))

        const result = await createAgreementVersion({
            type: 'user_agreement',
            language: 'en-US',
            content: '# English translation',
            version: '2.0.0-en',
        })

        expect(result).toMatchObject({
            id: 'generated-id',
            language: 'en-US',
            isAuthoritativeVersion: false,
            isMainVersion: false,
            sourceAgreementId: 'ua-v2',
        })
    })

    it('blocks updating the active authoritative version', async () => {
        mockAgreementRepo.findOne.mockResolvedValue(createAgreement({ id: 'ua-v2', version: '2.0.0' }))
        mockAgreementRepo.find.mockResolvedValue([createAgreement({ id: 'ua-v2', version: '2.0.0' })])
        mockSettings('zh-CN', 'ua-v2')

        await expect(updateAgreementContent('ua-v2', { content: '# updated' })).rejects.toThrow(
            'Cannot modify the currently active authoritative agreement; create a new version instead',
        )
    })

    it('allows updating a reference translation source mapping', async () => {
        const translation = createAgreement({
            id: 'ua-v2-en',
            language: 'en-US',
            version: '2.0.0-en',
            isMainVersion: false,
            isAuthoritativeVersion: false,
            sourceAgreementId: 'ua-v1',
            effectiveAt: null,
        })
        mockAgreementRepo.findOne.mockResolvedValue(translation)
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v1', version: '1.0.0' }),
            createAgreement({ id: 'ua-v2', version: '2.0.0', updatedAt: new Date('2026-02-02T00:00:00.000Z') }),
            translation,
        ])
        mockAgreementRepo.save.mockImplementation((payload) => Promise.resolve(payload))

        const result = await updateAgreementContent('ua-v2-en', {
            content: '# updated',
            sourceAgreementId: 'ua-v2',
        })

        expect(result).toMatchObject({
            content: '# updated',
            sourceAgreementId: 'ua-v2',
        })
    })

    it('blocks deleting the active authoritative version', async () => {
        mockAgreementRepo.findOne.mockResolvedValue(createAgreement({ id: 'ua-v2', version: '2.0.0' }))
        mockSettings('zh-CN', 'ua-v2')

        await expect(deleteAgreementVersion('ua-v2')).rejects.toThrow(
            'Cannot delete the currently active authoritative agreement',
        )
    })

    it('sets an authoritative version as active and persists the setting', async () => {
        const authoritative = createAgreement({ id: 'ua-v3', version: '3.0.0', effectiveAt: null })
        mockAgreementRepo.findOne.mockResolvedValue(authoritative)
        mockAgreementRepo.save.mockImplementation((payload) => Promise.resolve(payload))
        mockSettingRepo.findOne.mockImplementation(({ where }: any) => {
            if (where.key === SettingKey.LEGAL_MAIN_LANGUAGE) {
                return Promise.resolve({ key: SettingKey.LEGAL_MAIN_LANGUAGE, value: 'zh-CN' })
            }
            if (where.key === SettingKey.LEGAL_USER_AGREEMENT_ID) {
                return Promise.resolve(null)
            }
            return Promise.resolve(null)
        })
        mockSettingRepo.create.mockImplementation((payload) => payload)
        mockSettingRepo.save.mockImplementation((payload) => Promise.resolve(payload))

        const result = await setActiveAgreement('user_agreement', 'ua-v3')

        expect(result.effectiveAt).toBeInstanceOf(Date)
        expect(mockSettingRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            key: SettingKey.LEGAL_USER_AGREEMENT_ID,
            value: 'ua-v3',
        }))
    })

    it('marks both displayed translations and authoritative versions as consented for the locale', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({ id: 'ua-v2', version: '2.0.0' }),
            createAgreement({
                id: 'ua-v2-en',
                language: 'en-US',
                version: '2.0.0-en',
                isMainVersion: false,
                isAuthoritativeVersion: false,
                sourceAgreementId: 'ua-v2',
                effectiveAt: null,
            }),
            createAgreement({
                id: 'pp-v2',
                type: 'privacy_policy',
                version: '2.0.0',
            }),
            createAgreement({
                id: 'pp-v2-en',
                type: 'privacy_policy',
                language: 'en-US',
                version: '2.0.0-en',
                isMainVersion: false,
                isAuthoritativeVersion: false,
                sourceAgreementId: 'pp-v2',
                effectiveAt: null,
            }),
        ])
        mockSettingRepo.findOne.mockImplementation(({ where }: any) => {
            if (where.key === SettingKey.LEGAL_MAIN_LANGUAGE) {
                return Promise.resolve({ key: SettingKey.LEGAL_MAIN_LANGUAGE, value: 'zh-CN' })
            }
            if (where.key === SettingKey.LEGAL_USER_AGREEMENT_ID) {
                return Promise.resolve({ key: SettingKey.LEGAL_USER_AGREEMENT_ID, value: 'ua-v2' })
            }
            if (where.key === SettingKey.LEGAL_PRIVACY_POLICY_ID) {
                return Promise.resolve({ key: SettingKey.LEGAL_PRIVACY_POLICY_ID, value: 'pp-v2' })
            }
            return Promise.resolve(null)
        })

        await markAgreementConsentForLocale('en-US')

        expect(mockAgreementRepo.update).toHaveBeenCalledTimes(4)
        expect(mockAgreementRepo.update).toHaveBeenCalledWith({ id: 'ua-v2-en' }, { hasUserConsent: true })
        expect(mockAgreementRepo.update).toHaveBeenCalledWith({ id: 'ua-v2' }, { hasUserConsent: true })
        expect(mockAgreementRepo.update).toHaveBeenCalledWith({ id: 'pp-v2-en' }, { hasUserConsent: true })
        expect(mockAgreementRepo.update).toHaveBeenCalledWith({ id: 'pp-v2' }, { hasUserConsent: true })
    })
})
