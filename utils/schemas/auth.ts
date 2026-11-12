import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string()
        .min(1, { message: 'common.email_required' }),
    password: z.string()
        .min(1, { message: 'common.password_required' }),
})

export const registerSchema = z.object({
    name: z.string().min(1, { message: 'pages.register.name_required' }),
    email: z.string().min(1, { message: 'common.email_required' }),
    password: z.string().min(1, { message: 'common.password_required' }),
    confirmPassword: z.string().min(1, { message: 'pages.register.confirm_password_required' }),
    agreed: z.boolean().refine((val) => val, { message: 'legal.agreement_required' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'pages.register.password_mismatch',
    path: ['confirmPassword'],
})
