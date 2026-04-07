import { beforeEach, describe, expect, it, vi } from 'vitest'

const { lifecycle } = vi.hoisted(() => ({
    lifecycle: {
        mounted: [] as (() => void)[],
        beforeUnmount: [] as (() => void)[],
        routeLeave: null as null | (() => Promise<boolean>),
    },
}))

const mockConfirm = {
    require: vi.fn(),
}

vi.mock('vue', async () => {
    const actual = await vi.importActual<typeof import('vue')>('vue')

    return {
        ...actual,
        onMounted: (callback: () => void) => {
            lifecycle.mounted.push(callback)
        },
        onBeforeUnmount: (callback: () => void) => {
            lifecycle.beforeUnmount.push(callback)
        },
    }
})

vi.mock('primevue/useconfirm', async () => {
    const actual = await vi.importActual<typeof import('primevue/useconfirm')>('primevue/useconfirm')

    return {
        ...actual,
        useConfirm: () => mockConfirm,
    }
})

vi.mock('vue-router', async () => {
    const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

    return {
        ...actual,
        onBeforeRouteLeave: (callback: () => Promise<boolean>) => {
            lifecycle.routeLeave = callback
        },
    }
})

import { useUnsavedChangesGuard } from './use-unsaved-changes-guard'

describe('useUnsavedChangesGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        lifecycle.mounted = []
        lifecycle.beforeUnmount = []
        lifecycle.routeLeave = null
    })

    it('未 dirty 或显式禁用时 confirmIfDirty 应直接放行', async () => {
        const cleanGuard = useUnsavedChangesGuard({
            isDirty: false,
            message: 'leave?',
        })
        await expect(cleanGuard.confirmIfDirty()).resolves.toBe(true)

        const disabledGuard = useUnsavedChangesGuard({
            isDirty: true,
            message: 'leave?',
            enabled: false,
        })
        await expect(disabledGuard.confirmIfDirty()).resolves.toBe(true)
        expect(mockConfirm.require).not.toHaveBeenCalled()
    })

    it('dirty 时应调用确认框并按 accept/reject 返回结果', async () => {
        const guard = useUnsavedChangesGuard({
            isDirty: true,
            message: 'unsaved changes',
        })

        const acceptPromise = guard.confirmIfDirty()
        const acceptCall = mockConfirm.require.mock.calls[0]
        expect(acceptCall).toBeDefined()
        const acceptConfig = acceptCall![0] as { accept: () => void }
        acceptConfig.accept()
        await expect(acceptPromise).resolves.toBe(true)

        const rejectPromise = guard.confirmIfDirty()
        const rejectCall = mockConfirm.require.mock.calls[1]
        expect(rejectCall).toBeDefined()
        const rejectConfig = rejectCall![0] as { reject: () => void }
        rejectConfig.reject()
        await expect(rejectPromise).resolves.toBe(false)
    })

    it('应在 mounted / unmount 时注册并移除 beforeunload，并支持路由离开确认', async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
        useUnsavedChangesGuard({
            isDirty: true,
            message: 'leave page',
        })

        lifecycle.mounted.forEach((callback) => callback())
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

        const addEventCall = addEventListenerSpy.mock.calls[0]
        expect(addEventCall).toBeDefined()
        const handler = addEventCall![1] as (event: BeforeUnloadEvent) => void
        const preventDefault = vi.fn()
        handler({ preventDefault } as unknown as BeforeUnloadEvent)
        expect(preventDefault).toHaveBeenCalledTimes(1)

        const routeLeavePromise = lifecycle.routeLeave?.()
        const config = mockConfirm.require.mock.calls.at(-1)?.[0] as { accept: () => void }
        config.accept()
        await expect(routeLeavePromise).resolves.toBe(true)

        lifecycle.beforeUnmount.forEach((callback) => callback())
        expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', handler)
    })
})
