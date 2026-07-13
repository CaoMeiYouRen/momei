import { SOCIAL_PLATFORMS } from './commercial'

export interface SocialPostPlatformConfig {
    key: string
    /** 平台名称 i18n key（common.platforms.{key}） */
    i18nKey: string
    icon: string
    color: string
    /** 最大字符数 */
    maxLength: number
    /** 平台描述（给 AI 的提示） */
    promptGuideline: string
}

/** 由 SOCIAL_PLATFORMS 构建的 key→{ icon, color } 查找映射，避免 find + 非空断言 */
const SOCIAL_PLATFORM_LOOKUP = new Map(
    SOCIAL_PLATFORMS.map((p) => [p.key, { icon: p.icon, color: p.color }] as const),
)

function getSocialPlatformLookup(key: string): { icon: string; color: string } {
    const entry = SOCIAL_PLATFORM_LOOKUP.get(key)
    if (!entry) {
        // 兜底：不应发生，仅防御性处理
        return { icon: '', color: '#000000' }
    }
    return entry
}

/**
 * AI 内容多格式复用支持的平台列表。
 * 复用 commercial.ts 中已有的平台图标/颜色，叠加各平台的 prompt 参数。
 */
export const SOCIAL_POST_PLATFORMS: SocialPostPlatformConfig[] = [
    {
        key: 'juejin',
        i18nKey: 'common.platforms.juejin',
        ...getSocialPlatformLookup('juejin'),
        maxLength: 2000,
        promptGuideline: 'Create a Juejin (掘金) text post (called "沸点" Boiling Point). Keep under 300 characters. Use 1-2 relevant tags with # prefix. Tone should be casual and tech-savvy. Start with an engaging hook.',
    },
    {
        key: 'weibo',
        i18nKey: 'common.platforms.weibo',
        ...getSocialPlatformLookup('weibo'),
        maxLength: 2000,
        promptGuideline: 'Create a Weibo (微博) post. Keep under 140 characters for optimal display (Chinese characters count). Use #话题# format for 1-2 trending topics. Start with a compelling one-liner. Include emoji for visual appeal if appropriate.',
    },
    {
        key: 'xiaohongshu',
        i18nKey: 'common.platforms.xiaohongshu',
        ...getSocialPlatformLookup('xiaohongshu'),
        maxLength: 1000,
        promptGuideline: 'Create a Xiaohongshu (小红书) post. Use 3-5 short paragraphs with line breaks between them. Add 3-5 relevant hashtags at the end with # prefix. Tone should be warm, personal, and helpful. Start with an attention-grabbing opening.',
    },
    {
        key: 'zhihu',
        i18nKey: 'common.platforms.zhihu',
        ...getSocialPlatformLookup('zhihu'),
        maxLength: 3000,
        promptGuideline: 'Create a Zhihu (知乎) idea post (called "想法"). Keep under 200 characters. Use a thought-provoking question or bold statement format. Include 1-2 relevant topic tags. Tone should be intellectual and insightful.',
    },
    {
        key: 'bilibili',
        i18nKey: 'common.platforms.bilibili',
        ...getSocialPlatformLookup('bilibili'),
        maxLength: 2000,
        promptGuideline: 'Create a Bilibili (哔哩哔哩) dynamic post. Keep under 500 characters. Use a casual, fun tone with 1-2 relevant #tags. Add an engaging question or call-to-action at the end to encourage comments. Bilibili audience expects humor and authenticity.',
    },
    {
        key: 'twitter',
        i18nKey: 'common.platforms.x',
        icon: 'pi pi-twitter',
        color: '#000000',
        maxLength: 1500,
        promptGuideline: 'Create a Twitter/X thread (2-4 tweets). Each tweet is separated by "---". Keep each tweet under 280 characters. Use hashtags sparingly (1-2 max). Start with a strong hook tweet.',
    },
    {
        key: 'linkedin',
        i18nKey: 'common.platforms.linkedin',
        icon: 'pi pi-linkedin',
        color: '#0a66c2',
        maxLength: 3000,
        promptGuideline: 'Create a LinkedIn post. Use 3-5 short paragraphs with line breaks. Professional tone, include 2-3 relevant hashtags at the end. Start with a compelling opening line, end with a question or call to action.',
    },
]

export function getSocialPostPlatform(key: string): SocialPostPlatformConfig | undefined {
    return SOCIAL_POST_PLATFORMS.find((p) => p.key === key)
}
