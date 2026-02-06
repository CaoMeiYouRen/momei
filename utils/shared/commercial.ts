/**
 * 社交平台定义
 */
export const SOCIAL_PLATFORMS = [
    { key: 'wechat_mp', icon: 'pi pi-comment', color: '#07c160' },
    { key: 'bilibili', icon: 'pi pi-play', color: '#fb7299' },
    { key: 'weibo', icon: 'pi pi-weibo', color: '#e6162d' },
    { key: 'zhihu', icon: 'pi pi-info-circle', color: '#0084ff' },
    { key: 'x', icon: 'pi pi-twitter', color: '#000000' },
    { key: 'youtube', icon: 'pi pi-youtube', color: '#ff0000' },
    { key: 'facebook', icon: 'pi pi-facebook', color: '#1877f2' },
    { key: 'github', icon: 'pi pi-github', color: '#333' },
    { key: 'custom', icon: 'pi pi-link', color: '#666' },
]

/**
 * 打赏平台定义
 */
export const DONATION_PLATFORMS = [
    { key: 'wechat_pay', icon: 'pi pi-comment', color: '#07c160', type: 'image' },
    { key: 'alipay', icon: 'pi pi-wallet', color: '#1677ff', type: 'image' },
    { key: 'afdian', icon: 'pi pi-heart-fill', color: '#8a2be2', type: 'url' },
    { key: 'github_sponsors', icon: 'pi pi-github', color: '#333', type: 'url' },
    { key: 'opencollective', icon: 'pi pi-users', color: '#7fadf2', type: 'url' },
    { key: 'patreon', icon: 'pi pi-patreon', color: '#f96854', type: 'url' },
    { key: 'buymeacoffee', icon: 'pi pi-coffee', color: '#ffdd00', type: 'url' },
    { key: 'paypal', icon: 'pi pi-paypal', color: '#003087', type: 'url' },
    { key: 'custom', icon: 'pi pi-link', color: '#666', type: 'both' },
]

export interface SocialLink {
    platform: string
    url: string
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
    donationLinks: DonationLink[]
    enabled: boolean
}
