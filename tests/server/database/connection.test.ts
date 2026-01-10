import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DataSource } from 'typeorm'
import { setup } from '@nuxt/test-utils/e2e'
import { initializeDB } from '@/server/database/index'
import { User } from '@/server/entities/user'

// TODO: Skipped due to performance issues. See docs/plan/todo.md
describe.skip('Database Connection', async () => {
    let dataSource: DataSource

    await setup({
        server: false,
        dev: false,
        env: {
            DATABASE_TYPE: 'sqlite',
            DATABASE_PATH: ':memory:',
            LOGFILES: 'false',
            LOG_LEVEL: 'error',
            AUTH_SECRET: 'test_secret_1234567890_abcdefghij',
            NODE_ENV: 'test',
        },
    })

    beforeAll(async () => {
        dataSource = await initializeDB()
    })

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    it('should connect to the database successfully', () => {
        expect(dataSource).toBeDefined()
        expect(dataSource.isInitialized).toBe(true)
    })

    it('should synchronize entities and perform CRUD operations', async () => {
        const userRepository = dataSource.getRepository(User)

        // Create
        const user = new User()
        user.name = 'Test User'
        user.email = `test-${Date.now()}@example.com`
        user.username = `testuser${Date.now()}`
        user.emailVerified = true

        const savedUser = await userRepository.save(user)
        expect(savedUser.id).toBeDefined()

        // Read
        const foundUser = await userRepository.findOneBy({ id: savedUser.id })
        expect(foundUser).toBeDefined()
        expect(foundUser?.email).toBe(user.email)

        // Update
        foundUser!.name = 'Updated Name'
        await userRepository.save(foundUser!)

        const updatedUser = await userRepository.findOneBy({ id: savedUser.id })
        expect(updatedUser?.name).toBe('Updated Name')

        // Delete
        await userRepository.remove(updatedUser!)
        const deletedUser = await userRepository.findOneBy({ id: savedUser.id })
        expect(deletedUser).toBeNull()
    })
})
