import { describe, expect, it } from 'vitest'
import { getDemoModeRestriction } from './demo-security'

describe('demo-security.ts', () => {
    it('应该允许公开内容的 GET 请求', () => {
        expect(getDemoModeRestriction('/api/posts', 'GET')).toBeNull()
    })

    it('应该拦截系统设置读取', () => {
        expect(getDemoModeRestriction('/api/admin/settings', 'GET')).toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden in Demo Mode',
        })
    })

    it('应该拦截 Better Auth 管理接口读取', () => {
        expect(getDemoModeRestriction('/api/auth/admin/list-users', 'GET')).toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden in Demo Mode',
        })
    })

    it('应该拦截系统设置写入', () => {
        expect(getDemoModeRestriction('/api/admin/settings', 'PUT')).toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden in Demo Mode',
        })
    })

    it('应该统一拦截删除请求', () => {
        expect(getDemoModeRestriction('/api/posts/123', 'DELETE')).toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden in Demo Mode',
        })
    })
})
