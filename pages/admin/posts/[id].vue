<template>
    <div
        class="editor-layout"
        :class="{'drag-over': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <PostEditorHeader
            ref="headerRef"
            v-model:post="post"
            :errors="errors"
            :locales="locales"
            :has-translation="hasTranslation"
            :get-status-label="getStatusLabel"
            :get-status-severity="getStatusSeverity"
            :saving="saving"
            :is-new="isNew"
            :ai-loading="aiLoading"
            :title-suggestions="titleSuggestions"
            @suggest-titles="suggestTitles"
            @select-title="selectTitle"
            @handle-translation="(lang) => handleTranslationClick(lang)"
            @translate-content="(lang) => openTranslationWorkflow(lang)"
            @preview="handlePreview"
            @save="savePost"
            @open-settings="settingsVisible = true"
            @open-history="historyVisible = true"
        />

        <!-- Editor Area -->
        <div
            class="editor-area"
            :class="{
                'editor-area--invalid': errors.content,
                'editor-area--shifted': settingsVisible && !settingsCompact,
                'editor-area--compact': settingsVisible && settingsCompact
            }"
        >
            <ClientOnly>
                <AdminMavonEditorClient
                    ref="md"
                    v-model="post.content"
                    class="mavon-editor"
                    :placeholder="$t('pages.admin.posts.content_placeholder')"
                    @img-add="imgAdd"
                />
            </ClientOnly>
            <div v-if="errors.content" class="editor-error-message">
                <small class="p-error">{{ errors.content }}</small>
            </div>
        </div>

        <PostEditorSettings
            v-model:visible="settingsVisible"
            v-model:compact="settingsCompact"
            v-model:post="post"
            :errors="errors"
            :categories="categories"
            :filtered-tags="filteredTags"
            :ai-loading="aiLoading"
            :posts-for-translation="postsForTranslation"
            :language-options="languageOptions"
            :license-options="licenseOptions"
            :visibility-options="visibilityOptions"
            :default-license-label="defaultLicenseLabel"
            @search-posts="searchPosts"
            @suggest-slug="suggestSlug"
            @recommend-tags="recommendTags"
            @search-tags="searchTags"
            @suggest-summary="suggestSummary"
        />

        <PostTranslationWorkflowDialog
            v-model:visible="translationDialogVisible"
            :locales="locales"
            :source-options="translationSourceOptions"
            :target-statuses="translationTargetStatuses"
            :default-source-post-id="translationWorkflowDefaults.sourcePostId"
            :default-target-language="translationWorkflowDefaults.targetLanguage"
            :default-scopes="translationWorkflowDefaults.scopes"
            :progress="translationProgress.progress"
            :translation-status="translationProgress.status"
            :active-field="translationProgress.activeField"
            :error-text="translationProgress.error"
            @start="handleStartTranslationWorkflow"
        />

        <PublishPushDialog
            ref="publishPushDialog"
            :loading="saving"
            @confirm="handlePublishConfirm"
        />

        <PostHistoryPanel
            v-model:visible="historyVisible"
            :post-id="post.id"
            :current-content="post.content"
            @restore="handleRestore"
        />

        <!-- Drag Mask -->
        <PostEditorDragMask v-if="isDragging" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { ApiResponse } from '@/types/api'
import { PostStatus, PostVisibility, type Post, type PublishIntent } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationCategoryOption,
    PostTranslationSourceDetail,
    PostTranslationSourceOption,
    PostTranslationTagOption,
    PostTranslationTargetState,
    PostTranslationTargetStatus,
    PostTranslationWorkflowRequest,
    PostTranslationWorkflowAction,
    TranslationScopeField,
} from '@/types/post-translation'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { COPYRIGHT_LICENSES } from '@/types/copyright'
import PostEditorHeader from '@/components/admin/posts/post-editor-header.vue'
import PostEditorSettings from '@/components/admin/posts/post-editor-settings.vue'
import PostTranslationWorkflowDialog from '@/components/admin/posts/post-translation-workflow-dialog.vue'
import PublishPushDialog from '@/components/admin/posts/publish-push-dialog.vue'
import PostHistoryPanel from '@/components/admin/posts/post-history-panel.vue'
import PostEditorDragMask from '@/components/admin/posts/post-editor-drag-mask.vue'
import { usePostEditorAI } from '@/composables/use-post-editor-ai'
import { usePostTranslationAI } from '@/composables/use-post-translation-ai'
import { usePostEditorIO } from '@/composables/use-post-editor-io'
import { usePostEditorAutoSave } from '@/composables/use-post-editor-auto-save'
import { formatMarkdown } from '@/utils/shared/markdown'
import { hasSharedTranslationCluster, resolveTranslationClusterId } from '@/utils/shared/translation-cluster'

definePageMeta({
    middleware: 'author',
    layout: false,
})

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { contentLanguage } = useAdminI18n()

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const md = ref<any>(null)
const headerRef = ref<any>(null)

const languageOptions = computed(() =>
    locales.value.map((l: any) => ({
        label: t(`common.languages.${l.code}`),
        value: l.code,
    })),
)

const licenseOptions = computed(() => {
    return Object.keys(COPYRIGHT_LICENSES).map((key) => ({
        label: t(`components.post.copyright.licenses.${key}`),
        value: key,
    }))
})

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

const DEFAULT_TRANSLATION_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags']

const translations = ref<PostTranslationSourceOption[]>([])
const sourcePostSnapshot = ref<PostTranslationSourceDetail | null>(null)
const translationDialogVisible = ref(false)
const translationWorkflowDefaults = ref({
    sourcePostId: null as string | null,
    targetLanguage: post.value.language,
    scopes: [...DEFAULT_TRANSLATION_SCOPES],
})

const parseTranslationScopes = (value: string | string[] | undefined) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    if (!rawValue) {
        return [...DEFAULT_TRANSLATION_SCOPES]
    }

    const scopes = rawValue
        .split(',')
        .map((item) => item.trim())
        .filter((item): item is TranslationScopeField => DEFAULT_TRANSLATION_SCOPES.includes(item as TranslationScopeField))

    return scopes.length > 0 ? Array.from(new Set(scopes)) : [...DEFAULT_TRANSLATION_SCOPES]
}

const serializeTranslationScopes = (scopes: TranslationScopeField[]) => {
    const normalizedScopes = Array.from(new Set(
        scopes.filter((scope) => DEFAULT_TRANSLATION_SCOPES.includes(scope)),
    ))

    return normalizedScopes.length > 0 ? normalizedScopes.join(',') : undefined
}

const hasTranslation = (langCode: string) => {
    if (post.value.language === langCode && !isNew.value) return post.value
    return translations.value.find((t) => t.language === langCode) || null
}

const resolveTranslationTargetStatus = (langCode: string): PostTranslationTargetStatus => {
    if (langCode === post.value.language) {
        if (isNew.value && !post.value.id) {
            return {
                language: langCode,
                state: 'missing',
                action: 'create',
                postId: null,
                isCurrentEditor: true,
            }
        }

        const state: PostTranslationTargetState = post.value.status === PostStatus.PUBLISHED ? 'published' : 'draft'

        return {
            language: langCode,
            state,
            action: state === 'published' ? 'overwrite' : 'continue',
            postId: post.value.id || null,
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
    locales.value.map((item: any) => resolveTranslationTargetStatus(item.code)),
)

const handleTranslationClick = async (
    langCode: string,
    autoTranslate = false,
    options?: {
        sourceId?: string | null
        scopes?: TranslationScopeField[]
    },
) => {
    const trans = hasTranslation(langCode)
    const sourceId = options?.sourceId || post.value.id || sourcePostSnapshot.value?.id || null

    if (!trans && isNew.value && !post.value.id) {
        toast.add({
            severity: 'warn',
            summary: t('common.warn'),
            detail: t('pages.admin.posts.save_current_first'),
            life: 3000,
        })
        return
    }

    const autoTranslateQuery = autoTranslate
        ? {
                autoTranslate: 'true',
                sourceId: sourceId || undefined,
                translationScopes: serializeTranslationScopes(options?.scopes || DEFAULT_TRANSLATION_SCOPES),
            }
        : undefined

    if (trans && trans.id) {
        await navigateTo({
            path: localePath(`/admin/posts/${trans.id}`),
            query: autoTranslateQuery,
        })
        return
    }

    const newPostPath = localePath('/admin/posts/new')
    await navigateTo({
        path: newPostPath,
        query: {
            language: langCode,
            sourceId: sourceId || undefined,
            translationId: post.value.translationId || sourcePostSnapshot.value?.translationId || sourceId || undefined,
            ...autoTranslateQuery,
        },
    })
}

const filteredTags = ref<string[]>([])
const allTags = ref<string[]>([])
const tagEntities = ref<PostTranslationTagOption[]>([])

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const settingsVisible = ref(isNew.value)
const settingsCompact = ref(false)
const historyVisible = ref(false)
const publishPushDialog = ref<any>(null)

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
        set: (val) => {
            post.value.tags = val
        },
    }),
)

const {
    resetTranslationProgress,
    translatePostFields,
    translationProgress,
} = usePostTranslationAI(post)

// Override titleOp to use the one from header component
watch(headerRef, (header) => {
    if (header) {
        titleOp.value = header.titleOp
    }
})

const categories = ref<PostTranslationCategoryOption[]>([])
const errors = ref<Record<string, string>>({})

const { isDragging, onDragOver, onDragLeave, onDrop, imgAdd } = usePostEditorIO(
    post,
    computed({
        get: () => post.value.tags,
        set: (val) => {
            post.value.tags = val
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

const saving = ref(false)
const oldSlugValue = ref(post.value.slug)

const postsForTranslation = ref<TranslationGroupOption[]>([])
const searchPosts = async (event: { query: string }) => {
    if (!event.query.trim()) return
    try {
        const { data } = await $fetch<ApiResponse<{ items: TranslationSearchItem[] }>>(
            '/api/posts',
            {
                query: {
                    search: event.query,
                    limit: 10,
                    scope: 'manage',
                    // Exclude current post
                },
            },
        )
        postsForTranslation.value = data.items
            .filter((p) => p.id !== post.value.id)
            .map((p) => ({
                label: `[${p.language}] ${p.title}`,
                value: p.translationId || p.id,
            }))
    } catch (error) {
        console.error('Failed to search posts', error)
    }
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

    if (post.value.id) {
        upsert({
            id: post.value.id,
            title: post.value.title,
            language: post.value.language,
            translationId: post.value.translationId,
            status: post.value.status,
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

    const allowIdFallback = sourceLanguage === post.value.language
    const matchedCategory = categories.value.find((category) => hasSharedTranslationCluster(sourceCategory, category, {
        includeSourceId: allowIdFallback,
        includeTargetId: allowIdFallback,
    }))

    return matchedCategory?.id || null
}

const resolveMatchedTagNames = (
    sourceTags: PostTranslationSourceDetail['tags'],
    sourceLanguage: string,
) => {
    if (!sourceTags?.length) {
        return []
    }

    const allowIdFallback = sourceLanguage === post.value.language
    const mappedTags = sourceTags.flatMap((tag) => {
        const matchedTag = tagEntities.value.find((targetTag) => hasSharedTranslationCluster(tag, targetTag, {
            includeSourceId: allowIdFallback,
            includeTargetId: allowIdFallback,
        }))

        if (matchedTag?.name) {
            return [matchedTag.name]
        }

        return allowIdFallback && tag.name ? [tag.name] : []
    })

    return Array.from(new Set(mappedTags.filter(Boolean)))
}

const createTranslationScopeSnapshot = () => ({
    title: post.value.title,
    content: post.value.content,
    summary: post.value.summary,
    categoryId: post.value.categoryId,
    tags: [...post.value.tags],
})

const clearTranslatedScopes = (scopes: TranslationScopeField[]) => {
    if (scopes.includes('title')) {
        post.value.title = ''
    }

    if (scopes.includes('content')) {
        post.value.content = ''
    }

    if (scopes.includes('summary')) {
        post.value.summary = ''
    }

    if (scopes.includes('category')) {
        post.value.categoryId = null
    }

    if (scopes.includes('tags')) {
        post.value.tags = []
    }
}

const restoreTranslatedScopes = (
    scopes: TranslationScopeField[],
    snapshot: ReturnType<typeof createTranslationScopeSnapshot>,
) => {
    if (scopes.includes('title')) {
        post.value.title = snapshot.title
    }

    if (scopes.includes('content')) {
        post.value.content = snapshot.content
    }

    if (scopes.includes('summary')) {
        post.value.summary = snapshot.summary
    }

    if (scopes.includes('category')) {
        post.value.categoryId = snapshot.categoryId
    }

    if (scopes.includes('tags')) {
        post.value.tags = [...snapshot.tags]
    }
}

const hasSelectedScopesContent = (scopes: TranslationScopeField[]) => scopes.some((scope) => {
    if (scope === 'title') {
        return Boolean(post.value.title?.trim())
    }

    if (scope === 'content') {
        return Boolean(post.value.content?.trim())
    }

    if (scope === 'summary') {
        return Boolean(post.value.summary?.trim())
    }

    if (scope === 'category') {
        return Boolean(post.value.categoryId)
    }

    return (post.value.tags?.length || 0) > 0
})

const confirmTranslationOverwrite = async (
    scopes: TranslationScopeField[],
    targetState: PostTranslationTargetState,
    action: PostTranslationWorkflowAction,
) => {
    if (targetState === 'missing' || (isNew.value && !post.value.id) || !hasSelectedScopesContent(scopes)) {
        return true
    }

    const requestConfirm = (message: string, options?: { header?: string, severity?: 'warn' | 'danger' }) => new Promise<boolean>((resolve) => {
        confirm.require({
            message,
            header: options?.header || t('pages.admin.posts.translation_workflow.overwrite_title'),
            icon: 'pi pi-exclamation-triangle',
            acceptProps: {
                label: t('common.confirm'),
                severity: options?.severity || 'danger',
            },
            rejectProps: {
                label: t('common.cancel'),
                severity: 'secondary',
                outlined: true,
            },
            accept: () => resolve(true),
            reject: () => resolve(false),
        })
    })

    if (targetState === 'published') {
        const firstConfirmed = await requestConfirm(t('pages.admin.posts.translation_workflow.overwrite_published_first'), {
            severity: 'danger',
        })
        if (!firstConfirmed) {
            return false
        }

        return await requestConfirm(t('pages.admin.posts.translation_workflow.overwrite_published_second'), {
            severity: 'danger',
        })
    }

    return await requestConfirm(
        action === 'continue'
            ? t('pages.admin.posts.translation_workflow.continue_draft')
            : t('pages.admin.posts.translation_workflow.overwrite_draft'),
        {
            header: t('pages.admin.posts.translation_workflow.continue_title'),
            severity: 'warn',
        },
    )
}

const applyTranslatedCategory = (source: PostTranslationSourceDetail) => {
    post.value.categoryId = resolveMatchedCategoryId(source.category, source.language)
}

const applyTranslatedTags = (source: PostTranslationSourceDetail) => {
    post.value.tags = resolveMatchedTagNames(source.tags || [], source.language)
}

const fetchSourcePostDetail = async (postId: string) => {
    if (sourcePostSnapshot.value?.id === postId) {
        return sourcePostSnapshot.value
    }

    const response = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${postId}`)
    return response.data
}

const openTranslationWorkflow = async (requestedLanguage: string | null) => {
    const targetLanguage = requestedLanguage || post.value.language

    if (targetLanguage !== post.value.language && post.value.id && !isNew.value) {
        await handleTranslationClick(targetLanguage, true)
        return
    }

    resetTranslationProgress()
    translationWorkflowDefaults.value = {
        sourcePostId: sourcePostSnapshot.value?.id || post.value.id || translations.value[0]?.id || null,
        targetLanguage,
        scopes: [...DEFAULT_TRANSLATION_SCOPES],
    }

    translationDialogVisible.value = true
}

const handleStartTranslationWorkflow = async (payload: PostTranslationWorkflowRequest) => {
    if (payload.targetLanguage !== post.value.language) {
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

    if (post.value.language !== payload.targetLanguage) {
        post.value.language = payload.targetLanguage
        await Promise.all([
            loadCategories(payload.targetLanguage),
            loadTags(payload.targetLanguage),
        ])
    }

    const translationScopeSnapshot = createTranslationScopeSnapshot()
    clearTranslatedScopes(payload.scopes)

    const translated = await translatePostFields({
        source,
        sourceLanguage: payload.sourceLanguage,
        targetLanguage: payload.targetLanguage,
        scopes: payload.scopes,
    })

    if (!translated) {
        restoreTranslatedScopes(payload.scopes, translationScopeSnapshot)
        return
    }

    if (payload.scopes.includes('category')) {
        applyTranslatedCategory(source)
    }

    if (payload.scopes.includes('tags')) {
        applyTranslatedTags(source)
    }

    post.value.translationId = resolveTranslationClusterId(source.translationId, source.slug, source.id)
    translationDialogVisible.value = false
}

const previewLink = computed(() => {
    if (isNew.value && !post.value.id) return null
    return localePath(`/posts/${post.value.slug || post.value.id}`)
})

const handlePreview = () => {
    if (previewLink.value) {
        window.open(previewLink.value, '_blank')
    }
}

const handleRestore = (data: { title: string, content: string, summary: string | null }) => {
    post.value.title = data.title
    post.value.content = data.content
    post.value.summary = data.summary
}

const loadPost = async () => {
    if (isNew.value) {
        oldSlugValue.value = ''
        // 如果是新翻译版本，我们从源文章预填一些字段
        const sourceId = route.query.sourceId as string
        if (sourceId) {
            try {
                const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(`/api/posts/${sourceId}`)
                if (data) {
                    sourcePostSnapshot.value = data
                    // 预填标题、摘要、封面图、标签等
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
            } catch (e) {
                console.error('Failed to pre-fill from source post', e)
            }
        }

        // 即使没有 sourceId，如果带了 translationId 也可以尝试拉取已有的翻译列表
        if (route.query.translationId) {
            fetchTranslations(route.query.translationId as string)
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
        const { data } = await $fetch<ApiResponse<PostTranslationSourceDetail>>(
            `/api/posts/${route.params.id}`,
        )
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
            oldSlugValue.value = detailedPost.slug || ''

            if (post.value.translationId) {
                fetchTranslations(post.value.translationId)
            }

            const requestedSourceId = route.query.sourceId as string | undefined
            if (requestedSourceId && requestedSourceId !== detailedPost.id) {
                try {
                    sourcePostSnapshot.value = await fetchSourcePostDetail(requestedSourceId)
                } catch (sourceError) {
                    console.error('Failed to load translation source snapshot', sourceError)
                }
            }
        }
    } catch (error) {
        console.error('Failed to load post', error)
        // router.push('/admin/posts');
    }

    if (route.query.autoTranslate === 'true') {
        translationWorkflowDefaults.value = {
            sourcePostId: (route.query.sourceId as string) || sourcePostSnapshot.value?.id || null,
            targetLanguage: post.value.language,
            scopes: parseTranslationScopes(route.query.translationScopes as string | string[] | undefined),
        }
        translationDialogVisible.value = true
    }

    // 加载完成后检查是否有本地草稿可以恢复
    if (hasRecoverableDraft()) {
        confirm.require({
            message: t('pages.admin.posts.recover_draft_confirm'),
            header: t('common.confirmation'),
            icon: 'pi pi-exclamation-triangle',
            acceptProps: {
                label: t('common.confirm'),
            },
            rejectProps: {
                label: t('common.cancel'),
                severity: 'secondary',
                outlined: true,
            },
            accept: () => {
                recoverDraft()
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('pages.admin.posts.draft_recovered'),
                    life: 3000,
                })
            },
            reject: () => {
                clearLocalDraft()
                toast.add({
                    severity: 'info',
                    summary: t('common.info'),
                    detail: t('pages.admin.posts.draft_discarded'),
                    life: 3000,
                })
            },
        })
    }
}

const fetchTranslations = async (translationId: string) => {
    if (!translationId || !translationId.trim()) {
        translations.value = []
        return
    }
    try {
        const { data } = await $fetch<ApiResponse<{ items: PostTranslationSourceOption[] }>>('/api/posts', {
            query: { translationId, limit: 10, scope: 'manage' },
        })
        translations.value = data.items.filter(
            (item) => item.id !== post.value.id,
        )
    } catch (e) {
        console.error('Failed to fetch translations', e)
    }
}

const searchTags = (event: { query: string }) => {
    // In a real app, fetch from API
    // For now, just echo the query if not in list
    if (!event.query.trim().length) {
        filteredTags.value = [...allTags.value]
    } else {
        filteredTags.value = allTags.value.filter((tag) => {
            return tag.toLowerCase().startsWith(event.query.toLowerCase())
        })
        if (!filteredTags.value.includes(event.query)) {
            // Allow creating new tags implicitly by just typing
        }
    }
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

    // 更新文章的发布时间
    if (options.publishedAt) {
        post.value.publishedAt = options.publishedAt.toISOString()
    } else {
        post.value.publishedAt = null
    }

    await executeSave(true, options.pushOption, options.syncToMemos, options.pushCriteria)
}

const getPublishIntent = () => {
    return (post.value.metadata?.publish?.intent || post.value.publishIntent || {}) as PublishIntent
}

const setPublishIntent = (intent: PublishIntent) => {
    if (!post.value.metadata || typeof post.value.metadata !== 'object') {
        post.value.metadata = {}
    }

    post.value.metadata.publish = {
        ...(post.value.metadata.publish || {}),
        intent,
    }

    post.value.publishIntent = intent
}

const savePost = async (publish = false) => {
    // 仅在首次发布（从非发布状态变为发布状态）时弹出推送选项
    if (publish && post.value.status !== PostStatus.PUBLISHED) {
        const publishIntent = getPublishIntent()
        publishPushDialog.value?.open({
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

    // Auto format markdown before saving
    if (post.value.content) {
        post.value.content = await formatMarkdown(post.value.content)
    }

    // 判断是否定时发布
    const isFuture = post.value.publishedAt && new Date(post.value.publishedAt) > new Date()

    // 构建提交数据，显式移除关联对象以避免 Zod 校验失败
    const payload: any = { ...post.value }
    delete payload.category
    delete payload.author

    // 封装 publishIntent
    const nextPublishIntent = {
        ...getPublishIntent(),
        pushOption,
        syncToMemos: syncToMemos || Boolean(getPublishIntent().syncToMemos),
        pushCriteria,
    }
    setPublishIntent(nextPublishIntent)
    payload.metadata = {
        ...(payload.metadata || {}),
        publish: {
            ...(payload.metadata?.publish || {}),
            intent: nextPublishIntent,
        },
    }
    payload.publishIntent = nextPublishIntent

    if (publish) {
        payload.status = isFuture ? 'scheduled' : 'published'
    }

    const schema = isNew.value ? createPostSchema : updatePostSchema
    const result = schema.safeParse(payload)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            errors.value[String(issue.path[0])] = issue.message
        })

        // Check if any error is in the drawer fields
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
        const hasDrawerError = result.error.issues.some((issue) =>
            drawerFields.includes(String(issue.path[0])),
        )
        if (hasDrawerError) {
            settingsVisible.value = true
        }

        const firstError = result.error.issues[0]
        const errorDetail = firstError
            ? `${firstError.path.join('.')}: ${firstError.message}`
            : t('common.validation_error')
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: errorDetail,
            life: 5000,
        })
        return
    }

    saving.value = true
    try {
        if (isNew.value) {
            const response = await $fetch<{ code: number, data: any }>(
                '/api/posts',
                {
                    method: 'POST',
                    body: payload,
                },
            )
            if (response.code === 200 && response.data?.id) {
                post.value.id = response.data.id
                post.value.status = response.data.status
                // 成功保存到服务器，清除本地草稿
                clearLocalDraft()
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('common.save_success'),
                    life: 3000,
                })
                // Replace route to edit mode without reloading
                router.replace(localePath(`/admin/posts/${response.data.id}`))
            }
        } else {
            const response = await $fetch<{ code: number, data: any }>(`/api/posts/${route.params.id}`, {
                method: 'PUT' as any,
                body: payload,
            })
            if (publish) {
                post.value.status = isFuture ? PostStatus.SCHEDULED : PostStatus.PUBLISHED
            }
            // 成功保存到服务器，清除本地草稿
            clearLocalDraft()
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('common.save_success'),
                life: 3000,
            })
        }
    } catch (error: any) {
        console.error('Failed to save post', error)
        const serverMessage
            = error.data?.message
                || error.statusMessage
                || t('common.save_failed')
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: serverMessage,
            life: 5000,
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

const loadCategories = async (language = post.value.language) => {
    try {
        const response = await $fetch<ApiResponse<{ items: PostTranslationCategoryOption[] }>>(
            '/api/categories',
            {
                query: { limit: 100, language },
            },
        )
        if (response.data) {
            categories.value = response.data.items
        }
    } catch (error) {
        console.error('Failed to load categories', error)
    }
}

const loadTags = async (language = post.value.language) => {
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

watch(
    () => post.value.language,
    () => {
        loadCategories()
        loadTags()
    },
)

onMounted(() => {
    loadPost()
    loadCategories()
    loadTags()
})
</script>

<style lang="scss" scoped>
.editor-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-ground);
    position: relative;
}

.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    transition: margin-right 0.3s ease;

    .mavon-editor {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    &--invalid {
        border: 1px solid var(--p-error-color);
    }

    &--shifted {
        margin-right: 20rem;
    }

    &--compact {
        margin-right: 14rem;
    }
}

.editor-error-message {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 10;
    background-color: var(--p-surface-card);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}
</style>
