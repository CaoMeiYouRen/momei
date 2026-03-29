import { dataSource } from '@/server/database'
import { SettingAuditLog } from '@/server/entities/setting-audit-log'
import { maskSettingValue } from '@/server/utils/settings'
import { normalizeOptionalString } from '@/utils/shared/coerce'
import type {
    SettingAuditAction,
    SettingAuditItem,
    SettingAuditSourceType,
    SettingEffectiveSource,
    SettingMaskType,
} from '@/types/setting'

export interface SettingAuditContext {
    operatorId?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    reason?: string | null
    source?: SettingAuditSourceType
}

export interface SettingAuditChange {
    key: string
    action: SettingAuditAction
    oldValue: string | null
    newValue: string | null
    maskType: SettingMaskType
    effectiveSource: SettingEffectiveSource
    isOverriddenByEnv: boolean
}

function toStoredAuditValue(value: string | null, maskType: SettingMaskType): string | null {
    if (value === null) {
        return null
    }

    if (maskType === 'none') {
        return value
    }

    return maskSettingValue(value, maskType)
}

function mapAuditLogItem(item: SettingAuditLog): SettingAuditItem {
    return {
        id: item.id,
        settingKey: item.settingKey,
        action: item.action,
        oldValue: item.oldValue,
        newValue: item.newValue,
        maskType: item.maskType,
        effectiveSource: item.effectiveSource,
        isOverriddenByEnv: item.isOverriddenByEnv,
        source: item.source,
        reason: item.reason,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
        operator: item.operator
            ? {
                id: item.operator.id,
                name: item.operator.name,
                email: item.operator.email,
            }
            : null,
    }
}

export async function recordSettingAuditLogs(changes: SettingAuditChange[], context: SettingAuditContext = {}) {
    if (!dataSource.isInitialized || changes.length === 0) {
        return []
    }

    const auditRepo = dataSource.getRepository(SettingAuditLog)
    const entries = changes.map((change) => auditRepo.create({
        settingKey: change.key,
        action: change.action,
        oldValue: toStoredAuditValue(change.oldValue, change.maskType),
        newValue: toStoredAuditValue(change.newValue, change.maskType),
        maskType: change.maskType,
        effectiveSource: change.effectiveSource,
        isOverriddenByEnv: change.isOverriddenByEnv,
        source: context.source ?? 'api',
        reason: normalizeOptionalString(context.reason),
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        operatorId: context.operatorId || null,
    }))

    return auditRepo.save(entries)
}

export async function getSettingAuditLogs(options: {
    page: number
    limit: number
    settingKey?: string
}) {
    if (!dataSource.isInitialized) {
        return {
            items: [] as SettingAuditItem[],
            total: 0,
            page: options.page,
            limit: options.limit,
            totalPages: 0,
        }
    }

    const auditRepo = dataSource.getRepository(SettingAuditLog)
    const [items, total] = await auditRepo.findAndCount({
        where: options.settingKey ? { settingKey: options.settingKey } : undefined,
        relations: ['operator'],
        order: { createdAt: 'DESC' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
    })

    return {
        items: items.map(mapAuditLogItem),
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
    }
}
