import { z } from 'zod'

export const benefitWaitlistSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.email('Invalid email address').max(255, 'Email is too long'),
    locale: z.string().max(10).optional().nullable(),
})
