import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as settingService from './setting'
import { dataSource } from '@/server/database'
import { SettingKey } from '@/types/setting'

// Mock dataSource
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: true,
    },
}))

describe('settingService', () => {
    const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn(),
    }

    const mockSettingRepo = {
        findOne: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    const mockSettingAuditRepo = {
        create: vi.fn(),
        save: vi.fn(),
        findAndCount: vi.fn(),
    }

    const originalEnv = process.env

    beforeEach(() => {
        vi.clearAllMocks()
        process.env = { ...originalEnv }
        mockSettingRepo.find.mockResolvedValue([])
        ;(dataSource.getRepository as any).mockImplementation((entity: any) => {
            if (entity.name === 'Setting') {
                return mockSettingRepo
            }
            if (entity.name === 'SettingAuditLog') {
                return mockSettingAuditRepo
            }
            return {}
        })
        mockSettingAuditRepo.create.mockImplementation((data) => data)
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('getSetting', () => {
        it('should return setting value if found', async () => {
            mockSettingRepo.find.mockResolvedValue([{ key: SettingKey.SITE_TITLE, value: 'Momei' }])
            const result = await settingService.getSetting(SettingKey.SITE_TITLE)
            expect(result).toBe('Momei')
            expect(mockSettingRepo.find).toHaveBeenCalledTimes(1)
        })

        it('should return default value if not found in ENV or DB', async () => {
            mockSettingRepo.find.mockResolvedValue([])
            const result = await settingService.getSetting('unknown', 'Default')
            expect(result).toBe('Default')
        })

        it('should return null if not found and no default provided', async () => {
            mockSettingRepo.find.mockResolvedValue([])
            const result = await settingService.getSetting('unknown')
            expect(result).toBeNull()
        })

        it('should prioritize environment variable over database', async () => {
            process.env.NUXT_PUBLIC_APP_NAME = 'EnvTitle'
            mockSettingRepo.find.mockResolvedValue([{ key: SettingKey.SITE_NAME, value: 'DbTitle' }])

            const result = await settingService.getSetting(SettingKey.SITE_NAME)
            expect(result).toBe('EnvTitle')
            // Should not even query DB if ENV exists and is in the map
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('should keep site title independent from app name env override', async () => {
            process.env.NUXT_PUBLIC_APP_NAME = 'EnvAppName'
            mockSettingRepo.find.mockResolvedValue([{ key: SettingKey.SITE_TITLE, value: 'DbTitle' }])

            const result = await settingService.getSetting(SettingKey.SITE_TITLE)

            expect(result).toBe('DbTitle')
            expect(mockSettingRepo.find).toHaveBeenCalledTimes(1)
        })

        it('should read site url from NUXT_PUBLIC_SITE_URL', async () => {
            process.env.NUXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = await settingService.getSetting(SettingKey.SITE_URL)

            expect(result).toBe('https://example.com')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('should ignore database fallback for internal-only settings', async () => {
            mockSettingRepo.find.mockResolvedValue([{
                key: SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY,
                value: 'db-private-key',
            }])

            const result = await settingService.getSetting(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY)

            expect(result).toBeNull()
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('should read internal-only settings from env only', async () => {
            process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'env-private-key'

            const result = await settingService.getSetting(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY)

            expect(result).toBe('env-private-key')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })
    })

    describe('getSettings', () => {
        it('should return a record with found values and prioritize ENV', async () => {
            process.env.NUXT_PUBLIC_APP_NAME = 'EnvTitle'
            mockSettingRepo.find.mockResolvedValue([
                { key: SettingKey.SITE_NAME, value: 'DbTitle' },
                { key: SettingKey.SITE_DESCRIPTION, value: 'DbDesc' },
            ])

            const result = await settingService.getSettings([SettingKey.SITE_NAME, SettingKey.SITE_DESCRIPTION, 'unknown'])

            expect(result).toEqual({
                [SettingKey.SITE_NAME]: 'EnvTitle',
                [SettingKey.SITE_DESCRIPTION]: 'DbDesc',
                unknown: null,
            })
        })

        it('should not hydrate internal-only settings from database', async () => {
            mockSettingRepo.find.mockResolvedValue([
                { key: SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY, value: 'db-private-key' },
            ])

            const result = await settingService.getSettings([SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY])

            expect(result).toEqual({
                [SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]: null,
            })
        })
    })

    describe('resolveSetting', () => {
        it('should expose env override metadata when environment variable is present', async () => {
            process.env.NUXT_PUBLIC_APP_NAME = 'EnvTitle'

            const result = await settingService.resolveSetting(SettingKey.SITE_NAME)

            expect(result).toMatchObject({
                key: SettingKey.SITE_NAME,
                value: 'EnvTitle',
                source: 'env',
                isLocked: true,
                envKey: 'NUXT_PUBLIC_APP_NAME',
                defaultUsed: false,
                lockReason: 'env_override',
                requiresRestart: false,
            })
        })

        it('should keep actual source as db for forced lock keys without env override', async () => {
            mockSettingRepo.find.mockResolvedValue([{
                key: SettingKey.GITHUB_CLIENT_ID,
                value: 'db-client-id',
                level: 2,
                description: 'GitHub client id',
                maskType: 'none',
            }])

            const result = await settingService.resolveSetting(SettingKey.GITHUB_CLIENT_ID)

            expect(result).toMatchObject({
                key: SettingKey.GITHUB_CLIENT_ID,
                value: 'db-client-id',
                source: 'db',
                isLocked: true,
                envKey: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
                defaultUsed: false,
                lockReason: 'forced_env_lock',
                requiresRestart: true,
            })
        })

        it('should treat access token settings as admin-visible password fields', async () => {
            process.env.LISTMONK_ACCESS_TOKEN = 'listmonk-token-value'

            const result = await settingService.resolveSetting(SettingKey.LISTMONK_ACCESS_TOKEN)

            expect(result).toMatchObject({
                key: SettingKey.LISTMONK_ACCESS_TOKEN,
                value: 'listmonk-token-value',
                source: 'env',
                level: 2,
                maskType: 'password',
            })
        })

        it('should keep publicly exposed settings unmasked and level 0', async () => {
            process.env.NUXT_PUBLIC_CONTACT_EMAIL = 'public@example.com'

            const result = await settingService.resolveSetting(SettingKey.CONTACT_EMAIL)

            expect(result).toMatchObject({
                key: SettingKey.CONTACT_EMAIL,
                value: 'public@example.com',
                source: 'env',
                level: 0,
                maskType: 'none',
            })
        })
    })

    describe('setSetting', () => {
        it('should update existing setting', async () => {
            const existing = { id: '1', key: 'title', value: 'Old', maskType: 'none' }
            mockSettingRepo.find.mockResolvedValue([existing])

            await settingService.setSetting('title', 'New', { description: 'New Desc' })

            expect(existing.value).toBe('New')
            expect((existing as any).description).toBe('New Desc')
            expect(mockSettingRepo.save).toHaveBeenCalledWith(existing)
        })

        it('should create new setting if not exists', async () => {
            mockSettingRepo.find.mockResolvedValue([])
            const newSetting = { id: '2', key: 'new_key', value: 'val', maskType: 'none' }
            mockSettingRepo.create.mockReturnValue(newSetting)

            await settingService.setSetting('new_key', 'val')

            expect(mockSettingRepo.create).toHaveBeenCalledWith({
                key: 'new_key',
                value: 'val',
                description: '',
                level: 2,
                maskType: 'key',
            })
            expect(mockSettingRepo.save).toHaveBeenCalledWith(newSetting)
        })

        it('should record masked audit log when setting value changes', async () => {
            const existing = {
                id: '3',
                key: SettingKey.AI_API_KEY,
                value: 'sk-old-secret',
                description: '',
                level: 3,
                maskType: 'key',
            }
            mockSettingRepo.find.mockResolvedValue([existing])

            await settingService.setSetting(SettingKey.AI_API_KEY, 'sk-new-secret', undefined, {
                operatorId: 'admin-1',
                reason: 'rotate-key',
                source: 'admin_ui',
            })

            expect(mockSettingAuditRepo.save).toHaveBeenCalledWith([
                expect.objectContaining({
                    settingKey: SettingKey.AI_API_KEY,
                    action: 'update',
                    operatorId: 'admin-1',
                    reason: 'rotate-key',
                    source: 'admin_ui',
                    oldValue: expect.stringContaining('***'),
                    newValue: expect.stringContaining('***'),
                }),
            ])
        })
    })

    describe('setSettings', () => {
        it('should update multiple settings', async () => {
            mockSettingRepo.find.mockResolvedValue([])
            mockSettingRepo.create.mockImplementation((data) => data)

            await settingService.setSettings({
                key1: 'val1',
                key2: 'val2',
            })

            expect(mockSettingRepo.save).toHaveBeenCalledTimes(2)
        })

        it('should skip persisting internal-only settings', async () => {
            await settingService.setSettings({
                [SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]: 'private-key',
            })

            expect(mockSettingRepo.find).not.toHaveBeenCalled()
            expect(mockSettingRepo.save).not.toHaveBeenCalled()
        })
    })

    describe('getAllSettings', () => {
        it('should return all settings with metadata', async () => {
            const dbSettings = [
                {
                    key: 'a',
                    value: '1',
                    level: 2,
                    description: 'desc a',
                    maskType: 'none',
                },
            ]
            mockQueryBuilder.getMany.mockResolvedValue(dbSettings)

            const result = await settingService.getAllSettings()

            expect(result).toContainEqual(
                expect.objectContaining({
                    key: 'a',
                    value: '1',
                    level: 2,
                    description: 'desc a',
                    maskType: 'none',
                    source: 'db',
                    isLocked: false,
                }),
            )
            // Should also contain mapped settings from SETTING_ENV_MAP alongside DB records.
            expect(result.length).toBeGreaterThanOrEqual(
                Object.keys(settingService.SETTING_ENV_MAP).length - settingService.INTERNAL_ONLY_SETTING_KEYS.length,
            )
        })

        it('should expose default-backed metadata for registered defaults', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([])

            const result = await settingService.getAllSettings()
            const emailPortSetting = result.find((item) => item.key === String(SettingKey.EMAIL_PORT))
            const aiCostFactorsSetting = result.find((item) => item.key === String(SettingKey.AI_COST_FACTORS))

            expect(emailPortSetting).toMatchObject({
                key: SettingKey.EMAIL_PORT,
                value: '587',
                source: 'default',
                envKey: 'EMAIL_PORT',
                defaultUsed: true,
                lockReason: null,
                requiresRestart: false,
            })
            expect(aiCostFactorsSetting).toMatchObject({
                key: SettingKey.AI_COST_FACTORS,
                source: 'default',
                envKey: 'AI_COST_FACTORS',
                defaultUsed: true,
                lockReason: null,
                requiresRestart: false,
            })
        })

        it('should not expose internal-only settings in admin listing', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([
                {
                    key: SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY,
                    value: 'db-private-key',
                    level: 3,
                    description: 'secret',
                    maskType: 'password',
                },
            ])

            const result = await settingService.getAllSettings({ includeSecrets: true })

            expect(result.find((item) => item.key === String(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY))).toBeUndefined()
        })

        it('should normalize legacy access token metadata in admin listing', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([
                {
                    key: SettingKey.MEMOS_ACCESS_TOKEN,
                    value: 'legacy-token-value',
                    level: 3,
                    description: 'legacy memos token',
                    maskType: 'key',
                },
            ])

            const result = await settingService.getAllSettings({ shouldMask: true })
            const memosAccessTokenSetting = result.find((item) => item.key === String(SettingKey.MEMOS_ACCESS_TOKEN))

            expect(memosAccessTokenSetting).toMatchObject({
                key: SettingKey.MEMOS_ACCESS_TOKEN,
                value: '********',
                level: 2,
                maskType: 'password',
            })
        })

        it('should keep public settings unmasked in admin listing even if legacy mask exists', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([
                {
                    key: SettingKey.CONTACT_EMAIL,
                    value: 'public@example.com',
                    level: 2,
                    description: 'contact email',
                    maskType: 'email',
                },
            ])

            const result = await settingService.getAllSettings({ shouldMask: true })
            const contactEmailSetting = result.find((item) => item.key === String(SettingKey.CONTACT_EMAIL))

            expect(contactEmailSetting).toMatchObject({
                key: SettingKey.CONTACT_EMAIL,
                value: 'public@example.com',
                level: 0,
                maskType: 'none',
            })
        })
    })
})
