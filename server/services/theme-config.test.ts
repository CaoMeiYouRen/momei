import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getThemeConfigsService } from './theme-config'
import { dataSource } from '@/server/database'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

describe('getThemeConfigsService', () => {
    const themeConfigRepo = {
        find: vi.fn(),
    }

    const settingRepo = {
        findOneBy: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        ;(dataSource.getRepository as any).mockImplementation((entity: { name?: string }) => {
            if (entity?.name === 'ThemeConfig') {
                return themeConfigRepo
            }

            if (entity?.name === 'Setting') {
                return settingRepo
            }

            return {}
        })
    })

    it('should mark the active theme config from settings', async () => {
        themeConfigRepo.find.mockResolvedValue([
            { id: 'theme-1', name: 'Theme One' },
            { id: 'theme-2', name: 'Theme Two' },
        ])
        settingRepo.findOneBy.mockResolvedValue({
            key: SettingKey.THEME_ACTIVE_CONFIG_ID,
            value: 'theme-2',
        })

        const result = await getThemeConfigsService()

        expect(result).toEqual([
            expect.objectContaining({ id: 'theme-1', isActive: false }),
            expect.objectContaining({ id: 'theme-2', isActive: true }),
        ])
    })
})
