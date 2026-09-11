import { test } from 'vitest'
import { MomeiApi } from '../../src/lib/api'

/**
 * Multi-environment Stress Test using Vitest Bench
 * Usage: MOMEI_API_URL=xxx MOMEI_API_KEY=yyy pnpm run test:bench -- src/tools/multi-env-performance.bench.ts
 *
 * vitest 5 起 `bench` 不再是顶层 import，必须通过 `test()` 上下文 fixture 访问。
 * 详见 https://vitest.dev/guide/migration#benchmarking-api-rewrite
 */
const url = process.env.MOMEI_API_URL || 'http://localhost:3000'
const key = process.env.MOMEI_API_KEY

test.skipIf(!key)('Momei Online API Stress Test', async ({ bench }) => {
    const api = new MomeiApi({
        apiUrl: url,
        apiKey: key!,
        enableDangerousTools: false,
    })

    await bench(`Stress Test against ${url}`, async () => {
        try {
            await api.listPosts({ page: 1, limit: 10 })
        } catch {
            // Handle or ignore errors in bench
        }
    }).run()
})
