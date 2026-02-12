import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getAgreementContent,
    getActiveAgreementContent,
    getAgreementVersions,
    createAgreementVersion,
    updateAgreementContent,
    deleteAgreementVersion,
    setActiveAgreement,
} from './agreement'
import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/database')
vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(() => '123456789'),
    },
}))

describe('agreement service', () => {
    const mockAgreementRepo = {
        findOne: vi.fn(),
        findOneBy: vi.fn(),
        createQueryBuilder: vi.fn(),
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
    })

    describe('getAgreementContent', () => {
        it('should return main version when preferMainVersion is true', async () => {
            const mockAgreement = {
                id: '1',
                type: 'user_agreement',
                language: 'zh-CN',
                isMainVersion: true,
            }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)

            const result = await getAgreementContent('user_agreement', 'zh-CN', true)

            expect(result).toEqual(mockAgreement)
            expect(mockAgreementRepo.findOne).toHaveBeenCalledWith({
                where: { type: 'user_agreement', language: 'zh-CN', isMainVersion: true },
                order: { createdAt: 'DESC' },
            })
        })

        it('should fallback to latest version if main version not found', async () => {
            const mockAgreement = {
                id: '2',
                type: 'user_agreement',
                language: 'zh-CN',
                isMainVersion: false,
            }

            mockAgreementRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockAgreement)

            const result = await getAgreementContent('user_agreement', 'zh-CN', true)

            expect(result).toEqual(mockAgreement)
            expect(mockAgreementRepo.findOne).toHaveBeenCalledTimes(2)
        })

        it('should return latest version when preferMainVersion is false', async () => {
            const mockAgreement = { id: '1', type: 'privacy_policy', language: 'en-US' }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)

            const result = await getAgreementContent('privacy_policy', 'en-US', false)

            expect(result).toEqual(mockAgreement)
        })
    })

    describe('getActiveAgreementContent', () => {
        it('should return active agreement based on main language setting', async () => {
            const mockSetting = { key: SettingKey.LEGAL_MAIN_LANGUAGE, value: 'zh-CN' }
            const mockAgreement = { id: '1', type: 'user_agreement', language: 'zh-CN' }

            mockSettingRepo.findOne.mockResolvedValue(mockSetting)
            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)

            const result = await getActiveAgreementContent('user_agreement')

            expect(result).toEqual(mockAgreement)
        })

        it('should use default language if setting not found', async () => {
            mockSettingRepo.findOne.mockResolvedValue(null)
            mockAgreementRepo.findOne.mockResolvedValue({ id: '1' })

            await getActiveAgreementContent('user_agreement')

            expect(mockAgreementRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ language: 'zh-CN' }),
                }),
            )
        })
    })

    describe('getAgreementVersions', () => {
        it('should return all versions for a type', async () => {
            const mockVersions = [
                { id: '1', type: 'user_agreement', language: 'zh-CN' },
                { id: '2', type: 'user_agreement', language: 'en-US' },
            ]

            const mockQueryBuilder = {
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockVersions),
            }

            mockAgreementRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await getAgreementVersions('user_agreement')

            expect(result).toEqual(mockVersions)
        })

        it('should filter by language when provided', async () => {
            const mockQueryBuilder = {
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue([]),
            }

            mockAgreementRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            await getAgreementVersions('user_agreement', 'zh-CN')

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'agreement.language = :language',
                { language: 'zh-CN' },
            )
        })
    })

    describe('createAgreementVersion', () => {
        it('should create new agreement version', async () => {
            const agreementData = {
                type: 'user_agreement' as const,
                language: 'zh-CN',
                content: 'Agreement content',
                version: '1.0',
                isMainVersion: false,
            }

            mockAgreementRepo.create.mockReturnValue({ id: '123456789', ...agreementData })
            mockAgreementRepo.save.mockResolvedValue({ id: '123456789', ...agreementData })

            const result = await createAgreementVersion(agreementData)

            expect(result).toMatchObject(agreementData)
            expect(mockAgreementRepo.save).toHaveBeenCalled()
        })

        it('should unset other main versions when creating new main version', async () => {
            const agreementData = {
                type: 'user_agreement' as const,
                language: 'zh-CN',
                content: 'New main version',
                isMainVersion: true,
            }

            mockAgreementRepo.create.mockReturnValue({ id: '1', ...agreementData })
            mockAgreementRepo.save.mockResolvedValue({ id: '1', ...agreementData })

            await createAgreementVersion(agreementData)

            expect(mockAgreementRepo.update).toHaveBeenCalledWith(
                { type: 'user_agreement', language: 'zh-CN', isMainVersion: true },
                { isMainVersion: false },
            )
        })
    })

    describe('updateAgreementContent', () => {
        it('should update agreement content', async () => {
            const mockAgreement = {
                id: '1',
                type: 'user_agreement',
                language: 'zh-CN',
                content: 'Old content',
                isFromEnv: false,
                isMainVersion: false,
            }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)
            mockAgreementRepo.save.mockResolvedValue({
                ...mockAgreement,
                content: 'New content',
            })

            const result = await updateAgreementContent('1', { content: 'New content' })

            expect(result.content).toBe('New content')
        })

        it('should throw error if agreement not found', async () => {
            mockAgreementRepo.findOne.mockResolvedValue(null)

            await expect(
                updateAgreementContent('999', { content: 'New' }),
            ).rejects.toThrow('Agreement with ID 999 not found')
        })

        it('should throw error if trying to modify env agreement', async () => {
            mockAgreementRepo.findOne.mockResolvedValue({
                id: '1',
                isFromEnv: true,
            })

            await expect(
                updateAgreementContent('1', { content: 'New' }),
            ).rejects.toThrow('Cannot modify agreement content from environment variables')
        })

        it('should unset other main versions when updating to main', async () => {
            const mockAgreement = {
                id: '1',
                type: 'user_agreement',
                language: 'zh-CN',
                isFromEnv: false,
                isMainVersion: false,
            }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)
            mockAgreementRepo.save.mockResolvedValue({ ...mockAgreement, isMainVersion: true })

            await updateAgreementContent('1', { isMainVersion: true })

            expect(mockAgreementRepo.update).toHaveBeenCalled()
        })
    })

    describe('deleteAgreementVersion', () => {
        it('should delete agreement version', async () => {
            const mockAgreement = {
                id: '1',
                isFromEnv: false,
                hasUserConsent: false,
            }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)
            mockAgreementRepo.remove.mockResolvedValue(mockAgreement)

            await deleteAgreementVersion('1')

            expect(mockAgreementRepo.remove).toHaveBeenCalledWith(mockAgreement)
        })

        it('should throw error if agreement not found', async () => {
            mockAgreementRepo.findOne.mockResolvedValue(null)

            await expect(deleteAgreementVersion('999')).rejects.toThrow()
        })

        it('should throw error if trying to delete env agreement', async () => {
            mockAgreementRepo.findOne.mockResolvedValue({
                id: '1',
                isFromEnv: true,
            })

            await expect(deleteAgreementVersion('1')).rejects.toThrow(
                'Cannot delete agreement content from environment variables',
            )
        })

        it('should throw error if users have consented', async () => {
            mockAgreementRepo.findOne.mockResolvedValue({
                id: '1',
                isFromEnv: false,
                hasUserConsent: true,
            })

            await expect(deleteAgreementVersion('1')).rejects.toThrow(
                'Cannot delete agreement version that users have consented to',
            )
        })
    })

    describe('setActiveAgreement', () => {
        it('should set active agreement', async () => {
            const mockAgreement = {
                id: '1',
                type: 'user_agreement',
                isMainVersion: true,
            }

            mockAgreementRepo.findOne.mockResolvedValue(mockAgreement)
            mockSettingRepo.findOne.mockResolvedValue(null)
            mockSettingRepo.create.mockReturnValue({ key: SettingKey.LEGAL_USER_AGREEMENT_ID, value: '1' })
            mockSettingRepo.save.mockResolvedValue({ key: SettingKey.LEGAL_USER_AGREEMENT_ID, value: '1' })

            const result = await setActiveAgreement('user_agreement', '1')

            expect(result).toEqual(mockAgreement)
            expect(mockSettingRepo.save).toHaveBeenCalled()
        })

        it('should throw error if agreement not found', async () => {
            mockAgreementRepo.findOne.mockResolvedValue(null)

            await expect(setActiveAgreement('user_agreement', '999')).rejects.toThrow()
        })

        it('should throw error if not main version', async () => {
            mockAgreementRepo.findOne.mockResolvedValue({
                id: '1',
                isMainVersion: false,
            })

            await expect(setActiveAgreement('user_agreement', '1')).rejects.toThrow(
                'Only main version agreements can be set as active',
            )
        })
    })
})
