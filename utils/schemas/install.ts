import { z } from 'zod'

export const siteConfigSchema = z.object({
    siteTitle: z.string().min(1, '站点标题不能为空').max(100),
    siteDescription: z.string().max(500).optional().or(z.literal('')),
    siteKeywords: z.string().max(200).optional().or(z.literal('')),
    siteUrl: z.string().max(500).optional().or(z.literal('')),
    siteCopyright: z.string().max(200).optional().or(z.literal('')),
    defaultLanguage: z.enum(['zh-CN', 'en-US']),
})

export const extraConfigSchema = z.object({
    // AI
    aiProvider: z.string().optional(),
    aiApiKey: z.string().optional(),
    aiModel: z.string().optional(),
    aiEndpoint: z.string().optional(),
    // Email
    emailHost: z.string().optional(),
    emailPort: z.number().optional(),
    emailUser: z.string().optional(),
    emailPass: z.string().optional(),
    emailFrom: z.string().optional(),
    // Storage
    storageType: z.string().optional(),
    localStorageDir: z.string().optional(),
    localStorageBaseUrl: z.string().optional(),
    s3Endpoint: z.string().optional(),
    s3Bucket: z.string().optional(),
    s3Region: z.string().optional(),
    s3AccessKey: z.string().optional(),
    s3SecretKey: z.string().optional(),
    s3BaseUrl: z.string().optional(),
    s3BucketPrefix: z.string().optional(),
    // Analytics
    baiduAnalytics: z.string().optional(),
    googleAnalytics: z.string().optional(),
    clarityAnalytics: z.string().optional(),
    // App
    appIcp: z.string().optional(),
    appPolice: z.string().optional(),
}).partial()

export const extraConfigInputSchema = extraConfigSchema

export const adminCreationSchema = z.object({
    email: z.email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码长度至少为 8 位'),
    name: z.string().min(1, '昵称不能为空').max(50),
})

export type SiteConfigInput = z.infer<typeof siteConfigSchema>
export type ExtraConfigInput = z.infer<typeof extraConfigSchema>
export type AdminCreationInput = z.infer<typeof adminCreationSchema>
