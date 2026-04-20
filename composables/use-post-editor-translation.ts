import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { ApiResponse } from '@/types/api'
import type { PostEditorData } from '@/types/post-editor'
import { PostStatus, PostVisibility } from '@/types/post'
import type {
    PostTranslationProgress,
    PostTagBindingInput,
    PostTranslationCategoryOption,
    PostTranslationSourceDetail,
    PostTranslationSourceOption,
    PostTranslationTagOption,
    PostTranslationTargetState,
    PostTranslationTargetStatus,
    PostTranslationWorkflowAction,
    PostTranslationWorkflowRequest,
    TranslationScopeField,
} from '@/types/post-translation'
import { createPostTagBinding } from '@/utils/shared/post-tag-bindings'
import { splitAndNormalizeStringList } from '@/utils/shared/string-list'
import { hasSharedTranslationCluster, resolveTranslationClusterId } from '@/utils/shared/translation-cluster'

interface TranslationAudioState {
    metadataAudio: {
        url?: string | null
        duration?: number | null
        size?: number | null
        mimeType?: string | null
    } | null
}

interface LegacyAudioCompat {
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null
}

interface LocaleOption {
    code: string
}

interface TranslationGroupOption {
    label: string
    value: string
}

interface TranslationSearchItem {
    id: string
    title: string
    language: string
    translationId?: string | null
}

interface ToastApi {
    add: (options: {
        severity: string
        summary: string
        detail: string
        life: number
    }) => void
}

interface ConfirmApi {
    require: (options: {
        message: string
        header: string
        icon: string
        acceptProps: {
            label: string
            severity: 'warn' | 'danger'
        }
        rejectProps: {
            label: string
            severity: 'secondary'
            outlined: true
        }
        accept: () => void
        reject: () => void
    }) => void
}

interface UsePostEditorTranslationOptions {
    post: Ref<PostEditorData>
    isNew: ComputedRef<boolean>
    localeItems: ComputedRef<LocaleOption[]>
    categories: Ref<PostTranslationCategoryOption[]>
    tagEntities: Ref<PostTranslationTagOption[]>
    toast: ToastApi
    confirm: ConfirmApi
    t: (key: string) => string
    localePath: (path: string) => string
    loadCategories: (language?: string) => Promise<void>
    loadTags: (language?: string) => Promise<void>
    getTagBindings: () => PostTagBindingInput[]
    applyTagBindings: (bindings: PostTagBindingInput[]) => void
    beginAuxiliaryFieldProgress: (field: 'tags', options?: {
        content?: string
        totalChunks?: number
    }) => void
    completeAuxiliaryFieldProgress: (field: 'tags', options?: {
        content?: string
        totalChunks?: number
        completedChunks?: number
    }) => void
    failAuxiliaryFieldProgress: (field: 'tags', options: {
        error: string
        content?: string
        totalChunks?: number
        completedChunks?: number
    }) => void
    translateTaxonomyNames: (names: string[], targetLanguage: string) => Promise<string[]>
    translatePostFields: (payload: {
        source: PostTranslationSourceDetail
        sourceLanguage: string
        targetLanguage: string
        scopes: TranslationScopeField[]
        auxiliaryFieldExecutor?: (field: 'tags') => Promise<void>
    }) => Promise<boolean>
    translationProgress: Ref<PostTranslationProgress>
    resetTranslationProgress: () => void
}

interface TranslationActionContext {
    options: UsePostEditorTranslationOptions
    translations: Ref<PostTranslationSourceOption[]>
    sourcePostSnapshot: Ref<PostTranslationSourceDetail | null>
    postsForTranslation: Ref<TranslationGroupOption[]>
    hasTranslation: (langCode: string) => PostEditorData | PostTranslationSourceOption | null
}

const DEFAULT_TRANSLATION_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags', 'coverImage']
const AVAILABLE_TRANSLATION_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags', 'coverImage', 'audio']

function hasNestedDraftValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false
    }

    if (typeof value === 'string') {
        return value.trim().length > 0
    }

    if (Array.isArray(value)) {
        return value.some((item) => hasNestedDraftValue(item))
    }

    if (typeof value === 'object') {
        return Object.values(value).some((item) => hasNestedDraftValue(item))
    }

    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        return !Number.isNaN(value)
    }

    return false
}

export function hasUnsavedNewDraftContent(post: PostEditorData): boolean {
    return [
        post.title,
        post.content,
        post.summary,
        post.slug,
        post.coverImage,
        post.password,
        post.copyright,
        post.categoryId,
        post.publishedAt,
        post.isPinned,
        post.visibility !== undefined && post.visibility !== PostVisibility.PUBLIC,
        post.tags,
        post.metadata,
    ].some((item) => hasNestedDraftValue(item))
}

async function navigateToTranslationTarget(
    context: TranslationActionContext,
    langCode: string,
    autoTranslate = false,
    overrideOptions?: {
        sourceId?: string | null
        scopes?: TranslationScopeField[]
    },
) {
    const targetTranslation = context.hasTranslation(langCode)
    const sourceId = overrideOptions?.sourceId || context.options.post.value.id || context.sourcePostSnapshot.value?.id || null
    const isUnsavedNewDraft = context.options.isNew.value && !context.options.post.value.id

    if (isUnsavedNewDraft && hasUnsavedNewDraftContent(context.options.post.value)) {
        context.options.toast.add({
            severity: 'warn',
            summary: context.options.t('common.warn'),
            detail: context.options.t('pages.admin.posts.save_current_first'),
            life: 3000,
        })
        return
    }

    const autoTranslateQuery = autoTranslate
        ? {
            autoTranslate: 'true',
            sourceId: sourceId || undefined,
            translationScopes: serializeTranslationScopes(overrideOptions?.scopes || DEFAULT_TRANSLATION_SCOPES),
        }
        : undefined

    if (targetTranslation?.id) {
        await navigateTo({
            path: context.options.localePath(`/admin/posts/${targetTranslation.id}`),
            query: autoTranslateQuery,
        })
        return
    }

    await navigateTo({
        path: context.options.localePath('/admin/posts/new'),
        query: {
            language: langCode,
            sourceId: sourceId || undefined,
            translationId: context.options.post.value.translationId || context.sourcePostSnapshot.value?.translationId || sourceId || undefined,
            ...autoTranslateQuery,
        },
    })
}

async function searchTranslationPosts(context: TranslationActionContext, event: { query: string }) {
    if (!event.query.trim()) {
        return
    }

    try {
        const { data } = await $fetch<ApiResponse<{ items: TranslationSearchItem[] }>>('/api/posts', {
            query: {
                search: event.query,
                limit: 10,
                scope: 'manage',
            },
        })

        context.postsForTranslation.value = data.items
            .filter((item) => item.id !== context.options.post.value.id)
            .map((item) => ({
                label: `[${item.language}] ${item.title}`,
                value: item.translationId || item.id,
            }))
    } catch (error) {
        console.error('Failed to search posts', error)
    }
}

async function syncTranslations(context: TranslationActionContext, translationId: string) {
    if (!translationId?.trim()) {
        context.translations.value = []
        return
    }

    try {
        const { data } = await $fetch<ApiResponse<{ items: PostTranslationSourceOption[] }>>('/api/posts', {
            query: { translationId, limit: 10, scope: 'manage' },
        })
        context.translations.value = data.items.filter((item) => item.id !== context.options.post.value.id)
    } catch (error) {
        console.error('Failed to fetch translations', error)
    }
}

function serializeTranslationScopes(scopes: TranslationScopeField[]) {
    const normalizedScopes = Array.from(new Set(
        scopes.filter((scope) => AVAILABLE_TRANSLATION_SCOPES.includes(scope)),
    ))

    return normalizedScopes.length > 0 ? normalizedScopes.join(',') : undefined
}

function getLegacyAudioState(value: LegacyAudioCompat) {
    const audioUrl = value.audioUrl ?? null
    const audioDuration = value.audioDuration ?? null
    const audioSize = value.audioSize ?? null
    const audioMimeType = value.audioMimeType ?? null
    const hasAudio = Boolean(audioUrl)
        || audioDuration !== null
        || audioSize !== null
        || Boolean(audioMimeType)

    return hasAudio
        ? {
            url: audioUrl,
            duration: audioDuration,
            size: audioSize,
            mimeType: audioMimeType,
        }
        : null
}

function getAudioState(value: Pick<PostTranslationSourceDetail, 'metadata'> & LegacyAudioCompat): TranslationAudioState {
    const metadataAudio = value.metadata?.audio && typeof value.metadata.audio === 'object'
        ? { ...value.metadata.audio }
        : null
    const resolvedAudio = metadataAudio || getLegacyAudioState(value)

    return {
        metadataAudio: resolvedAudio ? { ...resolvedAudio } : null,
    }
}

function syncLegacyAudioState(target: LegacyAudioCompat, audio: TranslationAudioState['metadataAudio']) {
    target.audioUrl = audio?.url ?? null
    target.audioDuration = audio?.duration ?? null
    target.audioSize = audio?.size ?? null
    target.audioMimeType = audio?.mimeType ?? null
}

function applyAudioState(post: Ref<PostEditorData>, state: TranslationAudioState) {
    const nextMetadata = post.value.metadata && typeof post.value.metadata === 'object'
        ? { ...post.value.metadata }
        : {}

    if (state.metadataAudio) {
        nextMetadata.audio = { ...state.metadataAudio }
    } else {
        delete nextMetadata.audio
    }

    post.value.metadata = Object.keys(nextMetadata).length > 0 ? nextMetadata : null
    syncLegacyAudioState(post.value as PostEditorData & LegacyAudioCompat, state.metadataAudio)
}

export function usePostEditorTranslation(options: UsePostEditorTranslationOptions) {
    const translations = ref<PostTranslationSourceOption[]>([])
    const sourcePostSnapshot = ref<PostTranslationSourceDetail | null>(null)
    const translationDialogVisible = ref(false)
    const translationWorkflowDefaults = ref({
        sourcePostId: null as string | null,
        targetLanguage: options.post.value.language,
        scopes: [...DEFAULT_TRANSLATION_SCOPES],
    })
    const postsForTranslation = ref<TranslationGroupOption[]>([])

    const parseTranslationScopes = (value: string | string[] | undefined) => {
        const rawValue = Array.isArray(value) ? value[0] : value
        if (!rawValue) {
            return [...DEFAULT_TRANSLATION_SCOPES]
        }

        const scopes = splitAndNormalizeStringList(rawValue, {
            dedupe: true,
            delimiters: ',',
        })
            .filter((item): item is TranslationScopeField => AVAILABLE_TRANSLATION_SCOPES.includes(item as TranslationScopeField))

        return scopes.length > 0 ? scopes : [...DEFAULT_TRANSLATION_SCOPES]
    }

    const hasTranslation = (langCode: string) => {
        if (options.post.value.language === langCode && !options.isNew.value) {
            return options.post.value
        }

        return translations.value.find((item) => item.language === langCode) || null
    }

    const resolveTranslationTargetStatus = (langCode: string): PostTranslationTargetStatus => {
        if (langCode === options.post.value.language) {
            if (options.isNew.value && !options.post.value.id) {
                return {
                    language: langCode,
                    state: 'missing',
                    action: 'create',
                    postId: null,
                    isCurrentEditor: true,
                }
            }

            const state: PostTranslationTargetState = options.post.value.status === PostStatus.PUBLISHED ? 'published' : 'draft'

            return {
                language: langCode,
                state,
                action: state === 'published' ? 'overwrite' : 'continue',
                postId: options.post.value.id || null,
                isCurrentEditor: true,
            }
        }

        const targetTranslation = translations.value.find((item) => item.language === langCode)
        if (!targetTranslation) {
            return {
                language: langCode,
                state: 'missing',
                action: 'create',
                postId: null,
                isCurrentEditor: false,
            }
        }

        const state: PostTranslationTargetState = targetTranslation.status === PostStatus.PUBLISHED ? 'published' : 'draft'

        return {
            language: langCode,
            state,
            action: state === 'published' ? 'overwrite' : 'continue',
            postId: targetTranslation.id,
            isCurrentEditor: false,
        }
    }

    const translationTargetStatuses = computed<PostTranslationTargetStatus[]>(() =>
        options.localeItems.value.map((item) => resolveTranslationTargetStatus(item.code)),
    )

    const actionContext: TranslationActionContext = {
        options,
        translations,
        sourcePostSnapshot,
        postsForTranslation,
        hasTranslation,
    }

    const handleTranslationClick = async (
        langCode: string,
        autoTranslate = false,
        overrideOptions?: {
            sourceId?: string | null
            scopes?: TranslationScopeField[]
        },
    ) => {
        await navigateToTranslationTarget(actionContext, langCode, autoTranslate, overrideOptions)
    }

    const searchPosts = async (event: { query: string }) => {
        await searchTranslationPosts(actionContext, event)
    }

    const translationSourceOptions = computed<PostTranslationSourceOption[]>(() => {
        const sourceMap = new Map<string, PostTranslationSourceOption>()

        const upsert = (item: PostTranslationSourceOption | null | undefined) => {
            if (!item?.id) {
                return
            }

            sourceMap.set(item.id, item)
        }

        upsert(sourcePostSnapshot.value)

        if (options.post.value.id) {
            upsert({
                id: options.post.value.id,
                title: options.post.value.title,
                language: options.post.value.language,
                translationId: options.post.value.translationId,
                status: options.post.value.status,
            })
        }

        translations.value.forEach(upsert)

        return Array.from(sourceMap.values())
    })

    const resolveMatchedCategoryId = (
        sourceCategory: PostTranslationSourceDetail['category'],
        sourceLanguage: string,
    ) => {
        if (!sourceCategory) {
            return null
        }

        const allowIdFallback = sourceLanguage === options.post.value.language
        const matchedCategory = options.categories.value.find((category) => hasSharedTranslationCluster(sourceCategory, category, {
            includeSourceId: allowIdFallback,
            includeTargetId: allowIdFallback,
        }))

        return matchedCategory?.id || null
    }

    const resolveTranslatedTagBindings = async (
        sourceTags: PostTranslationSourceDetail['tags'],
        sourceLanguage: string,
        targetLanguage: string,
    ) => {
        if (!sourceTags?.length) {
            return []
        }

        const allowIdFallback = sourceLanguage === options.post.value.language
        const resolvedTags = new Array<PostTagBindingInput | null>(sourceTags.length).fill(null)
        const pendingTranslations: { index: number, tag: NonNullable<PostTranslationSourceDetail['tags']>[number] }[] = []

        sourceTags.forEach((tag, index) => {
            const matchedTag = options.tagEntities.value.find((targetTag) => hasSharedTranslationCluster(tag, targetTag, {
                includeSourceId: allowIdFallback,
                includeTargetId: allowIdFallback,
            }))

            if (matchedTag?.name) {
                resolvedTags[index] = createPostTagBinding({
                    name: matchedTag.name,
                    source: tag,
                    target: matchedTag,
                })
                return
            }

            if (allowIdFallback && tag.name) {
                resolvedTags[index] = createPostTagBinding({
                    name: tag.name,
                    source: tag,
                })
                return
            }

            if (!tag.name?.trim()) {
                return
            }

            pendingTranslations.push({ index, tag })
        })

        if (pendingTranslations.length > 0) {
            const translatedNames = await options.translateTaxonomyNames(
                pendingTranslations.map(({ tag }) => tag.name),
                targetLanguage,
            )

            if (translatedNames.length !== pendingTranslations.length) {
                throw new Error('Invalid translated tag names count')
            }

            pendingTranslations.forEach(({ index, tag }, translatedIndex) => {
                resolvedTags[index] = createPostTagBinding({
                    name: translatedNames[translatedIndex] || tag.name,
                    source: tag,
                })
            })
        }

        return Array.from(new Map(resolvedTags
            .filter((item): item is PostTagBindingInput => Boolean(item))
            .map((item) => [
                resolveTranslationClusterId(item.translationId, item.sourceTagSlug, item.sourceTagId)
                || item.name.toLowerCase(),
                item,
            ])).values())
    }

    const hasSelectedScopesContent = (scopes: TranslationScopeField[]) => scopes.some((scope) => {
        if (scope === 'title') {
            return Boolean(options.post.value.title?.trim())
        }

        if (scope === 'content') {
            return Boolean(options.post.value.content?.trim())
        }

        if (scope === 'summary') {
            return Boolean(options.post.value.summary?.trim())
        }

        if (scope === 'category') {
            return Boolean(options.post.value.categoryId)
        }

        if (scope === 'coverImage') {
            return Boolean(options.post.value.coverImage)
        }

        if (scope === 'audio') {
            return Boolean(getAudioState(options.post.value as PostEditorData & LegacyAudioCompat).metadataAudio?.url)
        }

        return (options.post.value.tags?.length || 0) > 0
    })

    const confirmTranslationOverwrite = async (
        scopes: TranslationScopeField[],
        targetState: PostTranslationTargetState,
        action: PostTranslationWorkflowAction,
    ) => {
        if (targetState === 'missing' || (options.isNew.value && !options.post.value.id) || !hasSelectedScopesContent(scopes)) {
            return true
        }

        const requestConfirm = (message: string, confirmOptions?: { header?: string, severity?: 'warn' | 'danger' }) => new Promise<boolean>((resolve) => {
            options.confirm.require({
                message,
                header: confirmOptions?.header || options.t('pages.admin.posts.translation_workflow.overwrite_title'),
                icon: 'pi pi-exclamation-triangle',
                acceptProps: {
                    label: options.t('common.confirm'),
                    severity: confirmOptions?.severity || 'danger',
                },
                rejectProps: {
                    label: options.t('common.cancel'),
                    severity: 'secondary',
                    outlined: true,
                },
                accept: () => resolve(true),
                reject: () => resolve(false),
            })
        })

        if (targetState === 'published') {
            const firstConfirmed = await requestConfirm(options.t('pages.admin.posts.translation_workflow.overwrite_published_first'), {
                severity: 'danger',
            })
            if (!firstConfirmed) {
                return false
            }

            return await requestConfirm(options.t('pages.admin.posts.translation_workflow.overwrite_published_second'), {
                severity: 'danger',
            })
        }

        return await requestConfirm(
            action === 'continue'
                ? options.t('pages.admin.posts.translation_workflow.continue_draft')
                : options.t('pages.admin.posts.translation_workflow.overwrite_draft'),
            {
                header: options.t('pages.admin.posts.translation_workflow.continue_title'),
                severity: 'warn',
            },
        )
    }

    const fetchSourcePostDetail = async (postId: string) => {
        if (sourcePostSnapshot.value?.id === postId) {
            return sourcePostSnapshot.value
        }

        const response = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${postId}`)
        return response.data
    }

    const openTranslationWorkflow = async (requestedLanguage: string | null) => {
        const targetLanguage = requestedLanguage || options.post.value.language

        if (targetLanguage !== options.post.value.language && options.post.value.id && !options.isNew.value) {
            await handleTranslationClick(targetLanguage, true)
            return
        }

        options.resetTranslationProgress()
        translationWorkflowDefaults.value = {
            sourcePostId: sourcePostSnapshot.value?.id || options.post.value.id || translations.value[0]?.id || null,
            targetLanguage,
            scopes: [...DEFAULT_TRANSLATION_SCOPES],
        }

        translationDialogVisible.value = true
    }

    const handleStartTranslationWorkflow = async (payload: PostTranslationWorkflowRequest) => {
        if (payload.sourceLanguage === payload.targetLanguage) {
            options.toast.add({
                severity: 'warn',
                summary: options.t('common.warn'),
                detail: options.t('pages.admin.posts.translation_workflow.same_language_warning'),
                life: 4000,
            })
            return
        }

        if (payload.targetLanguage !== options.post.value.language) {
            translationDialogVisible.value = false
            await handleTranslationClick(payload.targetLanguage, true, {
                sourceId: payload.sourcePostId,
                scopes: payload.scopes,
            })
            return
        }

        const source = await fetchSourcePostDetail(payload.sourcePostId)
        if (!source) {
            return
        }

        const confirmed = await confirmTranslationOverwrite(payload.scopes, payload.targetState, payload.action)
        if (!confirmed) {
            return
        }

        if (options.post.value.language !== payload.targetLanguage) {
            options.post.value.language = payload.targetLanguage
            await Promise.all([
                options.loadCategories(payload.targetLanguage),
                options.loadTags(payload.targetLanguage),
            ])
        }

        options.post.value.translationId = resolveTranslationClusterId(source.translationId, source.slug, source.id)

        const translated = await options.translatePostFields({
            source,
            sourceLanguage: payload.sourceLanguage,
            targetLanguage: payload.targetLanguage,
            scopes: payload.scopes,
            auxiliaryFieldExecutor: async (field) => {
                if (field !== 'tags' || !payload.scopes.includes('tags')) {
                    return
                }

                const sourceTags = source.tags || []
                options.beginAuxiliaryFieldProgress('tags', {
                    content: options.post.value.tags.join(', '),
                    totalChunks: sourceTags.length,
                })

                try {
                    const translatedTagBindings = await resolveTranslatedTagBindings(sourceTags, source.language, payload.targetLanguage)
                    options.applyTagBindings(translatedTagBindings)
                    options.completeAuxiliaryFieldProgress('tags', {
                        content: translatedTagBindings.map((binding) => binding.name).join(', '),
                        totalChunks: sourceTags.length,
                        completedChunks: sourceTags.length,
                    })
                } catch (error) {
                    console.error('Failed to resolve translated taxonomy bindings', error)
                    options.failAuxiliaryFieldProgress('tags', {
                        error: error instanceof Error ? error.message : options.t('pages.admin.posts.ai_error'),
                        content: options.post.value.tags.join(', '),
                        totalChunks: sourceTags.length,
                        completedChunks: 0,
                    })
                    options.toast.add({
                        severity: 'error',
                        summary: options.t('common.error'),
                        detail: options.t('pages.admin.posts.ai_error'),
                        life: 4000,
                    })
                }
            },
        })

        if (!translated) {
            return
        }

        try {
            if (payload.scopes.includes('category')) {
                options.post.value.categoryId = resolveMatchedCategoryId(source.category, source.language)
            }

            if (payload.scopes.includes('coverImage')) {
                options.post.value.coverImage = source.coverImage || ''
            }

            if (payload.scopes.includes('audio')) {
                applyAudioState(options.post, getAudioState(source))
            }
        } catch (error) {
            console.error('Failed to resolve translated taxonomy bindings', error)
            options.toast.add({
                severity: 'error',
                summary: options.t('common.error'),
                detail: options.t('pages.admin.posts.ai_error'),
                life: 4000,
            })
            return
        }

        if (options.translationProgress.value.status === 'failed' || options.translationProgress.value.status === 'cancelled') {
            return
        }

        translationDialogVisible.value = false
    }

    const fetchTranslations = async (translationId: string) => {
        await syncTranslations(actionContext, translationId)
    }

    return {
        postsForTranslation,
        translations,
        sourcePostSnapshot,
        translationDialogVisible,
        translationWorkflowDefaults,
        translationSourceOptions,
        translationTargetStatuses,
        hasTranslation,
        searchPosts,
        handleTranslationClick,
        openTranslationWorkflow,
        handleStartTranslationWorkflow,
        fetchTranslations,
        parseTranslationScopes,
        serializeTranslationScopes,
        resolveMatchedCategoryId,
        resolveTranslatedTagBindings,
    }
}
