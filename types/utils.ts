import type { ComputedRef, Ref } from 'vue'

/**
 * 将类型 T 放宽为可接受普通值、Ref 或 ComputedRef 的反应式参数类型。
 *
 * 曾分别定义在 composables/use-locale-message-modules.ts 与 composables/use-app-fetch.ts 中，
 * 现收敛到此单一事实源。
 */
export type MaybeReactive<T> = T | Ref<T> | ComputedRef<T>

/**
 * 通用语言选项（仅 code 字段）。
 * 曾分别在 composables/use-post-editor-translation.ts 与 composables/use-post-editor-page.ts 中定义，
 * 现收敛到此单一事实源。
 */
export interface LocaleOption {
    code: string
}

/**
 * 带标签的语言选项（用于 Select 组件）。
 * 曾分别在 composables/use-admin-ai.ts（AdminAiLocaleOption）与 composables/use-admin-i18n.ts（AdminI18nLocaleOption）中定义，
 * 现收敛到此单一事实源。
 */
export interface SelectLocaleOption {
    label: string
    code: string
}

/**
 * SelectLocaleOption 的类型定义。
 * 其运行时类型守卫 `isSelectLocaleOption` 已迁入 `utils/shared/type-guards.ts`。
 */
export interface SelectLocaleOption {
    label: string
    code: string
}
