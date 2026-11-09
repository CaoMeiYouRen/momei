import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllSettings, getSetting, getSettings, resolveLocalizedSettingsFromValues, resolveSetting, resolveSettings, setSettings } from './setting'
import { dataSource } from '@/server/database'
import { SettingKey } from '@/types/setting'
import { clearRuntimeCache } from '@/server/utils/runtime-cache'

/**
 * `server/services/setting` 的**本地化解析与来源回退**契约。
 *
 * 主体读写流程由 `setting.test.ts` 覆盖；本文件只补齐三类边界：
 * 1. `resolveLocalizedSettingsFromValues` 的 fallback 链 / legacy 单值 / 空值分支；
 * 2. `resolveSetting` 对非字符串默认值的归一化（数字 / 布尔 / 对象 / 循环引用）；
 * 3. `resolveSettings` / `getAllSettings` 的未初始化、查询失败、排除键与密级过滤。
 */

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: true,
    },
}))

const mockSettingRepo = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn(),
}

const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    getMany: vi.fn(),
}

beforeEach(() => {
    vi.clearAllMocks()
    clearRuntimeCache()
    ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = true
    for (const mock of [mockSettingRepo.findOne, mockSettingRepo.save, mockSettingRepo.create, mockSettingRepo.delete]) {
        mock.mockReset()
    }
    mockSettingRepo.find.mockResolvedValue([])
    mockSettingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.where.mockReturnThis()
    ;(dataSource.getRepository as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSettingRepo)
})

describe('resolveLocalizedSettingsFromValues', () => {
    it('未登记的键返回空结果（value null / resolvedLocale null）', () => {
        const result = resolveLocalizedSettingsFromValues({}, ['unknown.key'], 'zh-CN')

        expect(result['unknown.key']).toMatchObject({
            key: 'unknown.key',
            value: null,
            resolvedLocale: null,
            usedFallback: false,
            usedLegacyValue: false,
        })
    })

    it('结构化值命中请求语言时 usedFallback=false', () => {
        const value = {
            version: 1,
            type: 'localized-text',
            locales: { 'zh-CN': '墨梅', 'en-US': 'Momei' },
        }

        const result = resolveLocalizedSettingsFromValues({ [SettingKey.SITE_TITLE]: value }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({
            value: '墨梅',
            resolvedLocale: 'zh-CN',
            usedFallback: false,
            usedLegacyValue: false,
        })
    })

    it('结构化值只命中回退语言时标记 usedFallback', () => {
        const value = {
            version: 1,
            type: 'localized-text',
            locales: { 'zh-CN': 'Momei' },
        }

        // zh-TW 的 fallbackChain 为 ['zh-TW', 'zh-CN', 'en-US']
        const result = resolveLocalizedSettingsFromValues({ [SettingKey.SITE_TITLE]: value }, [SettingKey.SITE_TITLE], 'zh-TW')

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({
            value: 'Momei',
            resolvedLocale: 'zh-CN',
            usedFallback: true,
        })
    })

    it('结构化值只带 legacyValue 时回退 legacy 并标记 usedLegacyValue', () => {
        const value = {
            version: 1,
            type: 'localized-text',
            locales: {},
            legacyValue: 'Legacy Title',
        }

        const result = resolveLocalizedSettingsFromValues({ [SettingKey.SITE_TITLE]: value }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({
            value: 'Legacy Title',
            resolvedLocale: 'legacy',
            usedFallback: true,
            usedLegacyValue: true,
        })
    })

    it('结构化值既无命中语言也无 legacy 时返回空结果', () => {
        const value = {
            version: 1,
            type: 'localized-text',
            locales: { 'ko-KR': '  ' },
        }

        const result = resolveLocalizedSettingsFromValues({ [SettingKey.SITE_TITLE]: value }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({ value: null, resolvedLocale: null })
    })

    it('空字符串 / null 值直接返回空结果', () => {
        const result = resolveLocalizedSettingsFromValues(
            { [SettingKey.SITE_TITLE]: '', [SettingKey.SITE_NAME]: null as never },
            [SettingKey.SITE_TITLE, SettingKey.SITE_NAME],
            'zh-CN',
        )

        expect(result[SettingKey.SITE_TITLE]?.value).toBeNull()
        expect(result[SettingKey.SITE_NAME]?.value).toBeNull()
    })

    it('JSON 字符串按结构化值解析，并可回退到 legacy 单值', () => {
        const structured = JSON.stringify({
            version: 1,
            type: 'localized-text',
            locales: { 'zh-CN': 'Momei' },
            legacyValue: 'Legacy',
        })

        const result = resolveLocalizedSettingsFromValues(
            { [SettingKey.SITE_TITLE]: structured },
            [SettingKey.SITE_TITLE],
            'zh-TW',
        )

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({ value: 'Momei', resolvedLocale: 'zh-CN' })

        const legacyOnly = JSON.stringify({
            version: 1,
            type: 'localized-text',
            locales: { 'ko-KR': '메' },
        })
        const legacyResult = resolveLocalizedSettingsFromValues(
            { [SettingKey.SITE_TITLE]: legacyOnly },
            [SettingKey.SITE_TITLE],
            'zh-CN',
        )

        expect(legacyResult[SettingKey.SITE_TITLE]).toMatchObject({ value: null, resolvedLocale: null })
    })

    it('非 JSON 字符串按 legacy 单值兼容解析', () => {
        const result = resolveLocalizedSettingsFromValues(
            { [SettingKey.SITE_TITLE]: 'Plain Legacy Title' },
            [SettingKey.SITE_TITLE],
            'zh-CN',
        )

        expect(result[SettingKey.SITE_TITLE]).toMatchObject({
            value: 'Plain Legacy Title',
            resolvedLocale: 'legacy',
            usedLegacyValue: true,
        })
    })
})

describe('resolveSetting 非字符串默认值归一化', () => {
    it('数字 / 布尔 / bigint 默认值转字符串', async () => {
        ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false

        await expect(resolveSetting('custom.number', 42)).resolves.toMatchObject({ value: '42' })
        await expect(resolveSetting('custom.boolean', false)).resolves.toMatchObject({ value: 'false' })
        await expect(resolveSetting('custom.bigint', 10n)).resolves.toMatchObject({ value: '10' })
    })

    it('对象默认值序列化为 JSON', async () => {
        ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false

        await expect(resolveSetting('custom.object', { a: 1 })).resolves.toMatchObject({ value: '{"a":1}' })
    })

    it('循环引用默认值回落为空字符串', async () => {
        ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false
        const circular: Record<string, unknown> = {}
        circular.self = circular

        await expect(resolveSetting('custom.circular', circular)).resolves.toMatchObject({ value: '' })
    })
})

describe('setting 服务边界补充', () => {
    it('空键列表直接返回空结果（不查库）', async () => {
        const result = await resolveSettings([])

        expect(result).toEqual([])
        expect(mockSettingRepo.find).not.toHaveBeenCalled()
    })

    it('数据源未初始化时逐键返回默认结果', async () => {
        ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false

        const result = await resolveSettings([SettingKey.SITE_NAME])

        expect(result).toHaveLength(1)
        expect(result[0]?.key).toBe(SettingKey.SITE_NAME)
        expect(mockSettingRepo.find).not.toHaveBeenCalled()
    })

    it('查询失败时回退默认结果而不是抛出', async () => {
        mockSettingRepo.find.mockRejectedValue(new Error('db down'))

        const result = await resolveSettings([SettingKey.SITE_NAME])

        expect(result).toHaveLength(1)
        expect(result[0]?.key).toBe(SettingKey.SITE_NAME)
        expect(result[0]?.source).toBe('default')
    })

    // 注：HEXO_SYNC_* 同时在 ADMIN_SETTINGS_EXCLUDED_KEYS 与 INTERNAL_ONLY_KEYS 中，
    // 该用例实际验证的是「排除键不会出现在列表里」这一可观察契约（两条守卫互为冗余）。
    it('getAllSettings 跳过管理员排除键，并保留普通自定义键', async () => {
        mockQueryBuilder.getMany.mockResolvedValue([
            { key: SettingKey.HEXO_SYNC_ENABLED, value: 'true', level: 1, description: '', maskType: 'none' },
            { key: 'custom.public', value: 'ok', level: 1, description: '', maskType: 'none' },
        ])

        const result = await getAllSettings()

        expect(result.find((item) => item.key === String(SettingKey.HEXO_SYNC_ENABLED))).toBeUndefined()
        expect(result.find((item) => item.key === 'custom.public')).toMatchObject({ value: 'ok', level: 1 })
    })

    describe('resolveSetting / getSetting 数据库异常与内部键', () => {
        it('结构化默认值原样保留（不序列化为字符串）', async () => {
            ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false
            const structured = { version: 1, type: 'localized-text', locales: { 'zh-CN': '墨梅' } }

            const result = await resolveSetting(SettingKey.SITE_TITLE, structured)

            expect(result.value).toMatchObject({ version: 1, locales: { 'zh-CN': '墨梅' } })
        })

        it('内部键解析为 level 3', async () => {
            ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false

            const result = await resolveSetting(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY)

            expect(result.level).toBe(3)
        })

        it('resolveSetting 查询失败时回退默认结果并记录错误', async () => {
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))

            const result = await resolveSetting(SettingKey.SITE_NAME, 'fallback')

            expect(result).toMatchObject({ source: 'default', value: 'fallback' })
        })

        it('getSetting 在数据源未初始化 / 查询失败时返回默认值', async () => {
            ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false
            await expect(getSetting('custom.key', 'fallback')).resolves.toBe('fallback')

            ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = true
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))
            await expect(getSetting('custom.key', 'fallback')).resolves.toBe('fallback')
        })

        it('getSettings 在数据源未初始化时只返回环境变量结果', async () => {
            ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false
            const originalSiteName = process.env.NUXT_PUBLIC_APP_NAME
            process.env.NUXT_PUBLIC_APP_NAME = 'Env Blog'

            try {
                const result = await getSettings([SettingKey.SITE_NAME])

                expect(result[SettingKey.SITE_NAME]).toBe('Env Blog')
                expect(mockSettingRepo.find).not.toHaveBeenCalled()
            } finally {
                if (originalSiteName === undefined) {
                    delete process.env.NUXT_PUBLIC_APP_NAME
                } else {
                    process.env.NUXT_PUBLIC_APP_NAME = originalSiteName
                }
            }
        })

        it('getSettings 复用单项读取的运行时缓存，且全命中时不查库', async () => {
            mockSettingRepo.find.mockResolvedValue([
                { key: SettingKey.SITE_NAME, value: 'Cached Blog' },
            ])

            await getSetting(SettingKey.SITE_NAME)
            expect(mockSettingRepo.find).toHaveBeenCalledTimes(1)

            mockSettingRepo.find.mockClear()
            const result = await getSettings([SettingKey.SITE_NAME])

            expect(result[SettingKey.SITE_NAME]).toBe('Cached Blog')
            expect(mockSettingRepo.find).not.toHaveBeenCalled()
        })

        it('getSettings 查询失败时保留环境变量结果并返回 null', async () => {
            mockSettingRepo.find.mockRejectedValue(new Error('db down'))
            const originalSiteName = process.env.NUXT_PUBLIC_APP_NAME
            process.env.NUXT_PUBLIC_APP_NAME = 'Env Blog'

            try {
                // 同时请求 env 键与仅存在于数据库的键，确保真正走到查询失败分支
                const result = await getSettings([SettingKey.SITE_NAME, 'custom.db.only'])

                expect(result[SettingKey.SITE_NAME]).toBe('Env Blog')
                expect(result['custom.db.only']).toBeNull()
                expect(mockSettingRepo.find).toHaveBeenCalled()
            } finally {
                if (originalSiteName === undefined) {
                    delete process.env.NUXT_PUBLIC_APP_NAME
                } else {
                    process.env.NUXT_PUBLIC_APP_NAME = originalSiteName
                }
            }
        })
    })


    describe('批量读取与批量写入的过滤分支', () => {
        it('resolveSettings 成功路径按数据库记录构造结果', async () => {
            mockSettingRepo.find.mockResolvedValue([
                { key: SettingKey.SITE_NAME, value: 'Db Blog' },
            ])

            const result = await resolveSettings([SettingKey.SITE_NAME])

            expect(result[0]).toMatchObject({ key: SettingKey.SITE_NAME, value: 'Db Blog', source: 'db' })
        })

        it('getAllSettings 跳过仅历史别名键', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([
                { key: 'site_copyright', value: 'legacy', level: 1, description: '', maskType: 'none' },
            ])

            const result = await getAllSettings()

            expect(result.find((item) => item.key === 'site_copyright')).toBeUndefined()
        })

        it('setSettings 跳过环境锁定的键', async () => {
            await setSettings({ [SettingKey.SITE_URL]: 'https://example.com' })

            expect(mockSettingRepo.save).not.toHaveBeenCalled()
        })

        it('setSettings 写入 canonical 键后清理历史别名键', async () => {
            mockSettingRepo.findOne.mockResolvedValue(null)
            mockSettingRepo.create.mockImplementation((data) => data)
            mockSettingRepo.save.mockImplementation(async (data) => data)

            await setSettings({ [SettingKey.POST_COPYRIGHT]: 'new copyright' })

            const deleteArgument = mockSettingRepo.delete.mock.calls[0]?.[0] as { key: { _value?: string[] } }
            expect(deleteArgument.key._value).toEqual(['site_copyright'])
        })
    })

})
