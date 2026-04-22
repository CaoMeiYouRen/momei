import { computed, ref, unref, watch, type ComputedRef, type Ref } from 'vue'
import type { LocaleMessageModule } from '@/i18n/config/locale-modules'
import { ensureLocaleMessageModules } from '@/i18n/config/locale-runtime-loader'

type MaybeReactive<T> = T | Ref<T> | ComputedRef<T>

function resolveModules(modules: MaybeReactive<readonly LocaleMessageModule[]>) {
    return [...unref(modules)]
}

export function useLocaleMessageModules(options: {
    modules: MaybeReactive<readonly LocaleMessageModule[]>
    enabled?: MaybeReactive<boolean>
}) {
    const { locale } = useI18n()
    const nuxtApp = useNuxtApp()
    const localeModulesReady = ref(false)

    watch(
        () => ({
            locale: locale.value,
            enabled: options.enabled === undefined ? true : Boolean(unref(options.enabled)),
            modulesKey: resolveModules(options.modules).join('|'),
        }),
        async ({ locale: currentLocale, enabled }) => {
            if (!enabled) {
                localeModulesReady.value = true
                return
            }

            const modules = resolveModules(options.modules)
            if (modules.length === 0) {
                localeModulesReady.value = true
                return
            }

            localeModulesReady.value = false
            await ensureLocaleMessageModules({
                i18n: nuxtApp.$i18n,
                locale: currentLocale,
                modules,
            })
            localeModulesReady.value = true
        },
        { immediate: true },
    )

    return {
        localeModulesReady: computed(() => localeModulesReady.value),
    }
}
