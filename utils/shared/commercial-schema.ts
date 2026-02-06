import { z } from 'zod'
import { isValidCustomUrl, validateUrl } from './validate'

/**
 * 社交链接校验 Schema
 */
export const SocialLinkSchema = z.object({
    platform: z.string().min(1),
    url: z.string().max(512).optional().or(z.literal('')).refine((val) => !val || validateUrl(val), {
        message: 'Invalid URL. Only http:// or https:// are allowed',
    }),
    image: z.string().max(512).optional().or(z.literal('')).refine((val) => !val || isValidCustomUrl(val), {
        message: 'Invalid Image URL or not in whitelist. Please use local upload or whitelisted domains.',
    }),
    label: z.string().max(50).optional(),
    locales: z.array(z.string()).optional(),
})

/**
 * 打赏链接校验 Schema
 */
export const DonationLinkSchema = z.object({
    platform: z.string().min(1),
    url: z.string().max(512).optional().or(z.literal('')).refine((val) => !val || validateUrl(val), {
        message: 'Invalid URL. Only http:// or https:// are allowed',
    }),
    image: z.string().max(512).optional().or(z.literal('')).refine((val) => !val || isValidCustomUrl(val), {
        message: 'Invalid Image URL or not in whitelist. Please use local upload or whitelisted domains.',
    }),
    label: z.string().max(50).optional(),
    locales: z.array(z.string()).optional(),
})

/**
 * 全局商业化配置校验 Schema
 */
export const CommercialConfigSchema = z.object({
    enabled: z.boolean().default(true),
    socialLinks: z.array(SocialLinkSchema).optional().default([]),
    donationLinks: z.array(DonationLinkSchema).default([]),
})

/**
 * 用户商业化配置校验 Schema (包含社交 + 打赏)
 */
export const UserCommercialConfigSchema = z.object({
    socialLinks: z.array(SocialLinkSchema).default([]),
    donationLinks: z.array(DonationLinkSchema).default([]),
})
