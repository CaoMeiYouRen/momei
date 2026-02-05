import type { BaiduAnalyticsMethods } from '@/types/baidu-analytics'

/**
 * 百度统计插件 - 客户端插件
 * 等效实现百度统计的原始 JavaScript 代码
 */
export default defineNuxtPlugin((): { provide: { baiduAnalytics: BaiduAnalyticsMethods } } | void => {
    const config = useRuntimeConfig()
    const baiduAnalyticsId = config.public.baiduAnalyticsId

    // 只在客户端且配置了百度统计 ID 时执行
    if (baiduAnalyticsId && import.meta.client) {
        const initBaidu = () => {
            // 初始化百度统计全局变量
            window._hmt = window._hmt || []

            // 创建脚本元素
            const script = document.createElement('script')
            script.src = `https://hm.baidu.com/hm.js?${baiduAnalyticsId}`
            script.async = true
            script.defer = true

            // 将脚本插入到第一个 script 标签之前
            const firstScript = document.getElementsByTagName('script')[0]
            if (firstScript?.parentNode) {
                firstScript.parentNode.insertBefore(script, firstScript)
            } else {
                // 如果没有找到 script 标签，就插入到 head 中
                document.head.appendChild(script)
            }

            // 自动跟踪路由变化
            const router = useRouter()
            router.afterEach((to) => {
                if (window._hmt) {
                    window._hmt.push(['_trackPageview', to.fullPath])
                }
            })
        }

        // 使用 requestIdleCallback 延迟加载
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => initBaidu(), { timeout: 3000 })
        } else {
            setTimeout(initBaidu, 2000)
        }

        // 提供全局访问方法
        return {
            provide: {
                baiduAnalytics: {
                    /**
                     * 跟踪页面访问
                     * @param page 页面路径（可选）
                     */
                    trackPageview(page?: string) {
                        if (window._hmt) {
                            if (page) {
                                window._hmt.push(['_trackPageview', page])
                            } else {
                                window._hmt.push(['_trackPageview'])
                            }
                        }
                    },

                    /**
                     * 跟踪自定义事件
                     * @param category 事件类别
                     * @param action 事件动作
                     * @param label 事件标签（可选）
                     * @param value 事件值（可选）
                     */
                    trackEvent(category: string, action: string, label?: string, value?: number) {
                        if (window._hmt) {
                            if (value !== undefined && label) {
                                window._hmt.push(['_trackEvent', category, action, label, value])
                            } else if (label) {
                                window._hmt.push(['_trackEvent', category, action, label])
                            } else {
                                window._hmt.push(['_trackEvent', category, action])
                            }
                        }
                    },

                    /**
                     * 设置自定义变量
                     * @param index 自定义变量索引 (1-5)
                     * @param name 变量名称
                     * @param value 变量值
                     * @param scope 作用域 (1=访客级别, 2=会话级别, 3=页面级别)
                     */
                    setCustomVar(index: number, name: string, value: string, scope: number) {
                        if (window._hmt && index >= 1 && index <= 5) {
                            window._hmt.push(['_setCustomVar', index, name, value, scope])
                        }
                    },

                    /**
                     * 检查百度统计是否已加载
                     */
                    isLoaded() {
                        return typeof window !== 'undefined' && typeof window._hmt !== 'undefined'
                    },
                } satisfies BaiduAnalyticsMethods,
            },
        }
    }
})
