import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { generateRandomString } from '@/utils/shared/random'

describe('Archive API', async () => {
    await setup({
        dev: true,
        env: {
            DATABASE_TYPE: 'sqlite',
            DATABASE_PATH: ':memory:',
            LOGFILES: 'false',
            LOG_LEVEL: 'error',
            AUTH_SECRET: generateRandomString(32),
            NODE_ENV: 'test',
        },
    })

    beforeAll(async () => {
        // Insert some posts with different months/years
        const repo = dataSource.getRepository(Post)

        await repo.save([
            repo.create({ title: 'A', slug: 'a', content: 'a', status: 'published', publishedAt: new Date('2025-12-10'), language: 'zh' }),
            repo.create({ title: 'B', slug: 'b', content: 'b', status: 'published', publishedAt: new Date('2025-12-20'), language: 'zh' }),
            repo.create({ title: 'C', slug: 'c', content: 'c', status: 'published', publishedAt: new Date('2025-11-05'), language: 'zh' }),
            repo.create({ title: 'Old', slug: 'old', content: 'old', status: 'published', publishedAt: new Date('2023-06-01'), language: 'zh' }),
        ])
    })

    it('returns aggregated archive tree', async () => {
        const res: any = await $fetch('/api/posts/archive')
        expect(res.code).toBe(200)
        const years = res.data.list.map((y: any) => ({ year: y.year, months: y.months }))
        const y2025 = years.find((y: any) => y.year === 2025)
        expect(y2025).toBeDefined()
        const months = y2025.months.reduce((acc: any, m: any) => {
            acc[m.month] = m.count
            return acc
        }, {})
        expect(months[12]).toBe(2)
        expect(months[11]).toBe(1)
    })

    it('returns posts for given year/month when includePosts is true', async () => {
        const res: any = await $fetch('/api/posts/archive?includePosts=true&year=2025&month=12')
        expect(res.code).toBe(200)
        expect(res.data.list.length).toBe(2) // two posts in Dec 2025
        expect(res.data.total).toBe(2)
    })
})
