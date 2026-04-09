import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import type { ApiResponse } from '@/types/api'
import { PostStatus, PostVisibility, type PublishIntent } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTagBindingInput,
    PostTranslationCategoryOption,
    PostTranslationTagOption,
} from '@/types/post-translation'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { COPYRIGHT_LICENSES } from '@/types/copyright'
import { usePostEditorAI } from '@/composables/use-post-editor-ai'
import { usePostEditorAutoSave } from '@/composables/use-post-editor-auto-save'
import { usePostEditorDirtyState } from '@/composables/use-post-editor-dirty-state'
import { usePostEditorIO } from '@/composables/use-post-editor-io'
import {
    buildSavePayload,
    getPostStatusLabel,
    getPostStatusSeverity,
    handlePreviewOpen,
    loadExistingPostDetail,
    persistPost,
    preloadSourcePost,
    restorePostFromHistory,
    searchTagOptions,
    type PublishPushDialogExpose,
} from '@/composables/use-post-editor-page.helpers'
import { hasUnsavedNewDraftContent, usePostEditorTranslation } from '@/composables/use-post-editor-translation'
import { usePostTranslationAI } from '@/composables/use-post-translation-ai'
import { useRequestFeedback } from '@/composables/use-request-feedback'
import { formatMarkdown } from '@/utils/shared/markdown-formatter'
import { syncPostTagBindings } from '@/utils/shared/post-tag-bindings'
import { buildPreferredTaxonomyOptions } from '@/utils/shared/taxonomy-options'

interface LocaleOption {
    code: string
}

interface HeaderExpose {
    titleOp?: unknown
    openDistribution?: () => Promise<void>
}

interface MarkdownEditorExpose {
    $img2Url?: (position: number, url: string) => void
}

interface RestorePostPayload {
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
}

function areRouteQueryValuesEqual(current: string | string[] | undefined, previous: string | string[] | undefined) {
    if (Array.isArray(current) || Array.isArray(previous)) {
        if (!Array.isArray(current) || !Array.isArray(previous) || current.length !== previous.length) {
            return false
        }

        return current.every((item, index) => item === previous[index])
    }

    return current === previous
}

function createInitialPostState(options: {
    routeLanguage: string | undefined
    routeTranslationId: string | undefined
    contentLanguage: string | null | undefined
    locale: string
}): PostEditorData {
    return {
        title: '',
        content: '',
        slug: '',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        password: null,
        summary: '',
        coverImage: '',
        metadata: null,
        categoryId: null,
        copyright: null,
        tags: [],
        isPinned: false,
        language: options.routeLanguage || options.contentLanguage || options.locale,
        translationId: options.routeTranslationId || null,
        views: 0,
    }
}

function restoreEditorPostState(
    post: Ref<PostEditorData>,
    clearLocalDraft: () => void,
    data: {
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
    },
) {
    restorePostFromHistory(post, clearLocalDraft, data)
}

function openPostPreview(
    isNew: boolean,
    post: Ref<PostEditorData>,
    localePath: ReturnType<typeof useLocalePath>,
) {
    handlePreviewOpen(isNew, post, localePath)
}

export function usePostEditorPage() {
    const { t, locale, locales } = useI18n()
    const localePath = useLocalePath()
    const config = useRuntimeConfig()
    const { contentLanguage } = useAdminI18n()

    const route = useRoute()
    const toast = useToast()
    const confirm = useConfirm()
    const { showErrorToast, showSuccessToast } = useRequestFeedback()

    const md = ref<MarkdownEditorExpose | null>(null)
    const headerRef = ref<HeaderExpose | null>(null)

    const localeItems = computed(() => (locales.value || []) as LocaleOption[])
    const languageOptions = computed(() =>
        localeItems.value.map((item) => ({
            label: t(`common.languages.${item.code}`),
            value: item.code,
        })),
    )

    const licenseOptions = computed(() => Object.keys(COPYRIGHT_LICENSES).map((key) => ({
        label: t(`components.post.copyright.licenses.${key}`),
        value: key,
    })))

    const visibilityOptions = computed(() => [
        { label: t('pages.admin.posts.visibility_options.public'), value: PostVisibility.PUBLIC },
        { label: t('pages.admin.posts.visibility_options.private'), value: PostVisibility.PRIVATE },
        { label: t('pages.admin.posts.visibility_options.password'), value: PostVisibility.PASSWORD },
        { label: t('pages.admin.posts.visibility_options.registered'), value: PostVisibility.REGISTERED },
        { label: t('pages.admin.posts.visibility_options.subscriber'), value: PostVisibility.SUBSCRIBER },
    ])

    const defaultLicenseLabel = computed(() => {
        const key = config.public.postCopyright || config.public.defaultCopyright || 'all-rights-reserved'
        return t(`components.post.copyright.licenses.${key}`)
    })

    const post = ref<PostEditorData>(createInitialPostState({
        routeLanguage: route.query.language as string | undefined,
        routeTranslationId: route.query.translationId as string | undefined,
        contentLanguage: contentLanguage.value,
        locale: locale.value,
    }))

    const filteredTags = ref<string[]>([])
    const allTags = ref<string[]>([])
    const tagEntities = ref<PostTranslationTagOption[]>([])
    const tagBindings = ref<PostTagBindingInput[]>([])
    const categories = ref<PostTranslationCategoryOption[]>([])
    const errors = ref<Record<string, string>>({})

    const isNew = computed(() => route.params.id === 'new' || !route.params.id)
    const settingsVisible = ref(isNew.value)
    const settingsCompact = ref(false)
    const historyVisible = ref(false)
    const publishPushDialog = ref<PublishPushDialogExpose | null>(null)
    const saving = ref(false)

    const {
        aiLoading,
        titleSuggestions,
        titleOp,
        suggestTitles,
        selectTitle,
        suggestSlug,
        suggestSummary,
        recommendTags,
    } = usePostEditorAI(
        post,
        allTags,
        computed({
            get: () => post.value.tags,
            set: (value) => {
                post.value.tags = value
            },
        }),
    )

    const {
        beginAuxiliaryFieldProgress,
        cancelFieldTranslation,
        completeAuxiliaryFieldProgress,
        failAuxiliaryFieldProgress,
        resetTranslationProgress,
        retryFieldTranslation,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
    } = usePostTranslationAI(post)

    const applyTagBindings = (bindings: PostTagBindingInput[]) => {
        tagBindings.value = syncPostTagBindings(
            bindings.map((binding) => binding.name),
            bindings,
            tagEntities.value,
        )
        post.value.tags = tagBindings.value.map((binding) => binding.name)
    }

    watch(headerRef, (header) => {
        if (header) {
            titleOp.value = header.titleOp
        }
    })

    const { isDragging, onDragOver, onDragLeave, onDrop, imgAdd } = usePostEditorIO(
        post,
        computed({
            get: () => post.value.tags,
            set: (value) => {
                post.value.tags = value
            },
        }),
        categories,
        md,
    )

    const {
        hasRecoverableDraft,
        recoverDraft,
        clearLocalDraft,
    } = usePostEditorAutoSave(post, isNew)

    async function loadCategories(language = post.value.language) {
        try {
            const response = await $fetch<ApiResponse<{ items: PostTranslationCategoryOption[] }>>('/api/categories', {
                query: { limit: 100, language, aggregate: true },
            })

            if (response.data) {
                categories.value = buildPreferredTaxonomyOptions(response.data.items, {
                    contentLanguage: language,
                    uiLanguage: locale.value,
                })
            }
        } catch (error) {
            console.error('Failed to load categories', error)
        }
    }

    async function loadTags(language = post.value.language) {
        try {
            const response = await $fetch<ApiResponse<{ items: PostTranslationTagOption[] }>>('/api/tags', {
                query: { limit: 100, language },
            })

            if (response.data) {
                tagEntities.value = response.data.items
                allTags.value = response.data.items.map((tag) => tag.name)
            }
        } catch (error) {
            console.error('Failed to load tags', error)
        }
    }

    const {
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
        resolveMatchedCategoryId,
        resolveTranslatedTagBindings,
    } = usePostEditorTranslation({
        post,
        isNew,
        localeItems,
        categories,
        tagEntities,
        toast,
        confirm,
        t,
        localePath,
        loadCategories,
        loadTags,
        getTagBindings: () => tagBindings.value,
        applyTagBindings,
        beginAuxiliaryFieldProgress,
        completeAuxiliaryFieldProgress,
        failAuxiliaryFieldProgress,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
        resetTranslationProgress,
    })

    const { syncSavedSnapshot } = usePostEditorDirtyState({
        post,
        saving,
        leaveMessage: computed(() => t('pages.admin.settings.system.floating_actions.leave_confirm')),
    })

    const handlePreview = () => openPostPreview(isNew.value, post, localePath)

    const handleRestore = (data: RestorePostPayload) => restoreEditorPostState(post, clearLocalDraft, data)

    const loadPost = async () => {
        const loadOptions = {
            route,
            post,
            sourcePostSnapshot,
            translationWorkflowDefaults,
            translationDialogVisible,
            loadCategories,
            loadTags,
            fetchTranslations,
            parseTranslationScopes,
            resolveTranslatedTagBindings,
            resolveMatchedCategoryId,
            applyTagBindings,
            hasRecoverableDraft,
            recoverDraft,
            clearLocalDraft,
            confirm,
            t,
            showSuccessToast,
        }

        if (isNew.value) {
            await preloadSourcePost(loadOptions)
            return
        }

        await loadExistingPostDetail(loadOptions)
        syncSavedSnapshot()
    }

    const searchTags = (event: { query: string }) => {
        searchTagOptions(allTags, filteredTags, event)
    }

    const handlePublishConfirm = async (options: {
        pushOption: 'none' | 'draft' | 'now'
        publishedAt?: Date | null
        pushCriteria?: { categoryIds?: string[], tagIds?: string[] }
    }) => {
        if (publishPushDialog.value) {
            publishPushDialog.value.visible = false
        }

        post.value.publishedAt = options.publishedAt ? options.publishedAt.toISOString() : null
        await executeSave(true, options.pushOption, options.pushCriteria)
    }

    const savePost = async (publish = false) => {
        if (publish && post.value.status !== PostStatus.PUBLISHED) {
            publishPushDialog.value?.open?.({
                publishedAt: post.value.publishedAt,
                criteria: {
                    categoryIds: post.value.categoryId ? [post.value.categoryId] : [],
                    tagIds: post.value.tags || [],
                },
            })
            return
        }

        await executeSave(publish)
    }

    const executeSave = async (
        publish = false,
        pushOption: 'none' | 'draft' | 'now' = 'none',
        pushCriteria?: { categoryIds?: string[], tagIds?: string[] },
    ) => {
        errors.value = {}

        if (post.value.content) {
            post.value.content = await formatMarkdown(post.value.content)
        }

        const { isFuture, payload, publishIntent } = buildSavePayload({
            post: post.value,
            tagBindings: tagBindings.value,
            publish,
            pushOption,
            pushCriteria,
        })
        post.value.metadata = {
            ...(post.value.metadata || {}),
            publish: {
                ...(post.value.metadata?.publish || {}),
                intent: publishIntent as PublishIntent,
            },
        }

        const schema = isNew.value ? createPostSchema : updatePostSchema
        const result = schema.safeParse(payload)
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                errors.value[String(issue.path[0])] = issue.message
            })

            const drawerFields = [
                'language',
                'translationId',
                'slug',
                'categoryId',
                'category',
                'tags',
                'isPinned',
                'copyright',
                'publishedAt',
                'summary',
                'coverImage',
            ]
            const hasDrawerError = result.error.issues.some((issue) => drawerFields.includes(String(issue.path[0])))
            if (hasDrawerError) {
                settingsVisible.value = true
            }

            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('common.validation_error'),
                life: 5000,
            })
            return
        }

        saving.value = true
        try {
            await persistPost({
                post,
                isNew: isNew.value,
                route,
                localePath,
                clearLocalDraft,
                showSuccessToast,
            }, publish, payload, isFuture)
            syncSavedSnapshot()
        } catch (error) {
            console.error('Failed to save post', error)
            showErrorToast(error, {
                fallbackKey: 'common.save_failed',
            })
        } finally {
            saving.value = false
        }
    }

    const getStatusLabel = (status: string) => getPostStatusLabel(t, status)

    const getStatusSeverity = (status: string) => getPostStatusSeverity(status)

    watch(
        () => post.value.language,
        () => {
            void loadCategories()
            void loadTags()
        },
    )

    watch(
        () => post.value.tags,
        (tagNames) => {
            tagBindings.value = syncPostTagBindings(tagNames, tagBindings.value, tagEntities.value)
        },
        { deep: true },
    )

    watch(
        tagEntities,
        (nextTagEntities) => {
            tagBindings.value = syncPostTagBindings(post.value.tags, tagBindings.value, nextTagEntities)
        },
        { deep: true },
    )

    watch(
        () => locale.value,
        () => {
            void loadCategories()
        },
    )

    watch(
        () => ({
            language: route.query.language as string | string[] | undefined,
            sourceId: route.query.sourceId as string | string[] | undefined,
            translationId: route.query.translationId as string | string[] | undefined,
            autoTranslate: route.query.autoTranslate as string | string[] | undefined,
            translationScopes: route.query.translationScopes as string | string[] | undefined,
        }),
        async (nextQuery, previousQuery) => {
            if (!isNew.value || post.value.id) {
                return
            }

            if (
                previousQuery
                && areRouteQueryValuesEqual(nextQuery.language, previousQuery.language)
                && areRouteQueryValuesEqual(nextQuery.sourceId, previousQuery.sourceId)
                && areRouteQueryValuesEqual(nextQuery.translationId, previousQuery.translationId)
                && areRouteQueryValuesEqual(nextQuery.autoTranslate, previousQuery.autoTranslate)
                && areRouteQueryValuesEqual(nextQuery.translationScopes, previousQuery.translationScopes)
            ) {
                return
            }

            if (hasUnsavedNewDraftContent(post.value)) {
                return
            }

            post.value = createInitialPostState({
                routeLanguage: route.query.language as string | undefined,
                routeTranslationId: route.query.translationId as string | undefined,
                contentLanguage: contentLanguage.value,
                locale: locale.value,
            })
            syncSavedSnapshot()
            applyTagBindings([])
            translations.value = []
            sourcePostSnapshot.value = null
            translationDialogVisible.value = false

            await loadPost()
            await Promise.all([
                loadCategories(post.value.language),
                loadTags(post.value.language),
            ])
        },
    )

    onMounted(() => {
        void loadPost()
        void loadCategories()
        void loadTags()
    })

    return {
        md,
        headerRef,
        locales,
        languageOptions,
        licenseOptions,
        visibilityOptions,
        defaultLicenseLabel,
        post,
        translations,
        translationDialogVisible,
        translationWorkflowDefaults,
        filteredTags,
        allTags,
        tagEntities,
        isNew,
        settingsVisible,
        settingsCompact,
        historyVisible,
        publishPushDialog,
        aiLoading,
        titleSuggestions,
        suggestTitles,
        selectTitle,
        suggestSlug,
        suggestSummary,
        recommendTags,
        cancelFieldTranslation,
        retryFieldTranslation,
        translationProgress,
        categories,
        errors,
        isDragging,
        onDragOver,
        onDragLeave,
        onDrop,
        imgAdd,
        saving,
        postsForTranslation,
        translationSourceOptions,
        translationTargetStatuses,
        hasTranslation,
        handleTranslationClick,
        searchPosts,
        openTranslationWorkflow,
        handleStartTranslationWorkflow,
        handlePreview,
        handleRestore,
        searchTags,
        handlePublishConfirm,
        savePost,
        getStatusLabel,
        getStatusSeverity,
    }
}
