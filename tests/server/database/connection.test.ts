import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DataSource } from 'typeorm'
import { initializeDB } from '@/server/database/index'
import { User } from '@/server/entities/user'

describe('Database Connection', () => {
    let dataSource: DataSource

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
