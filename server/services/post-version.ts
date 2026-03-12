import { diffLines } from 'diff'
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostVersion } from '@/server/entities/post-version'
import { Tag } from '@/server/entities/tag'
import logger from '@/server/utils/logger'
import {
    buildCommitSummary,
    buildLegacyPostVersionSnapshot,
    buildPostVersionSnapshot,
    createSnapshotHash,
    getChangedFields,
} from '@/server/utils/post-version-snapshot'
import {
    PostVersionDiffField,
    PostVersionSource,
    type PostVersionDetail,
    type PostVersionDiffItem,
    type PostVersionDiffPayload,
    type PostVersionListItem,
    type PostVersionRestoreResult,
    type PostVersionSnapshot,
} from '@/types/post-version'

export interface PostVersionAuditContext {
    ipAddress?: string | null
    userAgent?: string | null
}

export interface PostVersionActor {
    currentUserId: string
    isAdmin: boolean
}

interface RecordPostVersionOptions {
    source: PostVersionSource
    restoredFromVersionId?: string | null
    auditContext?: PostVersionAuditContext
}

type DiffKind = 'text' | 'scalar' | 'list' | 'json'

interface DiffFieldDefinition {
    field: PostVersionDiffField
    kind: DiffKind
    getValue: (snapshot: PostVersionSnapshot) => unknown
}

const postVersionDiffFields: DiffFieldDefinition[] = [
    {
        field: PostVersionDiffField.TITLE,
        kind: 'text',
        getValue: (snapshot) => snapshot.title,
    },
    {
        field: PostVersionDiffField.SUMMARY,
        kind: 'text',
        getValue: (snapshot) => snapshot.summary,
    },
    {
        field: PostVersionDiffField.CONTENT,
        kind: 'text',
        getValue: (snapshot) => snapshot.content,
    },
    {
        field: PostVersionDiffField.COVER_IMAGE,
        kind: 'scalar',
        getValue: (snapshot) => snapshot.coverImage,
    },
    {
        field: PostVersionDiffField.CATEGORY_ID,
        kind: 'scalar',
        getValue: (snapshot) => snapshot.categoryId,
    },
    {
        field: PostVersionDiffField.TAG_IDS,
        kind: 'list',
        getValue: (snapshot) => snapshot.tagIds,
    },
    {
        field: PostVersionDiffField.VISIBILITY,
        kind: 'scalar',
        getValue: (snapshot) => snapshot.visibility,
    },
    {
        field: PostVersionDiffField.COPYRIGHT,
        kind: 'text',
        getValue: (snapshot) => snapshot.copyright,
    },
    {
        field: PostVersionDiffField.METADATA,
        kind: 'json',
        getValue: (snapshot) => snapshot.metadata,
    },
]

function serializeDiffValue(kind: DiffKind, value: unknown): string {
    if (kind === 'json') {
        return JSON.stringify(value ?? null, null, 2)
    }

    if (kind === 'list') {
        return Array.isArray(value) ? value.join('\n') : ''
    }

    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return value.toString()
    }

    return JSON.stringify(value)
}

function buildDiffItem(field: DiffFieldDefinition, currentSnapshot: PostVersionSnapshot, compareSnapshot: PostVersionSnapshot | null): PostVersionDiffItem {
    const currentValue = field.getValue(currentSnapshot)
    const compareValue = compareSnapshot ? field.getValue(compareSnapshot) : null
    const currentSerialized = serializeDiffValue(field.kind, currentValue)
    const compareSerialized = serializeDiffValue(field.kind, compareValue)
    const changed = currentSerialized !== compareSerialized

    return {
        field: field.field,
        kind: field.kind,
        changed,
        oldValue: compareValue,
        newValue: currentValue,
        parts: changed
            ? diffLines(compareSerialized, currentSerialized).map((part) => ({
                value: part.value,
                added: part.added,
                removed: part.removed,
            }))
            : [{ value: currentSerialized }],
    }
}

function mapVersionItem(version: PostVersion): PostVersionListItem {
    const changedFields = version.changedFields || []
    const source = version.source || PostVersionSource.EDIT

    return {
        id: version.id,
        postId: version.postId,
        sequence: version.sequence || 0,
        parentVersionId: version.parentVersionId ?? null,
        restoredFromVersionId: version.restoredFromVersionId ?? null,
        source,
        commitSummary: version.commitSummary || buildCommitSummary(source, changedFields),
        changedFields,
        snapshotHash: version.snapshotHash || '',
        createdAt: version.createdAt instanceof Date ? version.createdAt.toISOString() : String(version.createdAt),
        authorId: version.authorId,
        author: version.author
            ? {
                id: version.author.id,
                name: version.author.name,
                image: version.author.image,
            }
            : null,
    }
}

function mapVersionDetail(version: PostVersion): PostVersionDetail {
    return {
        ...mapVersionItem(version),
        snapshot: version.snapshot || buildLegacyPostVersionSnapshot(version),
    }
}

async function getPostWithAccess(postId: string, actor: PostVersionActor, includeTags = false): Promise<Post> {
    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id: postId },
        relations: includeTags ? ['tags'] : undefined,
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (!actor.isAdmin && post.authorId !== actor.currentUserId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return post
}

async function getVersionEntity(postId: string, versionId: string): Promise<PostVersion> {
    const versionRepo = dataSource.getRepository(PostVersion)
    const version = await versionRepo.findOne({
        where: { id: versionId, postId },
        relations: ['author'],
    })

    if (!version) {
        throw createError({ statusCode: 404, statusMessage: 'Version not found' })
    }

    return version
}

async function getLatestVersion(postId: string): Promise<PostVersion | null> {
    const versionRepo = dataSource.getRepository(PostVersion)
    return versionRepo.findOne({
        where: { postId },
        order: { sequence: 'DESC' },
        relations: ['author'],
    })
}

function mapRestoredPost(post: Post) {
    return {
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary ?? null,
        coverImage: post.coverImage ?? null,
        categoryId: post.categoryId ?? null,
        visibility: post.visibility,
        copyright: post.copyright ?? null,
        metaVersion: post.metaVersion || 1,
        metadata: post.metadata ? JSON.parse(JSON.stringify(post.metadata)) : null,
        tags: (post.tags || []).map((tag) => tag.name),
    }
}

export async function recordPostVersionCommit(post: Post, authorId: string, options: RecordPostVersionOptions) {
    const versionRepo = dataSource.getRepository(PostVersion)
    const latestVersion = await versionRepo.findOne({
        where: { postId: post.id },
        order: { sequence: 'DESC' },
    })
    const snapshot = buildPostVersionSnapshot(post)
    const snapshotHash = createSnapshotHash(snapshot)

    if (latestVersion?.snapshotHash === snapshotHash) {
        const hydratedLatest = await versionRepo.findOne({
            where: { id: latestVersion.id, postId: post.id },
            relations: ['author'],
        })
        return {
            created: false,
            version: hydratedLatest || latestVersion,
        }
    }

    const previousSnapshot = latestVersion?.snapshot ?? null
    const changedFields = getChangedFields(previousSnapshot, snapshot)

    const version = new PostVersion()
    version.postId = post.id
    version.sequence = (latestVersion?.sequence || 0) + 1
    version.parentVersionId = latestVersion?.id ?? null
    version.restoredFromVersionId = options.restoredFromVersionId ?? null
    version.source = options.source
    version.commitSummary = buildCommitSummary(options.source, changedFields)
    version.changedFields = changedFields
    version.snapshotHash = snapshotHash
    version.snapshot = snapshot
    version.title = snapshot.title
    version.content = snapshot.content
    version.summary = snapshot.summary
    version.authorId = authorId
    version.ipAddress = options.auditContext?.ipAddress ?? null
    version.userAgent = options.auditContext?.userAgent ?? null

    const savedVersion = await versionRepo.save(version)
    const hydratedVersion = await versionRepo.findOne({
        where: { id: savedVersion.id, postId: post.id },
        relations: ['author'],
    })

    return {
        created: true,
        version: hydratedVersion || savedVersion,
    }
}

export async function getPostVersionsService(postId: string, actor: PostVersionActor): Promise<PostVersionListItem[]> {
    await getPostWithAccess(postId, actor)

    const versionRepo = dataSource.getRepository(PostVersion)
    const versions = await versionRepo.find({
        where: { postId },
        order: { sequence: 'DESC' },
        relations: ['author'],
    })

    return versions.map(mapVersionItem)
}

export async function getPostVersionDetailService(postId: string, versionId: string, actor: PostVersionActor): Promise<PostVersionDetail> {
    await getPostWithAccess(postId, actor)
    const version = await getVersionEntity(postId, versionId)
    return mapVersionDetail(version)
}

export async function getPostVersionDiffService(
    postId: string,
    versionId: string,
    actor: PostVersionActor,
    options: { compareToVersionId?: string | null, compareToCurrent?: boolean } = {},
): Promise<PostVersionDiffPayload> {
    const post = await getPostWithAccess(postId, actor, true)
    const currentVersion = await getVersionEntity(postId, versionId)

    let compareVersion: PostVersion | null = null
    let compareSnapshot: PostVersionSnapshot | null = null
    let compareTarget: 'parent' | 'current' | 'version' = 'parent'

    if (options.compareToCurrent) {
        compareSnapshot = buildPostVersionSnapshot(post)
        compareTarget = 'current'
    } else if (options.compareToVersionId) {
        compareVersion = await getVersionEntity(postId, options.compareToVersionId)
        compareSnapshot = compareVersion.snapshot
        compareTarget = 'version'
    } else if (currentVersion.parentVersionId) {
        compareVersion = await getVersionEntity(postId, currentVersion.parentVersionId)
        compareSnapshot = compareVersion.snapshot
    } else {
        compareSnapshot = buildPostVersionSnapshot(post)
        compareTarget = 'current'
    }

    return {
        currentVersion: mapVersionDetail(currentVersion),
        compareVersion: compareVersion ? mapVersionDetail(compareVersion) : null,
        compareTarget,
        items: postVersionDiffFields.map((field) => buildDiffItem(field, currentVersion.snapshot, compareSnapshot)),
    }
}

export async function restorePostVersionService(
    postId: string,
    versionId: string,
    actor: PostVersionActor,
    auditContext?: PostVersionAuditContext,
): Promise<PostVersionRestoreResult> {
    const post = await getPostWithAccess(postId, actor, true)
    const targetVersion = await getVersionEntity(postId, versionId)
    const latestVersion = await getLatestVersion(postId)

    if (latestVersion?.snapshotHash === targetVersion.snapshotHash) {
        return {
            restored: false,
            post: mapRestoredPost(post),
            version: mapVersionDetail(latestVersion),
        }
    }

    const tagRepo = dataSource.getRepository(Tag)
    const restoredTags = targetVersion.snapshot.tagIds.length > 0
        ? await tagRepo.findBy({ id: In(targetVersion.snapshot.tagIds) })
        : []
    const restoredTagMap = new Map(restoredTags.map((tag) => [tag.id, tag]))

    post.title = targetVersion.snapshot.title
    post.content = targetVersion.snapshot.content
    post.summary = targetVersion.snapshot.summary
    post.coverImage = targetVersion.snapshot.coverImage
    post.categoryId = targetVersion.snapshot.categoryId
    post.visibility = targetVersion.snapshot.visibility
    post.copyright = targetVersion.snapshot.copyright
    post.metaVersion = targetVersion.snapshot.metaVersion
    post.metadata = targetVersion.snapshot.metadata ? JSON.parse(JSON.stringify(targetVersion.snapshot.metadata)) : null
    post.tags = targetVersion.snapshot.tagIds
        .map((tagId) => restoredTagMap.get(tagId))
        .filter((tag): tag is Tag => Boolean(tag))

    const missingTagCount = targetVersion.snapshot.tagIds.length - post.tags.length
    if (missingTagCount > 0) {
        logger.warn('Restoring post version skipped missing tags', {
            postId,
            versionId,
            missingTagCount,
        })
    }

    const postRepo = dataSource.getRepository(Post)
    await postRepo.save(post)

    const result = await recordPostVersionCommit(post, actor.currentUserId, {
        source: PostVersionSource.RESTORE,
        restoredFromVersionId: versionId,
        auditContext,
    })

    return {
        restored: result.created,
        post: mapRestoredPost(post),
        version: mapVersionDetail(result.version),
    }
}

export async function deletePostVersionService(postId: string, actor: PostVersionActor) {
    await getPostWithAccess(postId, actor)
    throw createError({
        statusCode: 409,
        statusMessage: 'Version history is immutable',
    })
}
