import { defineNitroPlugin } from 'nitropack/runtime'
import { TEST_MODE } from '@/utils/shared/env'

export default defineNitroPlugin(() => {
    // 仅在测试模式下预填充初始化数据
    if (TEST_MODE) {
        void (async () => {
            try {
                const [{ dataSource, initializeDB }, { seedTestData }] = await Promise.all([
                    import('../database'),
                    import('../utils/seed-test'),
                ])
                await initializeDB()
                await seedTestData(dataSource)
            } catch (error) {
                console.error('[Test Seed Plugin] Failed to seed test data:', error)
            }
        })()
    }
})
