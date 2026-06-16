import type { CopyrightType, LicenseMeta } from '@/types/copyright'

/**
 * 版权许可协议的元数据映射。
 * 从 `types/copyright.ts` 迁入至 `utils/shared/`，因为它包含运行时 Record 常量，不属于纯类型定义。
 */
export const COPYRIGHT_LICENSES: Record<CopyrightType, LicenseMeta> = {
    'all-rights-reserved': {
        id: 'all-rights-reserved',
    },
    'cc-by': {
        id: 'cc-by',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    'cc-by-sa': {
        id: 'cc-by-sa',
        url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    'cc-by-nd': {
        id: 'cc-by-nd',
        url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    },
    'cc-by-nc': {
        id: 'cc-by-nc',
        url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
    'cc-by-nc-sa': {
        id: 'cc-by-nc-sa',
        url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
    'cc-by-nc-nd': {
        id: 'cc-by-nc-nd',
        url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
    'cc-zero': {
        id: 'cc-zero',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
}

/**
 * 判断给定值是否为有效的 CopyrightType。
 * 从 `types/copyright.ts` 迁入至 `utils/shared/`，因为它包含运行时逻辑（类型守卫）。
 */
export function isCopyrightType(value: string): value is CopyrightType {
    return value in COPYRIGHT_LICENSES
}

/**
 * 将字符串解析为 CopyrightType，若无效则返回 fallback。
 * 从 `types/copyright.ts` 迁入至 `utils/shared/`，因为它包含运行时逻辑。
 */
export function resolveCopyrightType(value?: string | null, fallback: CopyrightType = 'all-rights-reserved'): CopyrightType {
    if (value && isCopyrightType(value)) {
        return value
    }

    return fallback
}
