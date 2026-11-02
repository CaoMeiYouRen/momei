import type { CaomeiLocale } from 'caomei-ui'
import { computed, type ComputedRef } from 'vue'
import { resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'

/**
 * 应用语言 → caomei-ui 内建语言的映射。
 *
 * 用 `satisfies Record<AppLocaleCode, CaomeiLocale>` 而非 `as` 断言：
 * - 新增应用语言时会在编译期缺失映射（而不是被断言悄悄放过）；
 * - caomei 若把某个标识移出 `CaomeiLocale`，这里也会直接报错。
 */
const CAOMEI_LOCALE_BY_APP = {
    'zh-CN': 'zh-CN',
    'en-US': 'en-US',
    'zh-TW': 'zh-TW',
    'ja-JP': 'ja-JP',
    'ko-KR': 'ko-KR',
} as const satisfies Record<AppLocaleCode, CaomeiLocale>

/**
 * 把任意来源的语言标识归一化为 caomei-ui 的语言。
 *
 * 先经应用 registry 归一化（未知 / 历史写法回落到默认语言），再映射到 caomei 标识；
 * 避免把「未注册但类型合法」的值传给 `CaomeiConfigProvider`，否则组件内建文案会静默回退
 * 到 `zh-CN`，与页面语言不一致。
 */
export function resolveCaomeiLocale(locale?: string | null): CaomeiLocale {
    return CAOMEI_LOCALE_BY_APP[resolveAppLocaleCode(locale)]
}

/** 当前页面语言对应的 caomei-ui 语言标识（响应式）。 */
export function useCaomeiLocale(): ComputedRef<CaomeiLocale> {
    const { locale } = useI18n()
    return computed(() => resolveCaomeiLocale(locale.value))
}
