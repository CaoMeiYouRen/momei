import type { Component } from 'vue'
import { Heart, Link as LinkIcon } from '@lucide/vue'
import { BRAND_ICONS, createClassIcon, rawIcon } from './brand-icons'

/**
 * 社交平台定义
 */
export type CommercialPlatformKind = 'social' | 'donation'
export type CommercialPlatformType = 'url' | 'image' | 'both'

interface CommercialPlatformDefinition {
    key: string
    icon: Component
    color: string
    type?: CommercialPlatformType
}

export const SOCIAL_PLATFORMS: CommercialPlatformDefinition[] = [
    { key: 'wechat_mp', icon: createClassIcon('iconfont icon-weixingongzhonghao'), color: '#07c160', type: 'both' },
    { key: 'juejin', icon: createClassIcon('iconfont icon-juejin'), color: '#1e80ff', type: 'url' },
    { key: 'xiaohongshu', icon: createClassIcon('iconfont icon-xiaohongshu'), color: '#ff2442', type: 'both' },
    { key: 'douyin', icon: BRAND_ICONS.tiktok, color: '#111111', type: 'both' },
    { key: 'bilibili', icon: createClassIcon('iconfont icon-bilibili'), color: '#00aeec', type: 'url' },
    { key: 'weibo', icon: createClassIcon('iconfont icon-weibo'), color: '#e6162d', type: 'url' },
    { key: 'zhihu', icon: createClassIcon('iconfont icon-zhihu'), color: '#0084ff', type: 'url' },
    { key: 'stack_overflow', icon: createClassIcon('mdi mdi-stack-overflow'), color: '#f48024', type: 'url' },
    { key: 'x', icon: BRAND_ICONS.twitter, color: '#000000', type: 'url' },
    { key: 'youtube', icon: BRAND_ICONS.youtube, color: '#ff0000', type: 'url' },
    { key: 'instagram', icon: BRAND_ICONS.instagram, color: '#e4405f', type: 'url' },
    { key: 'linkedin', icon: BRAND_ICONS.linkedin, color: '#0a66c2', type: 'url' },
    { key: 'twitch', icon: BRAND_ICONS.twitch, color: '#9146ff', type: 'url' },
    { key: 'facebook', icon: BRAND_ICONS.facebook, color: '#1877f2', type: 'url' },
    { key: 'github', icon: BRAND_ICONS.github, color: '#181717', type: 'url' },
    { key: 'discord', icon: BRAND_ICONS.discord, color: '#5865f2', type: 'url' },
    { key: 'custom', icon: rawIcon(LinkIcon), color: '#666666', type: 'both' },
]

/**
 * 打赏平台定义
 */
export const DONATION_PLATFORMS: CommercialPlatformDefinition[] = [
    { key: 'wechat_pay', icon: createClassIcon('iconfont icon-weixinzhifu'), color: '#07c160', type: 'image' },
    { key: 'alipay', icon: createClassIcon('iconfont icon-zhifubaozhifu'), color: '#1677ff', type: 'image' },
    { key: 'paypal', icon: BRAND_ICONS.paypal, color: '#003087', type: 'url' },
    { key: 'afdian', icon: createClassIcon('iconfont icon-aifadian'), color: '#946ce6', type: 'url' },
    { key: 'github_sponsors', icon: rawIcon(Heart), color: '#ea4aaa', type: 'url' },
    { key: 'opencollective', icon: createClassIcon('iconfont icon-open-collective'), color: '#3385ff', type: 'url' },
    { key: 'patreon', icon: createClassIcon('mdi mdi-patreon'), color: '#ff424d', type: 'url' },
    { key: 'buymeacoffee', icon: createClassIcon('iconfont icon-a-BuyMeACoffee'), color: '#ffdd00', type: 'url' },
    { key: 'ko_fi', icon: createClassIcon('iconfont icon-ko-fi'), color: '#29abe0', type: 'url' },
    { key: 'liberapay', icon: createClassIcon('iconfont icon-liberapay'), color: '#f6c915', type: 'url' },
    { key: 'custom', icon: rawIcon(LinkIcon), color: '#666666', type: 'both' },
]

function findCommercialPlatform(key: string, type: CommercialPlatformKind): CommercialPlatformDefinition | undefined {
    const list = type === 'social' ? SOCIAL_PLATFORMS : DONATION_PLATFORMS
    return list.find((platform) => platform.key === key)
}

export function getCommercialPlatformIcon(key: string, type: CommercialPlatformKind): Component {
    return findCommercialPlatform(key, type)?.icon || rawIcon(LinkIcon)
}

export function getCommercialPlatformColor(key: string, type: CommercialPlatformKind): string {
    return findCommercialPlatform(key, type)?.color || 'inherit'
}

export function getSocialPlatformType(key: string): CommercialPlatformType {
    return findCommercialPlatform(key, 'social')?.type || 'url'
}

export function getDonationPlatformType(key: string): CommercialPlatformType {
    return findCommercialPlatform(key, 'donation')?.type || 'url'
}

export function filterCommercialLinksByLocale<T extends { locales?: string[] }>(
    links: readonly T[] | null | undefined,
    locale: string,
): T[] {
    if (!Array.isArray(links)) {
        return []
    }

    return links.filter((link) => !link.locales || link.locales.length === 0 || link.locales.includes(locale))
}

export interface SocialLink {
    platform: string
    url: string
    image?: string // 针对微信公众号等需要展示二维码的平台
    label?: string
    locales?: string[] // 为空代表全语种显示
}

export interface DonationLink {
    platform: string
    url?: string
    image?: string
    label?: string
    locales?: string[] // 为空代表全语种显示
}

/**
 * 商业化配置/打赏配置 (全局)
 */
export interface CommercialConfig {
    socialLinks?: SocialLink[]
    donationLinks: DonationLink[]
    enabled: boolean
}
