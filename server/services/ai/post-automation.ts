import { AIBaseService } from './base'
import {
    buildCategoryRecommendation,
    createUsageAggregate,
    findExistingTargetPost,
    mergeAudioMetadata,
    normalizeCategoryStrategy,
    normalizeConfirmationMode,
    normalizeMetadataForPostInput,
    normalizeScopes,
    normalizeSlugStrategy,
    parseTaskPayload,
    parseTaskResult,
    resolvePostSlug,
    resolveTagBindings,
    type PostCategoryRecommendationResult,
    type PostCategorySuggestionCandidate,
    type TranslatePostTaskPayload,
    type TranslationUsageAggregate,
} from './post-automation-helpers'
import { requestTranslation, translateInChunks, type TranslateRequestOptions } from './text-translation'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { Post } from '@/server/entities/post'
import { createPostService, updatePostService } from '@/server/services/post'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { PostTagBindingInput, PostTranslationSourceDetail, TranslationScopeField } from '@/types/post-translation'
import { PostStatus, PostVisibility, type PostMetadata } from '@/types/post'

type TranslatePostTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type TranslatePostSlugStrategy = 'source' | 'translate' | 'ai'
export type TranslatePostCategoryStrategy = 'cluster' | 'suggest'
export type TranslatePostConfirmationMode = 'auto' | 'require' | 'confirmed'

export interface TranslatePostTaskInput extends TranslatePostTaskPayload {
    sourcePostId: string
    targetLanguage: string
    targetStatus?: PostStatus.DRAFT | PostStatus.PENDING
    slugStrategy?: TranslatePostSlugStrategy
    categoryStrategy?: TranslatePostCategoryStrategy
    confirmationMode?: TranslatePostConfirmationMode
}

interface TranslatePostPreviewSnapshot {
    sourcePostId: string
    targetPostId: string | null
    targetLanguage: string
    translationId: string | null
    appliedScopes: TranslationScopeField[]
    title: string
    summary: string | null
    content: string
    slug: string
    slugStrategy: TranslatePostSlugStrategy
    categoryId?: string | null
    categoryRecommendation?: PostCategoryRecommendationResult | null
    tags?: string[]
    tagBindings?: PostTagBindingInput[]
    coverImage?: string | null
    metadata?: ReturnType<typeof normalizeMetadataForPostInput>
    copyright: PostTranslationSourceDetail['copyright']
    visibility: PostTranslationSourceDetail['visibility']
    status: PostStatus.DRAFT | PostStatus.PENDING
    warnings: string[]
    coverImageCopied: boolean
    audioCopied: boolean
}

type CreatePostMetadataInput = Parameters<typeof createPostService>[0]['metadata']
type CreatePostBodyInput = Parameters<typeof createPostService>[0]
type UpdatePostBodyInput = Parameters<typeof updatePostService>[1]

export class PostAutomationService extends AIBaseService {
    static async createTranslatePostTask(input: TranslatePostTaskInput, actor: { userId: string, isAdmin: boolean }) {
        const sourcePost = await this.getAccessiblePost(input.sourcePostId, actor)
        const sourceLanguage = input.sourceLanguage || sourcePost.language
        const scopes = normalizeScopes(input.scopes)
        const confirmationMode = normalizeConfirmationMode(input.confirmationMode)
        const slugStrategy = normalizeSlugStrategy(input.slugStrategy)
        const categoryStrategy = normalizeCategoryStrategy(input.categoryStrategy)

        if (sourceLanguage === input.targetLanguage) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Target language must differ from source language',
            })
        }

        if (input.targetPostId) {
            await this.getAccessiblePost(input.targetPostId, actor)
        }

        if (!input.targetPostId && (!scopes.includes('title') || !scopes.includes('content'))) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Creating a translated post requires title and content scopes',
            })
        }

        if (confirmationMode === 'confirmed' && !input.previewTaskId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Confirming a translated preview requires previewTaskId',
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
                slugStrategy,
                categoryStrategy,
                confirmationMode,
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

    static async recommendCategoriesForPost(
        input: {
            postId: string
            targetLanguage: string
            sourceLanguage?: string
            limit?: number
        },
        actor: { userId: string, isAdmin: boolean },
    ) {
        const sourcePost = await this.getAccessiblePost(input.postId, actor)
        const sourceLanguage = input.sourceLanguage || sourcePost.language
        return await this.buildCategoryRecommendation(sourcePost, input.targetLanguage, sourceLanguage, actor, {
            limit: input.limit,
        })
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

    private static async buildCategoryRecommendation(
        sourcePost: PostTranslationSourceDetail,
        targetLanguage: string,
        sourceLanguage: string,
        actor: { userId: string, isAdmin: boolean },
        options: { limit?: number } = {},
    ): Promise<PostCategoryRecommendationResult> {
        return await buildCategoryRecommendation(sourcePost, targetLanguage, sourceLanguage, actor, options)
    }

    private static async resolveTagBindings(
        sourceTags: PostTranslationSourceDetail['tags'],
        sourceLanguage: string,
        targetLanguage: string,
        aggregate: TranslationUsageAggregate,
    ) {
        return await resolveTagBindings(sourceTags, sourceLanguage, targetLanguage, aggregate, this.translateFieldContent.bind(this))
    }

    private static async findExistingTargetPost(input: TranslatePostTaskInput, sourcePost: PostTranslationSourceDetail, actor: { userId: string, isAdmin: boolean }) {
        return await findExistingTargetPost(input, sourcePost, actor, this.getAccessiblePost.bind(this))
    }

    private static async resolvePostSlug(options: {
        sourcePost: PostTranslationSourceDetail
        translatedTitle: string
        translatedContent: string
        strategy: TranslatePostSlugStrategy
        actorUserId: string
        approvedSlug?: string | null
    }) {
        return await resolvePostSlug(options)
    }

    private static async loadPreviewSnapshot(previewTaskId: string, actor: { userId: string, isAdmin: boolean }) {
        const previewTask = await dataSource.getRepository(AITask).findOneBy({
            id: previewTaskId,
            userId: actor.userId,
        })

        if (previewTask?.type !== 'translate_post' || previewTask.status !== 'completed') {
            throw createError({
                statusCode: 404,
                statusMessage: 'Preview task not found',
            })
        }

        const previewResult = parseTaskResult<{
            needsConfirmation?: boolean
            preview?: TranslatePostPreviewSnapshot
        }>(previewTask.result)

        if (!previewResult?.needsConfirmation || !previewResult.preview) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Preview task is not awaiting confirmation',
            })
        }

        return previewResult.preview
    }

    private static async buildTranslatePreview(
        input: TranslatePostTaskInput,
        actor: { userId: string, isAdmin: boolean },
        task: AITask,
    ) {
        const scopes = normalizeScopes(input.scopes)
        const warnings: string[] = []
        const usageAggregate = createUsageAggregate()
        const slugStrategy = normalizeSlugStrategy(input.slugStrategy)
        const categoryStrategy = normalizeCategoryStrategy(input.categoryStrategy)
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

        const slug = await this.resolvePostSlug({
            sourcePost,
            translatedTitle,
            translatedContent,
            strategy: slugStrategy,
            actorUserId: actor.userId,
            approvedSlug: input.approvedSlug,
        })

        let metadataPatch: ReturnType<typeof mergeAudioMetadata> | null | undefined
        if (scopes.includes('audio')) {
            metadataPatch = targetPost ? mergeAudioMetadata(targetPost) : null
        }
        const normalizedMetadataPatch = normalizeMetadataForPostInput(metadataPatch)
        const translatedCoverImage = scopes.includes('coverImage')
            ? (targetPost?.coverImage ?? null)
            : undefined
        const categoryRecommendation = scopes.includes('category')
            ? await this.buildCategoryRecommendation(sourcePost, input.targetLanguage, sourceLanguage, actor)
            : null
        let categoryId: string | null | undefined
        if (scopes.includes('category')) {
            if (input.approvedCategoryId !== undefined) {
                categoryId = input.approvedCategoryId
            } else if (categoryStrategy === 'cluster') {
                categoryId = categoryRecommendation?.candidates.find((item) => item.reason === 'translation-cluster')?.id || null
            } else {
                categoryId = categoryRecommendation?.matchedCategoryId || null
            }
        }

        if (scopes.includes('category') && sourcePost.category && !categoryId) {
            warnings.push(`Category translation missing for ${sourcePost.category.name}`)
        }

        if (scopes.includes('coverImage') && sourcePost.coverImage && !translatedCoverImage) {
            warnings.push(`Cover image must be regenerated for ${input.targetLanguage}`)
        }

        if (scopes.includes('audio') && (sourcePost.metadata?.audio?.url || sourcePost.audioUrl) && !metadataPatch?.audio?.url) {
            warnings.push(`Audio asset must be regenerated for ${input.targetLanguage}`)
        }

        const tagBindings = scopes.includes('tags')
            ? await this.resolveTagBindings(sourcePost.tags, sourceLanguage, input.targetLanguage, usageAggregate)
            : undefined

        await this.updateTaskProgress(task, 'processing', 90)

        return {
            preview: {
                sourcePostId: sourcePost.id,
                targetPostId: targetPost?.id || input.targetPostId || null,
                targetLanguage: input.targetLanguage,
                translationId,
                appliedScopes: scopes,
                title: translatedTitle,
                summary: translatedSummary,
                content: translatedContent,
                slug,
                slugStrategy,
                categoryId,
                categoryRecommendation,
                tags: tagBindings?.map((item) => item.name),
                tagBindings,
                coverImage: translatedCoverImage,
                metadata: normalizedMetadataPatch,
                copyright: sourcePost.copyright ?? null,
                visibility: targetPost?.visibility ?? sourcePost.visibility,
                status: input.targetStatus || targetPost?.status || PostStatus.DRAFT,
                warnings,
                coverImageCopied: false,
                audioCopied: false,
            },
            usageAggregate,
            sourcePost,
            sourceLanguage,
            targetPost,
        }
    }

    private static async processTranslatePostTask(taskId: string, actor: { userId: string, isAdmin: boolean }) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = await taskRepo.findOneBy({ id: taskId, userId: actor.userId })

        if (!task) {
            return
        }

        const input = parseTaskPayload(task)
        const scopes = normalizeScopes(input.scopes)
        const confirmationMode = normalizeConfirmationMode(input.confirmationMode)
        const slugStrategy = normalizeSlugStrategy(input.slugStrategy)
        const categoryStrategy = normalizeCategoryStrategy(input.categoryStrategy)

        try {
            await this.updateTaskProgress(task, 'processing', 5)

            const previewContext = input.previewTaskId && confirmationMode === 'confirmed'
                ? async () => {
                    const preview = await this.loadPreviewSnapshot(input.previewTaskId!, actor)
                    const sourcePost = await this.getAccessiblePost(input.sourcePostId, actor)
                    const sourceLanguage = input.sourceLanguage || sourcePost.language
                    const targetPost = await this.findExistingTargetPost({
                        ...input,
                        targetPostId: preview.targetPostId,
                    }, sourcePost, actor)

                    return {
                        preview: {
                            ...preview,
                            slug: input.approvedSlug ? sanitizeSlug(input.approvedSlug) : preview.slug,
                            categoryId: input.approvedCategoryId === undefined ? preview.categoryId : input.approvedCategoryId,
                        },
                        usageAggregate: createUsageAggregate(),
                        sourcePost,
                        sourceLanguage,
                        targetPost,
                    }
                }
                : async () => await this.buildTranslatePreview({
                    ...input,
                    slugStrategy,
                    categoryStrategy,
                }, actor, task)

            const { preview, usageAggregate, sourcePost, sourceLanguage, targetPost } = await previewContext()

            if (confirmationMode === 'require') {
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
                        slugStrategy,
                        categoryStrategy,
                        confirmationMode,
                    },
                    response: {
                        needsConfirmation: true,
                        previewTaskId: taskId,
                        preview,
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
                return
            }

            const sharedBody = {
                language: input.targetLanguage,
                translationId: preview.translationId,
                title: preview.title,
                slug: preview.slug,
                content: preview.content,
                summary: preview.summary,
                categoryId: preview.categoryId,
                tags: preview.tags,
                tagBindings: preview.tagBindings,
                coverImage: preview.coverImage,
                metadata: normalizeMetadataForPostInput(preview.metadata),
                copyright: preview.copyright,
                visibility: preview.visibility || PostVisibility.PUBLIC,
                status: preview.status,
            } satisfies UpdatePostBodyInput

            const createBody: CreatePostBodyInput = {
                language: sharedBody.language,
                translationId: sharedBody.translationId,
                title: sharedBody.title,
                slug: sharedBody.slug,
                content: sharedBody.content,
                summary: sharedBody.summary,
                categoryId: sharedBody.categoryId,
                tags: sharedBody.tags,
                tagBindings: sharedBody.tagBindings,
                coverImage: sharedBody.coverImage,
                metadata: sharedBody.metadata,
                copyright: sharedBody.copyright,
                visibility: sharedBody.visibility,
                status: sharedBody.status,
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
                    slugStrategy,
                    categoryStrategy,
                    confirmationMode,
                },
                response: {
                    sourcePostId: sourcePost.id,
                    targetPostId: savedPost.id,
                    created: !targetPost,
                    targetLanguage: input.targetLanguage,
                    translationId: preview.translationId,
                    url: `/posts/${savedPost.slug}`,
                    appliedScopes: preview.appliedScopes,
                    warnings: preview.warnings,
                    categoryResolved: Boolean(preview.categoryId),
                    categoryRecommendation: preview.categoryRecommendation,
                    slug: preview.slug,
                    slugStrategy: preview.slugStrategy,
                    translatedTagCount: preview.tagBindings?.length || 0,
                    coverImageCopied: preview.coverImageCopied,
                    audioCopied: preview.audioCopied,
                    previewTaskId: input.previewTaskId || null,
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
                    slugStrategy,
                    categoryStrategy,
                    confirmationMode,
                },
                error,
                progress: task.progress || 0,
                settlementSource: 'estimated',
            })
        }
    }
}
