import type { PostMetadata, PostStatus, PostVisibility } from './post'


export type TranslationScopeField = 'title' | 'content' | 'summary' | 'category' | 'tags' | 'coverImage' | 'audio'

export type TranslationTextField = Extract<TranslationScopeField, 'title' | 'content' | 'summary'>

export type PostTranslationTargetState = 'missing' | 'draft' | 'published'

export type PostTranslationWorkflowAction = 'create' | 'continue' | 'overwrite'

export interface PostTranslationTaxonomyItem {
    id: string
    name: string
    slug?: string | null
    translationId?: string | null
}

export interface PostTagBindingInput {
    name: string
    translationId?: string | null
    sourceTagSlug?: string | null
    sourceTagId?: string | null
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
    metadata?: PostMetadata | null
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null
    copyright?: string | null
    visibility?: PostVisibility
    views?: number
    category?: PostTranslationTaxonomyItem | null
    tags?: PostTranslationTaxonomyItem[] | null
}

export interface PostTranslationTargetStatus {
    language: string
    state: PostTranslationTargetState
    action: PostTranslationWorkflowAction
    postId?: string | null
    isCurrentEditor: boolean
}

export interface PostTranslationWorkflowRequest {
    sourcePostId: string
    sourceLanguage: string
    targetLanguage: string
    scopes: TranslationScopeField[]
    action: PostTranslationWorkflowAction
    targetState: PostTranslationTargetState
    targetPostId?: string | null
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
    language?: string
    slug?: string | null
    translationId?: string | null
    translations?: PostTranslationCategoryOption[] | null
}

export interface PostTranslationTagOption {
    id: string
    name: string
    slug?: string | null
    translationId?: string | null
}
