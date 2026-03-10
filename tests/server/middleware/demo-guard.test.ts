import { beforeEach, describe, expect, it, vi } from 'vitest'

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
        defineEventHandler: (handler: unknown) => handler,
        createError: (payload: Record<string, unknown>) => Object.assign(
            new Error(toErrorMessage(payload)),
            payload,
        ),
        getRequestURL: (event: { url?: string }) => new URL(event.url || 'http://localhost/'),
    }
})

import { runDemoGuard } from '@/server/middleware/0-demo-guard'

const demoRuntimeConfig = {
    public: {
        demoMode: true,
    },
} as ReturnType<typeof useRuntimeConfig>

function createEvent(method: string, path: string) {
    return {
        method,
        url: `http://localhost${path}`,
    } as any
}

describe('demo guard middleware', () => {
    beforeEach(() => {
        demoRuntimeConfig.public.demoMode = true
    })

    it('应该允许公开 GET 请求通过', () => {
        expect(() => runDemoGuard(createEvent('GET', '/api/posts'), demoRuntimeConfig)).not.toThrow()
    })

    it('应该允许系统设置 GET 请求进入演示预览处理', () => {
        expect(() => runDemoGuard(createEvent('GET', '/api/admin/settings'), demoRuntimeConfig)).not.toThrow()
    })

    it('应该拦截系统设置写入请求', () => {
        expect(() => runDemoGuard(createEvent('PUT', '/api/admin/settings'), demoRuntimeConfig)).toThrowError(/核心管理操作/)
    })

    it('应该拦截删除请求', () => {
        expect(() => runDemoGuard(createEvent('DELETE', '/api/posts/1'), demoRuntimeConfig)).toThrowError(/禁止删除数据/)
    })
})
