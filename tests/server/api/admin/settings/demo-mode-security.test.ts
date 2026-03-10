import { describe, expect, it, vi } from 'vitest'

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')

    const toErrorMessage = (payload: Record<string, unknown>) => {
        if (typeof payload.message === 'string') {
            return payload.message
        }

        if (typeof payload.statusMessage === 'string') {
            return payload.statusMessage
        }

        return 'Error'
    }

    return {
        ...actual,
        createError: (payload: Record<string, unknown>) => Object.assign(
            new Error(toErrorMessage(payload)),
            payload,
        ),
    }
})

import { assertDemoSettingsReadAllowed } from '@/server/api/admin/settings/index.get'
import { assertDemoSettingsWriteAllowed } from '@/server/api/admin/settings/index.put'

const demoRuntimeConfig = {
    public: {
        demoMode: true,
    },
} as ReturnType<typeof useRuntimeConfig>

const normalRuntimeConfig = {
    public: {
        demoMode: false,
    },
} as ReturnType<typeof useRuntimeConfig>

describe('demo mode admin settings security', () => {
    it('应该在 demo 模式下阻止读取系统设置', () => {
        expect(() => assertDemoSettingsReadAllowed(demoRuntimeConfig)).toThrowError(/敏感数据读取/)
    })

    it('应该在 demo 模式下阻止更新系统设置', () => {
        expect(() => assertDemoSettingsWriteAllowed('PUT', demoRuntimeConfig)).toThrowError(/核心管理操作/)
    })

    it('应该在 demo 模式下统一阻止删除类方法', () => {
        expect(() => assertDemoSettingsWriteAllowed('DELETE', demoRuntimeConfig)).toThrowError(/禁止删除数据/)
    })

    it('应该在非 demo 模式下继续允许系统设置访问', () => {
        expect(() => assertDemoSettingsReadAllowed(normalRuntimeConfig)).not.toThrow()
        expect(() => assertDemoSettingsWriteAllowed('PUT', normalRuntimeConfig)).not.toThrow()
    })
})
