import { AdAdapterFactory } from '../../services/adapters'
import { getSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

type AdapterConfigMap = Record<string, Record<string, unknown>>

function parseCommercialConfig(raw: string | null): Record<string, unknown> {
    if (!raw) {
        return {}
    }

    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
            return parsed as Record<string, unknown>
        }
    } catch {
        // ignore invalid JSON
    }

    return {}
}

function normalizeAdapterConfig(config: unknown): Record<string, unknown> | null {
    if (!config || typeof config !== 'object') {
        return null
    }

    const normalized = config as Record<string, unknown>
    if (normalized.enabled === false) {
        return null
    }

    return normalized
}

async function resolveAdapterConfigs(): Promise<AdapterConfigMap> {
    const commercialRaw = await getSetting<string>(SettingKey.COMMERCIAL_SPONSORSHIP, null)
    const commercial = parseCommercialConfig(typeof commercialRaw === 'string' ? commercialRaw : null)

    const adNetworksFromRoot = normalizeAdapterConfig((commercial).adNetworks)
    const source = adNetworksFromRoot ?? commercial

    const adsense = normalizeAdapterConfig((source).adsense) ?? (
        process.env.ADSENSE_CLIENT_ID
            ? { clientId: process.env.ADSENSE_CLIENT_ID }
            : null
    )
    const baidu = normalizeAdapterConfig((source).baidu) ?? (
        process.env.BAIDU_SLOT_ID
            ? {
                slotId: process.env.BAIDU_SLOT_ID,
                userId: process.env.BAIDU_USER_ID,
            }
            : null
    )
    const tencent = normalizeAdapterConfig((source).tencent) ?? (
        process.env.TENCENT_APP_ID
            ? {
                appId: process.env.TENCENT_APP_ID,
                placementId: process.env.TENCENT_PLACEMENT_ID,
            }
            : null
    )

    const result: AdapterConfigMap = {}
    if (adsense) {
        result.adsense = adsense
    }
    if (baidu) {
        result.baidu = baidu
    }
    if (tencent) {
        result.tencent = tencent
    }

    return result
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
