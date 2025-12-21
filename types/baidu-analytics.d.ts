export interface BaiduAnalyticsMethods {
    /**
     * 跟踪页面访问
     * @param page 页面路径（可选）
     */
    trackPageview(page?: string): void

    /**
     * 跟踪自定义事件
     * @param category 事件类别
     * @param action 事件动作
     * @param label 事件标签（可选）
     * @param value 事件值（可选）
     */
    trackEvent(category: string, action: string, label?: string, value?: number): void

    /**
     * 设置自定义变量
     * @param index 自定义变量索引 (1-5)
     * @param name 变量名称
     * @param value 变量值
     * @param scope 作用域 (1=访客级别, 2=会话级别, 3=页面级别)
     */
    setCustomVar(index: number, name: string, value: string, scope: number): void

    /**
     * 检查百度统计是否已加载
     */
    isLoaded(): boolean
}

declare global {
    interface Window {
        _hmt?: any[]
    }
}
