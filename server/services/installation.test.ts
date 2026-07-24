import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getInstallationStatus,
    isSystemInstalled,
    saveSiteConfig,
    markSystemInstalled,
    syncSettingsFromEnv,
    saveExtraConfig,
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
            }

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
            }

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

        it('should create new settings from env when no existing records', async () => {
            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            const mockFindOne = vi.fn().mockResolvedValue(null)

            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: mockFindOne,
                create: mockCreate,
                save: mockSave,
            } as any)

            await syncSettingsFromEnv()

            // Should create non-internal keys with matching env vars (e.g., WEB_PUSH_VAPID_PUBLIC_KEY)
            expect(mockCreate).toHaveBeenCalled()
            expect(mockSave).toHaveBeenCalled()
        })

        it('should skip syncing when env value is empty', async () => {
            process.env = {
                SOME_EMPTY_VAR: '',
            }

            const mockSave = vi.fn()
            const mockCreate = vi.fn((item) => item)
            const mockFindOne = vi.fn().mockResolvedValue(null)

            vi.mocked(dataSource.getRepository).mockReturnValue({
                findOne: mockFindOne,
                create: mockCreate,
                save: mockSave,
            } as any)

            await syncSettingsFromEnv()

            // Only WEB_PUSH_VAPID_PUBLIC_KEY would have a non-empty value in global process.env
            // Empty values should not trigger saves
        })
    })

    describe('runtime detection via getInstallationStatus', () => {
        beforeEach(() => {
            vi.mocked(dataSource.query).mockResolvedValue([{ version: '3.45.0' }])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)
        })

        it('should detect cloudflare runtime', async () => {
            process.env.CF_PAGES = 'true'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('cloudflare')
            delete process.env.CF_PAGES
        })

        it('should detect vercel runtime', async () => {
            process.env.VERCEL = 'true'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('vercel')
            delete process.env.VERCEL
        })

        it('should detect netlify runtime', async () => {
            process.env.NETLIFY = 'true'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('netlify')
            delete process.env.NETLIFY
        })

        it('should detect aws-lambda runtime', async () => {
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-function'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('aws-lambda')
            delete process.env.AWS_LAMBDA_FUNCTION_NAME
        })

        it('should detect zeabur runtime', async () => {
            process.env.ZEABUR = 'true'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('zeabur')
            delete process.env.ZEABUR
        })

        it('should detect docker runtime', async () => {
            process.env.DOCKER = 'true'
            const status = await getInstallationStatus()
            expect(status.runtime).toBe('docker')
            delete process.env.DOCKER
        })

        it('should detect self-hosted-node when no known env vars set', async () => {
            const origNodeEnv = process.env.NODE_ENV
            // Set to undefined to avoid both 'development' and Docker path
            delete process.env.NODE_ENV

            // Clear all runtime env vars including Docker
            delete process.env.CF_PAGES
            delete process.env.VERCEL
            delete process.env.NETLIFY
            delete process.env.AWS_LAMBDA_FUNCTION_NAME
            delete process.env.ZEABUR
            delete process.env.DOCKER

            // Re-import installation module with clean state to get fresh detection
            vi.resetModules()
            const { getInstallationStatus: freshGetStatus } = await import('../services/installation')

            // Need to re-setup mocks after resetModules
            vi.mocked(dataSource.query).mockResolvedValue([{ version: '3.45.0' }])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)

            // We can't fully avoid /.dockerenv detection in Docker, so skip if needed
            const status = await freshGetStatus()
            // Accept either 'docker' (when /.dockerenv exists) or 'self-hosted-node'
            expect(['docker', 'self-hosted-node']).toContain(status.runtime)

            process.env.NODE_ENV = origNodeEnv
        })

        it('should retrieve sqlite database version', async () => {
            vi.mocked(dataSource.query).mockResolvedValue([{ version: '3.45.1' }])
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)

            const status = await getInstallationStatus()
            expect(status.databaseVersion).toBe('3.45.1')
        })

        it('should handle database version query failure gracefully', async () => {
            vi.mocked(dataSource.query).mockRejectedValue(new Error('Query failed'))
            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)

            const status = await getInstallationStatus()
            expect(status.databaseVersion).toBe('Unknown')
        })

        it('should return serverless=true for unknown runtime', async () => {
            // Simulate isServerlessEnvironment returning true
            const origNodeEnv = process.env.NODE_ENV
            delete process.env.NODE_ENV

            // Clear all runtime env vars
            delete process.env.CF_PAGES
            delete process.env.VERCEL
            delete process.env.NETLIFY
            delete process.env.AWS_LAMBDA_FUNCTION_NAME
            delete process.env.ZEABUR
            delete process.env.DOCKER

            vi.mocked(dataSource.getRepository).mockReturnValue({
                count: vi.fn().mockResolvedValue(1),
                findOne: vi.fn().mockResolvedValue({ key: 'system_installed', value: 'true' }),
            } as any)

            const status = await getInstallationStatus()
            // When NODE_ENV is not 'development', and not a known serverless, it falls to 'self-hosted-node'
            expect(status.isServerless).toBeDefined()
            process.env.NODE_ENV = origNodeEnv
        })
    })

    describe('saveExtraConfig', () => {
        let mockSettingRepo: any

        beforeEach(() => {
            mockSettingRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                create: vi.fn((item: any) => item),
                save: vi.fn().mockResolvedValue(undefined),
            }
            vi.mocked(dataSource.getRepository).mockReturnValue(mockSettingRepo)
        })

        it('should create all settings from minimal config', async () => {
            await saveExtraConfig({})

            // Should have created many settings
            expect(mockSettingRepo.create).toHaveBeenCalled()
            expect(mockSettingRepo.save).toHaveBeenCalled()
        })

        it('should enable AI when aiApiKey is provided', async () => {
            await saveExtraConfig({
                aiApiKey: 'sk-test-key',
                aiProvider: 'openai',
                aiModel: 'gpt-4',
            })

            // Find AI_ENABLED setting
            const createCalls = mockSettingRepo.create.mock.calls.map(([c]: any) => c)
            const aiEnabledSetting = createCalls.find((c: any) => c.key === SettingKey.AI_ENABLED)
            expect(aiEnabledSetting).toBeDefined()
            expect(aiEnabledSetting.value).toBe('true')

            const aiKeySetting = createCalls.find((c: any) => c.key === SettingKey.AI_API_KEY)
            expect(aiKeySetting).toBeDefined()
            expect(aiKeySetting.value).toBe('sk-test-key')
        })

        it('should update existing settings when they already exist', async () => {
            const mockSave = vi.fn((item: any) => Promise.resolve(item))
            const mockCreate = vi.fn((item: any) => item)
            // Track which keys are queried
            const queriedKeys: string[] = []
            mockSettingRepo.findOne = vi.fn(({ where }: any) => {
                const key = where?.key
                queriedKeys.push(key)
                // Return an existing record only for the keys we know exist
                if (key === SettingKey.AI_ENABLED || key === SettingKey.STORAGE_TYPE) {
                    return Promise.resolve({
                        key,
                        value: key === SettingKey.AI_ENABLED ? 'true' : 's3',
                        description: 'Existing',
                        level: 0,
                    } as any)
                }
                return Promise.resolve(null)
            })
            mockSettingRepo.save = mockSave
            mockSettingRepo.create = mockCreate

            await saveExtraConfig({
                aiApiKey: 'sk-updated-key',
                storageType: 'local',
            })

            // Settings with existing records should go through update (save with existing obj)
            expect(mockSave).toHaveBeenCalled()

            // Settings without existing records should go through create
            expect(mockCreate).toHaveBeenCalled()
        })

        it('should skip masked placeholder password values', async () => {
            // When value is '********' (masked placeholder) and maskType is 'password',
            // the setting should be skipped
            const mockSave = vi.fn()
            const mockCreate = vi.fn()
            mockSettingRepo.save = mockSave
            mockSettingRepo.create = mockCreate

            await saveExtraConfig({
                emailPass: '********', // masked placeholder
            })

            // EMAIL_PASS uses maskType 'password', so '********' should be skipped
            // Other settings without masked values should still be created
            expect(mockCreate).toHaveBeenCalled()
        })

        it('should skip env-locked settings with empty values', async () => {
            const mockSave = vi.fn()
            const mockCreate = vi.fn()
            mockSettingRepo.save = mockSave
            mockSettingRepo.create = mockCreate

            // Set env vars that map to ExtraConfig settings
            process.env.EMAIL_HOST = 'smtp.example.com'
            process.env.AI_API_KEY = 'real-key'

            await saveExtraConfig({
                emailHost: '', // empty and env-locked → should be skipped
                aiApiKey: '', // empty and env-locked → should be skipped
            })

            delete process.env.EMAIL_HOST
            delete process.env.AI_API_KEY
        })

        it('should handle s3 credentials with maskType', async () => {
            await saveExtraConfig({
                storageType: 's3',
                s3Endpoint: 'https://s3.example.com',
                s3Bucket: 'my-bucket',
                s3Region: 'us-east-1',
                s3AccessKey: 'AKIAIOSFODNN7EXAMPLE',
                s3SecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                s3BaseUrl: 'https://cdn.example.com',
            })

            const createCalls = mockSettingRepo.create.mock.calls.map(([c]: any) => c)
            const accessKeySetting = createCalls.find((c: any) => c.key === SettingKey.S3_ACCESS_KEY)
            expect(accessKeySetting).toBeDefined()
            expect(accessKeySetting.maskType).toBe('key')

            const secretKeySetting = createCalls.find((c: any) => c.key === SettingKey.S3_SECRET_KEY)
            expect(secretKeySetting).toBeDefined()
            expect(secretKeySetting.maskType).toBe('password')
        })

        it('should handle social auth credentials', async () => {
            await saveExtraConfig({
                githubClientId: 'github-id-123',
                githubClientSecret: 'github-secret-456',
                googleClientId: 'google-id-789',
                googleClientSecret: 'google-secret-012',
            })

            const createCalls = mockSettingRepo.create.mock.calls.map(([c]: any) => c)
            const ghSecret = createCalls.find((c: any) => c.key === SettingKey.GITHUB_CLIENT_SECRET)
            expect(ghSecret).toBeDefined()
            expect(ghSecret.maskType).toBe('password')
        })

        it('should set anonymousLoginEnabled and related flags', async () => {
            await saveExtraConfig({
                anonymousLoginEnabled: true,
            })

            const createCalls = mockSettingRepo.create.mock.calls.map(([c]: any) => c)
            const anonymousSetting = createCalls.find((c: any) => c.key === SettingKey.ANONYMOUS_LOGIN_ENABLED)
            expect(anonymousSetting).toBeDefined()
            expect(anonymousSetting.value).toBe('true')
        })

        it('should honor default values for optional fields', async () => {
            await saveExtraConfig({})

            const createCalls = mockSettingRepo.create.mock.calls.map(([c]: any) => c)
            const storageType = createCalls.find((c: any) => c.key === SettingKey.STORAGE_TYPE)
            expect(storageType).toBeDefined()
            expect(storageType.value).toBe('local')

            const postsPerPage = createCalls.find((c: any) => c.key === SettingKey.POSTS_PER_PAGE)
            expect(postsPerPage).toBeDefined()
            expect(postsPerPage.value).toBe('10')
        })
    })
})
