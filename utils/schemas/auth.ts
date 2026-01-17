import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string()
        .min(1, { message: 'pages.login.email_required' }),
    password: z.string()
        .min(1, { message: 'pages.login.password_required' }),
})

export const registerSchema = z.object({
    name: z.string().min(1, { message: 'pages.register.name_required' }),
    email: z.string().min(1, { message: 'pages.register.email_required' }),
    password: z.string().min(1, { message: 'pages.register.password_required' }),
    confirmPassword: z.string().min(1, { message: 'pages.register.confirm_password_required' }),
    agreed: z.boolean().refine((val) => val === true, { message: 'legal.agreement_required' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'pages.register.password_mismatch',
    path: ['confirmPassword'],
})
