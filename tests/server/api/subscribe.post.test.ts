import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'
import subscribeHandler from '@/server/api/subscribe.post'

// Mock runtime config
vi.mock('#imports', () => ({
    useRuntimeConfig: () => ({
        public: {
            appName: 'Momei Blog',
        },
    }),
}))

// Mock email service to avoid actual email sending
vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendSubscriptionConfirmation: vi.fn().mockResolvedValue(true),
    },
}))

import { emailService } from '@/server/utils/email/service'

describe('Subscribe API', async () => {
    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()
    })

    it('should create a new subscriber', async () => {
        const email = `test_${generateRandomString(5)}@example.com`
        const language = 'en-US'

        const event = {
            body: { email, language },
        } as any

        const result = await subscribeHandler(event)

        expect(result).toBeDefined()
        const subscriberRepo = dataSource.getRepository(Subscriber)
        const subscriber = await subscriberRepo.findOneBy({ email })
        
        expect(subscriber).toBeDefined()
        expect(subscriber?.email).toBe(email)
        expect(subscriber?.language).toBe(language)
        expect(subscriber?.isActive).toBe(true)
        expect(emailService.sendSubscriptionConfirmation).toHaveBeenCalledWith(email)
    })

    it('should link new subscriber to existing user', async () => {
        const email = `user_${generateRandomString(5)}@example.com`
        
        // Create user first
        const userRepo = dataSource.getRepository(User)
        const user = new User()
        user.name = 'Test User'
        user.email = email
        user.role = 'user'
        await userRepo.save(user)

        const event = {
            body: { email, language: 'zh-CN' },
        } as any
        
        await subscribeHandler(event)

        const subscriberRepo = dataSource.getRepository(Subscriber)
        const subscriber = await subscriberRepo.findOneBy({ email })
        expect(subscriber?.userId).toBe(user.id)
    })

    it('should reactivate an inactive subscriber and update info', async () => {
        const email = `inactive_${generateRandomString(5)}@example.com`
        
        // Create inactive subscriber
        const subscriberRepo = dataSource.getRepository(Subscriber)
        const sub = new Subscriber()
        sub.email = email
        sub.isActive = false
        sub.language = 'en-US'
        await subscriberRepo.save(sub)

        const event = {
            body: { email, language: 'zh-CN' },
        } as any

        const result = await subscribeHandler(event)

        expect(result.code).toBe(200)
        expect(result.message).toBe('Successfully subscribed')
        
        const updatedSub = await subscriberRepo.findOneBy({ email })
        expect(updatedSub?.isActive).toBe(true)
        expect(updatedSub?.language).toBe('zh-CN')
    })

    it('should return "Already subscribed" if already active', async () => {
        const email = `active_${generateRandomString(5)}@example.com`
        
        const subscriberRepo = dataSource.getRepository(Subscriber)
        const sub = new Subscriber()
        sub.email = email
        sub.isActive = true
        sub.language = 'en-US'
        await subscriberRepo.save(sub)

        const event = {
            body: { email, language: 'zh-CN' },
        } as any

        const result = await subscribeHandler(event)
        expect(result.message).toBe('Already subscribed')
        
        // Language should still be updated
        const updatedSub = await subscriberRepo.findOneBy({ email })
        expect(updatedSub?.language).toBe('zh-CN')
    })
})
