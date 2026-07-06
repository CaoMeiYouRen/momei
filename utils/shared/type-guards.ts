import type { SelectLocaleOption } from '@/types/utils'

/**
 * 类型守卫：判断 value 是否为 Record<string, unknown>（普通对象，排除 null 和数组）。
 *
 * 项目内 `isRecord` / `isPlainRecord` 曾出现在 6 个模块中且实现完全相同，
 * 现已收敛到此单一事实源。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * SelectLocaleOption 的类型守卫。
 * 从 `types/utils.ts` 迁入至 `utils/shared/`，因为它包含运行时逻辑，不属于纯类型定义。
 */
export function isSelectLocaleOption(value: unknown): value is SelectLocaleOption {
    return typeof value === 'object'
        && value !== null
        && 'label' in value
        && 'code' in value
}
