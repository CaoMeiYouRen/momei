/**
 * 将源对象中非 undefined 的字段安全地同步到目标对象（实体）
 * @param target 目标实体对象
 * @param source 校验过的输入对象 (Partial<T>)
 * @param keys 需要同步的键列表
 */
export function assignDefined<T extends object, S extends object>(
    target: T,
    source: S,
    keys: (keyof S & keyof T)[],
) {
    const targetRecord = target as Record<keyof S & keyof T, unknown>

    for (const key of keys) {
        const value = source[key]
        if (value !== undefined) {
            targetRecord[key] = value
        }
    }
}

/**
 * 将类实例的自有可枚举字段收敛为 plain object，便于构造响应 DTO。
 */
export function toPlainObject<T extends object>(value: T): { [K in keyof T]: T[K] } {
    return Object.fromEntries(Object.entries(value)) as { [K in keyof T]: T[K] }
}
