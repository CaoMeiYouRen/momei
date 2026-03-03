import { describe, it, expect, beforeAll } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'

describe('Post Entity Constraints', () => {
    let author: User

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Constraint Author'
        author.email = `auth_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)
    })

    it('should allow same slug with different languages', async () => {
        const postRepo = dataSource.getRepository(Post)
        const slug = `same-slug-${generateRandomString(5)}`

        const p1 = new Post()
        p1.title = 'Title 1'
        p1.slug = slug
        p1.language = 'zh-CN'
        p1.content = 'Content 1'
        p1.author = author
        await postRepo.save(p1)

        const p2 = new Post()
        p2.title = 'Title 2'
        p2.slug = slug
        p2.language = 'en-US'
        p2.content = 'Content 2'
        p2.author = author
        await postRepo.save(p2)

        const count = await postRepo.countBy({ slug })
        expect(count).toBe(2)
    })

    it('should fail with same slug and same language', async () => {
        const postRepo = dataSource.getRepository(Post)
        const slug = `unique-slug-${generateRandomString(5)}`

        const p1 = new Post()
        p1.title = 'Title 1'
        p1.slug = slug
        p1.language = 'zh-CN'
        p1.content = 'Content 1'
        p1.author = author
        await postRepo.save(p1)

        const p2 = new Post()
        p2.title = 'Title 2'
        p2.slug = slug
        p2.language = 'zh-CN'
        p2.content = 'Content 2'
        p2.author = author

        await expect(postRepo.save(p2)).rejects.toThrow()
    })
})
