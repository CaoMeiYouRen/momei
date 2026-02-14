import { defineNitroPlugin } from 'nitropack/runtime'
import { dataSource } from '../database'
import { seedTestData } from '../utils/seed-test'
import { TEST_MODE } from '@/utils/shared/env'

export default defineNitroPlugin(() => {
    // 仅在测试模式下预填充初始化数据
    if (TEST_MODE) {
        void (async () => {
            try {
                // 确保数据库已初始化
                if (!dataSource.isInitialized) {
                    await dataSource.initialize()
                }
                await seedTestData(dataSource)
            } catch (error) {
                console.error('[Test Seed Plugin] Failed to seed test data:', error)
            }
        })()
    }
})
