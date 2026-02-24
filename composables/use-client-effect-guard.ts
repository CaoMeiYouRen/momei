import { useNetwork } from '@vueuse/core'
interface ClientEffectGuardOptions {
    enabled: boolean
    minWidth?: number
    mobileEnabled?: boolean
    dataSaverBlock?: boolean
    slowNetworkBlock?: boolean
    requireOnline?: boolean
}

const SLOW_NETWORK_TYPES = new Set(['slow-2g', '2g', '3g'])

export const useClientEffectGuard = () => {
    const network = useNetwork()

    const canLoadEffect = (options: ClientEffectGuardOptions): boolean => {
        if (!import.meta.client) {
            return false
        }

        if (!options.enabled) {
            return false
        }

        const minWidth = options.minWidth ?? 0
        if (window.innerWidth < minWidth) {
            return false
        }

        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
        const mobileEnabled = options.mobileEnabled ?? true
        if (!mobileEnabled && isCoarsePointer) {
            return false
        }

        if (options.requireOnline && !network.isOnline.value) {
            return false
        }

        const dataSaverBlock = options.dataSaverBlock ?? true
        if (dataSaverBlock && network.saveData.value) {
            return false
        }

        const slowNetworkBlock = options.slowNetworkBlock ?? true
        const effectiveType = network.effectiveType.value
        if (slowNetworkBlock && effectiveType && SLOW_NETWORK_TYPES.has(effectiveType)) {
            return false
        }

        return true
    }

    const runWhenIdle = (task: () => void, options?: { timeout?: number, fallbackDelay?: number }) => {
        if (!import.meta.client) {
            return
        }

        const timeout = options?.timeout ?? 4000
        const fallbackDelay = options?.fallbackDelay ?? 1200

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(task, { timeout })
            return
        }

        globalThis.setTimeout(task, fallbackDelay)
    }

    return {
        canLoadEffect,
        runWhenIdle,
    }
}
