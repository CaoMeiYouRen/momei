import { ref, onMounted } from 'vue'

/**
 * 已加载的广告适配器脚本缓存
 */
const loadedScripts = new Set<string>()

/**
 * 广告脚本加载 Composable
 * 用于管理和加载广告平台脚本
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export function useAdScript() {
    const isLoading = ref(false)
    const loadError = ref<string | null>(null)

    /**
     * 加载所有已配置的广告脚本
     */
    async function loadAllScripts(): Promise<void> {
        try {
            isLoading.value = true
            loadError.value = null

            const response = await $fetch<{
                data: {
                    adapter: string
                    script: string
                }[]
            }>('/api/ads/script')

            if (!response.data) {
                return
            }

            // 批量加载脚本
            for (const { adapter, script } of response.data) {
                await loadScript(adapter, script)
            }
        } catch (error) {
            console.warn('Failed to load ad scripts:', error)
            loadError.value = error instanceof Error ? error.message : 'Failed to load ad scripts'
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 加载单个适配器脚本
     * @param adapterId 适配器 ID
     * @param scriptHtml 脚本 HTML
     */
    async function loadScript(adapterId: string, scriptHtml: string): Promise<void> {
        // 检查是否已加载
        if (loadedScripts.has(adapterId)) {
            return
        }

        return new Promise((resolve, reject) => {
            try {
                // 创建临时容器来解析和执行脚本
                const container = document.createElement('div')
                container.innerHTML = scriptHtml

                // 提取 script 标签
                const scripts = container.querySelectorAll('script')
                let loadedCount = 0

                if (scripts.length === 0) {
                    loadedScripts.add(adapterId)
                    resolve()
                    return
                }

                scripts.forEach((originalScript) => {
                    const script = document.createElement('script')

                    // 复制所有属性
                    Array.from(originalScript.attributes).forEach((attr) => {
                        script.setAttribute(attr.name, attr.value)
                    })

                    // 复制内容
                    if (originalScript.src) {
                        // 外部脚本
                        script.onload = () => {
                            loadedCount++
                            if (loadedCount === scripts.length) {
                                loadedScripts.add(adapterId)
                                resolve()
                            }
                        }
                        script.onerror = () => {
                            console.warn(`Failed to load ad script: ${adapterId}`)
                            loadedCount++
                            if (loadedCount === scripts.length) {
                                resolve() // 即使失败也继续
                            }
                        }
                    } else {
                        // 内联脚本
                        script.textContent = originalScript.textContent
                        loadedCount++
                    }

                    document.head.appendChild(script)
                })

                // 内联脚本立即完成
                if (Array.from(scripts).every((s) => !s.src)) {
                    loadedScripts.add(adapterId)
                    resolve()
                }
            } catch (err) {
                reject(err instanceof Error ? err : new Error(String(err)))
            }
        })
    }

    /**
     * 检查脚本是否已加载
     */
    function isScriptLoaded(adapterId: string): boolean {
        return loadedScripts.has(adapterId)
    }

    /**
     * 清除已加载脚本缓存（用于测试或重置）
     */
    function clearCache(): void {
        loadedScripts.clear()
    }

    /**
     * 在组件挂载时自动加载脚本
     */
    function autoLoad() {
        onMounted(() => {
            void loadAllScripts()
        })
    }

    return {
        isLoading,
        loadError,
        loadAllScripts,
        loadScript,
        isScriptLoaded,
        clearCache,
        autoLoad,
    }
}
