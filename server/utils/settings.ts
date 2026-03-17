import { PUBLIC_SETTING_KEYS, type SettingMaskType } from '@/types/setting'
import { maskEmail as baseMaskEmail, maskString as baseMaskString } from '@/utils/shared/privacy'

const PUBLIC_SETTING_KEY_SET = new Set<string>(PUBLIC_SETTING_KEYS)

const MASK_TYPE_PRIORITY: Record<SettingMaskType, number> = {
    none: 0,
    email: 1,
    key: 2,
    password: 3,
}

function normalizeMaskType(maskType: string | null | undefined): SettingMaskType | null {
    if (maskType === 'none' || maskType === 'password' || maskType === 'key' || maskType === 'email') {
        return maskType
    }

    return null
}

export function isPublicSettingKey(key: string) {
    return PUBLIC_SETTING_KEY_SET.has(key)
}

/**
 * 值的脱敏处理 (专门用于系统设置 UI)
 */
export const maskSettingValue = (value: string | null, type: string): string | null => {
    if (!value) {
        return value
    }
    switch (type) {
        case 'password':
            return '********'
        case 'key':
            // 使用通用的字符串脱敏，显示前 4 位和后 4 位
            return baseMaskString(value, 4, 4)
        case 'email':
            // 使用通用的邮箱脱敏
            return baseMaskEmail(value)
        default:
            return value
    }
}

/**
 * 判断输入的值是否为脱敏后的占位符
 */
export const isMaskedSettingPlaceholder = (inputValue: string, maskType: string): boolean => {
    if (!inputValue) {
        return false
    }
    if (maskType === 'password' && inputValue === '********') {
        return true
    }
    if (maskType === 'key' && (inputValue.includes('****') || inputValue.includes('***')) && inputValue.length >= 8) {
        return true
    }
    if (maskType === 'email' && inputValue.includes('***@')) {
        return true
    }
    return false
}

/**
 * 根据数据库键名或环境变量键名推断脱敏类型
 */
export const inferSettingMaskType = (key: string, value: string = ''): string => {
    const lowerKey = key.toLowerCase()

    if (lowerKey.includes('pass') || lowerKey.includes('secret') || lowerKey.includes('token')) {
        return 'password'
    }
    if (lowerKey.includes('key')) {
        return 'key'
    }
    if (lowerKey.includes('email') || lowerKey.includes('user')) {
        if (value.includes('@')) {
            return 'email'
        }
    }
    return 'none'
}

export function resolveSettingMaskType(key: string, value: string = '', explicitMaskType?: string | null): SettingMaskType {
    if (isPublicSettingKey(key)) {
        return 'none'
    }

    const inferredMaskType = normalizeMaskType(inferSettingMaskType(key, value)) ?? 'none'
    const normalizedExplicitMaskType = normalizeMaskType(explicitMaskType)

    if (!normalizedExplicitMaskType) {
        return inferredMaskType
    }

    return MASK_TYPE_PRIORITY[normalizedExplicitMaskType] >= MASK_TYPE_PRIORITY[inferredMaskType]
        ? normalizedExplicitMaskType
        : inferredMaskType
}

export function resolveSettingLevel(key: string, explicitLevel?: unknown) {
    if (isPublicSettingKey(key)) {
        return 0
    }

    const parsedLevel = Number(explicitLevel)
    if (Number.isInteger(parsedLevel) && parsedLevel >= 0 && parsedLevel <= 2) {
        return parsedLevel
    }

    return 2
}
