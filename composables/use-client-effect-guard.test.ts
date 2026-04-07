import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNetwork = {
    isOnline: { value: true },
    saveData: { value: false },
    effectiveType: { value: '4g' },
}

vi.mock('@vueuse/core', () => ({
    useNetwork: () => mockNetwork,
}))

import { useClientEffectGuard } from './use-client-effect-guard'

describe('useClientEffectGuard', () => {
    beforeEach(() => {
        mockNetwork.isOnline.value = true
        mockNetwork.saveData.value = false
        mockNetwork.effectiveType.value = '4g'
        vi.restoreAllMocks()
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 1440,
        })
        window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never
    })

    it('canLoadEffect 应拦截禁用、窄屏、移动端、离线和省流量场景', () => {
        const { canLoadEffect } = useClientEffectGuard()

        expect(canLoadEffect({ enabled: false })).toBe(false)
        expect(canLoadEffect({ enabled: true, minWidth: 1600 })).toBe(false)

        window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never
        expect(canLoadEffect({ enabled: true, mobileEnabled: false })).toBe(false)

        window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never
        mockNetwork.isOnline.value = false
        expect(canLoadEffect({ enabled: true, requireOnline: true })).toBe(false)

        mockNetwork.isOnline.value = true
        mockNetwork.saveData.value = true
        expect(canLoadEffect({ enabled: true, dataSaverBlock: true })).toBe(false)
    })

    it('canLoadEffect 应拦截慢网并在条件满足时放行', () => {
        const { canLoadEffect } = useClientEffectGuard()

        mockNetwork.effectiveType.value = '3g'
        expect(canLoadEffect({ enabled: true })).toBe(false)

        mockNetwork.effectiveType.value = '4g'
        expect(canLoadEffect({ enabled: true })).toBe(true)
    })

    it('runWhenIdle 应优先使用 requestIdleCallback，否则回退到 setTimeout', () => {
        const { runWhenIdle } = useClientEffectGuard()
        const idleSpy = vi.fn()
        const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((task: () => void) => {
            task()
            return 1
        }) as typeof setTimeout)

        Object.defineProperty(window, 'requestIdleCallback', {
            configurable: true,
            value: idleSpy,
        })

        const task = vi.fn()
        runWhenIdle(task, { timeout: 500 })
        expect(idleSpy).toHaveBeenCalledWith(task, { timeout: 500 })

        Reflect.deleteProperty(window, 'requestIdleCallback')
        runWhenIdle(task, { fallbackDelay: 250 })
        expect(timeoutSpy).toHaveBeenCalledWith(task, 250)
    })
})
