import { createError } from 'h3'

const DEMO_FORBIDDEN_STATUS = {
    statusCode: 403,
    statusMessage: 'Forbidden in Demo Mode',
} as const

const deleteRestriction = {
    ...DEMO_FORBIDDEN_STATUS,
    message: '演示模式下禁止删除数据，以保证共享体验环境的稳定性。系统会定期重置数据。',
}

const sensitiveReadRestriction = {
    ...DEMO_FORBIDDEN_STATUS,
    message: '演示模式下已禁用系统设置、用户管理与 API 密钥等敏感数据读取，以避免泄露共享演示环境信息。',
}

const sensitiveWriteRestriction = {
    ...DEMO_FORBIDDEN_STATUS,
    message: '演示模式下已禁用账号、密钥或系统设置等核心管理操作。您可以继续体验文章管理、AI 创作与多语言能力。',
}

const demoReadRestrictedPrefixes = [
    '/api/admin/settings',
    '/api/auth/admin',
    '/api/user/api-keys',
] as const

const demoWriteRestrictedPrefixes = [
    ...demoReadRestrictedPrefixes,
    '/api/auth/update-user',
    '/api/auth/change-password',
    '/api/auth/delete-user',
] as const

export interface DemoModeRestriction {
    statusCode: number
    statusMessage: string
    message: string
}

function hasRestrictedPrefix(path: string, prefixes: readonly string[]) {
    return prefixes.some((prefix) => path.startsWith(prefix))
}

export function getDemoModeRestriction(path: string, method: string): DemoModeRestriction | null {
    const normalizedMethod = method.toUpperCase()

    if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
        return hasRestrictedPrefix(path, demoReadRestrictedPrefixes)
            ? sensitiveReadRestriction
            : null
    }

    if (normalizedMethod === 'DELETE') {
        return deleteRestriction
    }

    return hasRestrictedPrefix(path, demoWriteRestrictedPrefixes)
        ? sensitiveWriteRestriction
        : null
}

export function assertDemoModeRequestAllowed(path: string, method: string) {
    const restriction = getDemoModeRestriction(path, method)

    if (restriction) {
        throw createError(restriction)
    }
}
