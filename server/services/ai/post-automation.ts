import { AIBaseService } from './base'
import { requestTranslation, translateInChunks, type TranslateRequestOptions } from './text-translation'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { createPostService, updatePostService } from '@/server/services/post'
import { createPostTagBinding } from '@/utils/shared/post-tag-bindings'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { PostTagBindingInput, PostTranslationSourceDetail, TranslationScopeField } from '@/types/post-translation'
import { PostStatus, type PostMetadata } from '@/types/post'

const DEFAULT_TRANSLATION_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags', 'coverImage', 'audio']

type TranslatePostTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface TranslatePostTaskInput {
    sourcePostId: string
    targetLanguage: string
    sourceLanguage?: string
    targetPostId?: string | null
    scopes?: TranslationScopeField[]
    targetStatus?: PostStatus.DRAFT | PostStatus.PENDING
}

interface TranslationUsageAggregate {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    requestCount: number
    textChars: number
    outputChars: number
}

function createUsageAggregate(): TranslationUsageAggregate {
    return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        textChars: 0,
        outputChars: 0,
    }
}

function normalizeScopes(scopes?: TranslationScopeField[]) {
    const nextScopes = scopes?.filter((scope) => DEFAULT_TRANSLATION_SCOPES.includes(scope)) || DEFAULT_TRANSLATION_SCOPES
    return Array.from(new Set(nextScopes))
}

function parseTaskPayload(task: Pick<AITask, 'payload'>): TranslatePostTaskInput {
    if (!task.payload) {
        throw new Error('Task payload is required')
    }

    if (typeof task.payload === 'string') {
        return JSON.parse(task.payload) as TranslatePostTaskInput
    }

    return task.payload as unknown as TranslatePostTaskInput
}

function mergeAudioMetadata(source: PostTranslationSourceDetail): PostMetadata | null {
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

function normalizeMetadataForPostInput(metadata: PostMetadata | null | undefined) {
    if (!metadata) {
        return metadata
    }

    return {
        ...metadata,
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
        integration: metadata.integration ? { ...metadata.integration } : undefined,
    }
}

export class PostAutomationService extends AIBaseService {
    static async createTranslatePostTask(input: TranslatePostTaskInput, actor: { userId: string, isAdmin: boolean }) {
        const sourcePost = await this.getAccessiblePost(input.sourcePostId, actor)
        const sourceLanguage = input.sourceLanguage || sourcePost.language

        if (sourceLanguage === input.targetLanguage) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Target language must differ from source language',
            })
        }

        if (input.targetPostId) {
            await this.getAccessiblePost(input.targetPostId, actor)
        }

        const scopes = normalizeScopes(input.scopes)
        if (!input.targetPostId && (!scopes.includes('title') || !scopes.includes('content'))) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Creating a translated post requires title and content scopes',
            })
        }

        const task = await this.recordTask({
            userId: actor.userId,
            category: 'text',
            type: 'translate_post',
            status: 'pending',
            payload: {
                ...input,
                sourceLanguage,
                scopes,
            },
            progress: 0,
            textLength: sourcePost.title.length + sourcePost.content.length + (sourcePost.summary?.length || 0),
            settlementSource: 'estimated',
        })

        if (!task) {
            throw new Error('Failed to create translate post task')
        }

        this.processTranslatePostTask(task.id, actor).catch((error) => {
            console.error(`[PostAutomationService] Failed to process translate post task ${task.id}:`, error)
        })

        return task
    }

    private static async getAccessiblePost(postId: string, actor: { userId: string, isAdmin: boolean }) {
        const post = await dataSource.getRepository(Post).findOne({
            where: { id: postId },
            relations: ['category', 'tags'],
        })

        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        if (!actor.isAdmin && post.authorId !== actor.userId) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        return post as Post & PostTranslationSourceDetail
    }

    private static async updateTaskProgress(task: AITask, status: TranslatePostTaskStatus, progress: number) {
        task.status = status
        task.progress = progress
        task.startedAt = task.startedAt || new Date()
        await dataSource.getRepository(AITask).save(task)
    }

    private static mergeUsage(aggregate: TranslationUsageAggregate, options: {
        usage?: {
            promptTokens?: number
            completionTokens?: number
            totalTokens?: number
        }
        inputChars?: number
        outputChars?: number
        requestCount?: number
    }) {
        aggregate.promptTokens += options.usage?.promptTokens || 0
        aggregate.completionTokens += options.usage?.completionTokens || 0
        aggregate.totalTokens += options.usage?.totalTokens || 0
        aggregate.requestCount += options.requestCount || 1
        aggregate.textChars += options.inputChars || 0
        aggregate.outputChars += options.outputChars || 0
    }

    private static async translateFieldContent(content: string, targetLanguage: string, options: TranslateRequestOptions, aggregate: TranslationUsageAggregate) {
        const { response, translatedContent } = await requestTranslation(content, targetLanguage, undefined, options)
        this.mergeUsage(aggregate, {
            usage: response.usage,
            inputChars: content.length,
            outputChars: translatedContent.length,
        })

        return translatedContent
    }

    private static async resolveCategoryId(sourceCategory: PostTranslationSourceDetail['category'], targetLanguage: string) {
        if (!sourceCategory) {
            return null
        }

        const clusterId = resolveTranslationClusterId(sourceCategory.translationId, sourceCategory.slug, sourceCategory.id)
        if (!clusterId) {
            return null
        }

        const targetCategory = await dataSource.getRepository(Category).findOne({
            where: { translationId: clusterId, language: targetLanguage },
        })

        return targetCategory?.id || null
    }

    private static async translateTagNamesBatch(
        names: string[],
        targetLanguage: string,
        sourceLanguage: string,
        aggregate: TranslationUsageAggregate,
    ) {
        const translatedNames = await Promise.all(names.map(async (name) => await this.translateFieldContent(name, targetLanguage, {
            sourceLanguage,
            field: 'title',
        }, aggregate)))

        return translatedNames.map((name) => name.trim()).filter(Boolean)
    }

    private static async resolveTagBindings(
        sourceTags: PostTranslationSourceDetail['tags'],
        sourceLanguage: string,
        targetLanguage: string,
        aggregate: TranslationUsageAggregate,
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
            const translatedNames = pendingTranslations.length === 1
                ? [await this.translateFieldContent(
                    pendingTranslations[0]!.name,
                    targetLanguage,
                    { sourceLanguage, field: 'title' },
                    aggregate,
                )]
                : await this.translateTagNamesBatch(
                    pendingTranslations.map((tag) => tag.name),
                    targetLanguage,
                    sourceLanguage,
                    aggregate,
                )

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

    private static async findExistingTargetPost(input: TranslatePostTaskInput, sourcePost: PostTranslationSourceDetail, actor: { userId: string, isAdmin: boolean }) {
        if (input.targetPostId) {
            return await this.getAccessiblePost(input.targetPostId, actor)
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

    private static async processTranslatePostTask(taskId: string, actor: { userId: string, isAdmin: boolean }) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = await taskRepo.findOneBy({ id: taskId, userId: actor.userId })

        if (!task) {
            return
        }

        const input = parseTaskPayload(task)
        const scopes = normalizeScopes(input.scopes)
        const warnings: string[] = []
        const usageAggregate = createUsageAggregate()

        try {
            await this.updateTaskProgress(task, 'processing', 5)

            const sourcePost = await this.getAccessiblePost(input.sourcePostId, actor)
            const sourceLanguage = input.sourceLanguage || sourcePost.language
            const targetPost = await this.findExistingTargetPost({ ...input, sourceLanguage, scopes }, sourcePost, actor)
            const translationId = resolveTranslationClusterId(sourcePost.translationId, sourcePost.slug, sourcePost.id)

            let translatedTitle = targetPost?.title || sourcePost.title
            if (scopes.includes('title')) {
                translatedTitle = await this.translateFieldContent(sourcePost.title, input.targetLanguage, {
                    sourceLanguage,
                    field: 'title',
                }, usageAggregate)
            }

            await this.updateTaskProgress(task, 'processing', 15)

            let translatedSummary = targetPost?.summary ?? sourcePost.summary ?? null
            if (scopes.includes('summary')) {
                translatedSummary = sourcePost.summary?.trim()
                    ? await this.translateFieldContent(sourcePost.summary, input.targetLanguage, {
                        sourceLanguage,
                        field: 'summary',
                    }, usageAggregate)
                    : null
            }

            await this.updateTaskProgress(task, 'processing', 25)

            let translatedContent = targetPost?.content || sourcePost.content
            if (scopes.includes('content')) {
                const contentResult = await translateInChunks(sourcePost.content, input.targetLanguage, {
                    sourceLanguage,
                    onChunkComplete: async ({ completedChunks, totalChunks }) => {
                        const progress = 25 + Math.round((completedChunks / totalChunks) * 55)
                        await this.updateTaskProgress(task, 'processing', Math.min(80, progress))
                    },
                })

                translatedContent = contentResult.content
                this.mergeUsage(usageAggregate, {
                    usage: contentResult.usage,
                    inputChars: sourcePost.content.length,
                    outputChars: contentResult.content.length,
                    requestCount: contentResult.usageSnapshot.requestCount || 1,
                })
            }

            const metadataPatch = scopes.includes('audio') ? mergeAudioMetadata(sourcePost) : undefined
            const categoryId = scopes.includes('category')
                ? await this.resolveCategoryId(sourcePost.category, input.targetLanguage)
                : undefined
            if (scopes.includes('category') && sourcePost.category && !categoryId) {
                warnings.push(`Category translation missing for ${sourcePost.category.name}`)
            }

            const tagBindings = scopes.includes('tags')
                ? await this.resolveTagBindings(sourcePost.tags, sourceLanguage, input.targetLanguage, usageAggregate)
                : undefined

            await this.updateTaskProgress(task, 'processing', 90)

            const normalizedMetadataPatch = normalizeMetadataForPostInput(metadataPatch)
            const sharedBody = {
                language: input.targetLanguage,
                translationId,
                title: translatedTitle,
                content: translatedContent,
                summary: translatedSummary,
                categoryId,
                tags: tagBindings?.map((item) => item.name),
                tagBindings,
                coverImage: scopes.includes('coverImage') ? (sourcePost.coverImage || null) : undefined,
                metadata: normalizedMetadataPatch,
                copyright: sourcePost.copyright ?? null,
                visibility: targetPost?.visibility ?? sourcePost.visibility,
                status: input.targetStatus || targetPost?.status || PostStatus.DRAFT,
            }

            const createBody = {
                ...sharedBody,
                pushOption: 'none' as const,
                syncToMemos: false,
            }

            const savedPost = targetPost
                ? await updatePostService(targetPost.id, sharedBody, {
                    isAdmin: actor.isAdmin,
                    currentUserId: actor.userId,
                })
                : await createPostService(createBody, sourcePost.authorId, {
                    isAdmin: actor.isAdmin,
                })

            await this.recordTask({
                id: taskId,
                userId: actor.userId,
                category: 'text',
                type: 'translate_post',
                status: 'completed',
                payload: {
                    ...input,
                    sourceLanguage,
                    scopes,
                },
                response: {
                    sourcePostId: sourcePost.id,
                    targetPostId: savedPost.id,
                    created: !targetPost,
                    targetLanguage: input.targetLanguage,
                    translationId,
                    url: `/posts/${savedPost.slug}`,
                    appliedScopes: scopes,
                    warnings,
                    categoryResolved: Boolean(categoryId),
                    translatedTagCount: tagBindings?.length || 0,
                    coverImageCopied: scopes.includes('coverImage') && Boolean(sourcePost.coverImage),
                    audioCopied: scopes.includes('audio') && Boolean(metadataPatch?.audio?.url),
                },
                progress: 100,
                textLength: sourcePost.title.length + sourcePost.content.length + (sourcePost.summary?.length || 0),
                usageSnapshot: {
                    promptTokens: usageAggregate.promptTokens || undefined,
                    completionTokens: usageAggregate.completionTokens || undefined,
                    totalTokens: usageAggregate.totalTokens || undefined,
                    requestCount: usageAggregate.requestCount || undefined,
                    textChars: usageAggregate.textChars || undefined,
                    outputChars: usageAggregate.outputChars || undefined,
                },
                settlementSource: 'actual',
            })
        } catch (error) {
            await this.recordTask({
                id: taskId,
                userId: actor.userId,
                category: 'text',
                type: 'translate_post',
                payload: {
                    ...input,
                    scopes,
                },
                error,
                progress: task.progress || 0,
                settlementSource: 'estimated',
            })
        }
    }
}
