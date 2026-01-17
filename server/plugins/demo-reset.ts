export default defineNitroPlugin(() => {
    const config = useRuntimeConfig()

    // 仅在演示模式下启用自动重启逻辑
    if (config.public.demoMode === true) {
        // 默认为 1 小时重启一次，防止长时间运行导致内存膨胀，并周期性充重置演示数据
        // 如果用户在环境变量中指定了 DEMO_RESET_INTERVAL (分钟)，则使用该值
        const minutes = Number(process.env.DEMO_RESET_INTERVAL) || 60
        const RESET_INTERVAL = minutes * 60 * 1000

        console.info(`[Demo Mode] Application is running in Demo Mode. Memory database will be reset every ${minutes} minutes.`)

        setTimeout(() => {
            console.warn('[Demo Mode] Resetting application state to provide a clean environment for new users (Process Exit)...')
            // 退出进程。如果部署在 Docker 中并设置了 restart: always/unless-stopped，容器将自动重启。
            // 配合 :memory: 数据库，重启即意味着数据重置。
            process.exit(0)
        }, RESET_INTERVAL)
    }
})
