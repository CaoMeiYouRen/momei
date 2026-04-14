import { getCommercialPlatformIcon } from './commercial'
import { buildAbsoluteUrl } from './url'

export type SharePageKind = 'post' | 'category' | 'tag' | 'list' | 'page'
export type SharePlatformKey = 'x' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'email' | 'wechat_mp' | 'weibo' | 'xiaohongshu' | 'juejin' | 'bilibili' | 'zhihu'
export type SharePlatformMode = 'direct' | 'copy'
export type ShareCopyMode = 'link' | 'rich'

export interface SharePayload {
    pageKind: SharePageKind
    title: string
    text: string
    url: string
    image?: string | null
    locale: string
}

export interface SharePlatformDefinition {
    key: SharePlatformKey
    mode: SharePlatformMode
    copyMode?: ShareCopyMode
    icon: string
}

function sanitizeSharePath(path: string, allowedQueryKeys: readonly string[] = []) {
    const pathWithoutHash = path.split('#')[0] || '/'

    try {
        const url = new URL(pathWithoutHash, 'https://momei.app')
        const search = new URLSearchParams()

        allowedQueryKeys.forEach((key) => {
            url.searchParams.getAll(key).forEach((value) => {
                search.append(key, value)
            })
        })

        const query = search.toString()
        return `${url.pathname}${query ? `?${query}` : ''}`
    } catch {
        const pathname = pathWithoutHash.split('?')[0] || '/'
        return pathname || '/'
    }
}

export function buildShareCanonicalUrl(options: {
    siteUrl: string
    localePath: (path: string) => string
    pageKind: SharePageKind
    slug?: string | null
    id?: string | null
    path?: string | null
    allowedQueryKeys?: readonly string[]
}) {
    const explicitPath = options.path?.trim()
    const resolvedPath = explicitPath || (() => {
        switch (options.pageKind) {
            case 'post':
                return options.localePath(`/posts/${options.slug || options.id || ''}`)
            case 'category':
                return options.localePath(`/categories/${options.slug || ''}`)
            case 'tag':
                return options.localePath(`/tags/${options.slug || ''}`)
            case 'list':
                return options.localePath('/posts')
            case 'page':
            default:
                return options.localePath('/')
        }
    })()

    return buildAbsoluteUrl(options.siteUrl, sanitizeSharePath(resolvedPath, options.allowedQueryKeys || []))
}

export const DIRECT_SHARE_PLATFORMS: SharePlatformDefinition[] = [
    { key: 'x', mode: 'direct', icon: getCommercialPlatformIcon('x', 'social') },
    { key: 'facebook', mode: 'direct', icon: getCommercialPlatformIcon('facebook', 'social') },
    { key: 'linkedin', mode: 'direct', icon: getCommercialPlatformIcon('linkedin', 'social') },
    { key: 'telegram', mode: 'direct', icon: 'pi pi-send' },
    { key: 'whatsapp', mode: 'direct', icon: 'pi pi-comments' },
    { key: 'email', mode: 'direct', icon: 'pi pi-envelope' },
]

export const COPY_SHARE_PLATFORMS: SharePlatformDefinition[] = [
    { key: 'wechat_mp', mode: 'copy', copyMode: 'link', icon: getCommercialPlatformIcon('wechat_mp', 'social') },
    { key: 'weibo', mode: 'copy', copyMode: 'rich', icon: getCommercialPlatformIcon('weibo', 'social') },
    { key: 'xiaohongshu', mode: 'copy', copyMode: 'rich', icon: getCommercialPlatformIcon('xiaohongshu', 'social') },
    { key: 'juejin', mode: 'copy', copyMode: 'link', icon: getCommercialPlatformIcon('juejin', 'social') },
    { key: 'bilibili', mode: 'copy', copyMode: 'link', icon: getCommercialPlatformIcon('bilibili', 'social') },
    { key: 'zhihu', mode: 'copy', copyMode: 'link', icon: getCommercialPlatformIcon('zhihu', 'social') },
]

export function buildShareCopyText(payload: SharePayload, mode: ShareCopyMode = 'rich') {
    if (mode === 'link') {
        return payload.url
    }

    return [payload.title.trim(), payload.text.trim(), payload.url].filter(Boolean).join('\n\n')
}

export function buildDirectShareUrl(platform: SharePlatformKey, payload: SharePayload) {
    const encodedUrl = encodeURIComponent(payload.url)
    const encodedTitle = encodeURIComponent(payload.title)
    const encodedRichText = encodeURIComponent(buildShareCopyText(payload, 'rich'))
    const encodedShortText = encodeURIComponent([payload.title.trim(), payload.url].filter(Boolean).join(' '))

    switch (platform) {
        case 'x':
            return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        case 'telegram':
            return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
        case 'whatsapp':
            return `https://wa.me/?text=${encodedShortText}`
        case 'email':
            return `mailto:?subject=${encodedTitle}&body=${encodedRichText}`
        default:
            return payload.url
    }
}
