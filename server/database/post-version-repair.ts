import { In, type DataSource } from 'typeorm'
import { Post } from '@/server/entities/post'
import { PostVersion } from '@/server/entities/post-version'
import logger from '@/server/utils/logger'
import {
    buildCommitSummary,
    buildLegacyPostVersionSnapshot,
    createSnapshotHash,
    getChangedFields,
    type PostVersionSnapshotLike,
} from '@/server/utils/post-version-snapshot'
import { PostVersionSource, type PostVersionSnapshot } from '@/types/post-version'

type PostVersionWithNullableFields = PostVersion & {
    sequence?: number | null
    commitSummary?: string | null
    changedFields?: typeof PostVersion.prototype.changedFields | null
    snapshotHash?: string | null
    snapshot?: PostVersionSnapshot | null
}

function sortVersions(left: PostVersion, right: PostVersion) {
    const leftTime = new Date(left.createdAt).getTime()
    const rightTime = new Date(right.createdAt).getTime()

    if (leftTime !== rightTime) {
        return leftTime - rightTime
    }

    return left.id.localeCompare(right.id)
}

function groupByPostId(versions: PostVersion[]) {
    return versions.reduce<Record<string, PostVersion[]>>((groups, version) => {
        let postVersions = groups[version.postId]
        if (!postVersions) {
            postVersions = []
            groups[version.postId] = postVersions
        }

        postVersions.push(version)
        return groups
    }, {})
}

export function normalizePostVersionChain(versions: PostVersion[], postFallback?: Partial<PostVersionSnapshotLike> | null) {
    const sortedVersions = [...versions].sort(sortVersions)
    let previousSnapshot: PostVersionSnapshot | null = null

    return sortedVersions.map((version, index) => {
        const snapshot = (version as PostVersionWithNullableFields).snapshot
            || buildLegacyPostVersionSnapshot(version, postFallback)
        const source = version.source || PostVersionSource.EDIT
        const changedFields = getChangedFields(previousSnapshot, snapshot)
        const previousVersion = index > 0 ? sortedVersions[index - 1] : null

        version.sequence = index + 1
        version.parentVersionId = previousVersion?.id || null
        version.source = source
        version.commitSummary = buildCommitSummary(source, changedFields)
        version.changedFields = changedFields
        version.snapshot = snapshot
        version.snapshotHash = createSnapshotHash(snapshot)

        previousSnapshot = snapshot
        return version
    })
}

export async function repairLegacyPostVersionRecords(dataSource: DataSource) {
    const versionRepo = dataSource.getRepository(PostVersion)

    const legacyPostRows = await versionRepo
        .createQueryBuilder('version')
        .select('version.postId', 'postId')
        .where('version.sequence IS NULL')
        .orWhere('version.commitSummary IS NULL')
        .orWhere('version.changedFields IS NULL')
        .orWhere('version.snapshotHash IS NULL')
        .orWhere('version.snapshot IS NULL')
        .getRawMany<{ postId: string }>()

    const postIds = [...new Set(legacyPostRows.map((row) => row.postId).filter(Boolean))]

    if (postIds.length === 0) {
        return
    }

    const [posts, versions] = await Promise.all([
        dataSource.getRepository(Post).find({
            where: { id: In(postIds) },
            relations: ['tags'],
        }),
        versionRepo.find({
            where: { postId: In(postIds) },
        }),
    ])

    const postMap = new Map(posts.map((post) => [post.id, post]))
    const versionsByPost = groupByPostId(versions)
    const normalizedVersions = Object.entries(versionsByPost).flatMap(([postId, postVersions]) => {
        const post = postMap.get(postId)

        return normalizePostVersionChain(postVersions, post
            ? {
                coverImage: post.coverImage,
                categoryId: post.categoryId,
                tags: post.tags,
                visibility: post.visibility,
                copyright: post.copyright,
                metaVersion: post.metaVersion,
                metadata: post.metadata,
                language: post.language,
                translationId: post.translationId,
            }
            : null)
    })

    await versionRepo.save(normalizedVersions)

    logger.info(`Repaired ${normalizedVersions.length} legacy post version records across ${postIds.length} posts`)
}
