import type { Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Composer } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTagBindingInput,
    PostTranslationSourceDetail,
} from '@/types/post-translation'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import { isFutureDate } from '@/utils/shared/date'

export interface TranslationWorkflowState {
    sourcePostId: string | null
    targetLanguage: string
    scopes: string[]
}

export interface PublishPushDialogExpose {
    visible?: boolean
    open?: (options: {
        publishedAt?: string | Date | null
        criteria?: { categoryIds?: string[], tagIds?: string[] }
    }) => void
}

interface ConfirmServiceLike {
    require: (options: Record<string, unknown>) => void
}

interface LoadPostOptions {
    route: RouteLocationNormalizedLoaded
    post: Ref<PostEditorData>
    sourcePostSnapshot: Ref<PostTranslationSourceDetail | null>
    translationWorkflowDefaults: Ref<TranslationWorkflowState>
    translationDialogVisible: Ref<boolean>
    loadCategories: (language?: string) => Promise<void>
    loadTags: (language?: string) => Promise<void>
    fetchTranslations: (translationId: string) => Promise<void>
    parseTranslationScopes: (value: string | string[] | undefined) => string[]
    resolveTranslatedTagBindings: (sourceTags: PostTranslationSourceDetail['tags'], sourceLanguage: string, targetLanguage: string) => Promise<PostTagBindingInput[]>
    resolveMatchedCategoryId: (sourceCategory: PostTranslationSourceDetail['category'], sourceLanguage: string) => string | null
    applyTagBindings: (bindings: PostTagBindingInput[]) => void
    hasRecoverableDraft: () => boolean
    recoverDraft: () => void
    clearLocalDraft: () => void
    confirm: ConfirmServiceLike
    t: Composer['t']
    showSuccessToast: (...args: any[]) => void
}

interface SavePostOptions {
    post: Ref<PostEditorData>
    isNew: boolean
    route: RouteLocationNormalizedLoaded
    localePath: (path: string) => string
    clearLocalDraft: () => void
    showSuccessToast: (key: string) => void
}

export function setTranslationWorkflowState(options: {
    route: RouteLocationNormalizedLoaded
    post: Ref<PostEditorData>
    sourcePostSnapshot: Ref<PostTranslationSourceDetail | null>
    translationWorkflowDefaults: Ref<TranslationWorkflowState>
    translationDialogVisible: Ref<boolean>
    parseTranslationScopes: (value: string | string[] | undefined) => string[]
}) {
    if (options.route.query.autoTranslate !== 'true') {
        return
    }

    options.translationWorkflowDefaults.value = {
        sourcePostId: (options.route.query.sourceId as string) || options.sourcePostSnapshot.value?.id || null,
        targetLanguage: options.post.value.language,
        scopes: options.parseTranslationScopes(options.route.query.translationScopes as string | string[] | undefined),
    }
    options.translationDialogVisible.value = true
}

export function promptDraftRecovery(options: Pick<LoadPostOptions, 'hasRecoverableDraft' | 'confirm' | 't' | 'recoverDraft' | 'clearLocalDraft' | 'showSuccessToast'>) {
    if (!options.hasRecoverableDraft()) {
        return
    }

    options.confirm.require({
        message: options.t('pages.admin.posts.recover_draft_confirm'),
        header: options.t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        acceptProps: {
            label: options.t('common.confirm'),
            severity: 'warn',
        },
        rejectProps: {
            label: options.t('common.cancel'),
            severity: 'secondary',
            outlined: true,
        },
        accept: () => {
            options.recoverDraft()
            options.showSuccessToast('pages.admin.posts.draft_recovered')
        },
        reject: () => {
            options.clearLocalDraft()
            options.showSuccessToast('pages.admin.posts.draft_discarded', {
                severity: 'info',
                summaryKey: 'common.info',
            })
        },
    })
}

export async function preloadSourcePost(options: LoadPostOptions) {
    const sourceId = options.route.query.sourceId as string
    const shouldPrefillFromSource = options.route.query.autoTranslate !== 'true'

    if (!sourceId) {
        if (options.route.query.translationId) {
            await options.fetchTranslations(options.route.query.translationId as string)
        }

        setTranslationWorkflowState(options)
        return
    }

    try {
        const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${sourceId}`)
        if (!data) {
            return
        }

        options.sourcePostSnapshot.value = data
        options.post.value.translationId = resolveTranslationClusterId(data.translationId, data.slug, data.id)
        options.post.value.slug = data.slug || ''

        if (shouldPrefillFromSource) {
            await Promise.all([
                options.loadCategories(options.post.value.language),
                options.loadTags(options.post.value.language),
            ])

            options.post.value.title = data.title
            options.post.value.summary = data.summary
            options.post.value.content = data.content
            options.post.value.coverImage = data.coverImage
            options.applyTagBindings(await options.resolveTranslatedTagBindings(data.tags || [], data.language, options.post.value.language))
            options.post.value.copyright = data.copyright
            options.post.value.categoryId = options.resolveMatchedCategoryId(data.category, data.language)
        }
    } catch (error) {
        console.error('Failed to pre-fill from source post', error)
    }

    if (options.route.query.translationId) {
        await options.fetchTranslations(options.route.query.translationId as string)
    }

    setTranslationWorkflowState(options)
}

export async function loadExistingPostDetail(options: LoadPostOptions) {
    try {
        const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${options.route.params.id}`)
        if (!data) {
            return
        }

        const detailedPost = data as PostTranslationSourceDetail & {
            visibility?: PostVisibility
            views?: number
        }

        options.post.value = {
            ...options.post.value,
            ...detailedPost,
            slug: detailedPost.slug || '',
            status: (detailedPost.status as PostStatus) || PostStatus.DRAFT,
            visibility: detailedPost.visibility || PostVisibility.PUBLIC,
            views: detailedPost.views || 0,
            categoryId: detailedPost.category?.id || null,
            tags: detailedPost.tags?.map((tag) => tag.name) || [],
            language: detailedPost.language || 'zh-CN',
            translationId: detailedPost.translationId || null,
        }

        options.applyTagBindings((detailedPost.tags || []).map((tag) => ({
            name: tag.name,
            translationId: resolveTranslationClusterId(tag.translationId, tag.slug, tag.id),
            sourceTagSlug: tag.slug ?? null,
            sourceTagId: tag.id,
        })))

        if (options.post.value.translationId) {
            await options.fetchTranslations(options.post.value.translationId)
        }

        const requestedSourceId = options.route.query.sourceId as string | undefined
        if (requestedSourceId && requestedSourceId !== detailedPost.id) {
            try {
                options.sourcePostSnapshot.value = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${requestedSourceId}`)
                    .then((response) => response.data)
            } catch (sourceError) {
                console.error('Failed to load translation source snapshot', sourceError)
            }
        }
    } catch (error) {
        console.error('Failed to load post', error)
    }

    setTranslationWorkflowState(options)
    promptDraftRecovery(options)
}

export function buildSavePayload(options: {
    post: PostEditorData
    tagBindings: PostTagBindingInput[]
    publish: boolean
    pushOption: 'none' | 'draft' | 'now'
    pushCriteria?: { categoryIds?: string[], tagIds?: string[] }
}) {
    const publishedAt = options.post.publishedAt
    const isFuture = typeof publishedAt === 'string' || publishedAt instanceof Date
        ? isFutureDate(publishedAt)
        : false
    const payload = { ...options.post } as Record<string, unknown>
    delete payload.category
    delete payload.author
    payload.tagBindings = options.tagBindings

    const publishIntent = {
        ...(options.post.metadata?.publish?.intent || {}),
        pushOption: options.pushOption,
        pushCriteria: options.pushCriteria,
    }

    payload.metadata = {
        ...(payload.metadata as Record<string, unknown> || {}),
        publish: {
            ...((payload.metadata as { publish?: Record<string, unknown> } | undefined)?.publish || {}),
            intent: publishIntent,
        },
    }

    if (options.publish) {
        payload.status = isFuture ? 'scheduled' : 'published'
    }

    return { isFuture, payload, publishIntent }
}

export async function persistPost(options: SavePostOptions, publish: boolean, payload: Record<string, unknown>, isFuture: boolean) {
    if (options.isNew) {
        const response = await $fetch<{ code: number, data: { id?: string, status?: PostStatus } }>('/api/posts', {
            method: 'POST',
            body: payload,
        })

        if (response.code === 200 && response.data?.id) {
            options.post.value.id = response.data.id
            options.post.value.status = response.data.status || PostStatus.DRAFT
            options.clearLocalDraft()
            options.showSuccessToast('common.save_success')
            await navigateTo(options.localePath(`/admin/posts/${response.data.id}`), { replace: true })
        }
        return
    }

    await $fetch(`/api/posts/${options.route.params.id}`, {
        method: 'PUT',
        body: payload,
    })

    if (publish) {
        options.post.value.status = isFuture ? PostStatus.SCHEDULED : PostStatus.PUBLISHED
    }

    options.clearLocalDraft()
    options.showSuccessToast('common.save_success')
}

export function handlePreviewOpen(isNew: boolean, post: Ref<PostEditorData>, localePath: (path: string) => string) {
    if (isNew && !post.value.id) {
        return
    }

    if (import.meta.client) {
        window.open(localePath(`/posts/${post.value.slug || post.value.id}`), '_blank')
    }
}

export function restorePostFromHistory(post: Ref<PostEditorData>, clearLocalDraft: () => void, data: {
    title: string
    content: string
    summary: string | null
    coverImage: string | null
    categoryId: string | null
    visibility: PostVisibility
    copyright: string | null
    metaVersion: number
    metadata: PostEditorData['metadata']
    tags: string[]
}) {
    post.value.title = data.title
    post.value.content = data.content
    post.value.summary = data.summary
    post.value.coverImage = data.coverImage
    post.value.categoryId = data.categoryId
    post.value.visibility = data.visibility
    post.value.copyright = data.copyright
    post.value.metaVersion = data.metaVersion
    post.value.metadata = data.metadata
    post.value.tags = data.tags
    clearLocalDraft()
}

export function searchTagOptions(allTags: Ref<string[]>, filteredTags: Ref<string[]>, event: { query: string }) {
    if (!event.query.trim().length) {
        filteredTags.value = [...allTags.value]
        return
    }

    filteredTags.value = allTags.value.filter((tag) => tag.toLowerCase().startsWith(event.query.toLowerCase()))
}

export function getPostStatusLabel(t: Composer['t'], status: string) {
    const map: Record<string, string> = {
        published: t('common.status.published'),
        scheduled: t('common.status.scheduled'),
        draft: t('common.status.draft'),
        pending: t('common.status.pending'),
        rejected: t('common.status.rejected'),
        hidden: t('common.status.hidden'),
    }
    return map[status] || status
}

export function getPostStatusSeverity(status: string) {
    const map: Record<string, string | undefined> = {
        published: 'success',
        scheduled: 'info',
        draft: 'secondary',
        pending: 'warn',
        rejected: 'danger',
        hidden: 'info',
    }
    return map[status] || 'info'
}
