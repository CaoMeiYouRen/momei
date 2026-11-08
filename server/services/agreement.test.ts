import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createAgreementVersion,
    deleteAgreementVersion,
    getActiveAgreementContent,
    getAgreementContent,
    getAgreementVersions,
    markAgreementConsentForLocale,
    setAgreementReviewStatus,
    setActiveAgreement,
    updateAgreementContent,
} from './agreement'
import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { Setting } from '@/server/entities/setting'
import type { AgreementReviewStatus } from '@/types/agreement'
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
    reviewStatus: AgreementReviewStatus
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
        reviewStatus: 'approved',
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
            reviewStatus: 'approved',
            isCurrentActive: true,
            canEdit: false,
            canDelete: false,
            canActivate: false,
            restrictionReasons: ['consented', 'active_authoritative'],
        })
        expect(result.items.find((item) => item.id === 'ua-v2-en')).toMatchObject({
            isReferenceTranslation: true,
            isCurrentReference: true,
            sourceAgreementId: 'ua-v2',
            canEdit: true,
        })
    })

    it('creates a reference translation linked to the active authoritative version by default', async () => {
        mockAgreementRepo.find.mockResolvedValue([
            createAgreement({
                id: 'ua-v3',
                version: '3.0.0',
                effectiveAt: null,
                updatedAt: new Date('2026-03-01T00:00:00.000Z'),
            }),
            createAgreement({
                id: 'ua-v2',
                version: '2.0.0',
                effectiveAt: new Date('2026-02-01T00:00:00.000Z'),
                updatedAt: new Date('2026-02-02T00:00:00.000Z'),
            }),
        ])
        mockSettings('zh-CN', 'ua-v2')
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
            reviewStatus: 'draft',
            isAuthoritativeVersion: false,
            isMainVersion: false,
            sourceAgreementId: 'ua-v2',
        })
    })

    it('moves a draft agreement into pending review and then approved', async () => {
        const draftAgreement = createAgreement({
            id: 'draft-1',
            version: '3.0.0',
            effectiveAt: null,
            reviewStatus: 'draft',
        })
        mockAgreementRepo.findOne.mockResolvedValue(draftAgreement)
        mockAgreementRepo.save.mockImplementation((payload) => Promise.resolve(payload))

        const pendingReview = await setAgreementReviewStatus('draft-1', 'pending_review')
        expect(pendingReview).toMatchObject({ reviewStatus: 'pending_review' })

        mockAgreementRepo.findOne.mockResolvedValue({ ...draftAgreement, reviewStatus: 'pending_review' })
        const approved = await setAgreementReviewStatus('draft-1', 'approved')
        expect(approved).toMatchObject({ reviewStatus: 'approved' })
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
        const authoritative = createAgreement({ id: 'ua-v3', version: '3.0.0', effectiveAt: null, reviewStatus: 'approved' })
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

    it('blocks activating draft agreements before approval', async () => {
        mockAgreementRepo.findOne.mockResolvedValue(createAgreement({
            id: 'ua-v4',
            version: '4.0.0',
            effectiveAt: null,
            reviewStatus: 'draft',
        }))

        await expect(setActiveAgreement('user_agreement', 'ua-v4')).rejects.toThrow('Only approved agreements can be activated')
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

    describe('协议版本回退与管理端边界场景', () => {
        it('主语言缺少权威版本时回退到最新的本地化版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({
                    id: 'zh-old',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                }),
                createAgreement({
                    id: 'zh-new',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                }),
            ])
            mockSettings('zh-CN', null)

            const result = await getAgreementContent('user_agreement', 'zh-CN', true)

            expect(result?.id).toBe('zh-new')
        })

        it('非主语言请求返回该语言下最新的版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({
                    id: 'en-old',
                    language: 'en-US',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                }),
                createAgreement({
                    id: 'en-new',
                    language: 'en-US',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                }),
            ])
            mockSettings('zh-CN', null)

            const result = await getAgreementContent('user_agreement', 'en-US')

            expect(result?.id).toBe('en-new')
        })

        it('配置的生效版本未审批时回退到最新已审批权威版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({
                    id: 'pending-active',
                    reviewStatus: 'draft',
                    effectiveAt: new Date('2026-03-01T00:00:00.000Z'),
                }),
                createAgreement({
                    id: 'approved-active',
                    reviewStatus: 'approved',
                    effectiveAt: new Date('2026-02-01T00:00:00.000Z'),
                }),
            ])
            mockSettings('zh-CN', 'pending-active')

            const result = await getActiveAgreementContent('user_agreement')

            expect(result?.id).toBe('approved-active')
            expect(result?.history.map((item) => item.id)).toEqual(['approved-active'])
        })

        it('没有任何已审批权威版本时返回空结果并记录告警', async () => {
            mockAgreementRepo.find.mockResolvedValue([])
            mockSettings('zh-CN', 'missing-agreement')

            await expect(getActiveAgreementContent('user_agreement')).resolves.toBeNull()
        })

        it('创建参考译文时必须存在可关联的权威版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([])
            mockSettings('zh-CN', null)

            await expect(createAgreementVersion({
                type: 'user_agreement',
                language: 'en-US',
                content: '# English',
            })).rejects.toThrow('Reference translations must link to an authoritative agreement version')
        })

        it('参考译文不能关联到不在权威版本集合中的版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({ id: 'zh-main', version: '1.0.0' }),
                createAgreement({
                    id: 'en-source',
                    language: 'en-US',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    sourceAgreementId: 'zh-main',
                }),
            ])
            mockSettings('zh-CN', 'zh-main')

            await expect(createAgreementVersion({
                type: 'user_agreement',
                language: 'en-US',
                content: '# English',
                sourceAgreementId: 'en-source',
            })).rejects.toThrow('Reference translations must link to an authoritative agreement version')
        })

        it('参考译文的来源协议类型必须与目标类型一致', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({ id: 'privacy-main', type: 'privacy_policy', version: '1.0.0' }),
            ])
            mockSettings('zh-CN', 'privacy-main')

            await expect(createAgreementVersion({
                type: 'user_agreement',
                language: 'en-US',
                content: '# English',
                sourceAgreementId: 'privacy-main',
            })).rejects.toThrow('Reference translation source type mismatch')
        })

        it('管理端列表按语言过滤版本', async () => {
            mockAgreementRepo.find.mockResolvedValue([
                createAgreement({ id: 'zh-main', version: '1.0.0' }),
                createAgreement({
                    id: 'en-main',
                    language: 'en-US',
                    isMainVersion: false,
                    isAuthoritativeVersion: false,
                    sourceAgreementId: 'zh-main',
                }),
            ])
            mockSettings('zh-CN', 'zh-main')

            const result = await getAgreementVersions('user_agreement', 'en-US')

            expect(result.items.map((item) => item.id)).toEqual(['en-main'])
            expect(result.authoritativeOptions.map((item) => item.id)).toEqual(['zh-main'])
        })

        it('更新协议时拒绝不存在的版本、环境变量版本和已同意版本', async () => {
            mockAgreementRepo.findOne.mockResolvedValueOnce(null)
            await expect(updateAgreementContent('missing', { content: '# x' }))
                .rejects.toThrow('Agreement with ID missing not found')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'env-version', isFromEnv: true }))
            await expect(updateAgreementContent('env-version', { content: '# x' }))
                .rejects.toThrow('Cannot modify agreement content from environment variables')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'consented', hasUserConsent: true }))
            await expect(updateAgreementContent('consented', { content: '# x' }))
                .rejects.toThrow('Cannot modify agreement version that users have already consented to')
        })

        it('删除协议时拒绝不存在的版本、环境变量版本和已同意版本，并支持删除普通版本', async () => {
            mockAgreementRepo.findOne.mockResolvedValueOnce(null)
            await expect(deleteAgreementVersion('missing'))
                .rejects.toThrow('Agreement with ID missing not found')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'env-version', isFromEnv: true }))
            await expect(deleteAgreementVersion('env-version'))
                .rejects.toThrow('Cannot delete agreement content from environment variables')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'consented', hasUserConsent: true }))
            await expect(deleteAgreementVersion('consented'))
                .rejects.toThrow('Cannot delete agreement version that users have consented to')

            const deletable = createAgreement({ id: 'old-version', effectiveAt: null })
            mockAgreementRepo.findOne.mockResolvedValueOnce(deletable)
            mockAgreementRepo.remove.mockResolvedValueOnce(deletable)
            mockSettings('zh-CN', 'current-version')

            await expect(deleteAgreementVersion('old-version')).resolves.toBe(deletable)
            expect(mockAgreementRepo.remove).toHaveBeenCalledWith(deletable)
        })

        it('设置生效版本时校验存在性与权威语言，并更新已有配置项', async () => {
            mockAgreementRepo.findOne.mockResolvedValueOnce(null)
            await expect(setActiveAgreement('user_agreement', 'missing'))
                .rejects.toThrow('Agreement with ID missing not found')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({
                id: 'en-version',
                language: 'en-US',
                isMainVersion: false,
                isAuthoritativeVersion: false,
            }))
            await expect(setActiveAgreement('user_agreement', 'en-version'))
                .rejects.toThrow('Only authoritative-language versions can be set as active')

            const target = createAgreement({ id: 'ua-v5', version: '5.0.0', effectiveAt: null, reviewStatus: 'approved' })
            const existingSetting = { key: SettingKey.LEGAL_USER_AGREEMENT_ID, value: 'ua-v4' }
            mockAgreementRepo.findOne.mockResolvedValueOnce(target)
            mockAgreementRepo.save.mockResolvedValueOnce(target)
            mockSettingRepo.findOne.mockImplementation(({ where }: any) => {
                if (where.key === SettingKey.LEGAL_MAIN_LANGUAGE) {
                    return Promise.resolve({ key: SettingKey.LEGAL_MAIN_LANGUAGE, value: 'zh-CN' })
                }
                if (where.key === SettingKey.LEGAL_USER_AGREEMENT_ID) {
                    return Promise.resolve(existingSetting)
                }
                return Promise.resolve(null)
            })
            mockSettingRepo.save.mockImplementation((payload) => Promise.resolve(payload))

            await expect(setActiveAgreement('user_agreement', 'ua-v5')).resolves.toBe(target)
            expect(existingSetting.value).toBe('ua-v5')
            expect(mockSettingRepo.save).toHaveBeenCalledWith(existingSetting)
        })

        it('审批状态流转覆盖不存在、环境变量、已同意、生效版本、重复状态与非法流转', async () => {
            mockAgreementRepo.findOne.mockResolvedValueOnce(null)
            await expect(setAgreementReviewStatus('missing', 'approved'))
                .rejects.toThrow('Agreement with ID missing not found')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'env-version', isFromEnv: true }))
            await expect(setAgreementReviewStatus('env-version', 'approved'))
                .rejects.toThrow('Cannot modify agreement content from environment variables')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'consented', hasUserConsent: true }))
            await expect(setAgreementReviewStatus('consented', 'approved'))
                .rejects.toThrow('Cannot modify agreement version that users have already consented to')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({ id: 'active-version' }))
            mockSettings('zh-CN', 'active-version')
            await expect(setAgreementReviewStatus('active-version', 'draft'))
                .rejects.toThrow('Cannot change the review status of the currently active authoritative agreement')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({
                id: 'approved-version',
                reviewStatus: 'approved',
                effectiveAt: null,
            }))
            mockSettings('zh-CN', 'other-version')
            await expect(setAgreementReviewStatus('approved-version', 'approved'))
                .resolves.toMatchObject({ id: 'approved-version' })
            expect(mockAgreementRepo.save).not.toHaveBeenCalled()

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({
                id: 'approved-draft',
                reviewStatus: 'approved',
                effectiveAt: null,
            }))
            await expect(setAgreementReviewStatus('approved-draft', 'pending_review'))
                .rejects.toThrow('Only draft agreements can be submitted for review')

            mockAgreementRepo.findOne.mockResolvedValueOnce(createAgreement({
                id: 'legacy-status',
                reviewStatus: 'legacy' as AgreementReviewStatus,
                effectiveAt: null,
            }))
            await expect(setAgreementReviewStatus('legacy-status', 'approved'))
                .rejects.toThrow('Only draft or pending-review agreements can be approved')
        })
    })
})
