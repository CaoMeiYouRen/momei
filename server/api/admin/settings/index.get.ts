import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { getAllSettings } from '@/server/services/setting'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    // 获取所有设置项，执行脱敏
    // 不包含级别为 3 (System) 的内部机密
    const settings = await getAllSettings({
        includeSecrets: false,
        shouldMask: true,
    })

    return success(settings)
})
