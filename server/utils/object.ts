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
    for (const key of keys) {
        if (source[key] !== undefined) {
            target[key] = source[key] as any
        }
    }
}
