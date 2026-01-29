import { maskEmail as baseMaskEmail, maskString as baseMaskString } from '@/utils/shared/privacy'

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

    if (lowerKey.includes('pass') || lowerKey.includes('secret')) {
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
