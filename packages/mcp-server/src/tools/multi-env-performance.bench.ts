import { bench, describe } from 'vitest'
import { MomeiApi } from '../../src/lib/api'

/**
 * Multi-environment Stress Test using Vitest Bench
 * Usage: MOMEI_API_URL=xxx MOMEI_API_KEY=yyy pnpm run test:bench -- src/tools/multi-env-performance.bench.ts
 */
describe('Momei Online API Stress Test', () => {
    const url = process.env.MOMEI_API_URL || 'http://localhost:3000'
    const key = process.env.MOMEI_API_KEY

    if (!key) {
        console.warn('Skipping online stress test because MOMEI_API_KEY is not set.')
        return
    }

    const api = new MomeiApi({
        apiUrl: url,
        apiKey: key,
        enableDangerousTools: false,
    })

    bench(`Stress Test against ${url}`, async () => {
        try {
            await api.listPosts({ page: 1, limit: 10 })
        } catch (error) {
            // Handle or ignore errors in bench
        }
    })
})
