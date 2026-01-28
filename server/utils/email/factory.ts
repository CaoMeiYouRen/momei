import nodemailer, { type Transporter } from 'nodemailer'
import {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
} from '@/utils/shared/env'

export type MailerConfig = {
    host?: string
    port?: number
    secure?: boolean
    auth?: {
        user?: string
        pass?: string
    }
}

export type MailerFactory = (config?: MailerConfig) => Transporter

export function createDefaultMailer(config?: MailerConfig): Transporter {
    return nodemailer.createTransport({
        host: config?.host || EMAIL_HOST,
        port: config?.port || EMAIL_PORT || 587,
        secure: config?.secure !== undefined ? config.secure : EMAIL_SECURE,
        auth: {
            user: config?.auth?.user || EMAIL_USER,
            pass: config?.auth?.pass || EMAIL_PASS,
        },
    })
}
