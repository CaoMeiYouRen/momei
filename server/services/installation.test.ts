import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getInstallationStatus,
    isSystemInstalled,
    saveSiteConfig,
    markSystemInstalled,
    syncSettingsFromEnv,
    validateAdminPassword,
} from '../services/installation'
import { dataSource } from '../database'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/services/setting-audit', () => ({
    recordSettingAuditLogs: vi.fn(),
}))

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

        it('should not expose internal-only setting env values', async () => {
            process.env = {
                MOMEI_INSTALLED: 'true',
                WEB_PUSH_VAPID_PRIVATE_KEY: 'private-key',
                WEB_PUSH_VAPID_PUBLIC_KEY: 'public-key',
            } as NodeJS.ProcessEnv

            const status = await getInstallationStatus()

            expect(status.envSettings[SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]).toBeUndefined()
            expect(status.envSettings[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]).toBeDefined()
            expect(status.envSettings[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]).toMatchObject({
                envKey: 'WEB_PUSH_VAPID_PUBLIC_KEY',
                lockReason: 'env_override',
            })
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
        it('should save site configuration to database with localized setting payloads', async () => {
            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            const mockFind = vi.fn().mockResolvedValue([])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: vi.fn().mockResolvedValue(null),
                find: mockFind,
                delete: vi.fn().mockResolvedValue(undefined),
                create: mockCreate,
                save: mockSave,
            } as any)

            const config = {
                siteTitle: {
                    version: 1 as const,
                    type: 'localized-text' as const,
                    locales: {
                        'zh-CN': 'Test Blog',
                    },
                    legacyValue: '旧站点标题',
                },
                siteDescription: {
                    version: 1 as const,
                    type: 'localized-text' as const,
                    locales: {
                        'zh-CN': 'A test blog',
                    },
                    legacyValue: '旧站点描述',
                },
                siteKeywords: {
                    version: 1 as const,
                    type: 'localized-string-list' as const,
                    locales: {
                        'zh-CN': ['test', 'blog'],
                    },
                    legacyValue: ['旧关键词'],
                },
                siteUrl: 'https://example.com',
                postCopyright: 'all-rights-reserved' as const,
                siteCopyrightOwner: {
                    version: 1 as const,
                    type: 'localized-text' as const,
                    locales: {
                        'zh-CN': 'Test Studio',
                    },
                    legacyValue: '旧版权方',
                },
                siteCopyrightStartYear: '2024',
                defaultLanguage: 'zh-CN' as const,
            }

            await saveSiteConfig(config)

            const savedSiteTitle = mockSave.mock.calls
                .map(([value]) => value)
                .find((value) => value.key === SettingKey.SITE_TITLE)
            const savedSiteName = mockSave.mock.calls
                .map(([value]) => value)
                .find((value) => value.key === SettingKey.SITE_NAME)
            const savedCopyrightOwner = mockSave.mock.calls
                .map(([value]) => value)
                .find((value) => value.key === SettingKey.SITE_COPYRIGHT_OWNER)

            expect(savedSiteTitle).toBeDefined()
            expect(savedSiteName).toBeDefined()
            expect(savedCopyrightOwner).toBeDefined()
            expect(JSON.parse(savedSiteTitle.value)).toEqual({
                version: 1,
                type: 'localized-text',
                locales: {
                    'zh-CN': 'Test Blog',
                },
                legacyValue: '旧站点标题',
            })
            expect(savedSiteName.value).toBe('Test Blog')
            expect(JSON.parse(savedCopyrightOwner.value)).toEqual({
                version: 1,
                type: 'localized-text',
                locales: {
                    'zh-CN': 'Test Studio',
                },
                legacyValue: '旧版权方',
            })
            expect(mockFind).toHaveBeenCalled()
        })

        it('should preserve existing locales when installation saves a new locale payload', async () => {
            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            const mockFind = vi.fn(({ where }) => {
                const keys = where?.key?._value ?? where?.key ?? []

                if (Array.isArray(keys) && keys.includes(SettingKey.SITE_TITLE)) {
                    return Promise.resolve([{
                        key: SettingKey.SITE_TITLE,
                        value: JSON.stringify({
                            version: 1,
                            type: 'localized-text',
                            locales: {
                                'zh-CN': '墨梅博客',
                            },
                            legacyValue: '旧标题',
                        }),
                    }])
                }

                return Promise.resolve([])
            })

            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: vi.fn().mockResolvedValue(null),
                find: mockFind,
                delete: vi.fn().mockResolvedValue(undefined),
                create: mockCreate,
                save: mockSave,
            } as any)

            await saveSiteConfig({
                siteTitle: {
                    version: 1 as const,
                    type: 'localized-text',
                    locales: {
                        'en-US': 'Momei Blog',
                    },
                    legacyValue: null,
                },
                siteDescription: {
                    version: 1 as const,
                    type: 'localized-text',
                    locales: {},
                    legacyValue: null,
                },
                siteKeywords: {
                    version: 1 as const,
                    type: 'localized-string-list',
                    locales: {},
                    legacyValue: null,
                },
                siteUrl: 'https://example.com',
                postCopyright: 'all-rights-reserved',
                siteCopyrightOwner: {
                    version: 1 as const,
                    type: 'localized-text',
                    locales: {},
                    legacyValue: null,
                },
                siteCopyrightStartYear: '2024',
                defaultLanguage: 'zh-CN',
            })

            const savedSiteTitle = mockSave.mock.calls
                .map(([value]) => value)
                .find((value) => value.key === SettingKey.SITE_TITLE)

            expect(JSON.parse(savedSiteTitle.value)).toEqual({
                version: 1,
                type: 'localized-text',
                locales: {
                    'zh-CN': '墨梅博客',
                    'en-US': 'Momei Blog',
                },
                legacyValue: '旧标题',
            })
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

    describe('syncSettingsFromEnv', () => {
        it('should skip syncing internal-only setting keys to database', async () => {
            process.env = {
                WEB_PUSH_VAPID_PRIVATE_KEY: 'private-key',
                WEB_PUSH_VAPID_PUBLIC_KEY: 'public-key',
            } as NodeJS.ProcessEnv

            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            const mockFindOne = vi.fn().mockResolvedValue(null)

            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: mockFindOne,
                create: mockCreate,
                save: mockSave,
            } as any)

            await syncSettingsFromEnv()

            expect(mockFindOne).toHaveBeenCalledWith({ where: { key: SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY } })
            expect(mockFindOne).not.toHaveBeenCalledWith({ where: { key: SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY } })
            expect(mockSave).not.toHaveBeenCalledWith(expect.objectContaining({ key: SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY }))
        })
    })
})
