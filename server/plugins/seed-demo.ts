import { defineNitroPlugin } from 'nitropack/runtime'
import { dataSource } from '../database'
import { seedDemoData } from '../utils/seed-demo'
import { DEMO_MODE } from '@/utils/shared/env'

export default defineNitroPlugin(() => {
    // 仅在演示模式下预填充假数据
    if (DEMO_MODE) {
        void (async () => {
            try {
                // 确保数据库已初始化
                if (!dataSource.isInitialized) {
                    await dataSource.initialize()
                }
                await seedDemoData(dataSource)
            } catch (error) {
                console.error('[Demo Seed Plugin] Failed to seed demo data:', error)
            }
        })()
    }
})
