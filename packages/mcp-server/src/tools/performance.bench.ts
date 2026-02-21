import { bench, describe } from 'vitest'
import { MomeiApi } from '../../src/lib/api'

// Benchmark for MomeiApi layer
describe('MomeiApi Performance', () => {
    const api = new MomeiApi({
        apiUrl: 'http://localhost:3000',
        apiKey: 'test-key',
        enableDangerousTools: false,
    })

    // Mock global fetch for controlled benchmarking
    globalThis.fetch = ((url: string, options: RequestInit) => {
        // Simulate a small delay for network-like behavior
        // await new Promise(resolve => setTimeout(resolve, 10));
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                code: 200,
                data: Array.from({ length: 10 }).map((_, i) => ({
                    id: String(i),
                    title: `Post ${i}`,
                    content: 'Some random content for benchmarking purposes.'.repeat(10),
                    status: 'published',
                    language: 'zh-CN',
                })),
                message: 'Success',
            }),
        } as Response)
    }) as any

    bench('listPosts performance', async () => {
        await api.listPosts({ page: 1, limit: 10 })
    })

    bench('getPost performance', async () => {
        await api.getPost('1')
    })
})
