import { createHash } from 'node:crypto'
import { PostVisibility, type PostMetadata } from '@/types/post'
import { PostVersionDiffField, type PostVersionSnapshot, type PostVersionSource } from '@/types/post-version'

export interface PostVersionSnapshotLike {
    title: string
    content: string
    summary?: string | null
    coverImage?: string | null
    categoryId?: string | null
    tags?: { id: string }[]
    tagIds?: string[]
    visibility?: PostVisibility | null
    copyright?: string | null
    metaVersion?: number | null
    metadata?: PostMetadata | null
    language?: string | null
    translationId?: string | null
}

function cloneMetadata(metadata: PostMetadata | null | undefined): PostMetadata | null {
    if (!metadata) {
        return null
    }

    return JSON.parse(JSON.stringify(metadata)) as PostMetadata
}

function stableStringify(value: unknown): string {
    if (value === null) {
        return 'null'
    }

    if (value === undefined) {
        return 'undefined'
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(',')}]`
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, entryValue]) => entryValue !== undefined)
            .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))

        return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`
    }

    return JSON.stringify(value)
}

function normalizeTagIds(input: PostVersionSnapshotLike): string[] {
    const sourceTagIds = input.tagIds || input.tags?.map((tag) => tag.id) || []
    return [...new Set(sourceTagIds.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

export function createSnapshotHash(snapshot: PostVersionSnapshot): string {
    return createHash('sha256').update(stableStringify(snapshot)).digest('hex')
}

export function buildPostVersionSnapshot(input: PostVersionSnapshotLike): PostVersionSnapshot {
    return {
        title: input.title,
        content: input.content,
        summary: input.summary ?? null,
        coverImage: input.coverImage ?? null,
        categoryId: input.categoryId ?? null,
        tagIds: normalizeTagIds(input),
        visibility: input.visibility ?? PostVisibility.PUBLIC,
        copyright: input.copyright ?? null,
        metaVersion: input.metaVersion || 1,
        metadata: cloneMetadata(input.metadata),
        language: input.language || 'zh-CN',
        translationId: input.translationId ?? null,
    }
}

export function buildLegacyPostVersionSnapshot(
    input: Pick<PostVersionSnapshotLike, 'title' | 'content' | 'summary'>,
    fallback?: Partial<PostVersionSnapshotLike> | null,
): PostVersionSnapshot {
    return buildPostVersionSnapshot({
        ...fallback,
        title: input.title,
        content: input.content,
        summary: input.summary ?? null,
    })
}

function serializeDiffValue(field: PostVersionDiffField, snapshot: PostVersionSnapshot | null): string {
    if (!snapshot) {
        return ''
    }

    switch (field) {
        case PostVersionDiffField.TITLE:
            return snapshot.title
        case PostVersionDiffField.SUMMARY:
            return snapshot.summary || ''
        case PostVersionDiffField.CONTENT:
            return snapshot.content
        case PostVersionDiffField.COVER_IMAGE:
            return snapshot.coverImage || ''
        case PostVersionDiffField.CATEGORY_ID:
            return snapshot.categoryId || ''
        case PostVersionDiffField.TAG_IDS:
            return snapshot.tagIds.join('\n')
        case PostVersionDiffField.VISIBILITY:
            return snapshot.visibility
        case PostVersionDiffField.COPYRIGHT:
            return snapshot.copyright || ''
        case PostVersionDiffField.METADATA:
            return JSON.stringify(snapshot.metadata ?? null, null, 2)
        default:
            return ''
    }
}

export function getChangedFields(compareSnapshot: PostVersionSnapshot | null, currentSnapshot: PostVersionSnapshot): PostVersionDiffField[] {
    const fields = Object.values(PostVersionDiffField)

    return fields.filter((field) => serializeDiffValue(field, compareSnapshot) !== serializeDiffValue(field, currentSnapshot))
}

export function buildCommitSummary(source: PostVersionSource, changedFields: PostVersionDiffField[]): string {
    const suffix = changedFields.length > 0 ? changedFields.join(',') : 'no_changes'
    return `${source}:${suffix}`
}
