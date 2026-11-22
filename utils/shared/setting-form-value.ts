import type { SettingFormValue } from '@/types/setting'

/**
 * 设置表单字段适配层的取值归一。
 *
 * `CaomeiInput` / `CaomeiPassword` / `CaomeiTextarea` 的 `modelValue` 只接受
 * `string | undefined`，而设置项通用类型 `SettingFormValue` 允许 `null`（DB 未设置即 null）。
 * 统一在此把 `null` / `undefined` 归一为空串，避免每个适配层重复实现。
 * 非标量取值（对象 / 数组 / 本地化对象）按空串处理：这些字段由 `LocalizedSettingEditor`
 * 或 JSON 字符串字段承接，不进入文本适配层，避免渲染出 `[object Object]`。
 */
export function normalizeSettingFormValue(value?: SettingFormValue): string {
    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }

    return ''
}
