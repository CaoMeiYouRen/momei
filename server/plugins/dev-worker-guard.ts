import logger from '@/server/utils/logger'

const DEV_WORKER_GUARD_FLAG = '__MOMEI_DEV_WORKER_GUARD_INSTALLED__'

export default defineNitroPlugin(() => {
    const runtimeConfig = useRuntimeConfig()
    const isWindowsLocalDev = runtimeConfig.public.windowsLocalDevMode

    if (process.env.NODE_ENV !== 'development' || !isWindowsLocalDev) {
        return
    }

    const globalScope = globalThis as typeof globalThis & { [DEV_WORKER_GUARD_FLAG]?: boolean }
    if (globalScope[DEV_WORKER_GUARD_FLAG]) {
        return
    }

    process.on('uncaughtException', (error) => {
        logger.error('[DevWorkerGuard] uncaughtException', error)
    })

    process.on('unhandledRejection', (reason) => {
        logger.error('[DevWorkerGuard] unhandledRejection', reason)
    })

    process.on('warning', (warning) => {
        logger.warn('[DevWorkerGuard] process warning', warning)
    })

    globalScope[DEV_WORKER_GUARD_FLAG] = true
    logger.info('[DevWorkerGuard] installed for Windows local dev runtime diagnostics')
})
