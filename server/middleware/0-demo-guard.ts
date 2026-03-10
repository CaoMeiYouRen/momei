import { defineEventHandler, getRequestURL, type H3Event } from 'h3'
import { assertDemoModeRequestAllowed } from '@/server/utils/demo-security'

export function runDemoGuard(
    event: H3Event,
    runtimeConfig: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig(),
) {
    const config = runtimeConfig

    // 仅在演示模式下运行拦截逻辑
    if (config.public.demoMode === true) {
        const method = event.method || 'GET'
        const { pathname: path } = getRequestURL(event)

        assertDemoModeRequestAllowed(path, method)
    }
}

export default defineEventHandler(runDemoGuard)
