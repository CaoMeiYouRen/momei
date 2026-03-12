import type { PostMetadata, PostVisibility } from './post'

export enum PostVersionSource {
    CREATE = 'create',
    EDIT = 'edit',
    RESTORE = 'restore',
    ROLLBACK_RECOVERY = 'rollback_recovery',
}

export enum PostVersionDiffField {
    TITLE = 'title',
    SUMMARY = 'summary',
    CONTENT = 'content',
    COVER_IMAGE = 'coverImage',
    CATEGORY_ID = 'categoryId',
    TAG_IDS = 'tagIds',
    VISIBILITY = 'visibility',
    COPYRIGHT = 'copyright',
    METADATA = 'metadata',
}

export interface PostVersionSnapshot {
    title: string
    content: string
    summary: string | null
    coverImage: string | null
    categoryId: string | null
    tagIds: string[]
    visibility: PostVisibility
    copyright: string | null
    metaVersion: number
    metadata: PostMetadata | null
    language: string
    translationId: string | null
}

export interface PostVersionAuthorSummary {
    id: string
    name: string
    image?: string | null
}

export interface PostVersionListItem {
    id: string
    postId: string
    sequence: number
    parentVersionId: string | null
    restoredFromVersionId: string | null
    source: PostVersionSource
    commitSummary: string
    changedFields: PostVersionDiffField[]
    snapshotHash: string
    createdAt: string
    authorId: string
    author: PostVersionAuthorSummary | null
}

export interface PostVersionDetail extends PostVersionListItem {
    snapshot: PostVersionSnapshot
}

export interface PostVersionDiffPart {
    value: string
    added?: boolean
    removed?: boolean
}

export interface PostVersionDiffItem {
    field: PostVersionDiffField
    kind: 'text' | 'scalar' | 'list' | 'json'
    changed: boolean
    oldValue: unknown
    newValue: unknown
    parts: PostVersionDiffPart[]
}

export interface PostVersionDiffPayload {
    currentVersion: PostVersionDetail
    compareVersion: PostVersionDetail | null
    compareTarget: 'parent' | 'current' | 'version'
    items: PostVersionDiffItem[]
}

export interface PostVersionRestoreResult {
    restored: boolean
    post: {
        id: string
        title: string
        content: string
        summary: string | null
        coverImage: string | null
        categoryId: string | null
        visibility: PostVisibility
        copyright: string | null
        metaVersion: number
        metadata: PostMetadata | null
        tags: string[]
    }
    version: PostVersionDetail
}
