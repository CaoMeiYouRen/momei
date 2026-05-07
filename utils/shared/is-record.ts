/**
 * 类型守卫：判断 value 是否为 Record<string, unknown>（普通对象，排除 null 和数组）。
 *
 * 项目内 `isRecord` / `isPlainRecord` 曾出现在 6 个模块中且实现完全相同，
 * 现已收敛到此单一事实源。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}
