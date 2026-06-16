import type { SelectLocaleOption } from '@/types/utils'

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
