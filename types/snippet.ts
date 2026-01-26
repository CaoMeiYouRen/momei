/**
 * 灵感碎片状态枚举
 */
export enum SnippetStatus {
    /**
     * 收纳箱：待处理的原始灵感
     */
    INBOX = 'inbox',
    /**
     * 已转换：已转化为正式文章
     */
    CONVERTED = 'converted',
    /**
     * 已归档：不再处理但保留备查
     */
    ARCHIVED = 'archived',
}

/**
 * 灵感来源类型
 */
export type SnippetSource = 'web' | 'api' | 'pwa' | 'ios-shortcut' | 'extension' | 'cli' | string

/**
 * 灵感碎片接口
 */
export interface Snippet {
    id: string
    content: string
    media: string[] | null
    audioUrl: string | null
    audioTranscription: string | null
    source: SnippetSource
    metadata: Record<string, any> | null
    status: SnippetStatus
    postId: string | null
    authorId: string
    createdAt: string
    updatedAt: string
}
