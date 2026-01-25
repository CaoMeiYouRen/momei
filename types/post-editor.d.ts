import type { Post } from './post'

/**
 * 文章编辑器相关的数据结构
 */

/**
 * 分类选项接口
 */
export interface CategoryOption {
    id: string
    name: string
}

/**
 * 编辑器专用文章数据结构（表单数据）
 */
export interface PostEditorData extends Omit<Post, 'id' | 'tags' | 'category' | 'author'> {
    id?: string
    tags: string[]
}

/**
 * Markdown FrontMatter 解析接口
 */
export interface PostFrontMatter {
    title?: string
    slug?: string
    abbrlink?: string
    description?: string
    desc?: string
    image?: string
    cover?: string
    thumb?: string
    copyright?: string
    license?: string
    language?: string
    lang?: string
    tags?: string | string[]
    categories?: string | string[]
    category?: string | string[]
    audio?: string
    audio_url?: string
    audio_duration?: number
    audio_size?: number
    audio_mime_type?: string
}
