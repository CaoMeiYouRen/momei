import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { aiAlertThresholdsSchema, aiCostFactorsSchema, aiQuotaPoliciesSchema } from '@/utils/schemas/ai'
import { externalFeedSourcesSchema } from '@/utils/schemas/external-feed'
import { parseMaybeJson } from '@/utils/shared/coerce'
import { success } from '@/server/utils/response'
import { setSettings } from '@/server/services/setting'
import { isAdminSettingsExcludedKey } from '@/server/services/setting.constants'
import { SettingKey } from '@/types/setting'
import { assertDemoModeRequestAllowed } from '@/server/utils/demo-security'

const settingAuditSourceSchema = z.enum(['admin_ui', 'theme_settings', 'commercial_settings', 'api'])

const settingsUpdateSchema = z.object({
    settings: z.record(z.string(), z.any()).optional(),
    reason: z.string().trim().max(255).optional(),
    source: settingAuditSourceSchema.optional(),
}).loose()

export function filterAdminSettingsPayload(settingsPayload: Record<string, unknown>) {
    return Object.fromEntries(
        Object.entries(settingsPayload).filter(([key]) => !isAdminSettingsExcludedKey(key)),
    )
}

export function assertDemoSettingsWriteAllowed(
    method = 'PUT',
    runtimeConfig: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig(),
) {
    if (runtimeConfig.public.demoMode) {
        assertDemoModeRequestAllowed('/api/admin/settings', method)
    }
}

export default defineEventHandler(async (event) => {
    assertDemoSettingsWriteAllowed(event.method || 'PUT')

    const session = await requireAdmin(event)

    const body = await readValidatedBody(event, (payload) => settingsUpdateSchema.parse(payload))
    const reservedKeys = new Set(['settings', 'reason', 'source'])
    const rawSettingsPayload = body.settings && typeof body.settings === 'object'
        ? body.settings
        : Object.fromEntries(Object.entries(body).filter(([key]) => !reservedKeys.has(key)))
    const settingsPayload = filterAdminSettingsPayload(rawSettingsPayload)

    if (Object.hasOwn(settingsPayload, SettingKey.AI_QUOTA_POLICIES)) {
        const rawPolicies = settingsPayload[SettingKey.AI_QUOTA_POLICIES]
        const parsedPolicies = Array.isArray(rawPolicies)
            ? rawPolicies
            : parseMaybeJson<unknown[] | null>(rawPolicies, null)
        const validation = aiQuotaPoliciesSchema.safeParse(parsedPolicies)

        if (!validation.success) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid AI quota policies JSON',
                data: z.treeifyError(validation.error),
            })
        }

        settingsPayload[SettingKey.AI_QUOTA_POLICIES] = JSON.stringify(validation.data, null, 2)
    }

    if (Object.hasOwn(settingsPayload, SettingKey.AI_ALERT_THRESHOLDS)) {
        const rawThresholds = settingsPayload[SettingKey.AI_ALERT_THRESHOLDS]
        const parsedThresholds = typeof rawThresholds === 'object' && rawThresholds !== null
            ? rawThresholds
            : parseMaybeJson<Record<string, unknown> | null>(rawThresholds, null)
        const validation = aiAlertThresholdsSchema.safeParse(parsedThresholds)

        if (!validation.success) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid AI alert thresholds JSON',
                data: z.treeifyError(validation.error),
            })
        }

        settingsPayload[SettingKey.AI_ALERT_THRESHOLDS] = JSON.stringify(validation.data, null, 2)
    }

    if (Object.hasOwn(settingsPayload, SettingKey.AI_COST_FACTORS)) {
        const rawCostFactors = settingsPayload[SettingKey.AI_COST_FACTORS]
        const parsedCostFactors = typeof rawCostFactors === 'object' && rawCostFactors !== null
            ? rawCostFactors
            : parseMaybeJson<Record<string, unknown> | null>(rawCostFactors, null)
        const validation = aiCostFactorsSchema.safeParse(parsedCostFactors)

        if (!validation.success) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid AI cost factors JSON',
                data: z.treeifyError(validation.error),
            })
        }

        settingsPayload[SettingKey.AI_COST_FACTORS] = JSON.stringify(validation.data, null, 2)
    }

    if (Object.hasOwn(settingsPayload, SettingKey.EXTERNAL_FEED_SOURCES)) {
        const rawSources = settingsPayload[SettingKey.EXTERNAL_FEED_SOURCES]
        const parsedSources = Array.isArray(rawSources)
            ? rawSources
            : parseMaybeJson<unknown[] | null>(rawSources, null)
        const validation = externalFeedSourcesSchema.safeParse(parsedSources)

        if (!validation.success) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid external feed sources JSON',
                data: z.treeifyError(validation.error),
            })
        }

        settingsPayload[SettingKey.EXTERNAL_FEED_SOURCES] = JSON.stringify(validation.data, null, 2)
    }

    await setSettings(settingsPayload, {
        operatorId: session.user.id,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
        userAgent: getRequestHeader(event, 'user-agent') || null,
        reason: body.reason || 'system_settings_update',
        source: body.source || 'admin_ui',
    })

    return success(null)
})
