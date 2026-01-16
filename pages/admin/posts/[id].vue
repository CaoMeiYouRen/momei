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
            @handle-translation="handleTranslationClick"
            @translate-content="translateContent"
            @preview="handlePreview"
            @save="savePost"
            @open-settings="settingsVisible = true"
        />

        <!-- Editor Area -->
        <div
            class="editor-area"
            :class="{'editor-area--invalid': errors.content}"
        >
            <ClientOnly>
                <mavon-editor
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
            v-model:post="post"
            :errors="errors"
            :categories="categories"
            :filtered-tags="filteredTags"
            :ai-loading="aiLoading"
            :posts-for-translation="postsForTranslation"
            :language-options="languageOptions"
            :license-options="licenseOptions"
            :default-license-label="defaultLicenseLabel"
            @search-posts="searchPosts"
            @suggest-slug="suggestSlug"
            @recommend-tags="recommendTags"
            @search-tags="searchTags"
            @suggest-summary="suggestSummary"
        />

        <!-- Drag Mask -->
        <div v-if="isDragging" class="drag-mask">
            <div class="drag-tip">
                <i class="pi pi-upload upload-icon" />
                <div class="upload-text">
                    {{ $t("common.drag_drop_tip") }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { COPYRIGHT_LICENSES } from '@/types/copyright'
import PostEditorHeader from '@/components/admin/posts/post-editor-header.vue'
import PostEditorSettings from '@/components/admin/posts/post-editor-settings.vue'
import { usePostEditorAI } from '@/composables/use-post-editor-ai'
import { usePostEditorIO } from '@/composables/use-post-editor-io'

definePageMeta({
    layout: false,
})

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { contentLanguage } = useAdminI18n()

const route = useRoute()
const router = useRouter()
const toast = useToast()

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

const defaultLicenseLabel = computed(() => {
    const key = config.public.defaultCopyright || 'all-rights-reserved'
    return t(`components.post.copyright.licenses.${key}`)
})

interface Post {
    id?: string
    title: string
    content: string
    slug: string
    status: 'draft' | 'published' | 'pending' | 'rejected' | 'hidden'
    summary: string
    coverImage: string
    categoryId: string | null
    copyright: string | null
    tags: string[]
    language: string
    translationId: string | null
    // API response objects
    category?: any
    author?: any
}

const post = ref<Post>({
    title: '',
    content: '',
    slug: '',
    status: 'draft',
    summary: '',
    coverImage: '',
    categoryId: null,
    copyright: null,
    tags: [],
    language:
        (route.query.language as string)
        || contentLanguage.value
        || locale.value,
    translationId: (route.query.translationId as string) || null,
})

const translations = ref<any[]>([])

const hasTranslation = (langCode: string) => {
    if (post.value.language === langCode && !isNew.value) return post.value
    return translations.value.find((t) => t.language === langCode) || null
}

const handleTranslationClick = async (langCode: string) => {
    const trans = hasTranslation(langCode)
    if (trans && trans.id) {
        navigateTo(localePath(`/admin/posts/${trans.id}`))
    } else {
        // Confirm before creating new translation if current post is not saved
        if (isNew.value && !post.value.id) {
            toast.add({
                severity: 'warn',
                summary: 'Warn',
                detail: t('pages.admin.posts.save_current_first'),
                life: 3000,
            })
            return
        }

        const newPostPath = localePath('/admin/posts/new')
        navigateTo({
            path: newPostPath,
            query: {
                language: langCode,
                translationId: post.value.translationId || post.value.id,
            },
        })
    }
}

const filteredTags = ref<string[]>([])
const allTags = ref<string[]>([]) // Should be loaded from API

const settingsVisible = ref(false)

const {
    aiLoading,
    titleSuggestions,
    titleOp,
    suggestTitles,
    selectTitle,
    suggestSlug,
    suggestSummary,
    recommendTags,
    translateContent,
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

// Override titleOp to use the one from header component
watch(headerRef, (header) => {
    if (header) {
        titleOp.value = header.titleOp
    }
})

const categories = ref<{ id: string, name: string }[]>([])
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

const saving = ref(false)
const oldSlugValue = ref(post.value.slug)

const postsForTranslation = ref<any[]>([])
const searchPosts = async (event: { query: string }) => {
    if (!event.query.trim()) return
    try {
        const { data } = await $fetch<{ data: { items: any[] } }>(
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

const isNew = computed(() => route.params.id === 'new' || !route.params.id)

const previewLink = computed(() => {
    if (isNew.value && !post.value.id) return null
    return localePath(`/posts/${post.value.slug || post.value.id}`)
})

const handlePreview = () => {
    if (previewLink.value) {
        window.open(previewLink.value, '_blank')
    }
}

const loadPost = async () => {
    if (isNew.value) {
        oldSlugValue.value = ''
        // If it's a new translation, we might want to pre-fill some fields from a source post
        if (route.query.translationId) {
            try {
                const { data } = await $fetch<any>(
                    `/api/posts/${route.query.translationId}`,
                )
                if (data) {
                    // Pre-fill categories, tags, etc.
                    post.value.categoryId = data.category?.id || null
                    post.value.tags = data.tags?.map((t: any) => t.name) || []
                    post.value.translationId = data.translationId || data.id
                    post.value.slug = data.slug // Suggest same slug
                }
            } catch (e) {}
            // Also fetch other translations for the bar
            fetchTranslations(route.query.translationId as string)
        }
        return
    }
    try {
        const { data } = await $fetch<{ data: any }>(
            `/api/posts/${route.params.id}`,
        )
        if (data) {
            post.value = {
                ...data,
                categoryId: data.category?.id || null,
                tags: data.tags?.map((t: any) => t.name) || [],
                language: data.language || 'zh-CN',
                translationId: data.translationId || null,
            }
            oldSlugValue.value = data.slug

            if (post.value.translationId) {
                fetchTranslations(post.value.translationId)
            }
        }
    } catch (error) {
        console.error('Failed to load post', error)
        // router.push('/admin/posts');
    }
}

const fetchTranslations = async (translationId: string) => {
    if (!translationId || !translationId.trim()) {
        translations.value = []
        return
    }
    try {
        const { data } = await $fetch<any>('/api/posts', {
            query: { translationId, limit: 10, scope: 'manage' },
        })
        translations.value = data.items.filter(
            (p: any) => p.id !== post.value.id,
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

const savePost = async (publish = false) => {
    errors.value = {}

    // 构建提交数据，显式移除关联对象以避免 Zod 校验失败
    const payload: any = { ...post.value }
    delete payload.category
    delete payload.author
    if (publish) {
        payload.status = 'published'
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
            ? `${String(firstError.path[0])}: ${firstError.message}`
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
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: t('common.save_success'),
                    life: 3000,
                })
                // Replace route to edit mode without reloading
                router.replace(localePath(`/admin/posts/${response.data.id}`))
            }
        } else {
            await $fetch(`/api/posts/${route.params.id}`, {
                method: 'PUT' as any,
                body: payload,
            })
            if (publish) {
                post.value.status = 'published'
            }
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
        draft: 'secondary',
        pending: 'warn',
        rejected: 'danger',
        hidden: 'info',
    }
    return map[status] || 'info'
}

const loadCategories = async () => {
    try {
        const response = await $fetch<{ data: { items: any[] } }>(
            '/api/categories',
            {
                query: { limit: 100, language: post.value.language },
            },
        )
        if (response.data) {
            categories.value = response.data.items
        }
    } catch (error) {
        console.error('Failed to load categories', error)
    }
}

const loadTags = async () => {
    try {
        const response = await $fetch<{ data: { items: any[] } }>('/api/tags', {
            query: { limit: 100, language: post.value.language },
        })
        if (response.data) {
            allTags.value = response.data.items.map((t: any) => t.name)
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

.drag-mask {
    position: absolute;
    inset: 0;
    background-color: rgb(0 0 0 / 0.3);
    border: 3px dashed var(--p-primary-500);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    backdrop-filter: blur(2px);

    i {
        font-size: 4rem;
        color: var(--p-primary-500);
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.5rem;
        color: var(--p-primary-500);
        font-weight: bold;
        text-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
    }
}

.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;

    .mavon-editor {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    &--invalid {
        border: 1px solid var(--p-error-color);
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
