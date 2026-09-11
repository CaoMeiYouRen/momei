import { test } from 'vitest'
import { MomeiApi } from '../../src/lib/api'

// Benchmark for MomeiApi layer.
// vitest 5 起 `bench` 不再是顶层 import，必须通过 `test()` 上下文 fixture 访问。
// 详见 https://vitest.dev/guide/migration#benchmarking-api-rewrite
const api = new MomeiApi({
    apiUrl: 'http://localhost:3000',
    apiKey: 'test-key',
    enableDangerousTools: false,
})

// Mock global fetch for controlled benchmarking
globalThis.fetch = (() =>
    // Simulate a small delay for network-like behavior
    // await new Promise(resolve => setTimeout(resolve, 10));
    Promise.resolve({
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
) as any

test('MomeiApi Performance > listPosts performance', async ({ bench }) => {
    await bench('listPosts', async () => {
        await api.listPosts({ page: 1, limit: 10 })
    }).run()
})

test('MomeiApi Performance > getPost performance', async ({ bench }) => {
    await bench('getPost', async () => {
        await api.getPost('1')
    }).run()
})
