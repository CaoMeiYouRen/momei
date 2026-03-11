import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import type { ApiResponse } from '@/types/api'
import { PostStatus, PostVisibility, type PublishIntent } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationCategoryOption,
    PostTranslationSourceDetail,
    PostTranslationTagOption,
} from '@/types/post-translation'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { COPYRIGHT_LICENSES } from '@/types/copyright'
import { usePostEditorAI } from '@/composables/use-post-editor-ai'
import { usePostEditorAutoSave } from '@/composables/use-post-editor-auto-save'
import { usePostEditorIO } from '@/composables/use-post-editor-io'
import { usePostEditorTranslation } from '@/composables/use-post-editor-translation'
import { usePostTranslationAI } from '@/composables/use-post-translation-ai'
import { useRequestFeedback } from '@/composables/use-request-feedback'
import { formatMarkdown } from '@/utils/shared/markdown'
import { buildPreferredTaxonomyOptions } from '@/utils/shared/taxonomy-options'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import { isFutureDate } from '@/utils/shared/date'

interface LocaleOption {
    code: string
}

interface HeaderExpose {
    titleOp?: unknown
}

interface PublishPushDialogExpose {
    visible?: boolean
    open?: (options: {
        syncToMemos: boolean
        publishedAt?: string | Date | null
        criteria?: { categoryIds?: string[], tagIds?: string[] }
    }) => void
}

interface MarkdownEditorExpose {
    $img2Url?: (position: number, url: string) => void
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
        const key = config.public.defaultCopyright || 'all-rights-reserved'
        return t(`components.post.copyright.licenses.${key}`)
    })

    const post = ref<PostEditorData>({
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
        language:
            (route.query.language as string)
            || contentLanguage.value
            || locale.value,
        translationId: (route.query.translationId as string) || null,
        views: 0,
    })

    const filteredTags = ref<string[]>([])
    const allTags = ref<string[]>([])
    const tagEntities = ref<PostTranslationTagOption[]>([])
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
        resetTranslationProgress,
        translatePostFields,
        translationProgress,
    } = usePostTranslationAI(post)

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
        resolveMatchedTagNames,
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
        translatePostFields,
        resetTranslationProgress,
    })

    const handlePreview = () => {
        if (isNew.value && !post.value.id) {
            return
        }

        if (import.meta.client) {
            window.open(localePath(`/posts/${post.value.slug || post.value.id}`), '_blank')
        }
    }

    const handleRestore = (data: { title: string, content: string, summary: string | null }) => {
        post.value.title = data.title
        post.value.content = data.content
        post.value.summary = data.summary
    }

    const loadPost = async () => {
        if (isNew.value) {
            const sourceId = route.query.sourceId as string

            if (sourceId) {
                try {
                    const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${sourceId}`)
                    if (data) {
                        sourcePostSnapshot.value = data
                        post.value.title = data.title
                        post.value.summary = data.summary
                        post.value.content = data.content
                        post.value.coverImage = data.coverImage
                        post.value.tags = resolveMatchedTagNames(data.tags || [], data.language)
                        post.value.translationId = resolveTranslationClusterId(data.translationId, data.slug, data.id)
                        post.value.slug = data.slug || ''
                        post.value.copyright = data.copyright
                        post.value.categoryId = resolveMatchedCategoryId(data.category, data.language)

                        const stopTaxonomySync = watch(
                            [categories, tagEntities],
                            ([nextCategories, nextTags]) => {
                                if (nextCategories.length === 0 && nextTags.length === 0) {
                                    return
                                }

                                post.value.categoryId = resolveMatchedCategoryId(data.category, data.language)
                                post.value.tags = resolveMatchedTagNames(data.tags || [], data.language)

                                if (nextCategories.length > 0 && nextTags.length > 0) {
                                    stopTaxonomySync()
                                }
                            },
                            { immediate: true },
                        )
                    }
                } catch (error) {
                    console.error('Failed to pre-fill from source post', error)
                }
            }

            if (route.query.translationId) {
                void fetchTranslations(route.query.translationId as string)
            }

            if (route.query.autoTranslate === 'true') {
                translationWorkflowDefaults.value = {
                    sourcePostId: sourceId || sourcePostSnapshot.value?.id || null,
                    targetLanguage: post.value.language,
                    scopes: parseTranslationScopes(route.query.translationScopes as string | string[] | undefined),
                }
                translationDialogVisible.value = true
            }

            return
        }

        try {
            const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${route.params.id}`)
            if (data) {
                const detailedPost = data as PostTranslationSourceDetail & {
                    visibility?: PostVisibility
                    views?: number
                }

                post.value = {
                    ...post.value,
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

                if (post.value.translationId) {
                    void fetchTranslations(post.value.translationId)
                }

                const requestedSourceId = route.query.sourceId as string | undefined
                if (requestedSourceId && requestedSourceId !== detailedPost.id) {
                    try {
                        sourcePostSnapshot.value = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${requestedSourceId}`)
                            .then((response) => response.data)
                    } catch (sourceError) {
                        console.error('Failed to load translation source snapshot', sourceError)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load post', error)
        }

        if (route.query.autoTranslate === 'true') {
            translationWorkflowDefaults.value = {
                sourcePostId: (route.query.sourceId as string) || sourcePostSnapshot.value?.id || null,
                targetLanguage: post.value.language,
                scopes: parseTranslationScopes(route.query.translationScopes as string | string[] | undefined),
            }
            translationDialogVisible.value = true
        }

        if (hasRecoverableDraft()) {
            confirm.require({
                message: t('pages.admin.posts.recover_draft_confirm'),
                header: t('common.confirmation'),
                icon: 'pi pi-exclamation-triangle',
                acceptProps: {
                    label: t('common.confirm'),
                    severity: 'warn',
                },
                rejectProps: {
                    label: t('common.cancel'),
                    severity: 'secondary',
                    outlined: true,
                },
                accept: () => {
                    recoverDraft()
                    showSuccessToast('pages.admin.posts.draft_recovered')
                },
                reject: () => {
                    clearLocalDraft()
                    showSuccessToast('pages.admin.posts.draft_discarded', {
                        severity: 'info',
                        summaryKey: 'common.info',
                    })
                },
            })
        }
    }

    const searchTags = (event: { query: string }) => {
        if (!event.query.trim().length) {
            filteredTags.value = [...allTags.value]
            return
        }

        filteredTags.value = allTags.value.filter((tag) => tag.toLowerCase().startsWith(event.query.toLowerCase()))
    }

    const handlePublishConfirm = async (options: {
        pushOption: 'none' | 'draft' | 'now'
        syncToMemos: boolean
        publishedAt?: Date | null
        pushCriteria?: { categoryIds?: string[], tagIds?: string[] }
    }) => {
        if (publishPushDialog.value) {
            publishPushDialog.value.visible = false
        }

        post.value.publishedAt = options.publishedAt ? options.publishedAt.toISOString() : null
        await executeSave(true, options.pushOption, options.syncToMemos, options.pushCriteria)
    }

    const getPublishIntent = () => {
        const publish = post.value.metadata?.publish

        if (publish && typeof publish === 'object' && 'intent' in publish) {
            return (publish.intent || {}) as PublishIntent
        }

        return {} as PublishIntent
    }

    const setPublishIntent = (intent: PublishIntent) => {
        if (!post.value.metadata || typeof post.value.metadata !== 'object') {
            post.value.metadata = {}
        }

        post.value.metadata.publish = {
            ...(post.value.metadata.publish || {}),
            intent,
        }
    }

    const savePost = async (publish = false) => {
        if (publish && post.value.status !== PostStatus.PUBLISHED) {
            const publishIntent = getPublishIntent()
            publishPushDialog.value?.open?.({
                syncToMemos: Boolean(publishIntent.syncToMemos),
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
        syncToMemos = false,
        pushCriteria?: { categoryIds?: string[], tagIds?: string[] },
    ) => {
        errors.value = {}

        if (post.value.content) {
            post.value.content = await formatMarkdown(post.value.content)
        }

        const publishedAt = post.value.publishedAt
        const isFuture = typeof publishedAt === 'string' || publishedAt instanceof Date
            ? isFutureDate(publishedAt)
            : false
        const payload = { ...post.value } as Record<string, unknown>
        delete payload.category
        delete payload.author

        const currentPublishIntent = getPublishIntent()
        const nextPublishIntent = {
            ...currentPublishIntent,
            pushOption,
            syncToMemos: syncToMemos || Boolean(currentPublishIntent.syncToMemos),
            pushCriteria,
        }
        setPublishIntent(nextPublishIntent)
        payload.metadata = {
            ...(payload.metadata as Record<string, unknown> || {}),
            publish: {
                ...((payload.metadata as { publish?: Record<string, unknown> } | undefined)?.publish || {}),
                intent: nextPublishIntent,
            },
        }

        if (publish) {
            payload.status = isFuture ? 'scheduled' : 'published'
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
            if (isNew.value) {
                const response = await $fetch<{ code: number, data: { id?: string, status?: PostStatus } }>('/api/posts', {
                    method: 'POST',
                    body: payload,
                })

                if (response.code === 200 && response.data?.id) {
                    post.value.id = response.data.id
                    post.value.status = response.data.status || PostStatus.DRAFT
                    clearLocalDraft()
                    showSuccessToast('common.save_success')
                    await navigateTo(localePath(`/admin/posts/${response.data.id}`), { replace: true })
                }

                return
            }

            await $fetch(`/api/posts/${route.params.id}`, {
                method: 'PUT',
                body: payload,
            })

            if (publish) {
                post.value.status = isFuture ? PostStatus.SCHEDULED : PostStatus.PUBLISHED
            }

            clearLocalDraft()
            showSuccessToast('common.save_success')
        } catch (error) {
            console.error('Failed to save post', error)
            showErrorToast(error, {
                fallbackKey: 'common.save_failed',
            })
        } finally {
            saving.value = false
        }
    }

    const getStatusLabel = (status: string) => {
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

    const getStatusSeverity = (status: string) => {
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

    watch(
        () => post.value.language,
        () => {
            void loadCategories()
            void loadTags()
        },
    )

    watch(
        () => locale.value,
        () => {
            void loadCategories()
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
