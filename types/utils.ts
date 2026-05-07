import type { ComputedRef, Ref } from 'vue'

/**
 * 将类型 T 放宽为可接受普通值、Ref 或 ComputedRef 的反应式参数类型。
 *
 * 曾分别定义在 composables/use-locale-message-modules.ts 与 composables/use-app-fetch.ts 中，
 * 现收敛到此单一事实源。
 */
export type MaybeReactive<T> = T | Ref<T> | ComputedRef<T>
