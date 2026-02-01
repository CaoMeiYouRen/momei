/**
 * PrimeVue 与 Vue-i18n 动态同步插件
 * 监听 Vue-i18n 语言变化，自动同步 PrimeVue 组件的内置文本
 */
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrimeVue } from 'primevue/config'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { en } from 'primelocale/js/en.js'

export default defineNuxtPlugin((nuxtApp) => {
    // 避免在服务端执行
    if (import.meta.server) {
        return
    }

    // 在应用挂载后初始化，确保 i18n 已准备好
    nuxtApp.hook('app:mounted', () => {
        try {
            const { locale } = useI18n()
            const primevue = usePrimeVue()

            // PrimeVue 语言映射表
            const localeMap: Record<string, any> = {
                'zh-CN': zh_CN,
                'en-US': en,
            }

            /**
             * 同步函数：将指定的语言代码应用到 PrimeVue
             * @param localeCode - 语言代码（如 'zh-CN', 'en-US'）
             */
            const syncPrimeVueLocale = (localeCode: string): void => {
                if (localeMap[localeCode]) {
                    // 通过修改 config.locale 来更新 PrimeVue 的语言
                    primevue.config.locale = localeMap[localeCode]
                }
            }

            // 初始化时同步当前语言
            syncPrimeVueLocale(locale.value)

            // 监听 Vue-i18n 语言变化，自动同步 PrimeVue
            watch(() => locale.value, (newLocale) => {
                syncPrimeVueLocale(newLocale)
            })
        } catch (error) {
            console.warn('PrimeVue i18n sync error:', error)
        }
    })
})
