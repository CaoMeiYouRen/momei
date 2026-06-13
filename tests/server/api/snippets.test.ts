import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'
import createSnippetHandler from '@/server/api/snippets/index.post'
import listSnippetsHandler from '@/server/api/admin/snippets/index.get'
import { SnippetStatus } from '@/types/snippet'

describe('Snippets API', () => {
    let user: User

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        user = new User()
        user.name = 'Snippet Author'
        user.email = `snippet_${generateRandomString(5)}@example.com`
        user.role = 'author'
        await userRepo.save(user)
    })

    it('should create a snippet via ingestion API', async () => {
        const event = {
            context: {
                auth: { user },
            },
            node: {},
            headers: new Headers(),
        } as any

        // Mock readBody
        vi.stubGlobal('readBody', () => Promise.resolve({
            content: 'My first snippet',
            source: 'test',
        }))

        const result = await createSnippetHandler(event)
        expect(result.code).toBe(200)
        expect(result.data.content).toBe('My first snippet')
        expect(result.data.authorId).toBe(user.id)
    })

    it('should list snippets via admin API', async () => {
        const event = {
            context: {
                auth: { user },
            },
        } as any

        // Mock getVerifiedQuery
        vi.stubGlobal('getVerifiedQuery', () => Promise.resolve({
            page: 1,
            limit: 20,
        }))

        const result = await listSnippetsHandler(event)
        expect(result.code).toBe(200)
        expect(result.data?.items?.length).toBeGreaterThan(0)
    })
})


