// testSetup.ts
import { vi } from 'vitest'

// 设置环境变量
// process.env.NODE_ENV = 'test';
// process.env.BETTER_AUTH_TRUSTED_ORIGINS = 'http://localhost:3000';
// process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test_db';

// 模拟WebSocket服务器以避免端口冲突
vi.mock('ws', () => ({
    Server: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        close: vi.fn(),
    })),
}))

// 全局错误处理
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason)
})
