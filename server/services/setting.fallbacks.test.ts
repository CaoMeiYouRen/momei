import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as settingService from './setting'
import { dataSource } from '@/server/database'
import { SettingKey } from '@/types/setting'
import { clearRuntimeCache } from '@/server/utils/runtime-cache'

/**
 * `settingService` 的数据库不可用 / 缓存 / 写入守卫分支。
 *
 * 独立文件是为了让主 `setting.test.ts` 的 describe 保持在 `max-lines-per-function`
 * 上限内；这一组用例共享独立的初始化状态与 repo mock，拆开后两边的失败点更集中。
 */

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: true,
    },
}))

describe('settingService database fallbacks', () => {
    const mockSettingRepo = {
        find: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
    }

    const mockSettingAuditRepo = {
        create: vi.fn(),
        save: vi.fn(),
    }

    const originalEnv = process.env

    /**
     * 本文件触及的环境变量：在基线副本中统一删除，避免开发者 shell 或 CI 里
     * 恰好导出的同名变量把「默认值 / 写入」用例变成 env 分支（会本地必挂或空断言）。
     */
    const ENV_KEYS_UNDER_TEST = [
        'NUXT_PUBLIC_SITE_DESCRIPTION',
        'NUXT_PUBLIC_SITE_KEYWORDS',
        'EMAIL_PASS',
        'NUXT_PUBLIC_POST_COPYRIGHT',
        'NUXT_PUBLIC_DEFAULT_COPYRIGHT',
    ] as const

    const isolatedEnv = { ...originalEnv }
    for (const key of ENV_KEYS_UNDER_TEST) {
        delete isolatedEnv[key]
    }

    beforeEach(() => {
        vi.clearAllMocks()
        clearRuntimeCache()
        process.env = { ...isolatedEnv }
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
        ;(dataSource as { isInitialized: boolean }).isInitialized = true
    })

    describe('database fallbacks', () => {
        const setInitialized = (value: boolean) => {
            ;(dataSource as { isInitialized: boolean }).isInitialized = value
        }

        afterEach(() => {
            setInitialized(true)
        })

        it('getSetting should return the default while the data source is not initialized', async () => {
            setInitialized(false)

            await expect(settingService.getSetting(SettingKey.SITE_TITLE, 'fallback')).resolves.toBe('fallback')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('getSetting should fall back to the default when the database read throws', async () => {
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))

            await expect(settingService.getSetting(SettingKey.SITE_TITLE, 'fallback')).resolves.toBe('fallback')
        })

        it('getSettings should return env values while the data source is not initialized', async () => {
            setInitialized(false)
            process.env = { ...isolatedEnv, NUXT_PUBLIC_SITE_DESCRIPTION: 'env-description' }

            const result = await settingService.getSettings([SettingKey.SITE_DESCRIPTION, SettingKey.SITE_KEYWORDS])

            expect(result[SettingKey.SITE_DESCRIPTION]).toBe('env-description')
            expect(result[SettingKey.SITE_KEYWORDS]).toBeNull()
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('getSettings should reuse the runtime cache across calls', async () => {
            mockSettingRepo.find.mockResolvedValue([{ key: SettingKey.SITE_TITLE, value: 'cached-title' }])

            await expect(settingService.getSettings([SettingKey.SITE_TITLE])).resolves.toEqual({
                [SettingKey.SITE_TITLE]: 'cached-title',
            })
            await expect(settingService.getSettings([SettingKey.SITE_TITLE])).resolves.toEqual({
                [SettingKey.SITE_TITLE]: 'cached-title',
            })

            expect(mockSettingRepo.find).toHaveBeenCalledTimes(1)
        })

        it('getSettings should skip the database when every key is env-backed', async () => {
            process.env = { ...isolatedEnv, NUXT_PUBLIC_SITE_DESCRIPTION: 'env-description' }

            const result = await settingService.getSettings([SettingKey.SITE_DESCRIPTION])

            expect(result[SettingKey.SITE_DESCRIPTION]).toBe('env-description')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('getSettings should keep env values when the database read throws', async () => {
            process.env = { ...isolatedEnv, NUXT_PUBLIC_SITE_DESCRIPTION: 'env-description' }
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))

            const result = await settingService.getSettings([SettingKey.SITE_DESCRIPTION, SettingKey.SITE_KEYWORDS])

            expect(result[SettingKey.SITE_DESCRIPTION]).toBe('env-description')
            expect(result[SettingKey.SITE_KEYWORDS]).toBeNull()
        })

        it('resolveSetting should fall back to defaults while the data source is not initialized', async () => {
            setInitialized(false)

            const resolved = await settingService.resolveSetting(SettingKey.SITE_TITLE)

            expect(resolved.source).toBe('default')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('resolveSetting should fall back to defaults when the database read throws', async () => {
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))

            const resolved = await settingService.resolveSetting(SettingKey.SITE_TITLE)

            expect(resolved.source).toBe('default')
        })

        it('resolveSettings should return defaults for every key when the database read throws', async () => {
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))

            const resolved = await settingService.resolveSettings([SettingKey.SITE_TITLE, SettingKey.SITE_DESCRIPTION])

            expect(resolved).toHaveLength(2)
            expect(resolved.every((item) => item.source === 'default')).toBe(true)
        })
    })

    describe('setSettings guards', () => {
        it('should skip env-locked keys without touching the database', async () => {
            await settingService.setSettings({ [SettingKey.SITE_URL]: 'https://example.com' })

            expect(mockSettingRepo.find).not.toHaveBeenCalled()
            expect(mockSettingRepo.save).not.toHaveBeenCalled()
        })

        it('should keep the stored secret when the submitted value is a masked placeholder', async () => {
            const existing = {
                id: 'secret-1',
                key: SettingKey.EMAIL_PASS,
                value: 'real-secret',
                description: '',
                level: 2,
                maskType: 'password',
            }
            mockSettingRepo.find.mockResolvedValue([existing])

            await settingService.setSettings({ [SettingKey.EMAIL_PASS]: '********' })

            const saved = mockSettingRepo.save.mock.calls[0]?.[0] as { value: string }
            expect(saved.value).toBe('real-secret')
            // 值未变化且 maskType 未变化，不应产生审计记录。
            expect(mockSettingAuditRepo.save).not.toHaveBeenCalled()
        })

        it('should delete legacy alias keys after writing the canonical key', async () => {
            mockSettingRepo.find.mockResolvedValue([])
            mockSettingRepo.create.mockImplementation((data) => data)

            await settingService.setSettings({ [SettingKey.POST_COPYRIGHT]: 'CC-BY-4.0' })

            expect(mockSettingRepo.delete).toHaveBeenCalled()
            const deleted = mockSettingRepo.delete.mock.calls[0]?.[0] as { key: { value?: string[] } }
            expect(deleted.key.value).toContain('site_copyright')
            expect(deleted.key.value).not.toContain(SettingKey.POST_COPYRIGHT)
        })

        it('should not record an audit entry when the value and mask type are unchanged', async () => {
            const existing = {
                id: 'same-1',
                key: SettingKey.SITE_DESCRIPTION,
                value: 'same-description',
                description: '',
                level: 2,
                maskType: 'none',
            }
            mockSettingRepo.find.mockResolvedValue([existing])

            await settingService.setSettings({ [SettingKey.SITE_DESCRIPTION]: 'same-description' })

            expect(mockSettingAuditRepo.save).not.toHaveBeenCalled()
        })
    })
})
