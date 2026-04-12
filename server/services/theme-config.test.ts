import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRepositoryMock, themeRepo, settingRepo } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn(),
    themeRepo: {
        find: vi.fn(),
        findOneBy: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    },
    settingRepo: {
        findOneBy: vi.fn(),
        save: vi.fn(),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: getRepositoryMock,
    },
}))

import {
    applyThemeConfigService,
    createThemeConfigService,
    deleteThemeConfigService,
    getThemeConfigsService,
    updateThemeConfigService,
} from './theme-config'
import { ThemeConfig } from '@/server/entities/theme-config'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'

describe('theme-config service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getRepositoryMock.mockImplementation((entity: { name?: string }) => {
            if (entity?.name === 'ThemeConfig') {
                return themeRepo
            }

            if (entity?.name === 'Setting') {
                return settingRepo
            }

            throw new Error(`Unexpected repository request: ${String(entity?.name)}`)
        })
    })

    it('marks active theme config in listing result', async () => {
        themeRepo.find.mockResolvedValue([
            { id: 'theme-1', name: 'One', createdAt: new Date('2026-01-01') },
            { id: 'theme-2', name: 'Two', createdAt: new Date('2026-01-02') },
        ])
        settingRepo.findOneBy.mockResolvedValue({ key: SettingKey.THEME_ACTIVE_CONFIG_ID, value: 'theme-2' })

        const result = await getThemeConfigsService()

        expect(themeRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } })
        expect(result).toEqual([
            expect.objectContaining({ id: 'theme-1', isActive: false }),
            expect.objectContaining({ id: 'theme-2', isActive: true }),
        ])
    })

    it('creates non-system theme config from body', async () => {
        themeRepo.save.mockImplementation((themeConfig: ThemeConfig) => Promise.resolve(themeConfig))

        const result = await createThemeConfigService({
            name: 'My Theme',
            description: 'Desc',
            configData: '{"theme_primary_color":"#fff"}',
            previewImage: '/theme.png',
        })

        expect(themeRepo.save).toHaveBeenCalledOnce()
        expect(result).toMatchObject({
            name: 'My Theme',
            description: 'Desc',
            previewImage: '/theme.png',
            isSystem: false,
        })
    })

    it('throws 404 when updating unknown theme config', async () => {
        themeRepo.findOneBy.mockResolvedValue(null)

        await expect(updateThemeConfigService('missing', { name: 'Next' })).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Theme config not found',
        })
    })

    it('updates existing theme config fields', async () => {
        const existing = Object.assign(new ThemeConfig(), {
            id: 'theme-1',
            name: 'Old',
            description: 'Old desc',
            configData: '{}',
            previewImage: null,
            isSystem: false,
        })
        themeRepo.findOneBy.mockResolvedValue(existing)
        themeRepo.save.mockImplementation((themeConfig: ThemeConfig) => Promise.resolve(themeConfig))

        const result = await updateThemeConfigService('theme-1', {
            name: 'New',
            previewImage: '/next.png',
        })

        expect(result).toMatchObject({
            id: 'theme-1',
            name: 'New',
            previewImage: '/next.png',
        })
    })

    it('throws 403 when deleting system theme config', async () => {
        themeRepo.findOneBy.mockResolvedValue({ id: 'theme-1', isSystem: true })

        await expect(deleteThemeConfigService('theme-1')).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'System theme config cannot be deleted',
        })
    })

    it('removes custom theme config', async () => {
        const theme = { id: 'theme-2', isSystem: false }
        themeRepo.findOneBy.mockResolvedValue(theme)
        themeRepo.remove.mockResolvedValue(theme)

        const result = await deleteThemeConfigService('theme-2')

        expect(themeRepo.remove).toHaveBeenCalledWith(theme)
        expect(result).toBe(theme)
    })

    it('throws 400 when applying invalid config json', async () => {
        themeRepo.findOneBy.mockResolvedValue({ id: 'theme-1', configData: '{invalid json' })

        await expect(applyThemeConfigService('theme-1')).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Invalid config data',
        })
    })

    it('applies config values and records active theme id', async () => {
        themeRepo.findOneBy.mockResolvedValue({
            id: 'theme-1',
            configData: JSON.stringify({
                theme_primary_color: '#000',
                theme_border_radius: 8,
                ignored_null: null,
            }),
        })
        settingRepo.findOneBy.mockImplementation(({ key }: { key: string }) => {
            if (key === 'theme_primary_color') {
                return Promise.resolve({ key, value: '#fff' })
            }

            if (key === 'theme_active_config_id') {
                return Promise.resolve(null)
            }

            return Promise.resolve(null)
        })
        settingRepo.save.mockImplementation((setting: Setting) => Promise.resolve(setting))

        const result = await applyThemeConfigService('theme-1')

        expect(result).toEqual({ success: true })
        expect(settingRepo.save).toHaveBeenCalledTimes(3)
        expect(settingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ key: 'theme_primary_color', value: '#000' }))
        expect(settingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ key: 'theme_border_radius', value: '8' }))
        expect(settingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ key: SettingKey.THEME_ACTIVE_CONFIG_ID, value: 'theme-1' }))
    })
})
