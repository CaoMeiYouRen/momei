import { z } from 'zod'
import { FriendLinkApplicationStatus, FriendLinkStatus } from '@/types/friend-link'

const httpUrlSchema = z.string().trim().url('无效的网址格式').refine((value) => {
    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol)
    } catch {
        return false
    }
}, '仅支持 http/https 链接')

const isBasicLogoUrl = (value: string) => {
    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol)
    } catch {
        return false
    }
}

const optionalHttpUrlSchema = z.union([httpUrlSchema, z.literal('')]).optional()
const optionalTextSchema = z.string().trim().max(500, '内容过长').optional().or(z.literal(''))
const optionalLogoSchema = z.string().trim().refine((value) => {
    if (!value) {
        return true
    }

    return value.startsWith('/') || value.startsWith('data:image/') || isBasicLogoUrl(value)
}, 'Logo 必须是有效的图片地址').optional().or(z.literal(''))

export const friendLinkCategorySchema = z.object({
    name: z.string().trim().min(1, '分类名称不能为空').max(100, '分类名称过长'),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug 仅支持小写字母、数字和连字符').max(100, 'Slug 过长').optional().or(z.literal('')),
    description: z.string().trim().max(500, '描述过长').optional().or(z.literal('')),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    isEnabled: z.boolean().optional(),
})

export const friendLinkSchema = z.object({
    name: z.string().trim().min(1, '站点名称不能为空').max(120, '站点名称过长'),
    url: httpUrlSchema,
    logo: optionalLogoSchema,
    description: z.string().trim().max(2000, '简介过长').optional().or(z.literal('')),
    rssUrl: optionalHttpUrlSchema,
    contactEmail: z.email('无效的邮箱地址'),
    categoryId: z.string().trim().optional().nullable().or(z.literal('')),
    status: z.enum([FriendLinkStatus.DRAFT, FriendLinkStatus.ACTIVE, FriendLinkStatus.INACTIVE]).optional(),
    isPinned: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
})

export const friendLinkApplicationSchema = z.object({
    name: z.string().trim().min(1, '站点名称不能为空').max(120, '站点名称过长'),
    url: httpUrlSchema,
    logo: optionalLogoSchema,
    description: z.string().trim().max(2000, '简介过长').optional().or(z.literal('')),
    categoryId: z.string().trim().optional().nullable().or(z.literal('')),
    categorySuggestion: z.string().trim().max(100, '分类建议过长').optional().or(z.literal('')),
    contactName: z.string().trim().max(100, '联系人名称过长').optional().or(z.literal('')),
    contactEmail: z.email('无效的邮箱地址'),
    rssUrl: optionalHttpUrlSchema,
    reciprocalUrl: optionalHttpUrlSchema,
    message: optionalTextSchema,
    captchaToken: z.string().optional(),
})

export const friendLinkApplicationReviewSchema = z.object({
    status: z.nativeEnum(FriendLinkApplicationStatus),
    reviewNote: z.string().trim().max(1000, '审核备注过长').optional().nullable().or(z.literal('')),
    linkData: friendLinkSchema.partial().optional(),
})

export type FriendLinkCategoryInput = z.infer<typeof friendLinkCategorySchema>
export type FriendLinkInput = z.infer<typeof friendLinkSchema>
export type FriendLinkApplicationInput = z.infer<typeof friendLinkApplicationSchema>
export type FriendLinkApplicationReviewInput = z.infer<typeof friendLinkApplicationReviewSchema>
