import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getInstallationStatus,
    isSystemInstalled,
    saveSiteConfig,
    markSystemInstalled,
    validateAdminPassword,
} from '../services/installation'
import { dataSource } from '../database'

// Mock 数据库
vi.mock('../database', () => ({
    dataSource: {
        isInitialized: true,
        options: { type: 'sqlite' },
        query: vi.fn().mockResolvedValue([]),
        getRepository: vi.fn(),
    },
}))

describe('Installation Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('validateAdminPassword', () => {
        it('should reject password shorter than 8 characters', () => {
            const result = validateAdminPassword('short')
            expect(result.valid).toBe(false)
            expect(result.message).toContain('at least 8 characters')
        })

        it('should reject password without numbers', () => {
            const result = validateAdminPassword('onlyletters')
            expect(result.valid).toBe(false)
            expect(result.message).toContain('at least one number')
        })

        it('should reject password without letters', () => {
            const result = validateAdminPassword('12345678')
            expect(result.valid).toBe(false)
            expect(result.message).toContain('at least one letter')
        })

        it('should accept valid password', () => {
            const result = validateAdminPassword('password123')
            expect(result.valid).toBe(true)
            expect(result.message).toBeUndefined()
        })
    })

    describe('getInstallationStatus', () => {
        it('should return installed=true when env flag is set', async () => {
            // Mock 环境变量
            process.env.MOMEI_INSTALLED = 'true'

            const status = await getInstallationStatus()

            expect(status.installed).toBe(true)
            expect(status.envInstallationFlag).toBe(true)

            // 清理
            delete process.env.MOMEI_INSTALLED
        })

        it('should return installed=false when database is not connected', async () => {
            process.env.MOMEI_INSTALLED = 'false'
            vi.mocked(dataSource.query).mockRejectedValue(new Error('Connection failed'))

            const status = await getInstallationStatus()

            expect(status.installed).toBe(false)
            expect(status.databaseConnected).toBe(false)

            delete process.env.MOMEI_INSTALLED
        })

        it('should return installed=false when no users exist', async () => {
            process.env.MOMEI_INSTALLED = 'false'
            vi.mocked(dataSource.query).mockResolvedValue([])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(0),
                findOne: vi.fn().mockResolvedValue(null),
            } as any)

            const status = await getInstallationStatus()

            expect(status.installed).toBe(false)
            expect(status.hasUsers).toBe(false)

            delete process.env.MOMEI_INSTALLED
        })

        it('should return installed=true when users exist and flag is set', async () => {
            vi.mocked(dataSource.query).mockResolvedValue([])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)

            const status = await getInstallationStatus()

            expect(status.installed).toBe(true)
            expect(status.hasUsers).toBe(true)
            expect(status.hasInstallationFlag).toBe(true)
        })
    })

    describe('isSystemInstalled', () => {
        it('should return boolean value', async () => {
            process.env.MOMEI_INSTALLED = 'true'

            const installed = await isSystemInstalled()

            expect(typeof installed).toBe('boolean')
            expect(installed).toBe(true)

            delete process.env.MOMEI_INSTALLED
        })
    })

    describe('saveSiteConfig', () => {
        it('should save site configuration to database', async () => {
            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: vi.fn().mockResolvedValue(null),
                create: mockCreate,
                save: mockSave,
            } as any)

            const config = {
                siteTitle: 'Test Blog',
                siteDescription: 'A test blog',
                siteKeywords: 'test, blog',
                siteCopyright: '© 2024 Test',
                defaultLanguage: 'zh-CN' as const,
            }

            await saveSiteConfig(config)

            expect(mockSave).toHaveBeenCalledTimes(15)
            expect(mockSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'site_title',
                    value: 'Test Blog',
                }),
            )
        })
    })

    describe('markSystemInstalled', () => {
        it('should mark system as installed in database', async () => {
            const mockSave = vi.fn()
            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: vi.fn().mockResolvedValue(null),
                create: vi.fn((item) => item),
                save: mockSave,
            } as any)

            await markSystemInstalled()

            expect(mockSave).toHaveBeenCalledWith({
                key: 'system_installed',
                value: 'true',
                description: '系统安装标记',
            })
        })
    })
})
