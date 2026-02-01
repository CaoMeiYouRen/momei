/**
 * PrimeVue 与 Vue-i18n 动态同步插件
 * 监听 Vue-i18n 语言变化，自动同步 PrimeVue 组件的内置文本
 */
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrimeVue } from 'primevue/config'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { en } from 'primelocale/js/en.js'

export default defineNuxtPlugin((_nuxtApp) => {
    // 避免在服务端执行
    if (import.meta.server) {
        return
    }

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
         * 深度更新 locale 对象的所有字段，确保完全响应式
         * @param localeCode - 语言代码（如 'zh-CN', 'en-US'）
         */
        const syncPrimeVueLocale = (localeCode: string): void => {
            if (localeMap[localeCode] && primevue?.config?.locale) {
                const newLocale = localeMap[localeCode]
                // 深度更新所有字段而不是替换整个对象引用
                // 这样可以确保 Password 等组件能正确响应语言变化
                Object.entries(newLocale).forEach(([key, value]) => {
                    ;(primevue.config.locale as any)[key] = value
                })
            }
        }

        // 初始化时同步当前语言
        syncPrimeVueLocale(locale.value)

        // 监听 Vue-i18n 语言变化，自动同步 PrimeVue
        watch(() => locale.value, (newLocale) => {
            syncPrimeVueLocale(newLocale)
        })
    } catch (error) {
        // 在某些非页面环境（如部分测试）下可能无法获取 i18n 实例，静默失败
        if (process.env.NODE_ENV !== 'test') {
            console.warn('PrimeVue i18n sync error:', error)
        }
    }
})
