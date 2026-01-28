import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as settingService from './setting'
import { dataSource } from '@/server/database'

// Mock dataSource
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
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

    beforeEach(() => {
        vi.clearAllMocks()
        ;(dataSource.getRepository as any).mockImplementation((entity: any) => {
            if (entity.name === 'Setting') {
                return mockSettingRepo
            }
            return {}
        })
    })

    describe('getSetting', () => {
        it('should return setting value if found', async () => {
            mockSettingRepo.findOne.mockResolvedValue({ key: 'title', value: 'Momei' })
            const result = await settingService.getSetting('title')
            expect(result).toBe('Momei')
            expect(mockSettingRepo.findOne).toHaveBeenCalledWith({ where: { key: 'title' } })
        })

        it('should return null if not found', async () => {
            mockSettingRepo.findOne.mockResolvedValue(null)
            const result = await settingService.getSetting('unknown')
            expect(result).toBeNull()
        })
    })

    describe('getSettings', () => {
        it('should return a record with found values and null for missing keys', async () => {
            mockSettingRepo.find.mockResolvedValue([
                { key: 'title', value: 'Momei' },
                { key: 'subtitle', value: 'Blog' },
            ])

            const result = await settingService.getSettings(['title', 'unknown'])
            expect(result).toEqual({
                title: 'Momei',
                unknown: null,
            })
        })
    })

    describe('setSetting', () => {
        it('should update existing setting', async () => {
            const existing = { key: 'title', value: 'Old' }
            mockSettingRepo.findOne.mockResolvedValue(existing)

            await settingService.setSetting('title', 'New', { description: 'New Desc' })

            expect(existing.value).toBe('New')
            expect((existing as any).description).toBe('New Desc')
            expect(mockSettingRepo.save).toHaveBeenCalledWith(existing)
        })

        it('should create new setting if not exists', async () => {
            mockSettingRepo.findOne.mockResolvedValue(null)
            const newSetting = { key: 'new_key', value: 'val' }
            mockSettingRepo.create.mockReturnValue(newSetting)

            await settingService.setSetting('new_key', 'val')

            expect(mockSettingRepo.create).toHaveBeenCalledWith({
                key: 'new_key',
                value: 'val',
                description: '',
                level: 2,
                maskType: 'none',
            })
            expect(mockSettingRepo.save).toHaveBeenCalledWith(newSetting)
        })
    })

    describe('setSettings', () => {
        it('should update multiple settings', async () => {
            mockSettingRepo.findOne.mockResolvedValue(null)
            mockSettingRepo.create.mockImplementation((data) => data)

            await settingService.setSettings({
                key1: 'val1',
                key2: 'val2',
            })

            expect(mockSettingRepo.save).toHaveBeenCalledTimes(2)
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
            // Should also contain default settings from SETTING_ENV_MAP
            expect(result.length).toBeGreaterThan(Object.keys(settingService.SETTING_ENV_MAP).length)
        })
    })
})
