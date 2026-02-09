import { rateLimit } from '@/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
    // 限制 API 请求频率
    if (event.path.startsWith('/api')) {
        if (event.path.startsWith('/api/auth')) {
            // auth 路由的频率限制由 better-auth 提供，故此处不做处理
            return
        }
        if (event.path.startsWith('/api/file') || event.path.startsWith('/api/user/avatar')) {
            // 限制 文件上传频率
            await rateLimit(event, {
                window: 60,
                max: 5,
            })
            return
        }
        if (event.path.startsWith('/api/subscribers/subscribe')) {
            // 限制 订阅 频率
            await rateLimit(event, {
                window: 60,
                max: 3,
            })
            return
        }
        if (event.path.startsWith('/api/ai')) {
            // 限制 AI 接口频率，防止 API 费用超支及滥用
            // 轮询状态接口放宽限制，其他接口保持严格
            if (event.path.includes('/api/ai/task/status/')) {
                await rateLimit(event, {
                    window: 60,
                    max: 30, // 每分钟允许 30 次轮询
                })
                return
            }
            await rateLimit(event, {
                window: 60,
                max: 5,
            })
            return
        }
        if (event.path.startsWith('/api/search')) {
            // 限制 搜索 频率，避免全文搜索带来的数据库压力
            await rateLimit(event, {
                window: 60,
                max: 5,
            })
            return
        }
        // 如果是 POST/PATCH/PUT/DELETE 请求，限制为 20 次/分钟
        if (event.method === 'POST' || event.method === 'PATCH' || event.method === 'PUT' || event.method === 'DELETE') {
            await rateLimit(event, {
                window: 60,
                max: 20,
            })
            return
        }
        // 否则限制为 60 次/分钟
        await rateLimit(event, {
            window: 60,
            max: 60,
        })

    }
})
