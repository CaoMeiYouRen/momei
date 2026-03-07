import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { getSettingAuditLogs, recordSettingAuditLogs } from '@/server/services/setting-audit'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: true,
    },
}))

describe('setting audit service', () => {
    const mockAuditRepo = {
        create: vi.fn(),
        save: vi.fn(),
        findAndCount: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        ;(dataSource.getRepository as any).mockReturnValue(mockAuditRepo)
        mockAuditRepo.create.mockImplementation((payload) => payload)
    })

    it('should store masked values for sensitive settings', async () => {
        await recordSettingAuditLogs([
            {
                key: 'ai_api_key',
                action: 'update',
                oldValue: 'sk-old-secret',
                newValue: 'sk-new-secret',
                maskType: 'key',
                effectiveSource: 'db',
                isOverriddenByEnv: false,
            },
        ], {
            operatorId: 'admin-1',
            reason: 'rotate-key',
            source: 'admin_ui',
        })

        expect(mockAuditRepo.save).toHaveBeenCalledWith([
            expect.objectContaining({
                settingKey: 'ai_api_key',
                action: 'update',
                operatorId: 'admin-1',
                reason: 'rotate-key',
                source: 'admin_ui',
                oldValue: expect.stringContaining('***'),
                newValue: expect.stringContaining('***'),
            }),
        ])
    })

    it('should map paginated audit logs for admin UI', async () => {
        mockAuditRepo.findAndCount.mockResolvedValue([
            [
                {
                    id: 'log-1',
                    settingKey: 'site_title',
                    action: 'update',
                    oldValue: 'Old Title',
                    newValue: 'New Title',
                    maskType: 'none',
                    effectiveSource: 'db',
                    isOverriddenByEnv: false,
                    source: 'admin_ui',
                    reason: 'system_settings_update',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Vitest',
                    createdAt: new Date('2026-03-07T00:00:00.000Z'),
                    operator: {
                        id: 'admin-1',
                        name: 'Admin',
                        email: 'admin@example.com',
                    },
                },
            ],
            1,
        ])

        const result = await getSettingAuditLogs({ page: 1, limit: 10 })

        expect(mockAuditRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
            relations: ['operator'],
            order: { createdAt: 'DESC' },
            skip: 0,
            take: 10,
        }))
        expect(result.items).toEqual([
            expect.objectContaining({
                id: 'log-1',
                settingKey: 'site_title',
                operator: {
                    id: 'admin-1',
                    name: 'Admin',
                    email: 'admin@example.com',
                },
            }),
        ])
        expect(result.total).toBe(1)
    })
})
