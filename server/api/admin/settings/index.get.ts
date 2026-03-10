import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { getAllSettings } from '@/server/services/setting'
import { assertDemoModeRequestAllowed } from '@/server/utils/demo-security'
import { getDemoSettingsPreview } from '@/server/utils/demo-settings'

export function assertDemoSettingsReadAllowed(
    runtimeConfig: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig(),
) {
    if (runtimeConfig.public.demoMode === true) {
        assertDemoModeRequestAllowed('/api/admin/settings', 'GET')
    }
}

export default defineEventHandler(async (event) => {
    assertDemoSettingsReadAllowed()

    await requireAdmin(event)

    if (useRuntimeConfig().public.demoMode === true) {
        return success({
            items: getDemoSettingsPreview(),
            demoPreview: true,
        })
    }

    // 获取所有设置项，执行脱敏
    // 不包含级别为 3 (System) 的内部机密
    const settings = await getAllSettings({
        includeSecrets: false,
        shouldMask: true,
    })

    return success({
        items: settings,
        demoPreview: false,
    })
})
