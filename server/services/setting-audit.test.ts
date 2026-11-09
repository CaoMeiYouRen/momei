import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSettingAuditLogs, recordSettingAuditLogs } from './setting-audit'
import { dataSource } from '@/server/database'

/**
 * `setting-audit` 的**数据源未初始化**边界。
 *
 * 正常读写路径由 `setting` 服务的写入 / 列表用例间接覆盖；这里钉住「数据库未初始化时
 * 不抛错、返回空结果」的降级契约（审计日志是旁路能力，不能阻断设置读写）。
 */

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: false,
        getRepository: vi.fn(),
    },
}))

beforeEach(() => {
    vi.clearAllMocks()
    ;(dataSource as unknown as { isInitialized: boolean }).isInitialized = false
})

describe('setting-audit 未初始化降级', () => {
    it('recordSettingAuditLogs 返回空数组且不触库', () => {
        const result = recordSettingAuditLogs([
            {
                key: 'site_name',
                action: 'update',
                oldValue: 'old',
                newValue: 'new',
                maskType: 'none',
                effectiveSource: 'db',
                isOverriddenByEnv: false,
            },
        ])

        expect(result).toEqual([])
        expect(dataSource.getRepository).not.toHaveBeenCalled()
    })

    it('getSettingAuditLogs 返回空分页结构', async () => {
        const result = await getSettingAuditLogs({ page: 2, limit: 20 })

        expect(result).toEqual({ items: [], total: 0, page: 2, limit: 20, totalPages: 0 })
        expect(dataSource.getRepository).not.toHaveBeenCalled()
    })
})
