import { defineNitroPlugin } from 'nitropack/runtime'
import { DEMO_MODE } from '@/utils/shared/env'

export default defineNitroPlugin(() => {
    // 仅在演示模式下预填充假数据
    if (DEMO_MODE) {
        void (async () => {
            try {
                const [{ dataSource, initializeDB }, { seedDemoData }] = await Promise.all([
                    import('../database'),
                    import('../utils/seed-demo'),
                ])
                await initializeDB()
                await seedDemoData(dataSource)
            } catch (error) {
                console.error('[Demo Seed Plugin] Failed to seed demo data:', error)
            }
        })()
    }
})
