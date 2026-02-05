import { pvCache } from '../utils/pv-cache'

/**
 * 后台统计刷新插件
 * 定期将内存中的阅读量统计刷新到数据库，减少高并发下的数据库写压力
 */
export default defineNitroPlugin(() => {
    // 默认每分钟刷入一次（60秒）
    // 可以在此处从 runtimeConfig 获取配置以支持灵活调整
    const FLUSH_INTERVAL = 60 * 1000

    setInterval(() => {
        void (async () => {
            try {
                await pvCache.flush()
            } catch (error) {
                // 注意：此处不使用 logger，因为 setInterval 内部报错可能导致循环异常
                // 且 pvCache.flush 内部已经有了详细日志记录
                console.error('[PVCache] Critical failure in background flush task:', error)
            }
        })()
    }, FLUSH_INTERVAL)
})
