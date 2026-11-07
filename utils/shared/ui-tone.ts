import type { ComponentTone } from 'caomei-ui'

/**
 * PrimeVue `severity` → caomei-ui `tone` 的唯一映射（迁移期收敛，避免各组件各写一份）。
 *
 * 对应关系见迁移方案 §6.2：
 * - `success` → `success`
 * - `warn` / `warning` → `warning`
 * - `danger` / `error` → `danger`
 * - `info` / `primary` → `primary`
 * - 其余（`secondary` / `contrast` / 空值）→ `neutral`（有损近似：PrimeVue 的 `contrast` 是深色描边，
 *   caomei 无对应语义，统一落到中性色）
 */
export function severityToTone(severity: string | null | undefined): ComponentTone {
    switch (severity) {
        case 'success':
            return 'success'
        case 'warn':
        case 'warning':
            return 'warning'
        case 'danger':
        case 'error':
            return 'danger'
        case 'info':
        case 'primary':
            return 'primary'
        default:
            return 'neutral'
    }
}
