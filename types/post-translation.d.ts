import type { PostStatus, PostVisibility } from './post'


export type TranslationScopeField = 'title' | 'content' | 'summary' | 'category' | 'tags'

export type TranslationTextField = Extract<TranslationScopeField, 'title' | 'content' | 'summary'>

export interface PostTranslationTaxonomyItem {
    id: string
    name: string
    translationId?: string | null
}

export interface PostTranslationSourceOption {
    id: string
    title: string
    language: string
    translationId?: string | null
    status?: PostStatus | string
}

export interface PostTranslationSourceDetail extends PostTranslationSourceOption {
    content: string
    summary?: string | null
    slug?: string
    coverImage?: string | null
    copyright?: string | null
    visibility?: PostVisibility
    views?: number
    category?: PostTranslationTaxonomyItem | null
    tags?: PostTranslationTaxonomyItem[] | null
}

export interface PostTranslationWorkflowRequest {
    sourcePostId: string
    sourceLanguage: string
    targetLanguage: string
    scopes: TranslationScopeField[]
}

export interface PostTranslationProgress {
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    activeField: TranslationTextField | null
    taskId: string | null
    error: string | null
}

export interface PostTranslationCategoryOption {
    id: string
    name: string
    translationId?: string | null
}

export interface PostTranslationTagOption {
    id: string
    name: string
    translationId?: string | null
}
