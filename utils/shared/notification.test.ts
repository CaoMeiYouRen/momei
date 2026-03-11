import { describe, expect, it } from 'vitest'
import { buildAITaskDetailPath, resolveNotificationLinkTarget } from './notification'

describe('notification link helpers', () => {
    it('should build ai task detail path', () => {
        expect(buildAITaskDetailPath('task-1')).toBe('/admin/ai/tasks/task-1')
    })

    it('should resolve legacy taskId links to ai task detail page', () => {
        expect(resolveNotificationLinkTarget('/posts?taskId=task-1')).toBe('/admin/ai/tasks/task-1')
    })

    it('should hide admin-only links when admin paths are not allowed', () => {
        expect(resolveNotificationLinkTarget('/posts?taskId=task-1', { allowAdminPaths: false })).toBeNull()
        expect(resolveNotificationLinkTarget('/admin/ai/tasks/task-1', { allowAdminPaths: false })).toBeNull()
    })

    it('should keep non task links unchanged', () => {
        expect(resolveNotificationLinkTarget('/settings?tab=notifications')).toBe('/settings?tab=notifications')
        expect(resolveNotificationLinkTarget(null)).toBeNull()
    })
})
