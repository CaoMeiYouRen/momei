import { AdAdapterFactory } from '../../services/adapters'
import type { AdAdapterConfig } from '../../services/adapters/base'
import { getSetting } from '@/server/services/setting'
import { resolveAdNetworkConfigs } from '@/server/utils/ad-network-config'
import { SettingKey } from '@/types/setting'

async function resolveAdapterConfigs() {
    const commercialRaw = await getSetting(SettingKey.COMMERCIAL_SPONSORSHIP, null)

    return resolveAdNetworkConfigs(typeof commercialRaw === 'string' ? commercialRaw : null)
}

/**
 * 获取广告脚本（公开接口）
 * GET /api/ads/script
 *
 * 查询参数:
 * - adapter: 适配器 ID (可选，不传则返回所有已配置适配器的脚本)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const adapterId = query.adapter as string | undefined
        const adapterConfigs = await resolveAdapterConfigs()

        // 如果指定了适配器 ID，只返回该适配器的脚本
        if (adapterId) {
            const config = adapterConfigs[adapterId]
            if (!config) {
                return {
                    code: 404,
                    message: `Adapter '${adapterId}' not configured`,
                }
            }

            const adapter = await AdAdapterFactory.create(adapterId, config)
            const script = adapter.getScript()

            return {
                code: 200,
                data: {
                    adapter: adapterId,
                    script,
                },
                message: 'Success',
            }
        }

        // 返回所有已配置适配器的脚本
        const scripts: { adapter: string, script: string }[] = []

        for (const [id, config] of Object.entries(adapterConfigs)) {
            if (!config) {
                continue
            }

            try {
                const adapter = await AdAdapterFactory.create(id, config)
                scripts.push({
                    adapter: id,
                    script: adapter.getScript(),
                })
            } catch {
                // 跳过配置错误的适配器
            }
        }

        return {
            code: 200,
            data: scripts,
            message: 'Success',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch ad scripts',
        }
    }
})
