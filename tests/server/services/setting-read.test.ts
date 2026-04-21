import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: true,
    },
}))

vi.mock('@/server/services/setting-audit', () => ({
    recordSettingAuditLogs: vi.fn(),
}))

vi.mock('@/server/utils/runtime-cache', () => ({
    clearRuntimeCache: vi.fn(),
    getRuntimeCache: vi.fn(() => undefined),
    setRuntimeCache: vi.fn(),
}))

import { dataSource } from '@/server/database'
import { getAllSettings, getSetting } from '@/server/services/setting'
import { INTERNAL_ONLY_SETTING_KEYS } from '@/server/services/setting.constants'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'

describe('setting service read guards', () => {
    const mockSettingRepo = {
        createQueryBuilder: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.HEXO_SYNC_ENABLED
        delete process.env.HEXO_SYNC_PROVIDER
        delete process.env.HEXO_SYNC_OWNER
        delete process.env.HEXO_SYNC_REPO
        delete process.env.HEXO_SYNC_BRANCH
        delete process.env.HEXO_SYNC_POSTS_DIR
        delete process.env.HEXO_SYNC_ACCESS_TOKEN

        mockSettingRepo.createQueryBuilder.mockReturnValue({
            getMany: vi.fn().mockResolvedValue([] satisfies Setting[]),
        })
        ;(dataSource.getRepository as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSettingRepo)
    })

    it('should exclude Hexo sync settings from admin settings list', async () => {
        const items = await getAllSettings({ includeSecrets: false, shouldMask: true })
        const keys = items.map((item) => item.key)

        expect(keys).not.toContain(SettingKey.HEXO_SYNC_ENABLED)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_PROVIDER)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_OWNER)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_REPO)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_BRANCH)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_POSTS_DIR)
        expect(keys).not.toContain(SettingKey.HEXO_SYNC_ACCESS_TOKEN)
    })

    it('should treat all Hexo sync settings as env-only', async () => {
        expect(INTERNAL_ONLY_SETTING_KEYS).toEqual(expect.arrayContaining([
            SettingKey.HEXO_SYNC_ENABLED,
            SettingKey.HEXO_SYNC_PROVIDER,
            SettingKey.HEXO_SYNC_OWNER,
            SettingKey.HEXO_SYNC_REPO,
            SettingKey.HEXO_SYNC_BRANCH,
            SettingKey.HEXO_SYNC_POSTS_DIR,
            SettingKey.HEXO_SYNC_ACCESS_TOKEN,
        ]))

        await expect(getSetting(SettingKey.HEXO_SYNC_PROVIDER, 'github')).resolves.toBe('github')
        await expect(getSetting(SettingKey.HEXO_SYNC_REPO, null)).resolves.toBeNull()
    })
})
