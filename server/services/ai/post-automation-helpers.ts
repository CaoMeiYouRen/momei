import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { createPostService } from '@/server/services/post'
import { TextService } from '@/server/services/ai/text'
import { createPostTagBinding } from '@/utils/shared/post-tag-bindings'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { PostTagBindingInput, PostTranslationSourceDetail, TranslationScopeField, TranslationTextField } from '@/types/post-translation'
import { PostStatus, type PostMetadata } from '@/types/post'

const DEFAULT_TRANSLATION_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags', 'coverImage', 'audio']

export interface TranslationUsageAggregate {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    requestCount: number
    textChars: number
    outputChars: number
}

export interface TranslatePostTaskPayload {
    sourcePostId: string
    targetLanguage: string
    sourceLanguage?: string
    targetPostId?: string | null
    scopes?: TranslationScopeField[]
    targetStatus?: PostStatus.DRAFT | PostStatus.PENDING
    slugStrategy?: 'source' | 'translate' | 'ai'
    categoryStrategy?: 'cluster' | 'suggest'
    confirmationMode?: 'auto' | 'require' | 'confirmed'
    previewTaskId?: string
    approvedSlug?: string | null
    approvedCategoryId?: string | null
}

export interface PostCategorySuggestionCandidate {
    id: string
    name: string
    slug: string
    language: string
    reason: 'translation-cluster' | 'translated-name' | 'translated-slug' | 'ai-recommended'
}

export interface PostCategoryRecommendationResult {
    sourceCategory: {
        id: string
        name: string
        slug: string
        language: string
    } | null
    matchedCategoryId: string | null
    candidates: PostCategorySuggestionCandidate[]
    proposedCategory: {
        name: string
        slug: string
        reason: 'translated-source-name'
    } | null
}

type CreatePostMetadataInput = Parameters<typeof createPostService>[0]['metadata']
type SourcePostIntegrationMetadata = NonNullable<PostMetadata['integration']>
type SourcePostDistributionMetadata = NonNullable<SourcePostIntegrationMetadata['distribution']>
type SourcePostDistributionChannelState = NonNullable<NonNullable<SourcePostDistributionMetadata['channels']>['memos']>
type SourcePostDistributionTimelineEntry = NonNullable<SourcePostDistributionMetadata['timeline']>[number]
type NormalizedPostMetadata = NonNullable<CreatePostMetadataInput>
type NormalizedPostIntegrationMetadata = NonNullable<NormalizedPostMetadata['integration']>
type NormalizedPostDistributionMetadata = NonNullable<NormalizedPostIntegrationMetadata['distribution']>
type NormalizedPostDistributionChannelState = NonNullable<NonNullable<NormalizedPostDistributionMetadata['channels']>['memos']>
type NormalizedPostDistributionTimelineEntry = NonNullable<NormalizedPostDistributionMetadata['timeline']>[number]

export function createUsageAggregate(): TranslationUsageAggregate {
    return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        textChars: 0,
        outputChars: 0,
    }
}

export function normalizeScopes(scopes?: TranslationScopeField[]) {
    const nextScopes = scopes?.filter((scope) => DEFAULT_TRANSLATION_SCOPES.includes(scope)) || DEFAULT_TRANSLATION_SCOPES
    return Array.from(new Set(nextScopes))
}

export function normalizeSlugStrategy(strategy?: 'source' | 'translate' | 'ai') {
    return strategy || 'source'
}

export function normalizeCategoryStrategy(strategy?: 'cluster' | 'suggest') {
    return strategy || 'cluster'
}

export function normalizeConfirmationMode(mode?: 'auto' | 'require' | 'confirmed') {
    return mode || 'auto'
}

export function sanitizeSlug(value?: string | null) {
    const normalized = value
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')

    return normalized || 'translated-post'
}

export function parseTaskPayload(task: Pick<AITask, 'payload'>): TranslatePostTaskPayload {
    if (!task.payload) {
        throw new Error('Task payload is required')
    }

    if (typeof task.payload === 'string') {
        return JSON.parse(task.payload) as TranslatePostTaskPayload
    }

    return task.payload as unknown as TranslatePostTaskPayload
}

export function parseTaskResult<T>(result: string | null | undefined): T | null {
    if (!result) {
        return null
    }

    if (typeof result === 'string') {
        return JSON.parse(result) as T
    }

    return result as T
}

export function mergeAudioMetadata(source: PostTranslationSourceDetail): PostMetadata | null {
    const metadata = source.metadata && typeof source.metadata === 'object'
        ? { ...source.metadata }
        : {}

    let audio: PostMetadata['audio'] | null = null

    if (source.metadata?.audio && typeof source.metadata.audio === 'object') {
        audio = { ...source.metadata.audio }
    } else if (source.audioUrl) {
        audio = {
            url: source.audioUrl,
            duration: source.audioDuration ?? null,
            size: source.audioSize ?? null,
            mimeType: source.audioMimeType ?? null,
        }
    }

    if (audio) {
        metadata.audio = audio
    } else {
        delete metadata.audio
    }

    return Object.keys(metadata).length > 0 ? metadata : null
}

export function normalizeMetadataForPostInput(metadata: PostMetadata | null | undefined): CreatePostMetadataInput {
    if (!metadata) {
        return metadata
    }

    const normalizeMetadataDateField = (value: string | Date | null | undefined) => {
        if (typeof value === 'string') {
            return new Date(value)
        }

        return value
    }

    const normalizeDistributionChannelState = (
        state: SourcePostDistributionChannelState | null | undefined,
    ): NormalizedPostDistributionChannelState | null | undefined => {
        if (!state) {
            return state
        }

        return {
            status: state.status,
            remoteId: state.remoteId,
            remoteUrl: state.remoteUrl,
            lastMode: state.lastMode,
            lastAction: state.lastAction,
            lastAttemptId: state.lastAttemptId,
            activeAttemptId: state.activeAttemptId,
            lastAttemptAt: normalizeMetadataDateField(state.lastAttemptAt),
            activeSince: normalizeMetadataDateField(state.activeSince),
            lastSuccessAt: normalizeMetadataDateField(state.lastSuccessAt),
            lastFailureAt: normalizeMetadataDateField(state.lastFailureAt),
            lastFinishedAt: normalizeMetadataDateField(state.lastFinishedAt),
            lastFailureReason: state.lastFailureReason,
            lastMessage: state.lastMessage,
            lastOperatorId: state.lastOperatorId,
            retryCount: state.retryCount,
        }
    }

    const normalizeDistributionTimelineEntry = (
        entry: SourcePostDistributionTimelineEntry,
    ): NormalizedPostDistributionTimelineEntry => ({
        id: entry.id,
        channel: entry.channel,
        action: entry.action,
        mode: entry.mode,
        status: entry.status,
        triggeredBy: entry.triggeredBy,
        operatorId: entry.operatorId,
        startedAt: normalizeMetadataDateField(entry.startedAt) ?? new Date(),
        finishedAt: normalizeMetadataDateField(entry.finishedAt),
        retryOfAttemptId: entry.retryOfAttemptId,
        remoteId: entry.remoteId,
        remoteUrl: entry.remoteUrl,
        failureReason: entry.failureReason,
        message: entry.message,
        details: entry.details,
    })

    const distribution = metadata.integration?.distribution
    let normalizedDistribution: NormalizedPostIntegrationMetadata['distribution'] | undefined

    if (distribution) {
        normalizedDistribution = {
            channels: distribution.channels
                ? {
                    memos: normalizeDistributionChannelState(distribution.channels.memos),
                    wechatsync: normalizeDistributionChannelState(distribution.channels.wechatsync),
                }
                : undefined,
            timeline: distribution.timeline?.map((entry) => normalizeDistributionTimelineEntry(entry)),
        }
    } else if (metadata.integration?.distribution === null) {
        normalizedDistribution = null
    }

    return {
        cover: metadata.cover
            ? {
                ...metadata.cover,
                generatedAt: typeof metadata.cover.generatedAt === 'string'
                    ? new Date(metadata.cover.generatedAt)
                    : metadata.cover.generatedAt,
            }
            : undefined,
        visualAssets: metadata.visualAssets?.map((asset) => ({
            ...asset,
            generatedAt: typeof asset.generatedAt === 'string'
                ? new Date(asset.generatedAt)
                : asset.generatedAt,
        })),
        audio: metadata.audio ? { ...metadata.audio } : undefined,
        tts: metadata.tts
            ? {
                ...metadata.tts,
                generatedAt: typeof metadata.tts.generatedAt === 'string'
                    ? new Date(metadata.tts.generatedAt)
                    : metadata.tts.generatedAt,
            }
            : undefined,
        scaffold: metadata.scaffold ? { ...metadata.scaffold } : undefined,
        publish: metadata.publish ? { ...metadata.publish } : undefined,
        integration: metadata.integration
            ? {
                memosId: metadata.integration.memosId,
                distribution: normalizedDistribution,
            }
            : undefined,
    }
}

export async function buildCategoryRecommendation(
    sourcePost: PostTranslationSourceDetail,
    targetLanguage: string,
    sourceLanguage: string,
    actor: { userId: string, isAdmin: boolean },
    options: { limit?: number } = {},
): Promise<PostCategoryRecommendationResult> {
    const sourceCategory = sourcePost.category
    const limit = options.limit || 5
    const targetCategories = await dataSource.getRepository(Category).find({
        where: { language: targetLanguage },
    })

    if (!sourceCategory) {
        return {
            sourceCategory: null,
            matchedCategoryId: null,
            candidates: [],
            proposedCategory: null,
        }
    }

    const candidates: PostCategorySuggestionCandidate[] = []
    const candidateIds = new Set<string>()
    const pushCandidate = (category: Category | null | undefined, reason: PostCategorySuggestionCandidate['reason']) => {
        if (!category || candidateIds.has(category.id)) {
            return
        }

        candidateIds.add(category.id)
        candidates.push({
            id: category.id,
            name: category.name,
            slug: category.slug,
            language: category.language,
            reason,
        })
    }

    const clusterId = resolveTranslationClusterId(sourceCategory.translationId, sourceCategory.slug, sourceCategory.id)
    if (clusterId) {
        pushCandidate(
            targetCategories.find((category) => category.translationId === clusterId),
            'translation-cluster',
        )
    }

    const translatedSourceName = sourceLanguage === targetLanguage
        ? sourceCategory.name
        : await TextService.translateName(sourceCategory.name, targetLanguage, actor.userId)
    const translatedSourceSlug = sanitizeSlug(await TextService.suggestSlugFromName(translatedSourceName, actor.userId))
    const sourceCategorySlug = sourceCategory.slug || sanitizeSlug(sourceCategory.name)

    const categoryByName = new Map(targetCategories.map((category) => [category.name.trim().toLowerCase(), category]))
    const categoryBySlug = new Map(targetCategories.map((category) => [category.slug.trim().toLowerCase(), category]))

    pushCandidate(categoryByName.get(translatedSourceName.trim().toLowerCase()), 'translated-name')
    pushCandidate(categoryBySlug.get(translatedSourceSlug), 'translated-slug')

    const aiRecommendedNames = await TextService.recommendCategories({
        title: sourcePost.title,
        content: sourcePost.content,
        categories: targetCategories.map((category) => category.name),
        language: targetLanguage,
    }, actor.userId)

    aiRecommendedNames.forEach((name) => {
        pushCandidate(categoryByName.get(name.trim().toLowerCase()), 'ai-recommended')
    })

    return {
        sourceCategory: {
            id: sourceCategory.id,
            name: sourceCategory.name,
            slug: sourceCategorySlug,
            language: sourceLanguage,
        },
        matchedCategoryId: candidates[0]?.id || null,
        candidates: candidates.slice(0, limit),
        proposedCategory: {
            name: translatedSourceName,
            slug: translatedSourceSlug,
            reason: 'translated-source-name',
        },
    }
}

export async function resolveTagBindings(
    sourceTags: PostTranslationSourceDetail['tags'],
    sourceLanguage: string,
    targetLanguage: string,
    aggregate: TranslationUsageAggregate,
    translateFieldContent: (content: string, targetLanguage: string, options: { sourceLanguage?: string, field?: TranslationTextField }, aggregate: TranslationUsageAggregate) => Promise<string>,
) {
    if (!sourceTags?.length) {
        return []
    }

    const tagRepo = dataSource.getRepository(Tag)
    const bindings: PostTagBindingInput[] = []
    const pendingTranslations: NonNullable<PostTranslationSourceDetail['tags']> = []

    for (const tag of sourceTags) {
        const clusterId = resolveTranslationClusterId(tag.translationId, tag.slug, tag.id)
        const matchedTag = clusterId
            ? await tagRepo.findOne({ where: { translationId: clusterId, language: targetLanguage } })
            : null

        if (matchedTag) {
            bindings.push(createPostTagBinding({
                name: matchedTag.name,
                source: tag,
                target: matchedTag,
            }))
            continue
        }

        if (sourceLanguage === targetLanguage) {
            bindings.push(createPostTagBinding({ name: tag.name, source: tag }))
            continue
        }

        pendingTranslations.push(tag)
    }

    if (pendingTranslations.length > 0) {
        const translatedNames = await Promise.all(pendingTranslations.map(async (tag) => await translateFieldContent(tag.name, targetLanguage, {
            sourceLanguage,
            field: 'title',
        }, aggregate)))

        pendingTranslations.forEach((tag, index) => {
            bindings.push(createPostTagBinding({
                name: translatedNames[index] || tag.name,
                source: tag,
            }))
        })
    }

    return Array.from(new Map(bindings.map((binding) => [
        resolveTranslationClusterId(binding.translationId, binding.sourceTagSlug, binding.sourceTagId) || binding.name.toLowerCase(),
        binding,
    ])).values())
}

export async function findExistingTargetPost(
    input: Pick<TranslatePostTaskPayload, 'targetPostId' | 'targetLanguage'>,
    sourcePost: PostTranslationSourceDetail,
    actor: { userId: string, isAdmin: boolean },
    getAccessiblePost: (postId: string, actor: { userId: string, isAdmin: boolean }) => Promise<Post & PostTranslationSourceDetail>,
) {
    if (input.targetPostId) {
        return await getAccessiblePost(input.targetPostId, actor)
    }

    const translationId = resolveTranslationClusterId(sourcePost.translationId, sourcePost.slug, sourcePost.id)
    if (!translationId) {
        return null
    }

    const targetPost = await dataSource.getRepository(Post).findOne({
        where: {
            translationId,
            language: input.targetLanguage,
        },
        relations: ['category', 'tags'],
    })

    if (!targetPost) {
        return null
    }

    if (!actor.isAdmin && targetPost.authorId !== actor.userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return targetPost as Post & PostTranslationSourceDetail
}

export async function resolvePostSlug(options: {
    sourcePost: PostTranslationSourceDetail
    translatedTitle: string
    translatedContent: string
    strategy: 'source' | 'translate' | 'ai'
    actorUserId: string
    approvedSlug?: string | null
}) {
    if (options.approvedSlug) {
        return sanitizeSlug(options.approvedSlug)
    }

    if (options.strategy === 'source') {
        return sanitizeSlug(options.sourcePost.slug || options.translatedTitle)
    }

    if (options.strategy === 'translate') {
        return sanitizeSlug(await TextService.suggestSlugFromName(options.translatedTitle, options.actorUserId))
    }

    return sanitizeSlug(await TextService.suggestSlug(
        options.translatedTitle,
        options.translatedContent,
        options.actorUserId,
    ))
}
