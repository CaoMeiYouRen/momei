import { TextService } from './ai'
import { commentService } from './comment'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import type {
    CommentTranslationCacheEntry,
    CommentTranslationCacheMap,
    CommentTranslationResult,
} from '@/types/comment'

interface CommentTranslationViewerOptions {
    isAdmin?: boolean
    viewerEmail?: string
    viewerId?: string
}

interface GetOrCreateCommentTranslationOptions extends CommentTranslationViewerOptions {
    actorId: string
    commentId: string
    targetLanguage: string
}

const COMMENT_TRANSLATION_TASK_POLL_LIMIT = 8
const commentTranslationInflight = new Map<string, Promise<CommentTranslationResult>>()
type TextTaskStatus = Awaited<ReturnType<typeof TextService.getTaskStatus>>

function buildCommentTranslationInflightKey(commentId: string, targetLanguage: AppLocaleCode) {
    return `${commentId}:${targetLanguage}`
}

function normalizeCommentTranslationCache(cache: Comment['translationCache'] | null | undefined): CommentTranslationCacheMap {
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
        return {}
    }

    return cache
}

function buildCommentTranslationCacheEntry(content: string): CommentTranslationCacheEntry {
    return {
        content,
        updatedAt: new Date().toISOString(),
    }
}

function extractTranslatedTaskContent(result: unknown) {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        return ''
    }

    const taskResult = result as Record<string, unknown>
    return typeof taskResult.content === 'string' ? taskResult.content : ''
}

function hasTaskResult(taskStatus: TextTaskStatus): taskStatus is TextTaskStatus & { result: unknown } {
    return 'result' in taskStatus
}

async function translateCommentContent(
    content: string,
    targetLanguage: AppLocaleCode,
    actorId: string,
) {
    if (!TextService.shouldUseAsyncTranslateTask(content)) {
        return await TextService.translate(content, targetLanguage, actorId, {
            field: 'content',
        })
    }

    const task = await TextService.createTranslateTask(content, targetLanguage, actorId, {
        field: 'content',
    })

    for (let attempt = 0; attempt < COMMENT_TRANSLATION_TASK_POLL_LIMIT; attempt += 1) {
        const taskStatus = await TextService.getTaskStatus(task.id, actorId, {
            includeRaw: true,
        })

        if (taskStatus.status === 'completed') {
            const translatedContent = extractTranslatedTaskContent(
                hasTaskResult(taskStatus) ? taskStatus.result : undefined,
            )
            if (translatedContent) {
                return translatedContent
            }

            throw createError({
                statusCode: 502,
                statusMessage: 'Comment translation returned empty content',
            })
        }

        if (taskStatus.status === 'failed') {
            throw createError({
                statusCode: 502,
                statusMessage: taskStatus.error || 'Comment translation failed',
            })
        }
    }

    throw createError({
        statusCode: 504,
        statusMessage: 'Comment translation timed out',
    })
}

export const commentTranslationService = {
    async getOrCreateTranslation(options: GetOrCreateCommentTranslationOptions): Promise<CommentTranslationResult> {
        const targetLanguage = resolveAppLocaleCode(options.targetLanguage)
        const inflightKey = buildCommentTranslationInflightKey(options.commentId, targetLanguage)
        const existingInflightTask = commentTranslationInflight.get(inflightKey)
        if (existingInflightTask) {
            return await existingInflightTask
        }

        const translationTask = (async () => {
            const comment = await commentService.getCommentById(options.commentId, {
                isAdmin: options.isAdmin,
                viewerEmail: options.viewerEmail,
                viewerId: options.viewerId,
            })

            if (!comment) {
                throw createError({
                    statusCode: 404,
                    statusMessage: 'Comment not found',
                })
            }

            const translationCache = normalizeCommentTranslationCache(comment.translationCache)
            const cachedTranslation = translationCache[targetLanguage]
            if (cachedTranslation?.content) {
                return {
                    commentId: comment.id,
                    targetLanguage,
                    content: cachedTranslation.content,
                    updatedAt: cachedTranslation.updatedAt,
                    fromCache: true,
                } satisfies CommentTranslationResult
            }

            const translatedContent = await translateCommentContent(
                comment.content,
                targetLanguage,
                options.actorId,
            )

            const nextTranslationEntry = buildCommentTranslationCacheEntry(translatedContent)
            const nextTranslationCache: CommentTranslationCacheMap = {
                ...translationCache,
                [targetLanguage]: nextTranslationEntry,
            }

            const commentRepo = dataSource.getRepository(Comment)
            await commentRepo.save({
                id: comment.id,
                translationCache: nextTranslationCache,
            })

            return {
                commentId: comment.id,
                targetLanguage,
                content: translatedContent,
                updatedAt: nextTranslationEntry.updatedAt,
                fromCache: false,
            } satisfies CommentTranslationResult
        })()

        commentTranslationInflight.set(inflightKey, translationTask)

        try {
            return await translationTask
        } finally {
            commentTranslationInflight.delete(inflightKey)
        }
    },
}
