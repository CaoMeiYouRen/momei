import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSettingAuditLogs } from '@/server/services/setting-audit'
import { requireAdmin } from '@/server/utils/permission'
import handler from '@/server/api/admin/settings/audit-logs.get'

vi.mock('@/server/services/setting-audit', () => ({
    getSettingAuditLogs: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin settings audit-logs.get API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
        vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ public: { demoMode: false } })))
    })

    it('should pass parsed pagination and filters to setting audit service', async () => {
        vi.mocked(requireAdmin).mockResolvedValue(undefined as never)
        vi.mocked(getSettingAuditLogs).mockResolvedValue({
            items: [],
            total: 0,
            page: 2,
            limit: 20,
            totalPages: 0,
        })

        const result = await handler({
            query: {
                page: '2',
                limit: '20',
                settingKey: 'site_name',
            },
        } as never)

        expect(getSettingAuditLogs).toHaveBeenCalledWith({
            page: 2,
            limit: 20,
            settingKey: 'site_name',
        })
        expect(result.code).toBe(200)
        expect(result.data).toEqual({
            items: [],
            total: 0,
            page: 2,
            limit: 20,
            totalPages: 0,
            demoPreview: false,
        })
    })

    it('should fall back to default pagination when query parsing fails', async () => {
        vi.mocked(requireAdmin).mockResolvedValue(undefined as never)
        vi.mocked(getSettingAuditLogs).mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        })

        await handler({
            query: {
                page: 'invalid',
                limit: 'invalid',
                settingKey: 42,
            },
        } as never)

        expect(getSettingAuditLogs).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
        })
    })
})
