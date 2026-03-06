type EnvMap = NodeJS.ProcessEnv

export type AdNetworkConfig = Record<string, unknown>

export interface AdNetworkConfigMap {
    adsense?: AdNetworkConfig
    baidu?: AdNetworkConfig
    tencent?: AdNetworkConfig
    [key: string]: AdNetworkConfig | undefined
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function parseCommercialConfig(raw: string | null | undefined): Record<string, unknown> {
    if (!raw) {
        return {}
    }

    try {
        const parsed = JSON.parse(raw)
        return isPlainRecord(parsed) ? parsed : {}
    } catch {
        return {}
    }
}

export function normalizeAdapterConfig(config: unknown): AdNetworkConfig | null {
    if (!isPlainRecord(config) || config.enabled === false) {
        return null
    }

    return config
}

export function resolveAdNetworkConfigs(raw: string | null | undefined, env: EnvMap = process.env): AdNetworkConfigMap {
    const commercial = parseCommercialConfig(raw)
    const adNetworksFromRoot = normalizeAdapterConfig(commercial.adNetworks)
    const source = adNetworksFromRoot ?? commercial

    const adsense = normalizeAdapterConfig(source.adsense) ?? (
        env.ADSENSE_CLIENT_ID
            ? { clientId: env.ADSENSE_CLIENT_ID }
            : null
    )
    const baidu = normalizeAdapterConfig(source.baidu) ?? (
        env.BAIDU_SLOT_ID
            ? {
                slotId: env.BAIDU_SLOT_ID,
                userId: env.BAIDU_USER_ID,
            }
            : null
    )
    const tencent = normalizeAdapterConfig(source.tencent) ?? (
        env.TENCENT_APP_ID
            ? {
                appId: env.TENCENT_APP_ID,
                placementId: env.TENCENT_PLACEMENT_ID,
            }
            : null
    )

    const result: AdNetworkConfigMap = {}

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

export function resolveGoogleAdSenseAccount(raw: string | null | undefined, env: EnvMap = process.env): string | null {
    const clientId = resolveAdNetworkConfigs(raw, env).adsense?.clientId

    if (typeof clientId !== 'string') {
        return null
    }

    const normalized = clientId.trim()
    return normalized || null
}
