export interface GoogleAnalyticsMethods {
    /**
     * 跟踪页面访问
     * @param pageConfig 配置对象
     */
    trackPageview(pageConfig?: {
        page_title?: string
        page_location?: string
        page_path?: string
    }): void

    /**
     * 跟踪自定义事件
     * @param eventName 事件名称
     * @param parameters 事件参数
     */
    trackEvent(eventName: string, parameters?: Record<string, unknown>): void

    /**
     * 设置用户属性
     * @param properties 用户属性
     */
    setUserProperties(properties: Record<string, unknown>): void

    /**
     * 设置配置
     * @param measurementId 测量 ID
     * @param configOptions 配置对象
     */
    setConfig(measurementId: string, configOptions?: Record<string, unknown>): void

    /**
     * 检查 Google Analytics 是否已加载
     */
    isLoaded(): boolean
}

declare global {
    interface Window {
        dataLayer: any[]
        gtag: (...args: any[]) => void
    }
}
